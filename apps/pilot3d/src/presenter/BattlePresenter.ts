import { PointerEventTypes, Vector3, type AbstractMesh, type ParticleSystem } from '../babylon';
import { ABILITIES, boardDef, encounterDef, guardianDef, type BoardConfig, type EncounterDef } from '@knowsters/content';
import { nextEnemyAction, rally, select, setMode, tile, unitById, validTiles, wait, type BattleEvent, type BattleState } from '@knowsters/rules';
import { Actor } from '../actors/Actor';
import type { AssetRegistry } from '../assets/registry';
import { loadArena, type Arena } from '../scene/environment';
import { boardToWorld, type Stage } from '../scene/setup';
import { VFX } from '../scene/vfx';
import { Hud } from '../ui/hud';

const key = (x: number, y: number) => `${x}:${y}`;

/**
 * Babylon ist Presenter (Auftrag, Architekturregel): Befehle gehen an den Regelkern, Events
 * kommen zurück und werden hier als Animation/VFX abgespielt. Keine Schadens-, Reichweiten-
 * oder Siegberechnung in dieser Datei.
 */
export class BattlePresenter {
  private arena!: Arena;
  private actors = new Map<string, Actor>();
  private summoner: Actor | null = null;
  private busy = false;
  private hazardFx = new Map<string, ParticleSystem>();
  private auras: ParticleSystem[] = [];
  private note = '';
  readonly log: string[] = [];
  private board!: BoardConfig;
  private encounter!: EncounterDef;

  constructor(
    private readonly stage: Stage,
    private readonly hud: Hud,
    private readonly registry: AssetRegistry,
    private readonly heavyVfx: boolean,
  ) {}

  private state!: BattleState;

  async mount(state: BattleState): Promise<void> {
    this.state = state;
    this.encounter = encounterDef(state.encounterId);
    this.board = boardDef(state.boardId);
    this.arena = await loadArena(this.stage, this.board, this.registry);
    const loads: Promise<void>[] = [];
    for (const u of state.units) if (u.alive && u.hp > 0) loads.push(this.spawnActor(u.id));
    // Beschwörer hinter dem Team
    this.summoner = new Actor(this.stage, 'summoner', 'human', 'human.summoner', this.registry, 1.2);
    loads.push(this.summoner.load());
    await Promise.all(loads);
    if (this.summoner) {
      const p = boardToWorld(this.board.width, this.board.height, (this.board.width - 1) / 2, this.board.height + 0.35);
      this.summoner.setPosition(p);
      this.summoner.faceToward(boardToWorld(this.board.width, this.board.height, (this.board.width - 1) / 2, 0));
    }
    this.stage.scene.onPointerObservable.add((info) => {
      if (info.type !== PointerEventTypes.POINTERTAP) return;
      const scene = this.stage.scene;
      const mode = this.state.mode;
      const pickTile = () => scene.pick(scene.pointerX, scene.pointerY, (m) => !!m.metadata?.tile)?.pickedMesh as AbstractMesh | null;
      // Bewegungs-/Feldziel-Modus: nur Felder picken, sonst verdeckt ein Wesen das Feld dahinter.
      const tileOnly = mode === 'move' || (mode !== null && mode !== 'basic' && ABILITIES[mode]?.target === 'tile');
      let mesh = tileOnly ? pickTile() : (scene.pick(scene.pointerX, scene.pointerY, (m) => !!(m.metadata?.tile || m.metadata?.unit))?.pickedMesh as AbstractMesh | null);
      if (!mesh) return;
      let meta = mesh.metadata as { unit?: string; tile?: { x: number; y: number } };
      // Zielmodus: Wurde ein Wesen getroffen, das kein gültiges Ziel ist (z. B. der eigene Körper vor dem
      // Gegnerfeld), gilt das Feld dahinter.
      if (meta.unit && mode && mode !== 'move' && this.state.selected) {
        const u = unitById(this.state, meta.unit);
        const valid = u ? validTiles(this.state, this.state.selected, mode).has(`${u.x}:${u.y}`) : false;
        if (!valid) {
          mesh = pickTile();
          if (!mesh) return;
          meta = mesh.metadata as { unit?: string; tile?: { x: number; y: number } };
        }
      }
      if (meta.unit && meta.unit !== 'summoner') this.onUnit(meta.unit);
      else if (meta.tile) this.onTile(meta.tile.x, meta.tile.y);
    });
    this.refresh();
    const all = [...this.actors.values(), ...(this.summoner ? [this.summoner] : [])];
    this.log.push(`mount: ${this.actors.size} Wesen · Arena ${this.arena.kind} (${this.arena.key}) · Modelle: ${all.map((a) => `${a.id}=${a.model?.key}${a.missingClips.length ? `[fehlt ${a.missingClips.join(',')}]` : ''}`).join(' ')}`);
    for (const d of this.registry.diagnostics) this.log.push(`${d.level}: ${d.asset} – ${d.message}`);
  }

  private async spawnActor(id: string): Promise<void> {
    const u = unitById(this.state, id);
    if (!u) return;
    const modelKey = u.kind === 'guardian' ? `creature.${u.speciesId}` : `enemy.${u.speciesId}`;
    const actor = new Actor(this.stage, id, 'creature', modelKey, this.registry);
    this.actors.set(id, actor);
    await actor.load();
    actor.setPosition(this.pos(u.x, u.y));
    actor.faceToward(this.pos(u.x, u.kind === 'guardian' ? 0 : this.board.height - 1));
    if (this.heavyVfx || u.kind === 'guardian') {
      const accent = u.kind === 'guardian' ? guardianDef(u.speciesId).accent : '#b271e8';
      const aura = VFX.aura(this.stage.scene, accent);
      aura.emitter = actor.anchor ?? actor.root.position;
      this.auras.push(aura);
    }
  }

  private pos(x: number, y: number): Vector3 {
    return boardToWorld(this.board.width, this.board.height, x, y);
  }

  // ---------------------------------------------------------------- Befehle (nur Weiterleitung)

  private onUnit(id: string): void {
    if (this.busy || this.state.result) return;
    const u = unitById(this.state, id);
    if (!u) return;
    if (u.kind === 'enemy') {
      if (this.state.mode && this.state.mode !== 'move') this.act(() => tile(this.state, u.x, u.y));
      else this.flash(`${u.name} · ${u.hp}/${u.maxHp} LP`);
      return;
    }
    if (this.state.mode && ['nivaro-swap', 'lumi-order', 'pyro-ignite'].includes(this.state.mode)) {
      this.act(() => tile(this.state, u.x, u.y));
      return;
    }
    if (select(this.state, id)) {
      this.hud.closeSkills();
      this.refresh();
    }
  }

  private onTile(x: number, y: number): void {
    if (this.busy || this.state.result || !this.state.mode) return;
    const occ = this.state.units.find((u) => u.alive && u.hp > 0 && u.x === x && u.y === y);
    if (occ) {
      if (this.state.mode !== 'move') this.onUnit(occ.id);
      return;
    }
    this.act(() => tile(this.state, x, y));
  }

  move(): void {
    this.mode('move');
  }

  basic(): void {
    this.mode('basic');
  }

  skill(id: string): void {
    const a = ABILITIES[id];
    if (!a) return;
    const r = setMode(this.state, id);
    if (!r.ok) return this.flash(r.message ?? 'Nicht möglich');
    if (a.target === 'self') return this.afterAction();
    this.note = `${a.name} · ${a.desc}`;
    this.refresh();
  }

  wait(): void {
    if (this.busy) return;
    this.act(() => wait(this.state));
  }

  rally(): void {
    if (this.busy) return;
    const r = rally(this.state);
    if (!r.ok) return this.flash(r.message ?? 'Nicht möglich');
    this.afterAction();
  }

  cancel(): void {
    this.state.mode = null;
    this.note = '';
    this.refresh();
  }

  private mode(m: 'move' | 'basic'): void {
    if (this.busy) return;
    const r = setMode(this.state, m);
    if (!r.ok) return this.flash(r.message ?? 'Nicht möglich');
    this.note = '';
    this.refresh();
  }

  private act(command: () => { ok: boolean; message?: string }): void {
    const r = command();
    if (!r.ok) return this.flash(r.message ?? 'Nicht möglich');
    this.afterAction();
  }

  private flash(msg: string): void {
    this.note = msg;
    this.refresh();
    setTimeout(() => {
      if (this.note === msg) {
        this.note = '';
        this.refresh();
      }
    }, 1400);
  }

  private afterAction(): void {
    this.hud.closeSkills();
    this.note = '';
    void this.playAndContinue();
  }

  // ---------------------------------------------------------------- Events → Animation

  private async playAndContinue(): Promise<void> {
    this.busy = true;
    this.arena.clearTiles();
    this.refresh();
    await this.playEvents(this.state.events);
    await this.sync();
    if (this.state.result) {
      this.busy = false;
      this.refresh();
      return;
    }
    if (this.state.phase === 'enemy') {
      let guard = 0;
      while (this.state.phase === 'enemy' && !this.state.result && guard++ < 128) {
        await this.delay(220);
        nextEnemyAction(this.state);
        await this.playEvents(this.state.events);
        await this.sync();
      }
    }
    this.busy = false;
    this.refresh();
  }

  private delay(ms: number): Promise<void> {
    return new Promise((r) => setTimeout(r, ms));
  }

  private async playEvents(events: BattleEvent[]): Promise<void> {
    for (const e of events) await this.playEvent(e);
    this.drawTerrain();
  }

  private playEvent(e: BattleEvent): Promise<void> {
    return new Promise((resolve) => {
      const done = () => resolve();
      const actor = e.unit ? this.actors.get(e.unit) : undefined;
      const target = e.targetId ? this.actors.get(e.targetId) : undefined;
      const tpos = e.targetPos ? this.pos(e.targetPos.x, e.targetPos.y) : null;
      const scene = this.stage.scene;
      switch (e.type) {
        case 'move':
        case 'jump':
        case 'enemy-move':
          if (!actor || !e.to) return done();
          actor.moveTo(this.pos(e.to.x, e.to.y), done);
          break;
        case 'charge':
          if (!actor || !e.to) return done();
          actor.moveTo(this.pos(e.to.x, e.to.y), () => {
            if (!target || !tpos) return done();
            actor.attack(tpos, () => this.impact(target, actor, e.amount ?? 0, 'fire'), done);
          });
          break;
        case 'basic-attack':
          if (!actor || !target || !tpos) return done();
          actor.attack(tpos, () => this.impact(target, actor, e.amount ?? 0, 'fire'), done);
          break;
        case 'enemy-hit':
          if (!actor || !target || !tpos) return done();
          actor.attack(tpos, () => this.impact(target, actor, e.amount ?? 0, 'enemy'), done);
          break;
        case 'beam':
        case 'flame':
          if (!actor || !target || !tpos) return done();
          actor.cast(tpos, () => VFX.projectile(scene, actor.root.position, tpos, e.type === 'beam' ? '#f2d08d' : '#ff8a4d', () => this.impact(target, actor, e.amount ?? 0, e.type === 'beam' ? 'light' : 'fire')), done);
          break;
        case 'hazard-hit':
          if (!target) return done();
          this.impact(target, target, e.amount ?? 0, 'fire');
          setTimeout(done, 260);
          break;
        case 'heal':
          if (!actor || !target) return done();
          actor.cast(target.root.position, () => VFX.lightHit(scene, target.root.position), done);
          break;
        case 'pulse':
          if (!actor || !target) return done();
          actor.cast(target.root.position, () => {
            VFX.lightHit(scene, target.root.position);
            if (tpos) target.moveTo(tpos);
          }, done);
          break;
        case 'swap':
          if (!actor || !target || !e.to || !e.targetTo) return done();
          target.moveTo(this.pos(e.targetTo.x, e.targetTo.y));
          actor.moveTo(this.pos(e.to.x, e.to.y), done);
          break;
        case 'spawn':
          if (!e.unit) return done();
          void this.spawnActor(e.unit).then(done);
          break;
        case 'escape':
          if (!actor || !e.to) return done();
          actor.moveTo(this.pos(e.to.x, e.to.y), () => actor.down(done));
          break;
        case 'rally':
          if (e.unit === this.state.units.find((u) => u.kind === 'guardian')?.id && this.summoner) {
            // Kommando-Animation einmal auslösen, VFX auf jedem Wächter
            this.summoner.command(() => {
              for (const g of this.state.units) if (g.kind === 'guardian' && g.alive) { const a = this.actors.get(g.id); if (a) VFX.rally(scene, a.root.position); }
            }, done);
          } else {
            if (target) VFX.rally(scene, target.root.position);
            setTimeout(done, 80);
          }
          break;
        case 'wait':
        case 'enemy-wait':
        case 'rooted-wait':
          setTimeout(done, 160);
          break;
        default: {
          // insight, ignite, root, trace, wall, trail, stand, refuge, detour, …
          if (!actor) return done();
          actor.cast(tpos, () => {
            const where = target?.root.position ?? tpos ?? actor.root.position;
            VFX.lightHit(scene, where);
            this.drawTerrain();
          }, done);
        }
      }
    });
  }

  private impact(target: Actor, from: Actor, amount: number, kind: 'fire' | 'light' | 'enemy'): void {
    if (kind === 'fire') VFX.fireHit(this.stage.scene, target.root.position);
    else if (kind === 'light') VFX.lightHit(this.stage.scene, target.root.position);
    else VFX.enemyHit(this.stage.scene, target.root.position);
    target.hit(from.root.position);
    this.note = amount > 0 ? `−${amount}` : 'Geblockt';
    this.hud.render(this.state, true, this.note);
  }

  private async sync(): Promise<void> {
    for (const u of this.state.units) {
      const a = this.actors.get(u.id);
      if (!a) continue;
      if (!u.alive || u.hp <= 0) {
        this.actors.delete(u.id);
        await new Promise<void>((r) => a.down(() => { a.dispose(); r(); }));
        continue;
      }
      const p = this.pos(u.x, u.y);
      if (Vector3.Distance(a.root.position, new Vector3(p.x, 0.08, p.z)) > 0.05) a.setPosition(p);
    }
    for (const [id, a] of this.actors) if (!this.state.units.some((u) => u.id === id && u.alive && u.hp > 0)) { a.dispose(); this.actors.delete(id); }
  }

  private drawTerrain(): void {
    const s = this.state;
    const wanted = new Set(s.hazards.map((h) => key(h.x, h.y)));
    for (const [k, ps] of this.hazardFx) if (!wanted.has(k)) { ps.dispose(); this.hazardFx.delete(k); }
    for (const h of s.hazards) if (!this.hazardFx.has(key(h.x, h.y))) this.hazardFx.set(key(h.x, h.y), VFX.ember(this.stage.scene, this.pos(h.x, h.y)));
  }

  refresh(): void {
    const s = this.state;
    this.arena.clearTiles();
    for (const w of s.walls) if (!w.static) this.arena.setTile(w.x, w.y, 'wall');
    for (const h of s.hazards) this.arena.setTile(h.x, h.y, 'hazard');
    for (const t of s.traces) for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) this.arena.setTile(t.x + dx, t.y + dy, 'trace');
    const sel = unitById(s, s.selected);
    if (sel && !this.busy && s.phase === 'player' && !s.result) {
      this.arena.setTile(sel.x, sel.y, 'selected');
      if (s.mode) for (const k of validTiles(s, sel.id, s.mode)) { const [x, y] = k.split(':').map(Number) as [number, number]; this.arena.setTile(x, y, s.mode === 'move' ? 'move' : 'target'); }
    }
    this.hud.render(s, this.busy, this.note);
  }
}
