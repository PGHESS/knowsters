import Phaser from 'phaser';
import type { AvatarLook } from '@knowsters/rules';
import { COLORS } from '../config';
import { HAIR_COLORS, PANTS_COLORS, SKIN_TONES, TOP_COLORS, darken, hex } from './palette';

/**
 * Prozeduraler Mensch (Beschwörer / NPC) aus Formen: Kopf, Frisurvariante, Torso, Jacke,
 * Arme, Beine. Platzhalter für spätere Illustration, aber mit Gehzyklus, Blickrichtung und Atmung,
 * damit die Komposition der Szenen schon stimmt.
 */
export class HumanFigure extends Phaser.GameObjects.Container {
  private readonly figure: Phaser.GameObjects.Container;
  private readonly legL: Phaser.GameObjects.Rectangle;
  private readonly legR: Phaser.GameObjects.Rectangle;
  private readonly armL: Phaser.GameObjects.Rectangle;
  private readonly armR: Phaser.GameObjects.Rectangle;
  private readonly shadow: Phaser.GameObjects.Ellipse;
  private walking = false;
  private walkT = 0;
  private readonly s: number;

  constructor(scene: Phaser.Scene, x: number, y: number, look: AvatarLook, scale = 1, accent = COLORS.cyan) {
    super(scene, x, y);
    this.s = scale;
    const s = scale;
    const skin = hex(SKIN_TONES[look.face % SKIN_TONES.length] ?? '#e9b896');
    const hair = hex(HAIR_COLORS[look.hairColor % HAIR_COLORS.length] ?? '#18191f');
    const top = hex(TOP_COLORS[look.top % TOP_COLORS.length] ?? '#1a2838');
    const pants = hex(PANTS_COLORS[look.pants % PANTS_COLORS.length] ?? '#17202a');

    this.shadow = scene.add.ellipse(0, 46 * s, 42 * s, 12 * s, 0x000000, 0.35);
    this.figure = scene.add.container(0, 0);
    this.legL = scene.add.rectangle(-6 * s, 34 * s, 9 * s, 24 * s, pants).setOrigin(0.5, 0);
    this.legR = scene.add.rectangle(6 * s, 34 * s, 9 * s, 24 * s, pants).setOrigin(0.5, 0);
    const shoeL = scene.add.rectangle(-6 * s, 57 * s, 11 * s, 5 * s, 0x111418).setOrigin(0.5, 0);
    const shoeR = scene.add.rectangle(6 * s, 57 * s, 11 * s, 5 * s, 0x111418).setOrigin(0.5, 0);
    const torso = scene.add.rectangle(0, 8 * s, 24 * s, 30 * s, darken(top, 0.75)).setOrigin(0.5, 0);
    const jacket = scene.add.rectangle(0, 6 * s, 30 * s, 34 * s, top).setOrigin(0.5, 0).setStrokeStyle(1.5 * s, accent, 0.55);
    const seam = scene.add.rectangle(0, 10 * s, 2 * s, 26 * s, accent, 0.6).setOrigin(0.5, 0);
    this.armL = scene.add.rectangle(-17 * s, 9 * s, 8 * s, 26 * s, top).setOrigin(0.5, 0).setAngle(6);
    this.armR = scene.add.rectangle(17 * s, 9 * s, 8 * s, 26 * s, top).setOrigin(0.5, 0).setAngle(-6);
    const handL = scene.add.circle(-18 * s, 36 * s, 4 * s, skin);
    const handR = scene.add.circle(18 * s, 36 * s, 4 * s, skin);
    const neck = scene.add.rectangle(0, 2 * s, 8 * s, 8 * s, skin).setOrigin(0.5, 0);
    const head = scene.add.circle(0, -8 * s, 11 * s, skin);
    const hairStyle = look.hair % 16;
    const hairTop = scene.add.arc(0, -11 * s, 12 * s, 180, 360, false, hair);
    const hairSide = hairStyle % 4 === 1 ? scene.add.rectangle(0, -12 * s, 24 * s, 10 * s, hair).setOrigin(0.5, 0) : null;
    const hairLong = hairStyle >= 8 ? scene.add.rectangle(0, -4 * s, 26 * s, 16 * s, hair).setOrigin(0.5, 0) : null;
    const eyeL = scene.add.circle(-4 * s, -8 * s, 1.4 * s, 0x1b1b22);
    const eyeR = scene.add.circle(4 * s, -8 * s, 1.4 * s, 0x1b1b22);
    const glow = scene.add.circle(15 * s, 12 * s, 3 * s, accent, 0.8);
    const parts: Phaser.GameObjects.GameObject[] = [];
    for (const part of [hairLong, this.legL, this.legR, shoeL, shoeR, this.armL, this.armR, torso, jacket, seam, handL, handR, neck, head, hairTop, hairSide, eyeL, eyeR, glow]) if (part) parts.push(part);
    this.figure.add(parts);
    this.add([this.shadow, this.figure]);
    scene.add.existing(this);

    scene.tweens.add({ targets: this.figure, y: -1.5 * s, duration: 1700, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
    scene.tweens.add({ targets: glow, alpha: 0.3, duration: 1100, yoyo: true, repeat: -1 });
  }

  face(dir: 1 | -1): void {
    this.figure.setScale(dir, 1);
  }

  setWalking(walking: boolean): void {
    this.walking = walking;
    if (!walking) {
      this.legL.setAngle(0);
      this.legR.setAngle(0);
      this.armL.setAngle(6);
      this.armR.setAngle(-6);
    }
  }

  tick(deltaMs: number): void {
    if (!this.walking) return;
    this.walkT += deltaMs / 110;
    const swing = Math.sin(this.walkT) * 22;
    this.legL.setAngle(swing);
    this.legR.setAngle(-swing);
    this.armL.setAngle(6 - swing * 0.8);
    this.armR.setAngle(-6 + swing * 0.8);
    this.figure.y = -Math.abs(Math.sin(this.walkT)) * 2 * this.s;
  }
}
