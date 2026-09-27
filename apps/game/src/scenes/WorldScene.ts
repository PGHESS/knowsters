import Phaser from 'phaser';
import { ABILITIES, guardianDef } from '@knowsters/content';
import { checkUnlock, route, safePoint, terrainDistance, walkable, type Point } from '@knowsters/rules';
import { COLORS, H, W, textStyle } from '../config';
import { HumanFigure } from '../human/HumanFigure';
import { CreatureRig } from '../rig/CreatureRig';
import type { Router } from '../router';
import type { GameStore } from '../store/store';
import { addPill, flash, makeButton, type CanvasButton } from '../ui/canvas';
import { showDialog } from '../ui/dialog';
import { showKnowledge } from '../ui/knowledge';
import { showTeam } from '../ui/team';
import { PLAZA_MAP, PLAZA_POINTS, paintPlaza } from '../world/plaza';

const SPEED = 15; // Prozent-Einheiten je Sekunde (y-Achse)
const NEAR = 7;

/**
 * Lichtquell · Werkstattplatz (Auftrag §11): Mensch steuerbar per Tap-to-Move über das
 * Terrain-Routing, Begleiter folgt, ein NPC, ein Encounter, Rückkehr nach dem Kampf.
 */
export class WorldScene extends Phaser.Scene {
  private store!: GameStore;
  private router!: Router;
  private human!: HumanFigure;
  private companion: CreatureRig | null = null;
  private npc!: HumanFigure;
  private pos: [number, number] = [50, 80];
  private companionPos: [number, number] = [46, 83];
  private path: Point[] = [];
  private marker!: Phaser.GameObjects.Ellipse;
  private flicker!: Phaser.GameObjects.Container;
  private flickerSparks: Phaser.GameObjects.Arc[] = [];
  private interact!: CanvasButton;
  private near: 'npc' | 'flicker' | null = null;
  private pendingArrival: 'npc' | 'flicker' | null = null;
  private lastSave = 0;
  private resolved = false;

  constructor() {
    super('World');
  }

  create(data: { after?: 'won' | 'lost' } = {}): void {
    this.store = this.registry.get('store') as GameStore;
    this.router = this.registry.get('router') as Router;
    this.resolved = Number(this.store.state.flags['won:workshop-flicker'] ?? 0) > 0;
    this.path = [];
    this.near = null;
    this.pendingArrival = null;

    paintPlaza(this, W, H, 0);
    const saved = this.store.state.world.position;
    this.pos = safePoint(PLAZA_MAP, saved ?? PLAZA_MAP.spawn) as [number, number];
    if (data.after) this.pos = safePoint(PLAZA_MAP, [PLAZA_POINTS.flicker[0] - 14, PLAZA_POINTS.flicker[1] + 6]) as [number, number];
    this.companionPos = [this.pos[0] - 6, this.pos[1] + 2];

    // Ziel-Marker
    this.marker = this.add.ellipse(0, 0, 26, 12, COLORS.cyan, 0).setStrokeStyle(2, COLORS.cyan, 0.8).setVisible(false).setDepth(3);

    // NPC Eno
    const npcPx = this.px(PLAZA_POINTS.npc);
    this.npc = new HumanFigure(this, npcPx[0], npcPx[1], { face: 9, hair: 3, hairColor: 6, top: 5, pants: 3 }, 0.95, COLORS.gold);
    this.npc.face(1);
    const npcTag = addPill(this, npcPx[0], npcPx[1] - 70, 58, 22, 'ENO', { fill: 0x0a2636, stroke: COLORS.gold, text: '#ffe8b0' });
    npcTag.container.setDepth(9);
    this.tweens.add({ targets: npcTag.container, y: -3, duration: 1300, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });

    // Flimmern (Encounter) an der Werkhalle
    const fpx = this.px(PLAZA_POINTS.flicker);
    this.flicker = this.add.container(fpx[0], fpx[1]).setDepth(4);
    const core = this.add.ellipse(0, -14, 44, 44, this.resolved ? COLORS.cyan : COLORS.violet, this.resolved ? 0.18 : 0.35);
    const ring = this.add.ellipse(0, -14, 64, 64, 0x000000, 0).setStrokeStyle(2, this.resolved ? COLORS.cyan : COLORS.violet, 0.6);
    this.flicker.add([core, ring]);
    this.tweens.add({ targets: ring, scaleX: 1.35, scaleY: 1.35, alpha: 0, duration: this.resolved ? 2600 : 1100, repeat: -1 });
    this.tweens.add({ targets: core, alpha: this.resolved ? 0.28 : 0.7, duration: this.resolved ? 1800 : 300, yoyo: true, repeat: -1 });
    if (!this.resolved) {
      for (let i = 0; i < 6; i++) {
        const s = this.add.circle(Phaser.Math.Between(-22, 22), Phaser.Math.Between(-40, 6), 2, i % 2 ? COLORS.violet : 0xff9fd0, 0.9);
        this.flicker.add(s);
        this.flickerSparks.push(s);
        this.tweens.add({ targets: s, y: s.y - 26, alpha: 0, duration: Phaser.Math.Between(700, 1300), repeat: -1, delay: i * 140 });
      }
    }
    const flickerTag = addPill(this, fpx[0], fpx[1] - 62, 96, 22, this.resolved ? 'WERKHALLE' : 'FLIMMERN', { fill: 0x1a1128, stroke: this.resolved ? COLORS.cyan : COLORS.violet, text: '#f3e5ff' });
    flickerTag.container.setDepth(9);

    // Begleiter + Mensch
    const comp = this.store.companion();
    if (comp) {
      const species = guardianDef(comp.speciesId);
      const c = this.px(this.companionPos);
      this.companion = new CreatureRig(this, c[0], c[1], `creature:${species.sprite}`, { height: 78, accent: parseInt(species.accent.slice(1), 16), facing: 1 });
    }
    const hp = this.px(this.pos);
    this.human = new HumanFigure(this, hp[0], hp[1], this.store.state.player.avatar, 1.05);

    // HUD
    this.add.rectangle(W / 2, 52, W, 104, 0x06121d, 0.28).setDepth(20);
    addPill(this, 92, 44, 150, 30, 'LICHTQUELL · WERKSTATT', { fill: 0x0a2636 }).container.setDepth(21);
    addPill(this, 318, 44, 100, 30, this.resolved ? 'KAP. 1 ✓' : 'KAP. 1', { fill: 0x0a2636, stroke: 0x507483, text: '#bdd4de' }).container.setDepth(21);
    this.add.text(18, 68, this.resolved ? 'Die Werkhalle ist ruhig. Eno hat noch Fragen.' : 'Finde heraus, woher das Flimmern kommt.', textStyle(12, '#d0e0e7')).setShadow(0, 1, '#000', 4).setDepth(21);
    if (!saved && !data.after) flash(this, 130, 'Tippe auf den Platz, um dich zu bewegen.', 2400, 25);

    // Bottom: globale Navigation (Welt ist aktiv) + Kontext
    this.add.rectangle(W / 2, H - 46, W, 92, 0x06121d, 0.55).setDepth(20);
    const nav = (x: number, label: string, fn: () => void) => makeButton(this, x, H - 42, 100, 46, label, fn, { fill: 0x102b3c, stroke: 0x5a8494, accent: '#dcecf1' }).container.setDepth(21);
    nav(64, 'HOME', () => this.router.go('Home'));
    nav(172, 'TEAM', () => showTeam(this.store, () => undefined));
    nav(280, 'WISSEN', () => showKnowledge(this.store, () => undefined));
    this.interact = makeButton(this, W - 70, H - 120, 118, 52, 'SPRECHEN', () => this.onInteract(), { fill: 0x123a4b, stroke: COLORS.cyan, accent: '#fff', size: 12 });
    this.interact.container.setDepth(22).setVisible(false);

    this.input.on('pointerup', (p: Phaser.Input.Pointer) => this.onTap(p));

    if (data.after) {
      this.time.delayedCall(400, () =>
        flash(this, 130, data.after === 'won' ? 'Die Halle ist still. Eno wartet am Platz.' : 'Ihr sammelt euch auf dem Platz. Eno hat vielleicht einen Rat.', 2600, 25),
      );
    }
    this.updateNear();
  }

  private px(p: readonly [number, number]): [number, number] {
    return [(p[0] / 100) * W, (p[1] / 100) * H];
  }

  private onTap(p: Phaser.Input.Pointer): void {
    if (p.y < 104 || p.y > H - 92) return;
    if (p.x > W - 130 && p.y > H - 150) return; // Interact-Button
    const target: [number, number] = [(p.x / W) * 100, (p.y / H) * 100];
    const npcD = terrainDistance(target, PLAZA_POINTS.npc, PLAZA_MAP.aspect);
    const flD = terrainDistance(target, PLAZA_POINTS.flicker, PLAZA_MAP.aspect);
    this.pendingArrival = npcD < 6 ? 'npc' : flD < 6 ? 'flicker' : null;
    const dest: [number, number] = this.pendingArrival === 'npc' ? [PLAZA_POINTS.npc[0] + 6, PLAZA_POINTS.npc[1] + 3] : this.pendingArrival === 'flicker' ? [PLAZA_POINTS.flicker[0] - 8, PLAZA_POINTS.flicker[1] + 4] : target;
    const safe = safePoint(PLAZA_MAP, dest);
    this.path = route(PLAZA_MAP, this.pos, safe).slice(1);
    const m = this.px(safe);
    this.marker.setPosition(m[0], m[1]).setVisible(true).setAlpha(1);
    this.tweens.add({ targets: this.marker, scaleX: 1.4, scaleY: 1.4, alpha: 0.4, duration: 500, yoyo: true, repeat: -1 });
  }

  override update(_time: number, delta: number): void {
    const dt = Math.min(0.05, delta / 1000);
    let walking = false;
    if (this.path.length) {
      const next = this.path[0] as Point;
      const d = terrainDistance(this.pos, next, PLAZA_MAP.aspect);
      const step = SPEED * dt;
      if (d <= step) {
        this.pos = [next[0], next[1]];
        this.path.shift();
        if (!this.path.length) this.arrive();
      } else {
        const nx = this.pos[0] + ((next[0] - this.pos[0]) * step) / d;
        const ny = this.pos[1] + ((next[1] - this.pos[1]) * step) / d;
        if (walkable(PLAZA_MAP, [nx, ny])) {
          if (Math.abs(nx - this.pos[0]) > 0.01) this.human.face(nx > this.pos[0] ? 1 : -1);
          this.pos = [nx, ny];
        } else this.path = [];
      }
      walking = this.path.length > 0;
      this.lastSave += delta;
      if (this.lastSave > 800) {
        this.lastSave = 0;
        this.savePos();
      }
    }
    this.human.setWalking(walking);
    this.human.tick(delta);
    const hp = this.px(this.pos);
    this.human.setPosition(hp[0], hp[1]).setDepth(10 + this.pos[1] / 10);
    // Begleiter folgt mit Abstand
    const facing = this.human.scaleX < 0 ? -1 : 1;
    const target: [number, number] = [this.pos[0] - facing * 7, this.pos[1] + 2.5];
    const k = Math.min(1, dt * 5);
    this.companionPos = [this.companionPos[0] + (target[0] - this.companionPos[0]) * k, this.companionPos[1] + (target[1] - this.companionPos[1]) * k];
    if (this.companion) {
      const cp = this.px(this.companionPos);
      if (Math.abs(cp[0] - this.companion.x) > 0.5) this.companion.face(cp[0] > this.companion.x ? 1 : -1);
      this.companion.setPosition(cp[0], cp[1]).setDepth(10 + this.companionPos[1] / 10);
    }
    this.npc.setDepth(10 + PLAZA_POINTS.npc[1] / 10);
    this.updateNear();
  }

  private arrive(): void {
    this.marker.setVisible(false);
    this.tweens.killTweensOf(this.marker);
    this.savePos();
    this.updateNear();
    if (this.pendingArrival && this.near === this.pendingArrival) this.onInteract();
    this.pendingArrival = null;
  }

  private savePos(): void {
    this.store.update((s) => {
      s.world.position = [this.pos[0], this.pos[1]];
    });
  }

  private updateNear(): void {
    const npcD = terrainDistance(this.pos, PLAZA_POINTS.npc, PLAZA_MAP.aspect);
    const flD = terrainDistance(this.pos, PLAZA_POINTS.flicker, PLAZA_MAP.aspect);
    const near = npcD < NEAR ? 'npc' : flD < NEAR + 2 ? 'flicker' : null;
    if (near !== this.near) {
      this.near = near;
      this.interact.container.setVisible(!!near);
      if (near === 'npc') this.interact.setLabel('SPRECHEN');
      if (near === 'flicker') this.interact.setLabel(this.resolved ? 'HALLE' : 'UNTERSUCHEN');
    }
  }

  private onInteract(): void {
    if (this.near === 'npc') this.talkToEno();
    else if (this.near === 'flicker') this.investigate();
  }

  private talkToEno(): void {
    const store = this.store;
    const pyro = store.team().find((c) => c.speciesId === 'pyro');
    const trail = ABILITIES['pyro-trail']!;
    const check = pyro ? checkUnlock(pyro, store.state.player.knowledge, trail) : null;
    const hasTrail = pyro?.unlocked.includes('pyro-trail');
    const won = this.resolved;
    const steps = won
      ? [
          { speaker: 'Eno', text: 'Die Lichtfugen sind ruhig. Nicht, weil ihr lauter wart als das Rauschen – sondern weil ihr genauer hingesehen habt.' },
          { speaker: 'Eno', text: hasTrail ? 'Pyros Glutspur hat die Halle verändert. Verstehen kommt vor Stärke – das hast du bewiesen.' : 'Pyro hätte mit der Glutspur noch mehr bewegen können. Dafür braucht es ein Verständnis für Anteile. Das Wissen gehört dir, nicht ihm.', choices: [
            { label: 'Ich übe im Wissenszentrum.', onSelect: () => { showKnowledge(store, () => undefined); return true; }, primary: !hasTrail },
            { label: 'Später.', onSelect: () => true },
          ] },
        ]
      : [
          { speaker: 'Eno', text: 'Seit gestern flackern die Lichtfugen in der Werkhalle. Drei Wesen treiben zwischen den Maschinen – nicht böse, aber getrieben.' },
          { speaker: 'Eno', text: 'Nimm alle vier mit. Terra hält, Lumi sieht, Nivaro verschiebt, Pyro bricht durch. Und du gibst einmal den Befehl „Sammeln“.' },
          { speaker: 'Eno', text: check?.needsProof
              ? `Pyro trägt eine Fähigkeit in sich, die er noch nicht abrufen kann: die Glutspur. Sie braucht ${check.attributeGaps.length ? 'mehr Angriff, ' : ''}einen Fähigkeitspunkt und dein Verständnis für Prozent. Das Wissen gehört dir – die Entwicklung ihm.`
              : 'Pyros Glutspur wartet auf euch. Sie verändert Gelände. Nutzt sie klug.', choices: [
            { label: 'Zur Werkhalle.', onSelect: () => { this.pendingArrival = 'flicker'; this.onTap({ x: (PLAZA_POINTS.flicker[0] / 100) * W, y: (PLAZA_POINTS.flicker[1] / 100) * H } as Phaser.Input.Pointer); return true; }, primary: true },
            { label: 'Erst üben (Wissen).', onSelect: () => { showKnowledge(store, () => undefined); return true; } },
            { label: 'Später.', onSelect: () => true },
          ] },
        ];
    showDialog(steps);
  }

  private investigate(): void {
    const store = this.store;
    const router = this.router;
    if (this.resolved) {
      showDialog([
        { speaker: 'Werkhalle', text: 'Die Maschinen summen gleichmäßig. Das Flimmern ist fort. Willst du die Halle noch einmal sichern?', choices: [
          { label: 'Noch einmal kämpfen', onSelect: () => { store.startBattle('workshop-flicker'); router.go('Battle'); return true; }, primary: true },
          { label: 'Nein', onSelect: () => true },
        ] },
      ]);
      return;
    }
    showDialog([
      { speaker: 'Werkhalle', text: 'Hinter dem Tor flackert es. Drei Wesen des Rauschens – und irgendwo dazwischen die Lichtfugen, die den Platz versorgen.', choices: [
        { label: 'Hinein. Team bereit.', onSelect: () => { store.startBattle('workshop-flicker'); router.go('Battle'); return true; }, primary: true },
        { label: 'Erst das Team prüfen', onSelect: () => { showTeam(store, () => undefined); return true; } },
        { label: 'Noch nicht', onSelect: () => true },
      ] },
    ]);
  }
}
