import Phaser from 'phaser';
import { ABILITIES, basicAttackDef, boardDef, encounterDef, enemyDef, guardianDef, type BoardConfig, type EncounterDef } from '@knowsters/content';
import {
  canAct,
  living,
  nextEnemyAction,
  previewEnemy,
  rally,
  select,
  setMode,
  tile,
  unitById,
  validTiles,
  wait,
  type BattleEvent,
  type BattleState,
  type BattleUnit,
} from '@knowsters/rules';
import { layoutFor, paintArena, type ArenaLayout } from '../battle/arena';
import { COLORS, H, W, prefersReducedMotion, textStyle } from '../config';
import { HumanFigure } from '../human/HumanFigure';
import { CreatureRig } from '../rig/CreatureRig';
import type { Router } from '../router';
import type { GameStore } from '../store/store';
import { addPill, flash, floatText, makeButton, type CanvasButton } from '../ui/canvas';
import { showResult } from '../ui/result';

interface UnitView {
  rig: CreatureRig;
  hpBg: Phaser.GameObjects.Rectangle;
  hpBar: Phaser.GameObjects.Rectangle;
  shield: Phaser.GameObjects.Text;
  status: Phaser.GameObjects.Text;
  ring: Phaser.GameObjects.Ellipse;
}

const DEPTH = { tiles: 1, highlight: 4, decor: 5, summoner: 8, units: 10, fx: 40, hud: 60 } as const;

/**
 * BattleScene = Presenter. Sie hält keinen Regelzustand, sondern ruft den Regelkern auf,
 * speichert nach jeder Aktion und spielt die zurückgegebenen Events als Animation ab.
 */
export class BattleScene extends Phaser.Scene {
  private store!: GameStore;
  private router!: Router;
  private state!: BattleState;
  private encounter!: EncounterDef;
  private board!: BoardConfig;
  private L!: ArenaLayout;
  private views = new Map<string, UnitView>();
  private highlights: Phaser.GameObjects.GameObject[] = [];
  private decor!: Phaser.GameObjects.Graphics;
  private tileHits: Phaser.GameObjects.Rectangle[] = [];
  private busy = false;
  private reduced = false;
  private finished = false;
  private hud!: { round: ReturnType<typeof addPill>; phase: ReturnType<typeof addPill>; objective: ReturnType<typeof addPill>; message: Phaser.GameObjects.Text };
  private bar!: { name: Phaser.GameObjects.Text; stats: Phaser.GameObjects.Text; info: Phaser.GameObjects.Text; move: CanvasButton; basic: CanvasButton; skills: CanvasButton; wait: CanvasButton; back: CanvasButton; rally: CanvasButton };
  private skillButtons: CanvasButton[] = [];
  private skillLevel = false;
  private summoner!: HumanFigure;

  constructor() {
    super('Battle');
  }

  create(): void {
    this.store = this.registry.get('store') as GameStore;
    this.router = this.registry.get('router') as Router;
    const battle = this.store.state.battle;
    if (!battle) {
      this.router.go('Home');
      return;
    }
    this.state = battle;
    this.encounter = encounterDef(battle.encounterId);
    this.board = boardDef(battle.boardId);
    this.L = layoutFor(this.board);
    this.reduced = prefersReducedMotion() || this.store.state.settings.reducedMotion;
    this.views.clear();
    this.highlights = [];
    this.skillButtons = [];
    this.skillLevel = false;
    this.busy = false;
    this.finished = false;

    paintArena(this, this.board, this.L);
    this.decor = this.add.graphics().setDepth(DEPTH.decor);
    this.createTileHits();
    for (const u of this.state.units) if (u.alive && u.hp > 0) this.createUnitView(u);
    const sy = this.L.startY + this.L.tileH * this.L.rows + 42;
    this.summoner = new HumanFigure(this, W / 2, sy, this.store.state.player.avatar, 0.82).setDepth(DEPTH.summoner);
    this.add.text(W / 2, sy + 62, 'DU', textStyle(9, '#bceff4', '700')).setOrigin(0.5).setDepth(DEPTH.summoner);
    this.createHud();
    this.createBar();
    this.refresh();
    if (this.state.result) this.time.delayedCall(300, () => this.finish());
    else if (this.state.phase === 'enemy') this.time.delayedCall(400, () => void this.runEnemyPhase());
    else if (this.state.round === 1 && Object.keys(this.state.acted).length === 0) this.time.delayedCall(500, () => this.tutorialPulse());
  }

  // ---------------------------------------------------------------- Aufbau

  private createTileHits(): void {
    for (let y = 0; y < this.L.rows; y++)
      for (let x = 0; x < this.L.cols; x++) {
        const c = this.L.center(x, y);
        const r = this.add.rectangle(c.x, c.y, this.L.tileW - 2, this.L.tileH - 2, 0x000000, 0).setDepth(DEPTH.tiles + 1).setInteractive();
        r.on('pointerup', () => this.onTile(x, y));
        this.tileHits.push(r);
      }
  }

  private createUnitView(u: BattleUnit): UnitView {
    const c = this.L.center(u.x, u.y);
    const species = u.kind === 'guardian' ? guardianDef(u.speciesId) : null;
    const enemy = u.kind === 'enemy' ? enemyDef(u.speciesId) : null;
    const accent = species ? parseInt(species.accent.slice(1), 16) : 0xe26fe7;
    const rig = new CreatureRig(this, c.x, c.y + this.L.tileH * 0.36, `creature:${species?.sprite ?? enemy?.sprite}`, {
      height: u.kind === 'guardian' ? this.L.tileH * 0.98 : this.L.tileH * 0.9,
      accent,
      reducedMotion: this.reduced,
    });
    rig.setDepth(DEPTH.units + u.y);
    rig.setSize(this.L.tileW - 6, this.L.tileH + 10).setInteractive();
    rig.on('pointerup', () => this.onUnit(u.id));
    const ring = this.add.ellipse(c.x, c.y + this.L.tileH * 0.38, this.L.tileW * 0.8, this.L.tileH * 0.3, accent, 0).setStrokeStyle(2, accent, 0).setDepth(DEPTH.highlight);
    const hpBg = this.add.rectangle(c.x, c.y + this.L.tileH * 0.46, 40, 5, 0x1a1420).setDepth(DEPTH.units + 20);
    const hpBar = this.add.rectangle(c.x - 20, c.y + this.L.tileH * 0.46, 40, 5, u.kind === 'enemy' ? 0xe26fe7 : 0x66e79e).setOrigin(0, 0.5).setDepth(DEPTH.units + 21);
    const shield = this.add.text(c.x + 22, c.y + this.L.tileH * 0.46, '', textStyle(9, '#bfe9ff', '700')).setOrigin(0, 0.5).setDepth(DEPTH.units + 21).setStroke('#06131f', 3);
    const status = this.add.text(c.x, c.y - this.L.tileH * 0.5, '', textStyle(10, '#f2d08d', '700')).setOrigin(0.5).setDepth(DEPTH.units + 21).setStroke('#06131f', 3);
    const view = { rig, hpBg, hpBar, shield, status, ring };
    this.views.set(u.id, view);
    return view;
  }

  private createHud(): void {
    this.add.rectangle(W / 2, 48, W, 96, 0x06121d, 0.55).setDepth(DEPTH.hud - 1);
    const round = addPill(this, 90, 44, 92, 30, 'RUNDE 1', { fill: 0x0a2636 });
    const phase = addPill(this, 198, 44, 104, 30, 'DEIN ZUG', { fill: 0x0a2636 });
    const objective = addPill(this, 316, 44, 104, 30, '', { fill: 0x281e27, stroke: 0xdf6ad7, text: '#f8d8f4' });
    for (const p of [round, phase, objective]) p.container.setDepth(DEPTH.hud);
    const message = this.add.text(W / 2, 82, '', textStyle(11, '#dbf8fb')).setOrigin(0.5, 0).setWordWrapWidth(340).setAlign('center').setDepth(DEPTH.hud);
    this.hud = { round, phase, objective, message };
  }

  private createBar(): void {
    const barY = H - 58;
    this.add.rectangle(W / 2, H - 80, 376, 152, 0x071722, 0.96).setStrokeStyle(1, 0x6bdde7, 0.22).setDepth(DEPTH.hud - 1);
    const name = this.add.text(20, H - 150, '', textStyle(13, '#fff', '700')).setDepth(DEPTH.hud);
    const stats = this.add.text(20, H - 133, '', textStyle(10, '#9fb7c2')).setDepth(DEPTH.hud);
    const info = this.add.text(20, H - 118, '', textStyle(10, '#dbf8fb')).setDepth(DEPTH.hud).setWordWrapWidth(350).setLineSpacing(1);
    const move = makeButton(this, 56, barY, 84, 56, '↔ BEWEGEN', () => this.onMove(), { fill: 0x123548, size: 10 });
    const basic = makeButton(this, 148, barY, 88, 56, '⚔ ANGRIFF', () => this.onBasic(), { fill: 0x4a2a2a, stroke: COLORS.red, accent: '#ffe4e4', size: 10, sub: 'Grundangriff' });
    const skills = makeButton(this, 244, barY, 96, 56, '✦ FÄHIGK.', () => this.toggleSkills(true), { fill: 0x5b341b, stroke: COLORS.orange, accent: '#fff2df', size: 10, sub: '4 Slots' });
    const waitBtn = makeButton(this, 340, barY, 82, 56, 'WARTEN', () => this.onWait(), { fill: 0x18372c, stroke: COLORS.green, accent: '#e7fff0', size: 10 });
    const back = makeButton(this, 22, 44, 32, 30, '‹', () => this.leave(), { fill: 0x102836, stroke: 0x5e8190 });
    // Beschwörerkommando sitzt beim Menschen, nicht in der Wesen-Leiste
    const sy = this.L.startY + this.L.tileH * this.L.rows + 42;
    const rallyBtn = makeButton(this, W - 72, sy + 4, 108, 40, '⚑ SAMMELN', () => this.onRally(), { fill: 0x2b2440, stroke: COLORS.violet, accent: '#f0e6ff', size: 10, sub: 'Kommando' });
    for (const b of [move, basic, skills, waitBtn, back, rallyBtn]) b.container.setDepth(DEPTH.hud);
    this.bar = { name, stats, info, move, basic, skills, wait: waitBtn, back, rally: rallyBtn };
  }

  private toggleSkills(open: boolean): void {
    this.skillLevel = open;
    for (const b of this.skillButtons) b.destroy();
    this.skillButtons = [];
    const visible = !open;
    this.bar.move.container.setVisible(visible);
    this.bar.basic.container.setVisible(visible);
    this.bar.skills.container.setVisible(visible);
    this.bar.wait.container.setVisible(visible);
    if (!open) {
      this.refresh();
      return;
    }
    const u = unitById(this.state, this.state.selected);
    if (!u) return;
    const species = guardianDef(u.speciesId);
    const barY = H - 58;
    species.abilities.forEach((id, i) => {
      const a = ABILITIES[id]!;
      const known = u.abilities.includes(id);
      const affordable = u.resonance >= a.resonanceCost;
      const btn = makeButton(this, 58 + i * 78, barY, 72, 60, `${a.icon} ${a.name}`, () => this.onSkill(id), {
        fill: known ? (i === 3 ? 0x3a2b4d : 0x123548) : 0x1b222a,
        stroke: known ? (i === 3 ? COLORS.violet : COLORS.cyan) : 0x4b5a63,
        size: 9,
        sub: known ? `R ${a.range}${a.resonanceCost ? ` · ${a.resonanceCost} RES` : ''}` : 'gesperrt',
      });
      btn.setEnabled(known && affordable);
      btn.container.setDepth(DEPTH.hud);
      this.skillButtons.push(btn);
    });
    const close = makeButton(this, 358, barY, 40, 60, '‹', () => { this.clearMode(); this.toggleSkills(false); }, { fill: 0x102836, stroke: 0x5e8190 });
    close.container.setDepth(DEPTH.hud);
    this.skillButtons.push(close);
    this.bar.info.setText('Tippe eine Fähigkeit, dann ein Ziel im Feld. Gesperrte Fähigkeiten lernst du unter Team.');
  }

  // ---------------------------------------------------------------- Input

  private onUnit(id: string): void {
    if (this.busy || this.finished) return;
    const u = unitById(this.state, id);
    if (!u) return;
    if (u.kind === 'enemy') {
      if (this.state.mode && this.state.mode !== 'move') {
        this.act(() => tile(this.state, u.x, u.y));
      } else {
        const p = previewEnemy(this.state, id);
        const insight = living(this.state, 'guardian').some((g) => g.insight > 0);
        const intent = insight ? (p.type === 'attack' ? ' · Absicht: Angriff' : p.type === 'move' ? ' · Absicht: Vorrücken' : p.type === 'rooted' ? ' · festgehalten' : ' · wartet') : '';
        flash(this, 108, `${u.name} · ${u.hp}/${u.maxHp} LP${u.analyzed ? ' · analysiert' : ''}${intent}`, 1300, DEPTH.hud + 5);
      }
      return;
    }
    if (this.state.mode === 'nivaro-swap' || this.state.mode === 'lumi-order' || this.state.mode === 'pyro-ignite') {
      this.act(() => tile(this.state, u.x, u.y));
      return;
    }
    if (select(this.state, id)) {
      this.toggleSkills(false);
      this.refresh();
      const v = this.views.get(id);
      if (v) this.tweens.add({ targets: v.rig, scaleX: 1.06, scaleY: 1.06, duration: 110, yoyo: true });
    }
  }

  private onTile(x: number, y: number): void {
    if (this.busy || this.finished || !this.state.mode) return;
    const occupant = unitById(this.state, this.state.units.find((u) => u.alive && u.hp > 0 && u.x === x && u.y === y)?.id ?? null);
    if (occupant && this.state.mode === 'move') return;
    if (occupant) {
      this.onUnit(occupant.id);
      return;
    }
    this.act(() => tile(this.state, x, y));
  }

  private onMove(): void {
    if (this.busy || this.finished) return;
    const r = setMode(this.state, 'move');
    if (!r.ok) flash(this, 108, r.message ?? 'Nicht möglich', 1200, DEPTH.hud + 5);
    this.refresh();
  }

  private onBasic(): void {
    if (this.busy || this.finished) return;
    const r = setMode(this.state, 'basic');
    if (!r.ok) {
      flash(this, 108, r.message ?? 'Nicht möglich', 1200, DEPTH.hud + 5);
      return;
    }
    const sel = unitById(this.state, this.state.selected);
    const def = sel?.basicAttack ? basicAttackDef(sel.basicAttack) : null;
    this.refresh(false);
    this.bar.info.setText(def ? `${def.name} · Reichweite ${def.range} · ${def.desc}` : 'Tippe einen Gegner in Reichweite.');
    this.showTargets();
  }

  private onSkill(id: string): void {
    if (this.busy || this.finished) return;
    const a = ABILITIES[id]!;
    const r = setMode(this.state, id);
    if (!r.ok) {
      flash(this, 108, r.message ?? 'Nicht möglich', 1200, DEPTH.hud + 5);
      return;
    }
    if (a.target === 'self') {
      // sofort ausgeführt
      this.afterAction();
      return;
    }
    this.bar.info.setText(`${a.name} · ${a.desc}`);
    this.refresh(false);
  }

  private onWait(): void {
    if (this.busy || this.finished) return;
    this.act(() => wait(this.state));
  }

  private onRally(): void {
    if (this.busy || this.finished) return;
    const r = rally(this.state);
    if (!r.ok) {
      flash(this, 108, r.message ?? 'Nicht möglich', 1200, DEPTH.hud + 5);
      return;
    }
    this.summoner.setWalking(true);
    this.time.delayedCall(500, () => this.summoner.setWalking(false));
    this.afterAction();
  }

  private clearMode(): void {
    this.state.mode = null;
  }

  private leave(): void {
    if (this.busy) return;
    this.store.saveBattle();
    this.router.go('Home');
  }

  // ---------------------------------------------------------------- Aktion → Events → Anzeige

  private act(command: () => { ok: boolean; message?: string }): void {
    const r = command();
    if (!r.ok) {
      if (r.message) flash(this, 108, r.message, 1200, DEPTH.hud + 5);
      return;
    }
    this.afterAction();
  }

  private afterAction(): void {
    this.store.saveBattle();
    this.toggleSkills(false);
    void this.playAndContinue();
  }

  private async playAndContinue(): Promise<void> {
    this.busy = true;
    this.clearHighlights();
    await this.playEvents(this.state.events);
    this.syncUnits();
    if (this.state.result) {
      this.busy = false;
      this.finish();
      return;
    }
    if (this.state.phase === 'enemy') {
      await this.runEnemyPhase();
      return;
    }
    this.busy = false;
    this.refresh();
  }

  private async runEnemyPhase(): Promise<void> {
    this.busy = true;
    this.refresh(false);
    let guard = 0;
    while (this.state.phase === 'enemy' && !this.state.result && guard++ < 128) {
      await this.delay(this.reduced ? 60 : 260);
      const step = nextEnemyAction(this.state);
      this.store.saveBattle();
      await this.playEvents(this.state.events);
      this.syncUnits();
      this.refresh(false);
      if (!step.ok && step.done) break;
    }
    this.busy = false;
    this.refresh();
    if (this.state.result) this.finish();
    else if (this.state.round > 1 && Object.keys(this.state.acted).length === 0) {
      const hint = this.encounter.tutorial[this.state.round];
      if (hint) flash(this, 108, `${hint.title} ${hint.text}`, 2600, DEPTH.hud + 5);
    }
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => this.time.delayedCall(ms, resolve));
  }

  private cellPos(c: { x: number; y: number }): { x: number; y: number } {
    const p = this.L.center(c.x, c.y);
    return { x: p.x, y: p.y + this.L.tileH * 0.36 };
  }

  private async playEvents(events: BattleEvent[]): Promise<void> {
    for (const e of events) await this.playEvent(e);
    this.drawDecor();
  }

  private playEvent(e: BattleEvent): Promise<void> {
    return new Promise((resolve) => {
      const done = () => resolve();
      const actor = e.unit ? this.views.get(e.unit) : undefined;
      const target = e.targetId ? this.views.get(e.targetId) : undefined;
      const tpos = e.targetPos ? this.cellPos(e.targetPos) : null;
      const dmgColor = '#ffb19b';
      switch (e.type) {
        case 'move':
        case 'jump':
        case 'enemy-move': {
          if (!actor || !e.to) return done();
          const p = this.cellPos(e.to);
          actor.rig.setDepth(DEPTH.units + e.to.y);
          actor.rig.travelTo(p.x, p.y, done);
          break;
        }
        case 'charge': {
          if (!actor || !e.to) return done();
          const p = this.cellPos(e.to);
          actor.rig.setDepth(DEPTH.units + e.to.y);
          actor.rig.travelTo(p.x, p.y, () => {
            if (!target || !tpos) return done();
            actor.rig.attack(tpos.x, tpos.y, () => this.impact(target, actor.rig.x, e.amount ?? 0, dmgColor), done);
          });
          break;
        }
        case 'beam':
        case 'flame': {
          if (!actor || !target || !tpos) return done();
          actor.rig.cast(() => {
            const color = e.type === 'beam' ? COLORS.gold : COLORS.orange;
            const orb = this.add.circle(actor.rig.x, actor.rig.y - 24, e.type === 'beam' ? 4 : 7, color).setDepth(DEPTH.fx);
            this.tweens.add({
              targets: orb,
              x: tpos.x,
              y: tpos.y - 22,
              duration: this.reduced ? 60 : 220,
              ease: 'Quad.easeIn',
              onComplete: () => {
                orb.destroy();
                this.impact(target, actor.rig.x, e.amount ?? 0, dmgColor);
                this.cameras.main.shake(this.reduced ? 0 : 80, 0.003);
              },
            });
          }, done);
          break;
        }
        case 'enemy-hit': {
          if (!actor || !target || !tpos) return done();
          actor.rig.attack(tpos.x, tpos.y, () => this.impact(target, actor.rig.x, e.amount ?? 0, '#ff9fd0'), done);
          break;
        }
        case 'basic-attack': {
          if (!actor || !target || !tpos) return done();
          actor.rig.attack(tpos.x, tpos.y, () => this.impact(target, actor.rig.x, e.amount ?? 0, dmgColor, COLORS.orange), done);
          break;
        }
        case 'hazard-hit': {
          if (!target) return done();
          this.impact(target, target.rig.x + 10, e.amount ?? 0, dmgColor, COLORS.orange);
          this.time.delayedCall(this.reduced ? 60 : 260, done);
          break;
        }
        case 'heal': {
          if (!actor || !target) return done();
          actor.rig.cast(() => {
            target.rig.heal();
            target.rig.sparks(6, COLORS.green);
            floatText(this, target.rig.x, target.rig.y - 50, `+${e.amount ?? 0} LP`, '#8cf0b2');
          }, done);
          break;
        }
        case 'pulse': {
          if (!actor || !target) return done();
          actor.rig.cast(() => {
            floatText(this, target.rig.x, target.rig.y - 50, e.amount ? `−${e.amount}` : 'STOSS', dmgColor);
            if (tpos && e.targetPos) {
              target.rig.setDepth(DEPTH.units + e.targetPos.y);
              target.rig.travelTo(tpos.x, tpos.y);
            }
          }, done);
          break;
        }
        case 'swap': {
          if (!actor || !target || !e.to || !e.targetTo) return done();
          const a = this.cellPos(e.to);
          const b = this.cellPos(e.targetTo);
          actor.rig.setDepth(DEPTH.units + e.to.y);
          target.rig.setDepth(DEPTH.units + e.targetTo.y);
          target.rig.travelTo(b.x, b.y);
          actor.rig.travelTo(a.x, a.y, done);
          break;
        }
        case 'spawn': {
          const u = e.unit ? unitById(this.state, e.unit) : null;
          if (!u) return done();
          const v = this.createUnitView(u);
          v.rig.setAlpha(0).setScale(0.6);
          this.tweens.add({ targets: v.rig, alpha: 1, scaleX: 1, scaleY: 1, duration: this.reduced ? 60 : 320, ease: 'Back.easeOut', onComplete: done });
          break;
        }
        case 'escape': {
          if (!actor || !e.to) return done();
          const p = this.cellPos(e.to);
          floatText(this, p.x, p.y - 40, 'DURCHBRUCH', '#ff9fd0');
          actor.rig.travelTo(p.x, p.y + 30, () => actor.rig.die(done));
          this.cameras.main.shake(this.reduced ? 0 : 120, 0.005);
          break;
        }
        case 'rally': {
          if (!target) return done();
          target.rig.sparks(5, COLORS.violet);
          floatText(this, target.rig.x, target.rig.y - 50, e.label ?? '+Schild', '#e2c8ff');
          this.time.delayedCall(this.reduced ? 40 : 120, done);
          break;
        }
        case 'wait':
        case 'enemy-wait':
        case 'rooted-wait': {
          if (actor) floatText(this, actor.rig.x, actor.rig.y - 46, e.label ?? '…', '#9fb7c2');
          this.time.delayedCall(this.reduced ? 40 : 200, done);
          break;
        }
        default: {
          // Status-/Geländeeffekte: insight, ignite, root, trace, wall, trail, stand, refuge, detour
          if (!actor) return done();
          const label = e.label ?? ({ trace: 'LICHTSPUR', wall: 'WALL', trail: 'GLUT', stand: 'STAND', refuge: 'ZUFLUCHT', detour: 'UMWEG' } as Record<string, string>)[e.type] ?? e.type.toUpperCase();
          const where = tpos ?? { x: actor.rig.x, y: actor.rig.y };
          actor.rig.cast(() => {
            floatText(this, where.x, where.y - 46, label, e.type === 'root' || e.type === 'insight' ? '#f2d08d' : '#a8f8ff');
            (target ?? actor).rig.sparks(5, e.type === 'root' ? COLORS.green : COLORS.cyan);
            this.drawDecor();
          }, done);
        }
      }
    });
  }

  private impact(target: UnitView, fromX: number, amount: number, color: string, sparkColor = COLORS.orange): void {
    target.rig.hit(fromX);
    target.rig.sparks(6, sparkColor);
    floatText(this, target.rig.x, target.rig.y - 50, amount > 0 ? `−${amount}` : 'GEBLOCKT', amount > 0 ? color : '#bfe9ff');
  }

  // ---------------------------------------------------------------- Anzeige

  private syncUnits(): void {
    for (const u of this.state.units) {
      const v = this.views.get(u.id);
      if (!v) continue;
      if (!u.alive || u.hp <= 0) {
        this.views.delete(u.id);
        v.hpBg.destroy();
        v.hpBar.destroy();
        v.shield.destroy();
        v.status.destroy();
        v.ring.destroy();
        v.rig.die(() => v.rig.destroy());
        continue;
      }
      const p = this.cellPos(u);
      if (Math.abs(v.rig.x - p.x) > 1 || Math.abs(v.rig.y - p.y) > 1) v.rig.setPosition(p.x, p.y);
      v.rig.setDepth(DEPTH.units + u.y);
      this.placeOverlays(v, u);
    }
    for (const [id, v] of this.views) if (!this.state.units.some((u) => u.id === id && u.alive && u.hp > 0)) { v.rig.destroy(); v.hpBg.destroy(); v.hpBar.destroy(); v.shield.destroy(); v.status.destroy(); v.ring.destroy(); this.views.delete(id); }
  }

  /** LP-Balken, Schild, Status und Ring an die aktuelle Zelle der Einheit hängen. */
  private placeOverlays(v: UnitView, u: BattleUnit): void {
    const c = this.L.center(u.x, u.y);
    v.ring.setPosition(c.x, c.y + this.L.tileH * 0.38);
    v.hpBg.setPosition(c.x, c.y + this.L.tileH * 0.46);
    v.hpBar.setPosition(c.x - 20, c.y + this.L.tileH * 0.46);
    v.shield.setPosition(c.x + 22, c.y + this.L.tileH * 0.46);
    v.status.setPosition(c.x, c.y - this.L.tileH * 0.5);
  }

  private drawDecor(): void {
    const g = this.decor;
    g.clear();
    for (const w of this.state.walls) {
      if (w.static) continue;
      const c = this.L.center(w.x, w.y);
      g.fillStyle(0x3a7d5b, 0.9).fillRoundedRect(c.x - this.L.tileW / 2 + 8, c.y - this.L.tileH / 2 + 14, this.L.tileW - 16, this.L.tileH - 24, 6);
      g.lineStyle(2, 0x9ff5b8, 0.8).strokeRoundedRect(c.x - this.L.tileW / 2 + 8, c.y - this.L.tileH / 2 + 14, this.L.tileW - 16, this.L.tileH - 24, 6);
    }
    for (const h of this.state.hazards) {
      const c = this.L.center(h.x, h.y);
      g.fillStyle(0xff8a4d, 0.35).fillRoundedRect(c.x - this.L.tileW / 2 + 4, c.y - this.L.tileH / 2 + 4, this.L.tileW - 8, this.L.tileH - 8, 8);
      g.fillStyle(0xffd27d, 0.6).fillCircle(c.x - 8, c.y + 6, 3).fillCircle(c.x + 9, c.y - 4, 2.5).fillCircle(c.x + 2, c.y + 16, 2);
    }
    for (const t of this.state.traces) {
      for (let dy = -1; dy <= 1; dy++)
        for (let dx = -1; dx <= 1; dx++) {
          const x = t.x + dx;
          const y = t.y + dy;
          if (x < 0 || y < 0 || x >= this.L.cols || y >= this.L.rows) continue;
          const c = this.L.center(x, y);
          g.fillStyle(0xf2d08d, dx === 0 && dy === 0 ? 0.3 : 0.16).fillRoundedRect(c.x - this.L.tileW / 2 + 4, c.y - this.L.tileH / 2 + 4, this.L.tileW - 8, this.L.tileH - 8, 8);
        }
    }
  }

  private clearHighlights(): void {
    for (const h of this.highlights) h.destroy();
    this.highlights = [];
    for (const v of this.views.values()) v.ring.setStrokeStyle(2, v.ring.strokeColor, 0);
  }

  private refresh(interactive = true): void {
    const s = this.state;
    const obj = this.encounter.objective;
    this.hud.round.setLabel(`RUNDE ${s.round}${obj.type === 'holdGate' ? `/${obj.rounds}` : `/${obj.maxRounds}`}`);
    this.hud.phase.setLabel(s.result ? (s.result === 'won' ? 'GEWONNEN' : 'VERLOREN') : s.phase === 'enemy' ? 'GEGNER' : s.turnOrder === 'initiative' ? 'INITIATIVE' : 'DEIN ZUG');
    this.hud.objective.setLabel(obj.type === 'holdGate' ? `TOR ${s.escaped}/${obj.maxEscapes}` : `GEGNER ${living(s, 'enemy').length}`);
    this.hud.message.setText(s.message);
    this.drawDecor();
    this.clearHighlights();
    for (const u of s.units) {
      const v = this.views.get(u.id);
      if (!v || !u.alive) continue;
      v.hpBar.setDisplaySize(40 * Math.max(0, u.hp / u.maxHp), 5);
      v.shield.setText(u.shield ? `🛡${u.shield}` : '');
      v.status.setText([u.analyzed ? '◉' : '', u.root ? '⌁' : '', u.buff ? '✹' : '', s.acted[u.id] && u.kind === 'guardian' && !s.result ? '·' : ''].join(''));
      v.rig.setAlpha(s.acted[u.id] && u.kind === 'guardian' && s.phase === 'player' ? 0.72 : 1);
    }
    const sel = unitById(s, s.selected);
    if (sel) {
      const v = this.views.get(sel.id);
      v?.ring.setStrokeStyle(2, v.ring.strokeColor, 0.75);
      this.bar.name.setText(sel.name.toUpperCase());
      this.bar.stats.setText(`${sel.hp}/${sel.maxHp} LP · Bewegung ${sel.move + s.teamMoveBonus} · Resonanz ${sel.resonance}/${sel.maxResonance}${sel.shield ? ` · Schild ${sel.shield}` : ''}`);
    }
    const active = interactive && !this.busy && !s.result && s.phase === 'player' && canAct(s, s.selected);
    this.bar.move.setEnabled(active);
    this.bar.basic.setEnabled(active && !!sel?.basicAttack);
    this.bar.skills.setEnabled(active);
    this.bar.wait.setEnabled(active);
    this.bar.rally.setEnabled(interactive && !this.busy && !s.result && s.phase === 'player' && !s.rallyUsed);
    this.bar.move.setActive(s.mode === 'move');
    this.bar.basic.setActive(s.mode === 'basic');
    if (!this.skillLevel) {
      this.bar.info.setText(
        s.result ? '' : s.phase === 'enemy' ? 'Das Rauschen handelt …' : sel && !canAct(s, sel.id) ? (s.acted[sel.id] ? `${sel.name} hat schon gehandelt. Tippe ein anderes Wesen.` : `${sel.name} ist noch nicht am Zug.`) : s.mode === 'move' ? 'Tippe ein leuchtendes Feld.' : s.mode === 'basic' ? 'Tippe einen markierten Gegner.' : 'Bewegen, Grundangriff, Fähigkeit oder Warten. Der Beschwörer kann einmal „Sammeln“ rufen.',
      );
    }
    if (!interactive || !s.mode || !sel) return;
    this.showTargets();
  }

  /** Erreichbare Felder / gültige Ziele für den aktuellen Modus aus dem Regelkern einblenden. */
  private showTargets(): void {
    const s = this.state;
    const sel = unitById(s, s.selected);
    if (!s.mode || !sel) return;
    const cells = validTiles(s, sel.id, s.mode);
    for (const key of cells) {
      const [x, y] = key.split(':').map(Number) as [number, number];
      const c = this.L.center(x, y);
      const occ = s.units.find((u) => u.alive && u.hp > 0 && u.x === x && u.y === y);
      if (occ && s.mode !== 'move') {
        const v = this.views.get(occ.id);
        v?.ring.setStrokeStyle(3, occ.kind === 'enemy' ? COLORS.orange : COLORS.green, 0.9);
        continue;
      }
      const color = s.mode === 'move' ? COLORS.cyan : COLORS.orange;
      const r = this.add.rectangle(c.x, c.y, this.L.tileW - 8, this.L.tileH - 8, color, 0.22).setStrokeStyle(2, color, 0.7).setDepth(DEPTH.highlight);
      this.highlights.push(r);
    }
  }

  private tutorialPulse(): void {
    const hint = this.encounter.tutorial[1];
    const target = hint?.unit ? living(this.state, 'guardian').find((g) => g.speciesId === hint.unit) : undefined;
    const v = target ? this.views.get(target.id) : undefined;
    if (v) {
      const ring = this.add.ellipse(v.rig.x, v.rig.y + 4, 62, 28, 0x000000, 0).setStrokeStyle(3, COLORS.orange, 0.8).setDepth(DEPTH.highlight);
      this.tweens.add({ targets: ring, scaleX: 1.35, scaleY: 1.35, alpha: 0, duration: 900, repeat: 1, onComplete: () => ring.destroy() });
    }
    if (hint) flash(this, 108, `${hint.title} ${hint.text}`, 2600, DEPTH.hud + 5);
  }

  private finish(): void {
    if (this.finished) return;
    this.finished = true;
    this.refresh(false);
    const outcome = this.store.finishBattle();
    if (!outcome) {
      this.router.go('Home');
      return;
    }
    const encounterId = this.encounter.id;
    const fromProlog = encounterId === 'prolog-bridge';
    this.time.delayedCall(this.reduced ? 100 : 700, () =>
      showResult({
        encounterId,
        result: outcome.result,
        rewardSkillPoints: outcome.rewardSkillPoints,
        round: this.state.round,
        onContinue: () => this.router.go(fromProlog ? 'Home' : 'World', { after: outcome.result }),
        onRetry: () => {
          this.store.startBattle(encounterId);
          this.router.go('Battle');
        },
      }),
    );
  }
}
