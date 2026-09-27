import { execSync } from 'node:child_process';
import { defineConfig } from 'vite';

function buildId(): string {
  const stamp = new Date().toISOString().slice(0, 16).replace('T', ' ');
  try {
    const sha = execSync('git rev-parse --short HEAD', { stdio: ['ignore', 'pipe', 'ignore'] }).toString().trim();
    return `${sha} · ${stamp}`;
  } catch {
    return `local · ${stamp}`;
  }
}

export default defineConfig({
  // GitHub Pages: https://pghess.github.io/knowsters/
  base: process.env.KNOWSTERS_BASE ?? '/knowsters/',
  define: {
    __BUILD_ID__: JSON.stringify(buildId()),
  },
  build: {
    target: 'es2020',
    sourcemap: true,
    chunkSizeWarningLimit: 2000,
  },
  server: { port: 5173 },
  preview: { port: 4173 },
});
