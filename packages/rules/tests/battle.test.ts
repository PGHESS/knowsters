import { describe, expect, it } from 'vitest';
import { ENCOUNTER_PROLOG, ENCOUNTER_WORKSHOP, GUARDIAN_ORDER, type EncounterDef } from '@knowsters/content';
import {
  createBattle,
  createCreature,
  hydrateBattle,
  living,
  nextEnemyAction,
  rally,
  resolveEnemyPhase,
  seededRng,
  select,
  setMode,
  status,
  tile,
  unitById,
  validTiles,
  wait,
  type BattleState,
  type CreatureInstance,
  type TurnOrderMode,
} from '../src';

const team = (seed = 7): CreatureInstance[] => {
  const rng = seededRng(seed);
  return GUARDIAN_ORDER.map((s) => createCreature(s, `${s}-1`, rng));
};
const guardian = (b: BattleState, species: string) => b.units.find((u) => u.speciesId === species && u.kind === 'guardian')!;
const start = (encounter: EncounterDef = ENCOUNTER_PROLOG, turnOrder: TurnOrderMode = 'sides', seed = 7) => createBattle(encounter, team(seed), { turnOrder });

describe('battle: setup and derived stats', () => {
  it('places four guardians and three enemies on the portrait bridge', () => {
    const b = start();
    const s = status(b);
    expect(s.round).toBe(1);
    expect(s.phase).toBe('player');
    expect(s.guardians).toHaveLength(4);
    expect(s.enemies).toHaveLength(3);
    expect(b.selected).toBe(guardian(b, 'pyro').id); // Tutorial-Hinweis Runde 1 wählt Pyro vor
    expect(guardian(b, 'pyro').abilities).not.toContain('pyro-trail'); // gesperrte Signature-Fähigkeit
    expect(guardian(b, 'terra').abilities).toHaveLength(4);
  });
  it('derives hp/move/resonance from attributes without exploding the numbers', () => {
    const t = team();
    const pyro = t.find((c) => c.speciesId === 'pyro')!;
    const base = createBattle(ENCOUNTER_PROLOG, t);
    const hp0 = guardian(base, 'pyro').maxHp;
    const move0 = guardian(base, 'pyro').move;
    pyro.attributes.vitality.value = 960;
    pyro.attributes.agility.value = 960;
    pyro.attributes.resonance.value = 900;
    const boosted = createBattle(ENCOUNTER_PROLOG, t);
    const p = guardian(boosted, 'pyro');
    expect(p.maxHp).toBe(hp0 + 4);
    expect(p.move).toBe(move0 + 2);
    expect(p.maxResonance).toBe(3);
    expect(p.maxHp).toBeLessThan(20);
  });
});

describe('battle: sides mode (team then enemies)', () => {
  it('one action per guardian opens a sequential enemy phase, then round 2 with spawns', () => {
    const b = start();
    expect(setMode(b, 'pyro-charge').ok).toBe(true);
    const pyro = guardian(b, 'pyro');
    const targets = validTiles(b, pyro.id, 'pyro-charge');
    expect(targets.size).toBeGreaterThan(0);
    const [tx, ty] = [...targets][0]!.split(':').map(Number) as [number, number];
    expect(tile(b, tx, ty).ok).toBe(true);
    expect(b.acted[pyro.id]).toBe(true);
    for (const s of ['lumi', 'terra', 'nivaro']) {
      select(b, guardian(b, s).id);
      expect(wait(b).ok).toBe(true);
    }
    expect(b.phase).toBe('enemy');
    const queued = b.enemyQueue.length;
    expect(queued).toBeGreaterThanOrEqual(1);
    const step = nextEnemyAction(b);
    expect(step.ok).toBe(true);
    expect(b.enemyQueue.length).toBeLessThan(queued);
    resolveEnemyPhase(b);
    expect(b.phase).toBe('player');
    expect(b.round).toBe(2);
    expect(living(b, 'enemy').length).toBeGreaterThanOrEqual(4);
    expect(b.acted).toEqual({});
  });
  it('a guardian that already acted cannot act again; the next unacted one is selected', () => {
    const b = start();
    const first = b.selected!;
    wait(b, first);
    expect(b.selected).not.toBe(first);
    select(b, first);
    expect(setMode(b, 'move').ok).toBe(false);
  });
  it("terra's wall is a real blocker for movement", () => {
    const b = start();
    select(b, guardian(b, 'terra').id);
    expect(setMode(b, 'terra-wall').ok).toBe(true);
    const cell = [...validTiles(b, b.selected, 'terra-wall')][0]!;
    const [x, y] = cell.split(':').map(Number) as [number, number];
    expect(tile(b, x, y).ok).toBe(true);
    expect(b.walls.some((w) => w.x === x && w.y === y && !w.static)).toBe(true);
    select(b, guardian(b, 'nivaro').id);
    setMode(b, 'move');
    expect(validTiles(b, b.selected, 'move').has(cell)).toBe(false);
  });
  it('holding the gate for six rounds wins, three escapes lose', () => {
    const b = start();
    b.round = 6;
    b.units = b.units.filter((u) => u.kind === 'guardian');
    for (const g of living(b, 'guardian')) wait(b, g.id);
    expect(b.phase).toBe('player'); // keine Gegner → Runde endet sofort
    expect(b.result).toBe('won');

    const c = start();
    c.escaped = 2;
    const enemy = living(c, 'enemy')[0]!;
    enemy.x = 2;
    enemy.y = 5; // ein Feld vor der Torreihe, kein Wächter angrenzend
    for (const g of living(c, 'guardian')) wait(c, g.id);
    resolveEnemyPhase(c);
    expect(c.escaped).toBe(3);
    expect(c.result).toBe('lost');
  });
});

describe('battle: initiative mode', () => {
  it('units act strictly in initiative order, enemies interleaved', () => {
    const b = start(ENCOUNTER_PROLOG, 'initiative');
    expect(b.order).toHaveLength(7);
    const inits = b.order.map((id) => unitById(b, id)!.initiative);
    for (let i = 1; i < inits.length; i++) expect(inits[i]! <= inits[i - 1]!).toBe(true);
    const current = b.order[b.orderIndex]!;
    const u = unitById(b, current)!;
    if (u.kind === 'guardian') {
      const other = living(b, 'guardian').find((g) => g.id !== u.id)!;
      expect(select(b, other.id)).toBe(true);
      expect(setMode(b, 'move').ok).toBe(false); // nicht am Zug
      expect(b.selected).toBe(other.id);
      select(b, u.id);
      expect(wait(b).ok).toBe(true);
    } else {
      expect(b.phase).toBe('enemy');
      nextEnemyAction(b);
    }
    // eine volle Runde abspielen
    let guard = 0;
    while (b.round === 1 && !b.result && guard++ < 40) {
      if (b.phase === 'enemy') nextEnemyAction(b);
      else wait(b);
    }
    expect(b.round).toBe(2);
    expect(b.result).toBeNull();
  });
});

describe('battle: summoner command, resonance, objectives', () => {
  it('rally works once per battle and grants move + shield', () => {
    const b = start();
    const before = guardian(b, 'pyro').move;
    expect(rally(b).ok).toBe(true);
    expect(b.teamMoveBonus).toBe(1);
    expect(guardian(b, 'pyro').shield).toBeGreaterThanOrEqual(1);
    setMode(b, 'move');
    const reach = validTiles(b, b.selected, 'move').size;
    expect(reach).toBeGreaterThan(0);
    expect(rally(b).ok).toBe(false);
    expect(before).toBe(guardian(b, 'pyro').move);
  });
  it('signature abilities cost resonance and are refused when empty', () => {
    const b = start();
    select(b, guardian(b, 'nivaro').id);
    const nivaro = guardian(b, 'nivaro');
    nivaro.resonance = 1;
    expect(setMode(b, 'nivaro-detour').ok).toBe(true); // self-target, wird sofort ausgeführt
    expect(nivaro.resonance).toBe(0);
    expect(b.nextMoveBonus).toBe(1);
    b.acted = {};
    select(b, nivaro.id);
    expect(setMode(b, 'nivaro-detour').ok).toBe(false);
  });
  it('defeatAll is won only when no enemies live and no spawns are pending', () => {
    const b = start(ENCOUNTER_WORKSHOP);
    for (const e of living(b, 'enemy')) e.hp = 1;
    select(b, guardian(b, 'pyro').id);
    // alle Gegner per Regel töten wäre lang; simuliere Zustand vor der letzten Aktion
    for (const e of living(b, 'enemy')) { e.hp = 0; e.alive = false; }
    expect(wait(b).ok).toBe(true);
    expect(b.result).toBeNull(); // Runde 3 bringt noch einen Verdichter
    b.round = 3;
    for (const g of living(b, 'guardian')) if (!b.acted[g.id]) wait(b, g.id);
    // Runde 3 hat begonnen (Spawn), jetzt den Spawn entfernen und handeln
    for (const e of living(b, 'enemy')) { e.hp = 0; e.alive = false; }
    b.acted = {};
    select(b, guardian(b, 'lumi').id);
    wait(b);
    expect(b.result).toBe('won');
  });
  it('impulse pushes away from the gate; without gate away from the caster', () => {
    const b = start();
    const nivaro = guardian(b, 'nivaro');
    nivaro.x = 4; // Spalte 5 hat ein statisches Hindernis in Reihe 2
    const enemy = living(b, 'enemy')[0]!;
    enemy.x = nivaro.x;
    enemy.y = nivaro.y - 1;
    select(b, nivaro.id);
    expect(setMode(b, 'nivaro-pulse').ok).toBe(true);
    expect(tile(b, enemy.x, enemy.y).ok).toBe(true);
    expect(enemy.y).toBe(nivaro.y - 3);

    const c = start(ENCOUNTER_WORKSHOP);
    const n2 = guardian(c, 'nivaro');
    n2.y = 6; // unterste Reihe: kein Wächter in Schubrichtung
    const e2 = living(c, 'enemy')[0]!;
    e2.x = n2.x - 1;
    e2.y = n2.y;
    select(c, n2.id);
    setMode(c, 'nivaro-pulse');
    expect(tile(c, e2.x, e2.y).ok).toBe(true);
    expect(e2.x).toBe(n2.x - 3);
  });
  it('survives a JSON round trip (save/reload mid battle)', () => {
    const b = start();
    wait(b);
    const copy = hydrateBattle(JSON.parse(JSON.stringify(b)))!;
    expect(copy).not.toBeNull();
    expect(copy.acted).toEqual(b.acted);
    expect(wait(copy).ok).toBe(true);
    expect(hydrateBattle({ version: 1 })).toBeNull();
  });
});
