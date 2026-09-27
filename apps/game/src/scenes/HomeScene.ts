import Phaser from 'phaser';
import { guardianDef } from '@knowsters/content';
import { H, W, COLORS, textStyle } from '../config';
import { HumanFigure } from '../human/HumanFigure';
import { CreatureRig } from '../rig/CreatureRig';
import type { Router } from '../router';
import type { GameStore } from '../store/store';
import { makeButton } from '../ui/canvas';
import { showKnowledge } from '../ui/knowledge';
import { showTeam } from '../ui/team';
import { paintPlaza } from '../world/plaza';

/** Home Hub (Auftrag §17): letzter Aufenthaltsort als Hintergrund, Mensch + Wesen, eine dominante Aktion. */
export class HomeScene extends Phaser.Scene {
  constructor() {
    super('Home');
  }

  create(): void {
    const store = this.registry.get('store') as GameStore;
    const router = this.registry.get('router') as Router;
    const s = store.state;

    paintPlaza(this, W, H, 0.42);
    this.add.rectangle(W / 2, H - 150, W, 300, 0x06131f, 0.55);

    const companion = store.companion();
    if (companion) {
      const species = guardianDef(companion.speciesId);
      new CreatureRig(this, 118, 560, `creature:${species.sprite}`, { height: 150, accent: parseInt(species.accent.slice(1), 16), facing: 1 }).setDepth(5);
    }
    new HumanFigure(this, 248, 505, s.player.avatar, 1.75).setDepth(6);

    this.add.text(24, 84, 'KNOWSTERS', textStyle(38, '#f4fbff', '700')).setStroke('#06131f', 6);
    this.add.text(26, 130, 'URBAN FANTASY · CREATURE TACTICS', textStyle(11, '#78e5ef', '700'));
    const battle = s.battle && !s.battle.result;
    const wonWorkshop = Number(s.flags['won:workshop-flicker'] ?? 0) > 0;
    const headline = battle ? 'Der Kampf wartet.' : wonWorkshop ? 'Die Werkhalle ist still.\nWas bleibt, ist deine Neugier.' : 'Lichtquell · Werkstattviertel.\nEtwas flimmert in der Halle.';
    this.add.text(26, H - 290, headline, textStyle(24, '#f5fbff', '700')).setLineSpacing(5).setStroke('#06131f', 5);
    this.add.text(27, H - 218, `${s.player.name} · Kapitel 1 · ${store.team().length} Wesen im Team`, textStyle(12, '#a8c1cc', '700'));

    const primary = makeButton(this, W / 2, H - 142, 330, 60, battle ? 'KAMPF FORTSETZEN' : 'WEITER', () => (battle ? router.go('Battle', { resume: true }) : router.go('World')), { fill: 0x1292a3, stroke: 0xb9fbff, accent: '#fff', size: 15 });
    primary.bg.setStrokeStyle(2, 0xb9fbff, 0.72);
    makeButton(this, 74, H - 72, 108, 48, 'TEAM', () => showTeam(store, () => this.scene.restart()), { fill: 0x112332, stroke: 0x6c8b99, accent: '#dceaf0' });
    makeButton(this, 195, H - 72, 108, 48, 'WISSEN', () => showKnowledge(store, () => this.scene.restart()), { fill: 0x112332, stroke: 0x6c8b99, accent: '#dceaf0' });
    makeButton(this, 316, H - 72, 108, 48, 'PROLOG', () => { store.startBattle('prolog-bridge'); router.go('Battle'); }, { fill: 0x112332, stroke: 0x6c8b99, accent: '#dceaf0' });

    this.add.text(W / 2, H - 22, `Vertical Slice · ${__BUILD_ID__}`, textStyle(9, '#5f7c88')).setOrigin(0.5);

    // Funken in der Werkstattluft
    this.time.addEvent({
      delay: 700,
      loop: true,
      callback: () => {
        if (Math.random() > 0.5) return;
        const sp = this.add.circle(Phaser.Math.Between(20, W - 20), Phaser.Math.Between(340, 620), 2, COLORS.cyan, 0.7);
        this.tweens.add({ targets: sp, y: sp.y - 20, alpha: 0, duration: 1100, onComplete: () => sp.destroy() });
      },
    });
  }
}
