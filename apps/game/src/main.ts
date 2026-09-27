import Phaser from 'phaser';
import './styles.css';
import { H, W } from './config';
import { cleanupLegacyServiceWorkers, installDiagnostics, reportRenderer, showDiagnostics } from './diagnostics';
import { Router } from './router';
import { BattleScene } from './scenes/BattleScene';
import { BootScene } from './scenes/BootScene';
import { HomeScene } from './scenes/HomeScene';
import { WorldScene } from './scenes/WorldScene';
import { GameStore } from './store/store';

installDiagnostics();
void cleanupLegacyServiceWorkers();

try {
  const store = GameStore.boot();
  const game = new Phaser.Game({
    type: Phaser.AUTO,
    parent: 'game',
    width: W,
    height: H,
    backgroundColor: '#07131f',
    antialias: true,
    scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH, width: W, height: H },
    input: { activePointers: 2 },
    scene: [BootScene, HomeScene, WorldScene, BattleScene],
  });
  const router = new Router(game, store);
  game.registry.set('store', store);
  game.registry.set('router', router);
  game.events.once('ready', () => {
    const type = game.renderer?.type === Phaser.WEBGL ? 'WebGL' : 'Canvas';
    reportRenderer(Phaser.VERSION, type);
    console.info(`Knowsters ${__BUILD_ID__} · Phaser ${Phaser.VERSION} · ${type}`);
  });
  window.addEventListener('resize', () => game.scale.refresh());
  // Für Debugging in Safari: window.knowsters.store / .router
  (window as unknown as { knowsters: unknown }).knowsters = { store, router, game, build: __BUILD_ID__ };
} catch (e) {
  console.error(e);
  showDiagnostics(`Start fehlgeschlagen: ${(e as Error).message}`);
}
