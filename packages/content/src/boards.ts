export type GateSide = 'left' | 'right' | 'top' | 'bottom' | 'none';
export type BoardTheme = 'bridge' | 'workshop' | 'plaza';

export interface Cell {
  x: number;
  y: number;
}

export interface BoardConfig {
  id: string;
  width: number;
  height: number;
  /** Seite, an der das Tor liegt. Gegner, die eine Torzelle betreten, brechen durch. */
  gate: GateSide;
  /** Seite, von der Gegner kommen (Spawn-Zellen, Weg-Ziel). */
  enemySide: GateSide;
  theme: BoardTheme;
  /** Unpassierbare statische Hindernisse (Geländer, Kisten, Werkbank). */
  obstacles: readonly Cell[];
}

/**
 * Original-Prolog (8×6, Tor links) als Referenz und für die Regel-Tests.
 * Koordinaten identisch mit legacy/v22/prolog.js.
 */
export const BOARD_BRIDGE_LANDSCAPE: BoardConfig = {
  id: 'bridge-8x6',
  width: 8,
  height: 6,
  gate: 'left',
  enemySide: 'right',
  theme: 'bridge',
  obstacles: [{ x: 5, y: 0 }, { x: 5, y: 5 }],
};

/** Portrait-Startwert 6×7 (Auftrag §8): Tor unten hinter dem Team, Gegner von oben. */
export const BOARD_BRIDGE_PORTRAIT: BoardConfig = {
  id: 'bridge-6x7',
  width: 6,
  height: 7,
  gate: 'bottom',
  enemySide: 'top',
  theme: 'bridge',
  obstacles: [{ x: 0, y: 2 }, { x: 5, y: 2 }],
};

/** Werkstattviertel: geschlossener Hof ohne Tor; Werkbank und Kisten als Deckung. */
export const BOARD_WORKSHOP_PORTRAIT: BoardConfig = {
  id: 'workshop-6x7',
  width: 6,
  height: 7,
  gate: 'none',
  enemySide: 'top',
  theme: 'workshop',
  obstacles: [{ x: 1, y: 3 }, { x: 4, y: 3 }],
};

export const BOARDS: Record<string, BoardConfig> = {
  [BOARD_BRIDGE_LANDSCAPE.id]: BOARD_BRIDGE_LANDSCAPE,
  [BOARD_BRIDGE_PORTRAIT.id]: BOARD_BRIDGE_PORTRAIT,
  [BOARD_WORKSHOP_PORTRAIT.id]: BOARD_WORKSHOP_PORTRAIT,
};

export const boardDef = (id: string): BoardConfig => {
  const b = BOARDS[id];
  if (!b) throw new Error(`Unbekanntes Brett: ${id}`);
  return b;
};
