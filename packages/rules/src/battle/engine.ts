/**
 * Taktik-Regelkern. Port von legacy/v22/prolog.js mit:
 *  - konfigurierbarem Brett (Breite, Höhe, Torseite, Hindernisse) und Missionsziel,
 *  - zwei Zugreihenfolge-Modi (Seiten / Initiative),
 *  - abgeleiteten Attributmodifikatoren,
 *  - Resonanz als Ressource für Signature-Fähigkeiten,
 *  - Beschwörer-Befehl „Sammeln“.
 *
 * Muster: Command → Rules → State + Events → Presenter. Die Engine kennt kein DOM und kein Phaser.
 */
import { ABILITIES, basicAttackDef, boardDef, encounterDef, enemyDef, guardianDef, type BoardConfig, type Cell, type EncounterDef } from '@knowsters/content';
import { deriveStats } from '../progression/attributes';
import type { CreatureInstance } from '../progression/creature';
import type { ActionResult, BattleEvent, BattleState, BattleUnit, EnemyStep, TurnOrderMode } from './types';

const key = (x: number, y: number) => `${x}:${y}`;
const manhattan = (a: Cell, b: Cell) => Math.abs(a.x - b.x) + Math.abs(a.y - b.y);

export interface CreateBattleOptions {
  turnOrder?: TurnOrderMode;
}

const ctx = (b: BattleState) => ({ encounter: encounterDef(b.encounterId), board: boardDef(b.boardId) });

// ---------------------------------------------------------------- Aufbau

function makeGuardian(creature: CreatureInstance, x: number, y: number): BattleUnit {
  const species = guardianDef(creature.speciesId);
  const d = deriveStats(creature.attributes);
  const maxHp = species.baseHp + d.hpBonus;
  return {
    id: creature.id,
    kind: 'guardian',
    speciesId: species.id,
    name: creature.name,
    x,
    y,
    hp: maxHp,
    maxHp,
    shield: 0,
    root: 0,
    analyzed: 0,
    buff: 0,
    immovable: 0,
    alive: true,
    move: species.baseMove + d.moveBonus,
    initiative: d.initiative,
    damage: 0,
    attackBonus: d.attackBonus,
    shieldBonus: d.shieldBonus,
    controlBonus: d.controlBonus,
    statusResist: d.statusResist,
    insight: d.insight,
    commandBonus: d.commandBonus,
    resonance: d.resonance,
    maxResonance: d.resonance,
    abilities: species.abilities.filter((a) => creature.unlocked.includes(a)),
    basicAttack: species.basicAttack,
  };
}

function makeEnemy(b: BattleState, speciesId: string, x: number, y: number): BattleUnit {
  const e = enemyDef(speciesId);
  return {
    id: `e${++b.enemySeq}`,
    kind: 'enemy',
    speciesId,
    name: e.name,
    x,
    y,
    hp: e.maxHp,
    maxHp: e.maxHp,
    shield: 0,
    root: 0,
    analyzed: 0,
    buff: 0,
    immovable: 0,
    alive: true,
    move: e.move,
    initiative: e.initiative,
    damage: basicAttackDef(e.basicAttack).damage,
    attackBonus: 0,
    shieldBonus: 0,
    controlBonus: 0,
    statusResist: 0,
    insight: 0,
    commandBonus: 0,
    resonance: 0,
    maxResonance: 0,
    abilities: [],
    basicAttack: e.basicAttack,
  };
}

/**
 * @param team Weseninstanzen in der Reihenfolge der Encounter-Aufstellung (species muss passen).
 */
export function createBattle(encounter: EncounterDef, team: readonly CreatureInstance[], options: CreateBattleOptions = {}): BattleState {
  const board = boardDef(encounter.boardId);
  const b: BattleState = {
    version: 30,
    encounterId: encounter.id,
    boardId: board.id,
    turnOrder: options.turnOrder ?? 'sides',
    round: 1,
    phase: 'player',
    result: null,
    escaped: 0,
    selected: null,
    mode: null,
    message: encounter.intro,
    acted: {},
    order: [],
    orderIndex: 0,
    enemyQueue: [],
    teamMoveBonus: 0,
    nextMoveBonus: 0,
    rallyUsed: false,
    walls: board.obstacles.map((o) => ({ ...o, turns: 99, static: true })),
    hazards: [],
    traces: [],
    units: [],
    eventSeq: 0,
    events: [],
    enemySeq: 0,
  };
  for (const p of encounter.team) {
    const creature = team.find((c) => c.speciesId === p.species);
    if (!creature) throw new Error(`Team ohne ${p.species}`);
    b.units.push(makeGuardian(creature, p.x, p.y));
  }
  for (const p of encounter.enemies) b.units.push(makeEnemy(b, p.species, p.x, p.y));
  beginRound(b, true);
  return b;
}

/**
 * Lädt einen gespeicherten Kampf und ergänzt Felder, die ältere v30-Stände noch nicht kannten
 * (`basicAttack` seit dem 3D-Pilot-Branch). Unbekannte Species-IDs machen den Stand ungültig.
 */
export function hydrateBattle(raw: unknown): BattleState | null {
  if (!raw || typeof raw !== 'object') return null;
  const b = raw as Partial<BattleState>;
  if (b.version !== 30 || !b.encounterId || !Array.isArray(b.units)) return null;
  const state = JSON.parse(JSON.stringify(raw)) as BattleState;
  for (const u of state.units) {
    if (u.basicAttack === undefined) {
      u.basicAttack = u.kind === 'guardian' ? guardianDef(u.speciesId).basicAttack : enemyDef(u.speciesId).basicAttack;
    }
    if (u.kind === 'enemy' && (u.damage === undefined || u.damage === null)) u.damage = basicAttackDef(u.basicAttack ?? enemyDef(u.speciesId).basicAttack).damage;
  }
  return state;
}

// ---------------------------------------------------------------- Abfragen

export const living = (b: BattleState, kind: BattleUnit['kind']): BattleUnit[] => b.units.filter((u) => u.kind === kind && u.alive && u.hp > 0);
export const unitAt = (b: BattleState, x: number, y: number): BattleUnit | null => b.units.find((u) => u.alive && u.hp > 0 && u.x === x && u.y === y) ?? null;
export const unitById = (b: BattleState, id: string | null): BattleUnit | null => (id ? (b.units.find((u) => u.id === id) ?? null) : null);
export const inBounds = (board: BoardConfig, x: number, y: number): boolean => x >= 0 && x < board.width && y >= 0 && y < board.height;
export const wallAt = (b: BattleState, x: number, y: number): boolean => b.walls.some((w) => w.x === x && w.y === y && w.turns > 0);
export const hazardAt = (b: BattleState, x: number, y: number): boolean => b.hazards.some((t) => t.turns > 0 && t.x === x && t.y === y);
export const traceAt = (b: BattleState, x: number, y: number): boolean => b.traces.some((t) => t.turns > 0 && Math.abs(t.x - x) <= 1 && Math.abs(t.y - y) <= 1);

export function isGateCell(board: BoardConfig, x: number, y: number): boolean {
  switch (board.gate) {
    case 'left':
      return x === 0;
    case 'right':
      return x === board.width - 1;
    case 'top':
      return y === 0;
    case 'bottom':
      return y === board.height - 1;
    default:
      return false;
  }
}

/** Richtung „vom Tor weg“ als Einheitsvektor. */
export function awayFromGate(board: BoardConfig, from: Cell, target: Cell): Cell {
  switch (board.gate) {
    case 'left':
      return { x: 1, y: 0 };
    case 'right':
      return { x: -1, y: 0 };
    case 'top':
      return { x: 0, y: 1 };
    case 'bottom':
      return { x: 0, y: -1 };
    default: {
      const dx = target.x - from.x;
      const dy = target.y - from.y;
      if (Math.abs(dx) >= Math.abs(dy)) return { x: Math.sign(dx) || 1, y: 0 };
      return { x: 0, y: Math.sign(dy) || 1 };
    }
  }
}

const blocked = (b: BattleState, board: BoardConfig, x: number, y: number, ignoreId: string | null = null) =>
  !inBounds(board, x, y) || wallAt(b, x, y) || b.units.some((u) => u.alive && u.hp > 0 && u.id !== ignoreId && u.x === x && u.y === y);

export function reachable(b: BattleState, u: BattleUnit, limit: number): Cell[] {
  const { board } = ctx(b);
  const q: [number, number, number][] = [[u.x, u.y, 0]];
  const seen = new Set([key(u.x, u.y)]);
  const out: Cell[] = [];
  while (q.length) {
    const [x, y, d] = q.shift() as [number, number, number];
    if (d > 0) out.push({ x, y });
    if (d >= limit) continue;
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]] as const) {
      const nx = x + dx;
      const ny = y + dy;
      const k = key(nx, ny);
      if (seen.has(k) || !inBounds(board, nx, ny) || wallAt(b, nx, ny)) continue;
      const occ = unitAt(b, nx, ny);
      if (occ && occ.id !== u.id) continue;
      seen.add(k);
      q.push([nx, ny, d + 1]);
    }
  }
  return out;
}

export const moveRange = (b: BattleState, u: BattleUnit): number => u.move + b.teamMoveBonus;

export function canAct(b: BattleState, id: string | null): boolean {
  const u = unitById(b, id);
  if (!u || !u.alive || u.hp <= 0 || u.kind !== 'guardian' || b.result || b.phase !== 'player' || b.acted[u.id]) return false;
  if (b.turnOrder === 'initiative') return b.order[b.orderIndex] === u.id;
  return true;
}

export function validTiles(b: BattleState, id: string | null, mode: string | null): Set<string> {
  const u = unitById(b, id);
  const { board } = ctx(b);
  if (!u || !mode) return new Set();
  if (mode === 'move') return new Set(reachable(b, u, moveRange(b, u)).map((t) => key(t.x, t.y)));
  if (mode === 'basic') {
    if (!u.basicAttack) return new Set();
    const range = basicAttackDef(u.basicAttack).range;
    return new Set(living(b, 'enemy').filter((e) => manhattan(u, e) <= range).map((e) => key(e.x, e.y)));
  }
  const a = ABILITIES[mode];
  if (!a) return new Set();
  const out: string[] = [];
  for (let y = 0; y < board.height; y++)
    for (let x = 0; x < board.width; x++) {
      const target = unitAt(b, x, y);
      let ok = false;
      if (a.target === 'enemy') ok = !!target && target.kind === 'enemy' && manhattan(u, target) <= a.range;
      if (a.target === 'ally') ok = !!target && target.kind === 'guardian' && target.id !== u.id && manhattan(u, target) <= a.range;
      if (a.target === 'tile') ok = manhattan(u, { x, y }) <= a.range && !blocked(b, board, x, y, u.id);
      if (ok) out.push(key(x, y));
    }
  return new Set(out);
}

/** Vorschau der nächsten Gegneraktion (Intuition zeigt sie im HUD). */
export function previewEnemy(b: BattleState, enemyId: string): { type: 'attack' | 'move' | 'wait' | 'rooted'; targetId?: string; to?: Cell } {
  const e = unitById(b, enemyId);
  if (!e || e.kind !== 'enemy') return { type: 'wait' };
  const adjacent = adjacentGuardian(b, e);
  if (adjacent) return { type: 'attack', targetId: adjacent.id };
  if (e.root > 0) return { type: 'rooted' };
  const n = nextStep(b, e);
  return n ? { type: 'move', to: n } : { type: 'wait' };
}

// ---------------------------------------------------------------- Events

function emit(b: BattleState, fx: Omit<BattleEvent, 'seq'>): void {
  b.eventSeq++;
  b.events.push({ seq: b.eventSeq, ...fx });
}

function damage(u: BattleUnit | null, amount: number): number {
  if (!u || !u.alive) return 0;
  let left = amount;
  if (u.shield > 0) {
    const used = Math.min(u.shield, left);
    u.shield -= used;
    left -= used;
  }
  u.hp = Math.max(0, u.hp - left);
  if (u.hp <= 0) u.alive = false;
  return left;
}

function heal(u: BattleUnit, amount: number): number {
  const before = u.hp;
  u.hp = Math.min(u.maxHp, u.hp + amount);
  return u.hp - before;
}

// ---------------------------------------------------------------- Spieleraktionen

export function select(b: BattleState, id: string): boolean {
  if (b.phase === 'enemy' || b.result) return false;
  const u = unitById(b, id);
  if (!u || u.kind !== 'guardian' || !u.alive) return false;
  b.selected = id;
  b.mode = null;
  return true;
}

export function setMode(b: BattleState, mode: 'move' | string): ActionResult {
  if (!canAct(b, b.selected)) return { ok: false, message: 'Dieser Wächter kann gerade nicht handeln.' };
  const u = unitById(b, b.selected) as BattleUnit;
  if (mode === 'move') {
    if (u.root > 0) return { ok: false, message: `${u.name} wird festgehalten.` };
    b.mode = 'move';
    return { ok: true };
  }
  if (mode === 'basic') {
    if (!u.basicAttack) return { ok: false, message: 'Diese Einheit hat keinen Grundangriff.' };
    b.mode = 'basic';
    return { ok: true };
  }
  const a = ABILITIES[mode];
  if (!a || !u.abilities.includes(a.id)) return { ok: false, message: 'Diese Fähigkeit ist nicht gelernt.' };
  if (u.resonance < a.resonanceCost) return { ok: false, message: `Nicht genug Resonanz für ${a.name}.` };
  if (a.target === 'self') return actionAbility(b, u.id, a.id);
  b.mode = a.id;
  return { ok: true };
}

export function tile(b: BattleState, x: number, y: number): ActionResult {
  if (!b.mode) return { ok: false, message: 'Wähle zuerst Bewegen oder eine Fähigkeit.' };
  if (!b.selected) return { ok: false };
  if (b.mode === 'move') return actionMove(b, b.selected, x, y);
  if (b.mode === 'basic') return actionBasicAttack(b, b.selected, x, y);
  return actionAbility(b, b.selected, b.mode, x, y);
}

export function wait(b: BattleState, id: string | null = b.selected): ActionResult {
  b.events = [];
  const u = unitById(b, id);
  if (!u || !canAct(b, u.id)) return { ok: false };
  emit(b, { type: 'wait', unit: u.id, sourcePos: { x: u.x, y: u.y }, targetPos: { x: u.x, y: u.y } });
  markActed(b, u, `${u.name} beobachtet die Lage und hält die Position.`);
  return { ok: true };
}

/** Beschwörer-Befehl „Sammeln“: einmal pro Kampf, +1 Bewegung diese Runde, kleiner Schild fürs Team. */
export function rally(b: BattleState): ActionResult {
  b.events = [];
  if (b.result || b.phase !== 'player') return { ok: false, message: 'Jetzt nicht möglich.' };
  if (b.rallyUsed) return { ok: false, message: 'Der Befehl wurde in diesem Kampf schon gegeben.' };
  const team = living(b, 'guardian');
  const bonus = 1 + Math.max(0, ...team.map((g) => g.commandBonus));
  b.rallyUsed = true;
  b.teamMoveBonus += 1;
  for (const g of team) {
    g.shield += bonus;
    emit(b, { type: 'rally', unit: g.id, targetId: g.id, targetPos: { x: g.x, y: g.y }, amount: bonus, label: `+${bonus} Schild` });
  }
  b.message = 'Sammeln! Das Team rückt diese Runde weiter und steht dichter zusammen.';
  return { ok: true };
}

/**
 * Grundangriff (Bible §8): immer verfügbar, keine Resonanz, kein Slot. Schaden wird nur hier
 * berechnet: Basis + Angriffsbonus + Entfachen + Analyse.
 */
function actionBasicAttack(b: BattleState, id: string, x: number, y: number): ActionResult {
  b.events = [];
  const u = unitById(b, id);
  if (!u || !canAct(b, id) || !u.basicAttack) return { ok: false, message: 'Grundangriff gerade nicht möglich.' };
  const def = basicAttackDef(u.basicAttack);
  const target = unitAt(b, x, y);
  if (!target || target.kind !== 'enemy') return { ok: false, message: 'Wähle einen Gegner.' };
  if (manhattan(u, target) > def.range) return { ok: false, message: `${def.name} reicht nur ${def.range} Feld${def.range === 1 ? '' : 'er'} weit.` };
  const dmg = def.damage + u.attackBonus + (u.buff || 0) + (target.analyzed > 0 ? 2 : 0);
  u.buff = 0;
  damage(target, dmg);
  emit(b, { type: 'basic-attack', ability: def.id, unit: id, sourcePos: { x: u.x, y: u.y }, targetId: target.id, targetPos: { x: target.x, y: target.y }, amount: dmg });
  markActed(b, u, `${u.name}: ${def.name} trifft ${target.name} für ${dmg} Schaden.`);
  return { ok: true };
}

function actionMove(b: BattleState, id: string, x: number, y: number): ActionResult {
  b.events = [];
  const u = unitById(b, id);
  if (!u || !canAct(b, id) || u.root > 0) return { ok: false, message: 'Dieses Wesen kann sich gerade nicht bewegen.' };
  if (!reachable(b, u, moveRange(b, u)).some((t) => t.x === x && t.y === y)) return { ok: false, message: 'Dieses Feld ist nicht erreichbar.' };
  const from = { x: u.x, y: u.y };
  u.x = x;
  u.y = y;
  emit(b, { type: 'move', unit: id, from, to: { x, y }, targetPos: { x, y } });
  markActed(b, u, `${u.name} verändert seine Position.`);
  return { ok: true };
}

function actionAbility(b: BattleState, id: string, aid: string, x: number | null = null, y: number | null = null): ActionResult {
  b.events = [];
  const { board } = ctx(b);
  const u = unitById(b, id);
  const a = ABILITIES[aid];
  if (!u || !a || !canAct(b, id) || !u.abilities.includes(aid)) return { ok: false, message: 'Diese Fähigkeit ist gerade nicht verfügbar.' };
  if (u.resonance < a.resonanceCost) return { ok: false, message: `Nicht genug Resonanz für ${a.name}.` };
  const source = { x: u.x, y: u.y };
  const target = x === null || y === null ? u : unitAt(b, x, y);
  if (a.target === 'enemy' && (!target || target.kind !== 'enemy' || manhattan(u, target) > a.range)) return { ok: false, message: 'Wähle einen erreichbaren Gegner.' };
  if (a.target === 'ally' && (!target || target.kind !== 'guardian' || target.id === id || manhattan(u, target) > a.range)) return { ok: false, message: 'Wähle einen erreichbaren Verbündeten.' };
  if (a.target === 'tile' && (x === null || y === null || !inBounds(board, x, y) || manhattan(u, { x, y }) > a.range || blocked(b, board, x, y, u.id))) return { ok: false, message: 'Wähle ein freies erreichbares Feld.' };
  const t = target as BattleUnit;
  const tx = x as number;
  const ty = y as number;
  const pos = (v: BattleUnit) => ({ x: v.x, y: v.y });
  let msg = '';
  const hit = (victim: BattleUnit, base: number, fxType: string) => {
    const dmg = base + u.attackBonus + (u.buff || 0) + (victim.analyzed > 0 ? 2 : 0);
    u.buff = 0;
    damage(victim, dmg);
    emit(b, { type: fxType, ability: aid, unit: id, sourcePos: source, targetId: victim.id, targetPos: pos(victim), amount: dmg });
    return dmg;
  };
  switch (aid) {
    case 'lumi-insight':
      t.analyzed = 2 + u.controlBonus;
      msg = `Lumi erkennt die Struktur von ${t.name}. Das Ziel ist analysiert.`;
      emit(b, { type: 'insight', ability: aid, unit: id, sourcePos: source, targetId: t.id, targetPos: pos(t), label: 'ANALYSE' });
      break;
    case 'lumi-trace':
      b.traces.push({ x: tx, y: ty, turns: 2 + u.controlBonus });
      msg = 'Lumi legt eine Lichtspur über den Bereich. Gegner darin verlieren Tempo.';
      emit(b, { type: 'trace', ability: aid, unit: id, sourcePos: source, tile: { x: tx, y: ty }, targetPos: { x: tx, y: ty } });
      break;
    case 'lumi-order': {
      const h = heal(t, 3);
      t.root = 0;
      msg = `Lumi ordnet den Moment neu. ${t.name} erhält ${h} LP zurück.`;
      emit(b, { type: 'heal', ability: aid, unit: id, sourcePos: source, targetId: t.id, targetPos: pos(t), amount: h });
      break;
    }
    case 'lumi-beam':
      msg = `Lumis Fokusstrahl trifft für ${hit(t, 3, 'beam')} Schaden.`;
      break;
    case 'pyro-flame':
      msg = `Pyros Flammenstoß trifft für ${hit(t, 4, 'flame')} Schaden.`;
      break;
    case 'pyro-charge': {
      const from = pos(u);
      u.x = tx;
      u.y = ty;
      const adj = living(b, 'enemy').filter((e) => manhattan(u, e) === 1).sort((p, q) => p.hp - q.hp)[0];
      if (adj) {
        const dmg = 3 + u.attackBonus + (u.buff || 0) + (adj.analyzed > 0 ? 2 : 0);
        u.buff = 0;
        damage(adj, dmg);
        msg = `Pyro bricht vor und trifft ${adj.name} für ${dmg} Schaden.`;
        emit(b, { type: 'charge', ability: aid, unit: id, from, to: { x: tx, y: ty }, sourcePos: source, targetId: adj.id, targetPos: pos(adj), amount: dmg });
      } else {
        msg = 'Pyro stößt entschlossen nach vorn.';
        emit(b, { type: 'move', ability: aid, unit: id, from, to: { x: tx, y: ty }, targetPos: { x: tx, y: ty } });
      }
      break;
    }
    case 'pyro-ignite':
      t.buff = (t.buff || 0) + 2;
      msg = `Pyro entfacht ${t.name}. Der nächste Angriff wird stärker.`;
      emit(b, { type: 'ignite', ability: aid, unit: id, sourcePos: source, targetId: t.id, targetPos: pos(t), label: '+2 Angriff' });
      break;
    case 'pyro-trail':
      b.hazards.push({ x: tx, y: ty, turns: 2 });
      msg = 'Pyro hinterlässt eine Glutspur. Wer hindurchgeht, zahlt dafür.';
      emit(b, { type: 'trail', ability: aid, unit: id, sourcePos: source, tile: { x: tx, y: ty }, targetPos: { x: tx, y: ty } });
      break;
    case 'terra-stand': {
      const s = 4 + u.shieldBonus;
      u.shield += s;
      u.immovable = 1;
      msg = `Terra verankert sich. ${s} Schild schützen ihre Position.`;
      emit(b, { type: 'stand', ability: aid, unit: id, sourcePos: source, targetPos: source, amount: s, label: `+${s} Schild` });
      break;
    }
    case 'terra-wall':
      b.walls.push({ x: tx, y: ty, turns: 2 });
      msg = 'Terra hebt einen Schutzwall aus dem Boden.';
      emit(b, { type: 'wall', ability: aid, unit: id, sourcePos: source, tile: { x: tx, y: ty }, targetPos: { x: tx, y: ty } });
      break;
    case 'terra-root':
      t.root = 1;
      msg = `Wurzeln halten ${t.name} fest.`;
      emit(b, { type: 'root', ability: aid, unit: id, sourcePos: source, targetId: t.id, targetPos: pos(t), label: 'FEST' });
      break;
    case 'terra-refuge': {
      const s = 3 + u.shieldBonus;
      for (const ally of living(b, 'guardian')) if (manhattan(u, ally) <= 1) ally.shield += s;
      msg = 'Terra schafft eine Zuflucht für alle Wächter in ihrer Nähe.';
      emit(b, { type: 'refuge', ability: aid, unit: id, sourcePos: source, targetPos: source, amount: s, label: `+${s} Schild` });
      break;
    }
    case 'nivaro-swap': {
      const ox = u.x;
      const oy = u.y;
      const sx = t.x;
      const sy = t.y;
      u.x = sx;
      u.y = sy;
      t.x = ox;
      t.y = oy;
      msg = `Nivaro tauscht den Platz mit ${t.name}.`;
      emit(b, { type: 'swap', ability: aid, unit: id, from: { x: ox, y: oy }, to: { x: sx, y: sy }, sourcePos: source, targetId: t.id, targetFrom: { x: sx, y: sy }, targetTo: { x: ox, y: oy }, targetPos: { x: ox, y: oy } });
      break;
    }
    case 'nivaro-pulse': {
      const dir = awayFromGate(board, u, t);
      let pushes = 0;
      for (let i = 0; i < 2; i++) {
        const nx = t.x + dir.x;
        const ny = t.y + dir.y;
        if (t.immovable > 0 || blocked(b, board, nx, ny, t.id)) break;
        t.x = nx;
        t.y = ny;
        pushes++;
      }
      const dmg = 1 + (t.analyzed > 0 ? 2 : 0);
      damage(t, dmg);
      msg = `Nivaro stößt ${t.name} ${pushes || 'kein'} Feld${pushes === 1 ? '' : 'er'} zurück.`;
      emit(b, { type: 'pulse', ability: aid, unit: id, sourcePos: source, targetId: t.id, targetPos: pos(t), pushes, amount: dmg });
      break;
    }
    case 'nivaro-jump': {
      const from = pos(u);
      u.x = tx;
      u.y = ty;
      msg = 'Nivaro findet einen Weg, den eben noch niemand gesehen hat.';
      emit(b, { type: 'jump', ability: aid, unit: id, from, to: { x: tx, y: ty }, targetPos: { x: tx, y: ty } });
      break;
    }
    case 'nivaro-detour':
      b.nextMoveBonus = 1;
      msg = 'Nivaro öffnet einen Umweg. In der nächsten Runde bewegen sich alle Wächter weiter.';
      emit(b, { type: 'detour', ability: aid, unit: id, sourcePos: source, targetPos: source, label: '+1 Bewegung' });
      break;
    default:
      return { ok: false, message: 'Unbekannte Fähigkeit.' };
  }
  u.resonance -= a.resonanceCost;
  markActed(b, u, msg);
  return { ok: true, message: msg };
}

function markActed(b: BattleState, u: BattleUnit, msg: string): void {
  b.acted[u.id] = true;
  b.mode = null;
  b.message = msg;
  if (checkObjectiveAfterAction(b)) return;
  advanceTurn(b);
}

// ---------------------------------------------------------------- Zugreihenfolge

function buildOrder(b: BattleState): string[] {
  const all = [...living(b, 'guardian'), ...living(b, 'enemy')];
  return all
    .sort((p, q) => q.initiative - p.initiative || (p.kind === q.kind ? 0 : p.kind === 'guardian' ? -1 : 1))
    .map((u) => u.id);
}

function beginRound(b: BattleState, first = false): void {
  const { encounter } = ctx(b);
  if (!first) {
    tickObjects(b);
    b.round++;
    b.teamMoveBonus = b.nextMoveBonus;
    b.nextMoveBonus = 0;
    b.acted = {};
    b.enemyQueue = [];
    for (const spawn of encounter.spawns[b.round] ?? []) {
      let y = spawn.y;
      for (let tries = 0; tries < 6 && (unitAt(b, spawn.x, y) || wallAt(b, spawn.x, y)); tries++) y = (y + 1) % boardDef(b.boardId).height;
      if (!unitAt(b, spawn.x, y) && !wallAt(b, spawn.x, y)) {
        const e = makeEnemy(b, spawn.species, spawn.x, y);
        b.units.push(e);
        emit(b, { type: 'spawn', unit: e.id, targetPos: { x: spawn.x, y }, spawnSide: 'enemy' });
      }
    }
  }
  const hint = encounter.tutorial[b.round];
  if (b.turnOrder === 'initiative') {
    b.order = buildOrder(b);
    b.orderIndex = -1;
    advanceTurn(b);
    if (hint && b.phase === 'player') b.message = hint.text;
    return;
  }
  b.phase = 'player';
  const suggested = hint?.unit ? living(b, 'guardian').find((g) => g.speciesId === hint.unit)?.id : undefined;
  b.selected = suggested ?? living(b, 'guardian')[0]?.id ?? null;
  b.message = hint?.text ?? (first ? b.message : 'Haltet die Linie.');
}

function advanceTurn(b: BattleState): void {
  if (b.result) return;
  if (b.turnOrder === 'sides') {
    const ids = living(b, 'guardian').map((g) => g.id);
    if (ids.length && ids.every((id) => b.acted[id])) {
      b.phase = 'enemy';
      b.mode = null;
      b.enemyQueue = living(b, 'enemy').map((e) => e.id);
      b.message = 'Gegnerphase – das Rauschen setzt sich in Bewegung.';
      if (!b.enemyQueue.length) endRound(b);
      return;
    }
    const next = ids.find((id) => !b.acted[id]);
    if (next) b.selected = next;
    return;
  }
  // Initiative: nächste lebende Einheit in der Reihenfolge
  for (;;) {
    b.orderIndex++;
    if (b.orderIndex >= b.order.length) {
      endRound(b);
      return;
    }
    const u = unitById(b, b.order[b.orderIndex] ?? null);
    if (!u || !u.alive || u.hp <= 0) continue;
    if (u.kind === 'guardian') {
      b.phase = 'player';
      b.selected = u.id;
      b.mode = null;
      return;
    }
    b.phase = 'enemy';
    b.mode = null;
    b.enemyQueue = [u.id];
    return;
  }
}

function tickObjects(b: BattleState): void {
  for (const arr of [b.walls, b.hazards, b.traces]) for (const x of arr) if (!x.static) x.turns--;
  b.walls = b.walls.filter((x) => x.static || x.turns > 0);
  b.hazards = b.hazards.filter((x) => x.turns > 0);
  b.traces = b.traces.filter((x) => x.turns > 0);
  for (const u of b.units) {
    if (u.analyzed > 0) u.analyzed--;
    if (u.immovable > 0) u.immovable--;
  }
}

function endRound(b: BattleState): EnemyStep {
  const { encounter } = ctx(b);
  b.units = b.units.filter((u) => u.alive && u.hp > 0);
  if (checkLoss(b)) return { ok: true, done: true, result: b.result };
  const obj = encounter.objective;
  if (obj.type === 'holdGate' && b.round >= obj.rounds) {
    b.result = 'won';
    b.phase = 'player';
    b.message = encounter.victory;
    return { ok: true, done: true, result: 'won' };
  }
  if (obj.type === 'defeatAll' && b.round >= obj.maxRounds) {
    b.result = 'lost';
    b.phase = 'player';
    b.message = encounter.defeat;
    return { ok: true, done: true, result: 'lost' };
  }
  b.events = [];
  beginRound(b);
  return { ok: true, done: true, newRound: true };
}

function checkLoss(b: BattleState): boolean {
  const { encounter } = ctx(b);
  const obj = encounter.objective;
  if (obj.type === 'holdGate' && b.escaped >= obj.maxEscapes) {
    b.result = 'lost';
    b.phase = 'player';
    b.enemyQueue = [];
    b.message = 'Zu viele Gegner haben das Tor erreicht.';
    return true;
  }
  if (living(b, 'guardian').length === 0) {
    b.result = 'lost';
    b.phase = 'player';
    b.enemyQueue = [];
    b.message = 'Die Wächter können die Linie nicht mehr halten.';
    return true;
  }
  return false;
}

/** Nach einer Spieleraktion: „alle besiegen“ kann sofort gewonnen sein. */
function checkObjectiveAfterAction(b: BattleState): boolean {
  const { encounter } = ctx(b);
  if (encounter.objective.type !== 'defeatAll') return false;
  const pendingSpawns = Object.keys(encounter.spawns).some((r) => Number(r) > b.round);
  if (living(b, 'enemy').length === 0 && !pendingSpawns) {
    b.result = 'won';
    b.phase = 'player';
    b.message = encounter.victory;
    return true;
  }
  return false;
}

// ---------------------------------------------------------------- Gegner

/** Wächter in Reichweite des Gegner-Grundangriffs, mit den wenigsten LP zuerst. */
const adjacentGuardian = (b: BattleState, e: BattleUnit): BattleUnit | undefined => {
  const range = e.basicAttack ? basicAttackDef(e.basicAttack).range : 1;
  return living(b, 'guardian')
    .filter((g) => manhattan(e, g) <= range)
    .sort((p, q) => p.hp - q.hp)[0];
};

/** BFS-Schritt: zum Tor (Torbrett) oder auf den nächsten Wächter zu (Hof). */
function nextStep(b: BattleState, e: BattleUnit): Cell | null {
  const { board } = ctx(b);
  const goals = new Set<string>();
  if (board.gate !== 'none') {
    for (let y = 0; y < board.height; y++) for (let x = 0; x < board.width; x++) if (isGateCell(board, x, y)) goals.add(key(x, y));
  } else {
    for (const g of living(b, 'guardian'))
      for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]] as const) {
        const cx = g.x + dx;
        const cy = g.y + dy;
        if (inBounds(board, cx, cy) && !wallAt(b, cx, cy) && (!unitAt(b, cx, cy) || (cx === e.x && cy === e.y))) goals.add(key(cx, cy));
      }
  }
  if (!goals.size) return null;
  const q: Cell[] = [{ x: e.x, y: e.y }];
  const prev = new Map<string, Cell | null>([[key(e.x, e.y), null]]);
  let end: Cell | null = null;
  while (q.length) {
    const c = q.shift() as Cell;
    if (goals.has(key(c.x, c.y)) && !(c.x === e.x && c.y === e.y)) {
      end = c;
      break;
    }
    for (const [dx, dy] of [[-1, 0], [0, -1], [0, 1], [1, 0]] as const) {
      const nx = c.x + dx;
      const ny = c.y + dy;
      const k = key(nx, ny);
      if (prev.has(k) || !inBounds(board, nx, ny) || wallAt(b, nx, ny)) continue;
      const occ = unitAt(b, nx, ny);
      if (occ && occ.id !== e.id) continue;
      prev.set(k, c);
      q.push({ x: nx, y: ny });
    }
  }
  if (!end) return null;
  let cur = end;
  let parent = prev.get(key(cur.x, cur.y));
  while (parent && !(parent.x === e.x && parent.y === e.y)) {
    cur = parent;
    parent = prev.get(key(cur.x, cur.y));
  }
  return cur;
}

/** Führt genau eine Gegneraktion aus (für schrittweise Darstellung). */
export function nextEnemyAction(b: BattleState): EnemyStep {
  if (b.result) return { ok: false, done: true, result: b.result };
  if (b.phase !== 'enemy') return { ok: false, done: true };
  const { board } = ctx(b);
  b.events = [];
  while (b.enemyQueue.length) {
    const id = b.enemyQueue.shift() as string;
    const e = b.units.find((u) => u.id === id && u.kind === 'enemy' && u.alive && u.hp > 0);
    if (!e) continue;
    const adjacent = adjacentGuardian(b, e);
    if (adjacent) {
      const def = e.basicAttack ? basicAttackDef(e.basicAttack) : null;
      const dealt = damage(adjacent, def ? def.damage : e.damage);
      emit(b, { type: 'enemy-hit', ability: def?.id, unit: e.id, sourcePos: { x: e.x, y: e.y }, targetId: adjacent.id, targetPos: { x: adjacent.x, y: adjacent.y }, amount: dealt });
      b.message = def ? `${e.name}: ${def.name} trifft ${adjacent.name} für ${dealt} Schaden.` : `${e.name} greift ${adjacent.name} an.`;
      if (checkLoss(b)) return { ok: true, done: true, unit: e.id, type: 'attack', result: b.result };
      return afterEnemy(b, { ok: true, done: false, unit: e.id, type: 'attack' });
    }
    if (e.root > 0) {
      e.root--;
      emit(b, { type: 'rooted-wait', unit: e.id, sourcePos: { x: e.x, y: e.y }, targetPos: { x: e.x, y: e.y }, label: 'FEST' });
      b.message = `${e.name} kommt nicht vom Fleck.`;
      return afterEnemy(b, { ok: true, done: false, unit: e.id, type: 'rooted' });
    }
    let steps = e.move;
    if (traceAt(b, e.x, e.y)) steps = 0;
    const start = { x: e.x, y: e.y };
    let hazardDamage = 0;
    let escaped = false;
    for (let i = 0; i < steps && e.alive; i++) {
      const n = nextStep(b, e);
      if (!n) break;
      e.x = n.x;
      e.y = n.y;
      if (hazardAt(b, e.x, e.y)) {
        hazardDamage += damage(e, 2);
        if (!e.alive) break;
      }
      if (isGateCell(board, e.x, e.y)) {
        e.alive = false;
        b.escaped++;
        escaped = true;
        break;
      }
    }
    if (escaped) {
      emit(b, { type: 'escape', unit: e.id, from: start, to: { x: e.x, y: e.y }, targetPos: { x: e.x, y: e.y }, label: 'DURCHBRUCH' });
      b.message = `${e.name} durchbricht die Linie.`;
      if (checkLoss(b)) return { ok: true, done: true, unit: e.id, type: 'escape', result: b.result };
      return afterEnemy(b, { ok: true, done: false, unit: e.id, type: 'escape' });
    }
    if (hazardDamage) {
      emit(b, { type: 'enemy-move', unit: e.id, from: start, to: { x: e.x, y: e.y }, targetPos: { x: e.x, y: e.y } });
      emit(b, { type: 'hazard-hit', unit: e.id, sourcePos: { x: e.x, y: e.y }, targetId: e.id, targetPos: { x: e.x, y: e.y }, amount: hazardDamage });
      b.message = `${e.name} läuft durch die Glut und nimmt ${hazardDamage} Schaden.`;
      return afterEnemy(b, { ok: true, done: false, unit: e.id, type: 'hazard' });
    }
    if (start.x !== e.x || start.y !== e.y) {
      emit(b, { type: 'enemy-move', unit: e.id, from: start, to: { x: e.x, y: e.y }, targetPos: { x: e.x, y: e.y } });
      b.message = board.gate === 'none' ? `${e.name} rückt vor.` : `${e.name} rückt auf das Tor vor.`;
      return afterEnemy(b, { ok: true, done: false, unit: e.id, type: 'move' });
    }
    emit(b, { type: 'enemy-wait', unit: e.id, sourcePos: { x: e.x, y: e.y }, targetPos: { x: e.x, y: e.y } });
    b.message = `${e.name} sucht einen Weg durch die Linie.`;
    return afterEnemy(b, { ok: true, done: false, unit: e.id, type: 'wait' });
  }
  // Queue leer
  if (b.turnOrder === 'initiative') {
    advanceTurn(b);
    return b.result ? { ok: true, done: true, result: b.result } : { ok: true, done: true, newRound: b.orderIndex === 0 };
  }
  return endRound(b);
}

/** Im Initiative-Modus ist nach einer Gegneraktion sofort die nächste Einheit dran. */
function afterEnemy(b: BattleState, step: EnemyStep): EnemyStep {
  if (b.turnOrder === 'initiative' && !b.enemyQueue.length) {
    advanceTurn(b);
    return { ...step, done: b.phase === 'player' || !!b.result, result: b.result };
  }
  return step;
}

/** Löst die komplette Gegnerphase auf (Tests, nicht-visuelle Verarbeitung). */
export function resolveEnemyPhase(b: BattleState): BattleState {
  let guard = 0;
  while (b.phase === 'enemy' && !b.result && guard++ < 128) nextEnemyAction(b);
  return b;
}

export function status(b: BattleState) {
  return {
    round: b.round,
    escaped: b.escaped,
    result: b.result,
    phase: b.phase,
    selected: b.selected,
    turnOrder: b.turnOrder,
    guardians: living(b, 'guardian').map((x) => ({ id: x.id, speciesId: x.speciesId, hp: x.hp, shield: x.shield, x: x.x, y: x.y, acted: !!b.acted[x.id], resonance: x.resonance })),
    enemies: living(b, 'enemy').map((x) => ({ id: x.id, speciesId: x.speciesId, hp: x.hp, x: x.x, y: x.y, analyzed: x.analyzed, root: x.root })),
  };
}
