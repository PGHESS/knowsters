import Phaser from 'phaser';
import { guardianDef } from '@knowsters/content';
import { COLORS, H, W, textStyle } from '../config';
import { CreatureRig } from '../rig/CreatureRig';
import type { Router } from '../router';
import { makeButton } from '../ui/canvas';

/**
 * Rig-Labor (Asset-Pilot, Auftrag §15). Erreichbar über `?lab=rig`.
 * Links: das eigene Cutout-Rig (Pyro) mit Idle / Move / Attack / Hit.
 * Rechts: Ladeversuch der offiziellen Spine-Runtime (`@esotericsoftware/spine-phaser-v4`)
 * mit dem Spineboy-Beispiel von esotericsoftware.com – nur hier, per dynamischem Import,
 * damit das Produktionsbundle nicht wächst. Ergebnis wird im Screen protokolliert.
 */
export class RigLabScene extends Phaser.Scene {
  private log!: Phaser.GameObjects.Text;
  private lines: string[] = [];
  private fps!: Phaser.GameObjects.Text;

  constructor() {
    super('RigLab');
  }

  create(): void {
    const router = this.registry.get('router') as Router;
    this.add.rectangle(W / 2, H / 2, W, H, 0x0a1622);
    this.add.text(20, 40, 'RIG-LABOR', textStyle(20, '#f2fbff', '700'));
    this.add.text(20, 66, 'Cutout-Rig (links) · Spine-Runtime-Test (rechts)', textStyle(11, '#9fb7c2'));
    this.fps = this.add.text(W - 20, 40, '', textStyle(11, '#7edee7', '700')).setOrigin(1, 0);
    this.log = this.add.text(20, H - 300, '', textStyle(10, '#dbf8fb')).setWordWrapWidth(350).setLineSpacing(2);

    // Bodenlinie
    this.add.rectangle(W / 2, 430, W - 40, 2, 0x2d4658);
    const pyro = guardianDef('pyro');
    const rig = new CreatureRig(this, 110, 430, `creature:${pyro.sprite}`, { height: 170, accent: parseInt(pyro.accent.slice(1), 16) });
    const targetX = 300;
    this.add.circle(targetX, 400, 8, COLORS.violet, 0.5);

    const row = (i: number) => H - 60 - i * 58;
    makeButton(this, 66, row(1), 92, 48, 'IDLE', () => rig.idle(), { fill: 0x123548 });
    makeButton(this, 168, row(1), 92, 48, 'MOVE', () => rig.travelTo(rig.x < 200 ? 250 : 110, 430), { fill: 0x123548 });
    makeButton(this, 270, row(1), 92, 48, 'ATTACK', () => rig.attack(targetX, 430, () => { rig.sparks(8); this.cameras.main.shake(70, 0.003); }), { fill: 0x5b341b, stroke: COLORS.orange });
    makeButton(this, 66, row(0), 92, 48, 'HIT', () => rig.hit(rig.x + 40), { fill: 0x3a2b4d, stroke: COLORS.violet });
    makeButton(this, 168, row(0), 92, 48, 'CAST', () => rig.cast(() => rig.sparks(10, COLORS.gold)), { fill: 0x18372c, stroke: COLORS.green });
    makeButton(this, 270, row(0), 92, 48, 'HOME', () => router.go('Home'), { fill: 0x102836, stroke: 0x5e8190 });

    this.note('Cutout-Rig: 1 Körperebene + Schatten + Aura, Timelines für Idle/Move/Attack/Cast/Hit.');
    void this.trySpine();
  }

  override update(): void {
    this.fps.setText(`${Math.round(this.game.loop.actualFps)} fps`);
  }

  private note(line: string): void {
    this.lines.push(line);
    this.log.setText(this.lines.slice(-8).join('\n'));
  }

  private async trySpine(): Promise<void> {
    const t0 = performance.now();
    try {
      const spine = (await import('@esotericsoftware/spine-phaser-v4')) as unknown as { SpinePlugin: Phaser.Plugins.ScenePlugin; version?: string };
      this.note(`spine-phaser-v4 geladen (${Math.round(performance.now() - t0)} ms)`);
      this.plugins.installScenePlugin('SpinePlugin', spine.SpinePlugin as unknown as Function, 'spine', this);
      this.note('SpinePlugin als Szenen-Plugin installiert.');
      const base = 'https://esotericsoftware.com/files/examples/4.2/spineboy/export/';
      const loader = this.load as unknown as { spineJson(key: string, url: string): void; spineAtlas(key: string, url: string): void };
      loader.spineJson('spineboy-data', `${base}spineboy-pro.json`);
      loader.spineAtlas('spineboy-atlas', `${base}spineboy-pma.atlas`);
      this.load.once('complete', () => {
        try {
          const add = this.add as unknown as { spine(x: number, y: number, data: string, atlas: string): { scale: number; animationState: { setAnimation(track: number, name: string, loop: boolean): void }; setScale(s: number): unknown } };
          const boy = add.spine(295, 430, 'spineboy-data', 'spineboy-atlas');
          boy.setScale(0.32);
          boy.animationState.setAnimation(0, 'walk', true);
          this.note(`Spineboy gerendert · Runtime OK mit Phaser ${Phaser.VERSION} (${Math.round(performance.now() - t0)} ms gesamt)`);
        } catch (e) {
          this.note(`Spine-Objekt fehlgeschlagen: ${(e as Error).message}`);
        }
      });
      this.load.once('loaderror', (file: { key: string }) => this.note(`Spine-Asset fehlgeschlagen: ${file.key}`));
      this.load.start();
    } catch (e) {
      this.note(`Spine-Runtime nicht ladbar: ${(e as Error).message}`);
    }
  }
}
