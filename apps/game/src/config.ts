/** Logische Portrait-Auflösung; Phaser skaliert per FIT. */
export const W = 390;
export const H = 844;

export const COLORS = {
  cyan: 0x5de5f1,
  orange: 0xff8a4d,
  green: 0x73eaa0,
  gold: 0xf2d08d,
  red: 0xea6a78,
  violet: 0xb271e8,
  ink: 0x07131f,
  panel: 0x0b2232,
} as const;

export const FONT = 'Inter, "SF Pro Text", "Segoe UI", system-ui, -apple-system, sans-serif';

export const textStyle = (size = 14, color = '#f2fbff', weight: '400' | '600' | '700' = '600'): Phaser.Types.GameObjects.Text.TextStyle => ({
  fontFamily: FONT,
  fontSize: `${size}px`,
  fontStyle: weight === '700' ? 'bold' : 'normal',
  color,
});

export const prefersReducedMotion = (): boolean =>
  typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;
