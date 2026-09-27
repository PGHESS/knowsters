import Phaser from 'phaser';
import { prefersReducedMotion } from '../config';

export interface RigOptions {
  /** Höhe der Figur in Pixeln (Bodenlinie = y). */
  height: number;
  accent: number;
  facing?: 1 | -1;
  reducedMotion?: boolean;
}

/**
 * Cutout-Rig (Asset-Pilot, Auftrag §15). Heute besteht das Rig aus einer freigestellten
 * Körperebene plus Effektlayern (Schatten, Element-Aura, Funken) und Timeline-Animationen für
 * Idle / Move / Attack / Hit. Die API ist so gebaut, dass ein mehrteiliges Spine-/Cutout-Rig
 * dieselben Methoden anbietet: Der Presenter (BattleScene) kennt nur `idle()`, `travelTo()`,
 * `attack()`, `hit()`, `die()`.
 */
export class CreatureRig extends Phaser.GameObjects.Container {
  readonly bodyLayer: Phaser.GameObjects.Container;
  readonly sprite: Phaser.GameObjects.Image;
  readonly shadow: Phaser.GameObjects.Ellipse;
  readonly aura: Phaser.GameObjects.Ellipse;
  private readonly accent: number;
  private readonly reduced: boolean;
  private idleTweens: Phaser.Tweens.Tween[] = [];
  private facing: 1 | -1 = 1;

  constructor(scene: Phaser.Scene, x: number, y: number, texture: string, opts: RigOptions) {
    super(scene, x, y);
    this.accent = opts.accent;
    this.reduced = opts.reducedMotion ?? prefersReducedMotion();
    const h = opts.height;
    this.shadow = scene.add.ellipse(0, 2, h * 0.62, h * 0.16, 0x000000, 0.42);
    this.aura = scene.add.ellipse(0, -h * 0.05, h * 0.5, h * 0.2, opts.accent, 0.16);
    this.bodyLayer = scene.add.container(0, 0);
    this.sprite = scene.add.image(0, 0, texture).setOrigin(0.5, 1);
    const scale = h / this.sprite.height;
    this.sprite.setScale(scale);
    this.bodyLayer.add(this.sprite);
    this.add([this.shadow, this.aura, this.bodyLayer]);
    scene.add.existing(this);
    if (opts.facing) this.face(opts.facing);
    this.idle();
  }

  private d(ms: number): number {
    return this.reduced ? Math.min(90, ms * 0.25) : ms;
  }

  face(dir: 1 | -1): void {
    this.facing = dir;
    this.bodyLayer.setScale(dir, this.bodyLayer.scaleY);
  }

  /** Idle: Atmen (Gewichtsverlagerung über die Bodenlinie), Aura pulsiert. 3–5 s Loop. */
  idle(): void {
    this.stopIdle();
    if (this.reduced) return;
    const breathe = this.scene.tweens.add({
      targets: this.bodyLayer,
      scaleY: 1.025,
      scaleX: this.facing * 0.99,
      y: -1,
      duration: 1600 + Math.random() * 900,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });
    const sway = this.scene.tweens.add({ targets: this.bodyLayer, angle: 1.2, duration: 2600 + Math.random() * 1400, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
    const glow = this.scene.tweens.add({ targets: this.aura, alpha: 0.32, scaleX: 1.12, duration: 1300, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
    this.idleTweens = [breathe, sway, glow];
  }

  private stopIdle(): void {
    for (const t of this.idleTweens) t.stop();
    this.idleTweens = [];
    this.bodyLayer.setScale(this.facing, 1).setAngle(0).setY(0);
  }

  /** Move: Anticipation (Squash) → Bogen zum Ziel → Settle. */
  travelTo(x: number, y: number, onDone?: () => void): void {
    this.stopIdle();
    if (x !== this.x) this.face(x > this.x ? 1 : -1);
    const dur = this.d(320);
    const tl = this.scene.tweens.chain({
      targets: this.bodyLayer,
      tweens: [
        { scaleY: 0.9, scaleX: this.facing * 1.08, duration: this.d(90), ease: 'Quad.easeOut' },
        { scaleY: 1.06, scaleX: this.facing * 0.96, duration: this.d(120), ease: 'Quad.easeIn' },
        { scaleY: 1, scaleX: this.facing, duration: this.d(140), ease: 'Back.easeOut' },
      ],
    });
    this.scene.tweens.add({
      targets: this,
      x,
      y,
      duration: dur,
      delay: this.d(80),
      ease: 'Sine.easeInOut',
      onComplete: () => {
        tl.destroy();
        this.idle();
        onDone?.();
      },
    });
    this.scene.tweens.add({ targets: this.bodyLayer, y: -18, duration: dur / 2, delay: this.d(80), yoyo: true, ease: 'Quad.easeOut' });
    this.scene.tweens.add({ targets: this.shadow, scaleX: 0.7, scaleY: 0.7, alpha: 0.25, duration: dur / 2, delay: this.d(80), yoyo: true });
  }

  /** Attack: Wind-up nach hinten → Lunge Richtung Ziel → Hit-Stop → zurück. `onImpact` beim Treffer. */
  attack(targetX: number, targetY: number, onImpact: () => void, onDone?: () => void): void {
    this.stopIdle();
    const dx = targetX - this.x;
    const dy = targetY - this.y;
    const len = Math.hypot(dx, dy) || 1;
    if (Math.abs(dx) > 4) this.face(dx > 0 ? 1 : -1);
    const lungeX = (dx / len) * Math.min(26, len * 0.35);
    const lungeY = (dy / len) * Math.min(26, len * 0.35);
    this.scene.tweens.chain({
      targets: this.bodyLayer,
      tweens: [
        { x: -lungeX * 0.4, y: -lungeY * 0.4 - 4, scaleX: this.facing * 0.94, scaleY: 1.06, duration: this.d(160), ease: 'Quad.easeOut' },
        { x: lungeX, y: lungeY, scaleX: this.facing * 1.1, scaleY: 0.94, duration: this.d(110), ease: 'Quad.easeIn', onComplete: onImpact },
        { x: lungeX, y: lungeY, duration: this.d(70) },
        { x: 0, y: 0, scaleX: this.facing, scaleY: 1, duration: this.d(220), ease: 'Sine.easeOut', onComplete: () => { this.idle(); onDone?.(); } },
      ],
    });
  }

  /** Cast (keine Bewegung zum Ziel): kurzes Aufrichten + Aura-Blitz. */
  cast(onImpact: () => void, onDone?: () => void): void {
    this.stopIdle();
    this.scene.tweens.add({ targets: this.aura, alpha: 0.7, scaleX: 1.5, scaleY: 1.4, duration: this.d(180), yoyo: true });
    this.scene.tweens.chain({
      targets: this.bodyLayer,
      tweens: [
        { scaleY: 1.08, y: -6, duration: this.d(140), ease: 'Quad.easeOut', onComplete: onImpact },
        { scaleY: 1, y: 0, duration: this.d(200), ease: 'Sine.easeOut', onComplete: () => { this.idle(); onDone?.(); } },
      ],
    });
  }

  /** Hit: Flash + Rückstoß + Zittern. */
  hit(fromX: number, onDone?: () => void): void {
    this.stopIdle();
    const dir = fromX < this.x ? 1 : -1;
    const flash = this.scene.add.ellipse(this.x, this.y - this.sprite.displayHeight * 0.45, this.sprite.displayWidth * 0.9, this.sprite.displayHeight * 0.9, 0xffffff, 0.55).setDepth(this.depth + 1);
    this.scene.tweens.add({ targets: flash, alpha: 0, duration: this.d(140), onComplete: () => flash.destroy() });
    this.scene.tweens.chain({
      targets: this.bodyLayer,
      tweens: [
        { x: dir * 9, angle: dir * -5, duration: this.d(60), ease: 'Quad.easeOut' },
        { x: dir * -3, angle: dir * 2, duration: this.d(70) },
        { x: 0, angle: 0, duration: this.d(120), ease: 'Sine.easeOut', onComplete: () => { this.idle(); onDone?.(); } },
      ],
    });
  }

  heal(): void {
    this.scene.tweens.add({ targets: this.aura, alpha: 0.6, scaleX: 1.6, scaleY: 1.5, duration: this.d(260), yoyo: true });
  }

  die(onDone?: () => void): void {
    this.stopIdle();
    this.scene.tweens.add({ targets: this, alpha: 0, y: this.y + 10, duration: this.d(320), ease: 'Quad.easeIn', onComplete: () => onDone?.() });
    this.scene.tweens.add({ targets: this.bodyLayer, scaleY: 0.6, scaleX: this.facing * 1.15, duration: this.d(320) });
  }

  /** Kleine Funken in Akzentfarbe (Element-Partikel). */
  sparks(count = 6, color = this.accent): void {
    if (this.reduced) return;
    for (let i = 0; i < count; i++) {
      const s = this.scene.add.circle(this.x + Phaser.Math.Between(-10, 10), this.y - 20 + Phaser.Math.Between(-10, 10), Phaser.Math.Between(1, 3), color, 0.85).setDepth(this.depth + 1);
      this.scene.tweens.add({ targets: s, y: s.y - Phaser.Math.Between(14, 30), x: s.x + Phaser.Math.Between(-10, 10), alpha: 0, duration: Phaser.Math.Between(500, 900), onComplete: () => s.destroy() });
    }
  }
}
