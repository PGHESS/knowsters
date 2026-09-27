import Phaser from 'phaser';
import type { BoardConfig } from '@knowsters/content';
import { isGateCell } from '@knowsters/rules';
import { COLORS, W } from '../config';

export interface ArenaLayout {
  cols: number;
  rows: number;
  tileW: number;
  tileH: number;
  startX: number;
  startY: number;
  center(x: number, y: number): { x: number; y: number };
}

/** Bereich für das Feld: y 118–608, x 20–370 (Portrait 390×844). */
export function layoutFor(board: BoardConfig): ArenaLayout {
  const areaW = 340;
  const areaH = 490;
  const tileW = Math.floor(areaW / board.width);
  const tileH = Math.floor(areaH / board.height);
  const startX = Math.round((W - tileW * board.width) / 2);
  const startY = 118 + Math.round((areaH - tileH * board.height) / 2);
  return {
    cols: board.width,
    rows: board.height,
    tileW,
    tileH,
    startX,
    startY,
    center: (x, y) => ({ x: startX + x * tileW + tileW / 2, y: startY + y * tileH + tileH / 2 }),
  };
}

/**
 * Arena = Backdrop + Feldplatten + Props (Auftrag §16). Das Raster entsteht aus dem Material:
 * Steinplatten mit Rissen und Torfuge (Brücke) bzw. Metallplatten mit Lichtfugen (Werkhalle).
 */
export function paintArena(scene: Phaser.Scene, board: BoardConfig, L: ArenaLayout): void {
  const g = scene.add.graphics().setDepth(1);
  const left = L.startX;
  const top = L.startY;
  const width = L.tileW * L.cols;
  const height = L.tileH * L.rows;

  if (board.theme === 'bridge') {
    const bg = scene.add.image(W / 2, 360, 'backdrop:bridge').setDepth(0);
    const s = Math.max(W / bg.width, 740 / bg.height);
    bg.setScale(s).setAlpha(0.9).setTint(0x9fb6d0);
    scene.add.rectangle(W / 2, 360, W, 760, 0x07131f, 0.35).setDepth(0);
    // Brückenkörper
    g.fillStyle(0x0e1c28, 0.85).fillRoundedRect(left - 14, top - 16, width + 28, height + 30, 18);
    g.lineStyle(3, 0x3d5468, 0.9).strokeRoundedRect(left - 14, top - 16, width + 28, height + 30, 18);
    // Geländer links/rechts
    for (const x of [left - 9, left + width + 5]) {
      g.fillStyle(0x2c4256).fillRect(x, top - 10, 4, height + 18);
      for (let i = 0; i <= L.rows; i++) g.fillStyle(0x4a657c).fillRect(x - 2, top - 10 + i * L.tileH, 8, 5);
    }
  } else {
    // Werkhalle: dunkler Hallenboden, Maschinenband oben
    scene.add.rectangle(W / 2, 360, W, 760, 0x08141d).setDepth(0);
    const band = scene.add.graphics().setDepth(0);
    band.fillStyle(0x16283a).fillRect(0, 100, W, 30);
    for (let i = 0; i < 9; i++) {
      band.fillStyle(i % 2 ? 0x1f3446 : 0x2a4356).fillRect(12 + i * 42, 104, 30, 20);
      band.fillStyle(0x5de5f1, i % 3 === 0 ? 0.7 : 0.25).fillRect(16 + i * 42, 112, 22, 3);
    }
    band.lineStyle(2, 0x5de5f1, 0.35).lineBetween(0, 130, W, 130);
    g.fillStyle(0x121f2b, 0.9).fillRoundedRect(left - 10, top - 10, width + 20, height + 20, 12);
    g.lineStyle(2, 0x2d4658, 0.9).strokeRoundedRect(left - 10, top - 10, width + 20, height + 20, 12);
  }

  for (let y = 0; y < L.rows; y++) {
    for (let x = 0; x < L.cols; x++) {
      const px = left + x * L.tileW;
      const py = top + y * L.tileH;
      const gate = isGateCell(board, x, y);
      const obstacle = board.obstacles.some((o) => o.x === x && o.y === y);
      const seed = (x * 31 + y * 17) % 7;
      if (board.theme === 'bridge') {
        const tone = gate ? 0x3c4c58 : 0x2a3a46 + seed * 0x020303;
        g.fillStyle(tone, 1).fillRoundedRect(px + 2, py + 2, L.tileW - 4, L.tileH - 4, 6);
        g.lineStyle(1, 0xdaf3f7, 0.09).strokeRoundedRect(px + 2, py + 2, L.tileW - 4, L.tileH - 4, 6);
        // Risse
        g.lineStyle(1, 0x0e1a24, 0.5);
        if (seed % 3 === 0) g.lineBetween(px + 8, py + 10 + seed * 3, px + L.tileW * 0.6, py + 6 + seed * 5);
        if (seed % 2 === 1) g.lineBetween(px + L.tileW * 0.5, py + L.tileH - 8, px + L.tileW - 6, py + L.tileH - 20);
        if (gate) g.lineStyle(2, COLORS.gold, 0.45).lineBetween(px + 4, py + L.tileH - 4, px + L.tileW - 4, py + L.tileH - 4);
      } else {
        const tone = 0x233340 + seed * 0x020304;
        g.fillStyle(tone, 1).fillRect(px + 2, py + 2, L.tileW - 4, L.tileH - 4);
        g.lineStyle(1, COLORS.cyan, (x + y) % 3 === 0 ? 0.28 : 0.09).strokeRect(px + 2, py + 2, L.tileW - 4, L.tileH - 4);
        g.fillStyle(0x0b1620, 0.7).fillCircle(px + 8, py + 8, 1.6).fillCircle(px + L.tileW - 8, py + L.tileH - 8, 1.6);
      }
      if (obstacle) {
        if (board.theme === 'bridge') {
          // eingestürztes Geländerstück / Steinblock
          g.fillStyle(0x4a5c6d).fillRoundedRect(px + 6, py + 12, L.tileW - 12, L.tileH - 22, 5);
          g.fillStyle(0x64798d).fillRoundedRect(px + 6, py + 12, L.tileW - 12, 8, 4);
          g.lineStyle(2, 0x1a2733).strokeRoundedRect(px + 6, py + 12, L.tileW - 12, L.tileH - 22, 5);
        } else {
          // Kiste
          g.fillStyle(0x4a3a2b).fillRect(px + 7, py + 14, L.tileW - 14, L.tileH - 24);
          g.fillStyle(0x5c4936).fillRect(px + 7, py + 14, L.tileW - 14, 8);
          g.lineStyle(2, 0x2b1f16).strokeRect(px + 7, py + 14, L.tileW - 14, L.tileH - 24);
          g.lineStyle(2, COLORS.gold, 0.5).lineBetween(px + 7, py + L.tileH / 2 + 2, px + L.tileW - 7, py + L.tileH / 2 + 2);
        }
      }
    }
  }
  if (board.gate !== 'none') {
    const gy = board.gate === 'bottom' ? top + height + 6 : top - 12;
    scene.add.text(W / 2, gy, 'STADTTOR', { fontFamily: 'Inter, system-ui, sans-serif', fontSize: '9px', fontStyle: 'bold', color: '#f2d08d' }).setOrigin(0.5).setAlpha(0.8).setDepth(2);
  }
}
