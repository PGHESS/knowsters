import { execSync } from 'node:child_process';
import { defineConfig } from 'vite';

function buildId(): string {
  const stamp = new Date().toISOString().slice(0, 16).replace('T', ' ');
  try {
    return `${execSync('git rev-parse --short HEAD', { stdio: ['ignore', 'pipe', 'ignore'] }).toString().trim()} · ${stamp}`;
  } catch {
    return `local · ${stamp}`;
  }
}

export default defineConfig({
  // Pages: https://pghess.github.io/knowsters/pilot/
  base: process.env.KNOWSTERS_PILOT_BASE ?? '/knowsters/pilot/',
  // Modelle und Manifeste werden mit der Hauptapp geteilt (apps/game/public/assets/...)
  publicDir: '../game/public',
  define: { __BUILD_ID__: JSON.stringify(buildId()) },
  build: { target: 'es2020', sourcemap: true, chunkSizeWarningLimit: 4000 },
  server: { port: 5174 },
  preview: { port: 4174 },
});
