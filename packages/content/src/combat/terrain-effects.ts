/**
 * Geländeeffekte (Wände, Glut, Lichtspur). Regeln in der Engine (`walls`, `hazards`, `traces`);
 * hier Darstellung, Dauer-Standard und VFX-Schlüssel.
 */
export interface TerrainEffectDef {
  /** `terrain.<name>` */
  id: string;
  /** Liste in BattleState. */
  list: 'walls' | 'hazards' | 'traces';
  name: string;
  icon: string;
  desc: string;
  defaultTurns: number;
  /** Wirkradius in Feldern (Lichtspur: 1 = 3×3). */
  radius: number;
  vfx: string;
}

export const TERRAIN_EFFECTS: Record<string, TerrainEffectDef> = {
  'terrain.wall': { id: 'terrain.wall', list: 'walls', name: 'Schutzwall', icon: '▰', desc: 'Unpassierbar.', defaultTurns: 2, radius: 0, vfx: 'vfx.earth.wall' },
  'terrain.ember': { id: 'terrain.ember', list: 'hazards', name: 'Glut', icon: '⌁', desc: '2 Schaden für Gegner, die das Feld betreten.', defaultTurns: 2, radius: 0, vfx: 'vfx.fire.trail' },
  'terrain.lighttrace': { id: 'terrain.lighttrace', list: 'traces', name: 'Lichtspur', icon: '✧', desc: 'Gegner im Bereich bewegen sich nicht.', defaultTurns: 2, radius: 1, vfx: 'vfx.light.trace' },
};
