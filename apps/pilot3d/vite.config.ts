import { execSync } from 'node:child_process';
import { gzipSync } from 'node:zlib';
import { defineConfig, type Plugin } from 'vite';

function buildId(): string {
  const stamp = new Date().toISOString().slice(0, 16).replace('T', ' ');
  try {
    return `${execSync('git rev-parse --short HEAD', { stdio: ['ignore', 'pipe', 'ignore'] }).toString().trim()} · ${stamp}`;
  } catch {
    return `local · ${stamp}`;
  }
}

/** Schreibt bundle-info.json (Gesamt-JS, gzip, Chunks, Entry) für das Performance-Overlay (Issue #3, Punkt 7). */
function bundleInfo(): Plugin {
  return {
    name: 'knowsters-bundle-info',
    generateBundle(_o, bundle) {
      let js = 0;
      let gz = 0;
      let chunks = 0;
      let entry = 0;
      for (const c of Object.values(bundle)) {
        if (c.type !== 'chunk') continue;
        chunks++;
        const bytes = Buffer.byteLength(c.code);
        js += bytes;
        gz += gzipSync(c.code).length;
        if (c.isEntry) entry += bytes;
      }
      this.emitFile({ type: 'asset', fileName: 'bundle-info.json', source: JSON.stringify({ jsKB: Math.round(js / 1024), gzipKB: Math.round(gz / 1024), chunks, entryKB: Math.round(entry / 1024), build: buildId() }) });
    },
  };
}

export default defineConfig({
  plugins: [bundleInfo()],
  // Pages: https://pghess.github.io/knowsters/pilot/
  base: process.env.KNOWSTERS_PILOT_BASE ?? '/knowsters/pilot/',
  // Modelle und Manifeste werden mit der Hauptapp geteilt (apps/game/public/assets/...)
  publicDir: '../game/public',
  define: { __BUILD_ID__: JSON.stringify(buildId()) },
  build: { target: 'es2020', sourcemap: true, chunkSizeWarningLimit: 4000 },
  server: { port: 5174 },
  preview: { port: 4174 },
});
