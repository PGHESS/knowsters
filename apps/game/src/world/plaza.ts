import Phaser from 'phaser';
import type { TerrainMap } from '@knowsters/rules';
import { COLORS } from '../config';

/**
 * Lichtquell · Werkstattplatz, prozedural (Auftrag §11: urban statt Fantasy-Dorf).
 * Platzhalter-Art mit richtiger Komposition: Pflaster mit Lichtfugen, Werkstattfassade,
 * Energieleitung, Laternen, Kisten/Werkbank als Props, Tiefe durch Verläufe.
 * Koordinaten in Prozent (0–100) passen zur Terrain-Karte.
 */
export const PLAZA_MAP: TerrainMap = {
  id: 'lichtquell-werkstatt',
  aspect: 0.46, // 390 breit × 844 hoch → x-Schritte sind schmaler als y-Schritte
  ground: [
    [
      [6, 40], [94, 40], [94, 62], [86, 62], [86, 70], [94, 70], [94, 90], [6, 90], [6, 72], [16, 72], [16, 63], [6, 63],
    ],
  ],
  solid: [
    [[62, 74], [80, 74], [80, 84], [62, 84]], // Werkbank
    [[10, 48], [22, 48], [22, 56], [10, 56]], // Kisten
  ],
  spawn: [50, 80],
};

export const PLAZA_POINTS = {
  npc: [26, 47] as [number, number],
  flicker: [78, 52] as [number, number],
  door: [50, 36] as [number, number],
};

export const pctToPx = (p: readonly [number, number], w: number, h: number): [number, number] => [(p[0] / 100) * w, (p[1] / 100) * h];

export interface PlazaPainted {
  root: Phaser.GameObjects.Container;
  lamps: Phaser.GameObjects.Ellipse[];
}

export function paintPlaza(scene: Phaser.Scene, w: number, h: number, dim = 0): PlazaPainted {
  const root = scene.add.container(0, 0);
  const g = scene.add.graphics();
  root.add(g);
  const X = (p: number) => (p / 100) * w;
  const Y = (p: number) => (p / 100) * h;

  // Himmel / Nacht mit Stadtlicht
  g.fillGradientStyle(0x0a1a2b, 0x0a1a2b, 0x1a3c52, 0x1a3c52, 1);
  g.fillRect(0, 0, w, Y(40));
  // Fassade der Werkhalle
  g.fillStyle(0x16283a).fillRect(X(4), Y(6), X(92), Y(34));
  g.fillStyle(0x1d3446).fillRect(X(4), Y(6), X(92), Y(4));
  for (let i = 0; i < 6; i++) {
    const lit = i % 2 === 0;
    g.fillStyle(lit ? 0xf2c66d : 0x22384a, lit ? 0.85 : 1).fillRect(X(9 + i * 14.5), Y(13), X(9), Y(8));
    g.lineStyle(2, 0x0e1a26, 1).strokeRect(X(9 + i * 14.5), Y(13), X(9), Y(8));
  }
  g.fillStyle(0x0d1b27).fillRect(X(40), Y(24), X(20), Y(16)); // Tor
  g.fillStyle(0x5de5f1, 0.35).fillRect(X(41.5), Y(25), X(17), Y(1));
  g.lineStyle(3, 0x243e52).strokeRect(X(4), Y(6), X(92), Y(34));
  // Energieleitung über dem Platz
  g.lineStyle(3, 0x5de5f1, 0.25).lineBetween(X(4), Y(30), X(96), Y(33));
  g.lineStyle(1, 0xbdfbff, 0.5).lineBetween(X(4), Y(30), X(96), Y(33));
  // Pflaster
  g.fillStyle(0x223744).fillRect(0, Y(40), w, Y(60));
  const tileW = X(10);
  const tileH = Y(5.2);
  for (let r = 0; r < 12; r++) {
    for (let c = -1; c < 11; c++) {
      const ox = (r % 2) * tileW * 0.5;
      const x = c * tileW + ox;
      const y = Y(40) + r * tileH;
      const tone = 0x263c4a + ((r * 7 + c * 13) % 5) * 0x030405;
      g.fillStyle(tone, 1).fillRect(x + 1.5, y + 1.5, tileW - 3, tileH - 3);
      g.lineStyle(1, 0x5de5f1, r % 3 === 1 && c % 2 === 0 ? 0.28 : 0.07).strokeRect(x + 1.5, y + 1.5, tileW - 3, tileH - 3);
    }
  }
  // Metallplatten / Infrastruktur
  g.fillStyle(0x2e3f4c).fillRect(X(30), Y(58), X(40), Y(8));
  g.lineStyle(2, 0x5de5f1, 0.5).strokeRect(X(30), Y(58), X(40), Y(8));
  g.lineStyle(1, 0x9ff5fb, 0.35);
  for (let i = 1; i < 4; i++) g.lineBetween(X(30 + i * 10), Y(58), X(30 + i * 10), Y(66));
  // Beete links/rechts (Aussparungen)
  g.fillStyle(0x1b3128).fillRect(X(0), Y(63), X(16), Y(9));
  g.fillStyle(0x1b3128).fillRect(X(86), Y(62), X(14), Y(8));
  g.fillStyle(0x2e5a3a, 0.9);
  for (let i = 0; i < 5; i++) g.fillCircle(X(3 + i * 3), Y(66 + (i % 2) * 2), X(1.6));
  for (let i = 0; i < 4; i++) g.fillCircle(X(88 + i * 3), Y(65 + (i % 2) * 2), X(1.6));
  // Kisten (solid)
  g.fillStyle(0x4a3a2b).fillRect(X(10), Y(46), X(12), Y(9));
  g.fillStyle(0x5c4936).fillRect(X(10), Y(46), X(12), Y(3));
  g.lineStyle(2, 0x2b1f16).strokeRect(X(10), Y(46), X(12), Y(9));
  g.lineStyle(2, 0xf2c66d, 0.6).lineBetween(X(10), Y(51), X(22), Y(51));
  // Werkbank (solid)
  g.fillStyle(0x30414d).fillRect(X(62), Y(72), X(18), Y(11));
  g.fillStyle(0x3d525f).fillRect(X(62), Y(72), X(18), Y(3));
  g.lineStyle(2, 0x182530).strokeRect(X(62), Y(72), X(18), Y(11));
  g.fillStyle(0xff8a4d, 0.8).fillCircle(X(66), Y(73.5), X(0.9));
  g.fillStyle(0x5de5f1, 0.8).fillCircle(X(76), Y(73.5), X(0.9));
  // Laternen
  const lamps: Phaser.GameObjects.Ellipse[] = [];
  for (const [lx, ly] of [[8, 42], [92, 42]] as const) {
    g.fillStyle(0x1a2733).fillRect(X(lx) - 3, Y(ly) - Y(14), 6, Y(14));
    const glow = scene.add.ellipse(X(lx), Y(ly) - Y(14), 70, 90, 0xf2c66d, 0.16);
    const bulb = scene.add.circle(X(lx), Y(ly) - Y(14), 6, 0xfff0c8, 0.95);
    root.add([glow, bulb]);
    lamps.push(glow);
  }
  // Atmosphäre: Vignette + Tiefe
  const fog = scene.add.graphics();
  fog.fillGradientStyle(0x07131f, 0x07131f, 0x07131f, 0x07131f, 0.0, 0.0, 0.55, 0.55);
  fog.fillRect(0, Y(78), w, Y(22));
  root.add(fog);
  if (dim > 0) {
    root.add(scene.add.rectangle(w / 2, h / 2, w, h, COLORS.ink, dim));
  }
  return { root, lamps };
}
