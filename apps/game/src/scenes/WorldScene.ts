import Phaser from 'phaser';
import { H, W, textStyle } from '../config';
import type { Router } from '../router';
import type { GameStore } from '../store/store';
import { makeButton } from '../ui/canvas';
import { paintPlaza } from '../world/plaza';

/** Platzhalter bis M3: Welt-Loop mit Tap-to-Move, Begleiter, NPC und Encounter. */
export class WorldScene extends Phaser.Scene {
  constructor() {
    super('World');
  }

  create(): void {
    const store = this.registry.get('store') as GameStore;
    const router = this.registry.get('router') as Router;
    paintPlaza(this, W, H, 0.1);
    this.add.text(W / 2, 200, 'Welt-Szene folgt in M3', textStyle(16, '#f2fbff', '700')).setOrigin(0.5);
    makeButton(this, W / 2, H - 80, 300, 56, 'WERKHALLE BETRETEN (KAMPF)', () => { store.startBattle('workshop-flicker'); router.go('Battle'); }, { fill: 0x9b5c1e, stroke: 0xffca76, accent: '#fff7e2' });
    makeButton(this, W / 2, H - 20, 200, 36, 'HOME', () => router.go('Home'), { fill: 0x102b3c, stroke: 0x5a8494 });
  }
}
