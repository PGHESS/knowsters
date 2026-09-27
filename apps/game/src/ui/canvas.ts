import Phaser from 'phaser';
import { COLORS, textStyle } from '../config';

/** Kleine Canvas-UI-Bausteine für HUD und Action Bar (Touchziele ≥ 44 pt). */

export interface PillOptions {
  fill?: number;
  stroke?: number;
  text?: string;
  alpha?: number;
}

export function addPill(scene: Phaser.Scene, x: number, y: number, w: number, h: number, label: string, o: PillOptions = {}) {
  const bg = scene.add.rectangle(x, y, w, h, o.fill ?? COLORS.panel, o.alpha ?? 0.9).setStrokeStyle(1, o.stroke ?? COLORS.cyan, 0.45);
  const t = scene.add.text(x, y, label, textStyle(11, o.text ?? '#dffbff', '700')).setOrigin(0.5);
  const c = scene.add.container(0, 0, [bg, t]);
  return { container: c, bg, text: t, setLabel: (v: string) => t.setText(v) };
}

export interface ButtonOptions {
  fill?: number;
  stroke?: number;
  accent?: string;
  size?: number;
  sub?: string;
}

export interface CanvasButton {
  container: Phaser.GameObjects.Container;
  bg: Phaser.GameObjects.Rectangle;
  text: Phaser.GameObjects.Text;
  sub: Phaser.GameObjects.Text | null;
  setLabel(v: string, sub?: string): void;
  setEnabled(v: boolean): void;
  setActive(v: boolean): void;
  destroy(): void;
}

export function makeButton(scene: Phaser.Scene, x: number, y: number, w: number, h: number, label: string, onTap: () => void, o: ButtonOptions = {}): CanvasButton {
  const fill = o.fill ?? 0x102f42;
  const stroke = o.stroke ?? COLORS.cyan;
  const bg = scene.add.rectangle(x, y, w, h, fill, 0.96).setStrokeStyle(1, stroke, 0.5).setInteractive({ useHandCursor: true });
  const text = scene.add.text(x, o.sub ? y - 7 : y, label, textStyle(o.size ?? 12, o.accent ?? '#efffff', '700')).setOrigin(0.5);
  const sub = o.sub ? scene.add.text(x, y + 10, o.sub, textStyle(9, '#9fb7c2', '600')).setOrigin(0.5) : null;
  const container = scene.add.container(0, 0, sub ? [bg, text, sub] : [bg, text]);
  let enabled = true;
  bg.on('pointerdown', () => enabled && bg.setScale(0.97));
  bg.on('pointerup', () => {
    bg.setScale(1);
    if (enabled) onTap();
  });
  bg.on('pointerout', () => bg.setScale(1));
  return {
    container,
    bg,
    text,
    sub,
    setLabel(v, s) {
      text.setText(v);
      if (sub && s !== undefined) sub.setText(s);
    },
    setEnabled(v) {
      enabled = v;
      container.setAlpha(v ? 1 : 0.42);
    },
    setActive(v) {
      bg.setStrokeStyle(v ? 2 : 1, v ? 0xffffff : stroke, v ? 0.9 : 0.5);
    },
    destroy() {
      container.destroy(true);
    },
  };
}

/** Schwebender Text (Schaden, Status), steigt und verblasst. */
export function floatText(scene: Phaser.Scene, x: number, y: number, label: string, color: string, depth = 70): void {
  const t = scene.add.text(x, y, label, textStyle(13, color, '700')).setOrigin(0.5).setDepth(depth).setStroke('#06131f', 4);
  scene.tweens.add({ targets: t, y: y - 28, alpha: 0, duration: 800, ease: 'Quad.easeOut', onComplete: () => t.destroy() });
}

/** Kurze Meldung oben, verblasst. */
export function flash(scene: Phaser.Scene, y: number, msg: string, duration = 1400, depth = 70): void {
  const bg = scene.add.rectangle(195, y, 340, 38, 0x06131f, 0.94).setDepth(depth).setStrokeStyle(1, COLORS.cyan, 0.3);
  const t = scene.add.text(195, y, msg, textStyle(11, '#e5fbfd', '700')).setOrigin(0.5).setDepth(depth + 1).setWordWrapWidth(320).setAlign('center');
  bg.setSize(340, Math.max(38, t.height + 14));
  scene.tweens.add({ targets: [bg, t], alpha: 0, delay: duration, duration: 260, onComplete: () => { bg.destroy(); t.destroy(); } });
}
