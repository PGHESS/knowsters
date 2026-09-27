import type Phaser from 'phaser';
import type { GameStore } from './store/store';
import { hideSheet } from './ui/overlay';

export type SceneKey = 'Boot' | 'Home' | 'World' | 'Battle' | 'RigLab';

/**
 * Ein Router für Szenen und Overlays. Genau eine Spielszene ist aktiv; DOM-Sheets liegen darüber.
 * Globale Navigation (Home / Welt / Team / Wissen) verschwindet in Kampf und Dialog automatisch,
 * weil diese Szenen ihre eigene HUD-Leiste mitbringen.
 */
export class Router {
  current: SceneKey = 'Boot';
  /** Debug: Szene, die nach dem Boot statt Home geöffnet wird. */
  labOnBoot: SceneKey | null = null;

  constructor(
    private readonly game: Phaser.Game,
    readonly store: GameStore,
  ) {}

  go(next: SceneKey, data: Record<string, unknown> = {}): void {
    hideSheet();
    const prev = this.current;
    this.current = next;
    if (prev !== next && this.game.scene.isActive(prev)) this.game.scene.stop(prev);
    if (this.game.scene.isActive(next)) this.game.scene.stop(next);
    this.game.scene.start(next, data);
  }

  /** Nach dem Boot: laufenden Kampf fortsetzen, sonst Home. */
  resume(): void {
    if (this.labOnBoot) {
      this.go(this.labOnBoot);
      return;
    }
    if (this.store.state.battle && !this.store.state.battle.result) this.go('Battle', { resume: true });
    else this.go('Home');
  }
}
