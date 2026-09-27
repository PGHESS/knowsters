import Phaser from 'phaser';
import { GUARDIANS, ENEMIES } from '@knowsters/content';
import { COLORS, H, W, textStyle } from '../config';
import type { Router } from '../router';

export class BootScene extends Phaser.Scene {
  constructor() {
    super('Boot');
  }

  preload(): void {
    for (const g of Object.values(GUARDIANS)) this.load.image(`creature:${g.sprite}`, `assets/creatures/${g.sprite}.png`);
    for (const e of Object.values(ENEMIES)) this.load.image(`creature:${e.sprite}`, `assets/creatures/${e.sprite}.png`);
    this.load.image('backdrop:bridge', 'assets/backdrops/bridge.webp');

    this.add.rectangle(W / 2, H / 2 + 26, 230, 7, 0x173240).setOrigin(0.5);
    const fill = this.add.rectangle(W / 2 - 115, H / 2 + 26, 0, 7, COLORS.cyan).setOrigin(0, 0.5);
    this.add.text(W / 2, H / 2 - 22, 'KNOWSTERS', textStyle(32, '#f2fbff', '700')).setOrigin(0.5);
    this.add.text(W / 2, H / 2 + 4, 'URBAN FANTASY · CREATURE TACTICS', textStyle(10, '#7edee7', '700')).setOrigin(0.5);
    const tip = this.add.text(W / 2, H - 80, 'Nicht jede Stärke ist Angriff.', textStyle(12, '#9fb7c2')).setOrigin(0.5);
    this.tweens.add({ targets: tip, alpha: 0.5, duration: 1200, yoyo: true, repeat: -1 });
    this.load.on('progress', (v: number) => fill.setDisplaySize(230 * v, 7));
  }

  create(): void {
    const router = this.registry.get('router') as Router;
    this.time.delayedCall(250, () => router.resume());
  }
}
