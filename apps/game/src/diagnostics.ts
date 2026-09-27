/**
 * Startdiagnose (Auftrag §4.3): Bei Fehlern erscheint ein Overlay mit echter Exception,
 * User Agent, Phaser-Version, Renderer und Build-ID. Nicht „Internet prüfen“.
 */
const errors: string[] = [];
let rendererInfo = 'noch nicht gestartet';
let phaserVersion = 'noch nicht geladen';

export function installDiagnostics(): void {
  window.addEventListener('error', (e) => {
    errors.push(`${e.message}${e.filename ? ` @ ${e.filename.split('/').pop()}:${e.lineno}` : ''}`);
    showDiagnostics('Unbehandelter Fehler');
  });
  window.addEventListener('unhandledrejection', (e) => {
    const reason = e.reason instanceof Error ? e.reason.message : String(e.reason);
    errors.push(`Promise: ${reason}`);
    showDiagnostics('Unbehandelte Promise-Ablehnung');
  });
  document.getElementById('diag-reset')?.addEventListener('click', () => {
    try {
      localStorage.removeItem('knowsters-save-v30');
    } catch {
      /* ignore */
    }
    location.reload();
  });
}

export function reportRenderer(version: string, renderer: string): void {
  phaserVersion = version;
  rendererInfo = renderer;
}

export function webglSupport(): string {
  try {
    const c = document.createElement('canvas');
    if (c.getContext('webgl2')) return 'webgl2';
    if (c.getContext('webgl')) return 'webgl1';
    return 'nicht verfügbar';
  } catch (e) {
    return `Fehler: ${(e as Error).message}`;
  }
}

export function showDiagnostics(reason: string): void {
  const box = document.getElementById('diag');
  const detail = document.getElementById('diag-detail');
  if (!box || !detail) return;
  detail.textContent = [
    `Grund: ${reason}`,
    `Fehler: ${errors.length ? errors.join('\n        ') : 'keine JS-Exception erfasst'}`,
    `Build: ${__BUILD_ID__}`,
    `Phaser: ${phaserVersion}`,
    `Renderer: ${rendererInfo}`,
    `WebGL: ${webglSupport()}`,
    `UA: ${navigator.userAgent}`,
    `Viewport: ${window.innerWidth}×${window.innerHeight} @${window.devicePixelRatio || 1}x`,
  ].join('\n');
  box.hidden = false;
}

/** Alte Service Worker und Caches des v22-Prototyps entfernen (Auftrag §4.2). */
export async function cleanupLegacyServiceWorkers(): Promise<void> {
  try {
    if ('serviceWorker' in navigator) {
      const regs = await navigator.serviceWorker.getRegistrations();
      await Promise.all(regs.map((r) => r.unregister()));
    }
    if ('caches' in window) {
      const keys = await caches.keys();
      await Promise.all(keys.filter((k) => k.startsWith('knowsters-')).map((k) => caches.delete(k)));
    }
  } catch {
    /* nicht kritisch */
  }
}
