import Phaser from 'phaser';
import './styles.css';
import { H, W } from './config';
import { cleanupLegacyServiceWorkers, installDiagnostics, reportRenderer, showDiagnostics } from './diagnostics';
import { Router } from './router';
import { BattleScene } from './scenes/BattleScene';
import { BootScene } from './scenes/BootScene';
import { HomeScene } from './scenes/HomeScene';
import { RigLabScene } from './scenes/RigLabScene';
import { WorldScene } from './scenes/WorldScene';
import { GameStore } from './store/store';
import { setInputGate } from './ui/overlay';

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
    input: { activePointers: 2, windowEvents: false },
    scene: [BootScene, HomeScene, WorldScene, BattleScene, RigLabScene],
  });
  const router = new Router(game, store);
  setInputGate((open) => {
    game.input.enabled = !open;
  });
  game.registry.set('store', store);
  game.registry.set('router', router);
  game.events.once('ready', () => {
    const type = game.renderer?.type === Phaser.WEBGL ? 'WebGL' : 'Canvas';
    reportRenderer(Phaser.VERSION, type);
    console.info(`Knowsters ${__BUILD_ID__} · Phaser ${Phaser.VERSION} · ${type}`);
  });
  window.addEventListener('resize', () => game.scale.refresh());
  // Debug-Hilfen für Gerätetests: ?fps=1 zeigt die Bildrate, ?lab=rig öffnet das Rig-Labor.
  const params = new URLSearchParams(location.search);
  if (params.has('fps')) {
    const el = document.createElement('div');
    el.style.cssText = 'position:fixed;top:calc(env(safe-area-inset-top,0px) + 4px);left:8px;z-index:60;font:700 12px ui-monospace,monospace;color:#7edee7;background:#06131fcc;padding:3px 6px;border-radius:6px;pointer-events:none';
    document.body.appendChild(el);
    setInterval(() => { el.textContent = `${Math.round(game.loop.actualFps)} fps · ${game.renderer?.type === Phaser.WEBGL ? 'WebGL' : 'Canvas'} · ${window.devicePixelRatio}x`; }, 500);
  }
  if (params.get('lab') === 'rig') router.labOnBoot = 'RigLab';
  // Für Debugging in Safari: window.knowsters.store / .router
  (window as unknown as { knowsters: unknown }).knowsters = { store, router, game, build: __BUILD_ID__ };
} catch (e) {
  console.error(e);
  showDiagnostics(`Start fehlgeschlagen: ${(e as Error).message}`);
}
