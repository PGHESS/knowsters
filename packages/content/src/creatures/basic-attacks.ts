/**
 * Grundangriffe (Art & Asset Bible §8): jedes Wesen hat genau einen, immer verfügbar,
 * ohne Resonanzkosten, außerhalb der vier Skill-Slots. Werte sind PILOTWERTE.
 */
export type AttackKind = 'physical' | 'fire' | 'light' | 'earth' | 'energy';

export interface BasicAttackDef {
  /** Namenskonvention Bible §14: `attack.<species>.basic` */
  id: string;
  speciesId: string;
  name: string;
  icon: string;
  kind: AttackKind;
  /** Manhattan-Reichweite. */
  range: number;
  /** Grundschaden vor Angriffsbonus, Entfachen und Analyse. */
  damage: number;
  /** Animationsvertrag (Bible §7). */
  anim: 'basic_attack';
  vfx: string;
  desc: string;
  /** Balancing-Status. */
  pilot: true;
}

/**
 * Alle Wesen – Wächter und Gegner – haben denselben Vertrag. Bei Gegnern wählt die KI den
 * Grundangriff automatisch (Reichweite, Schaden, Animation, VFX kommen aus derselben Struktur).
 */
export const BASIC_ATTACKS: Record<string, BasicAttackDef> = {
  'attack.pyro.basic': { id: 'attack.pyro.basic', speciesId: 'pyro', name: 'Flammenklaue', icon: '🐾', kind: 'fire', range: 1, damage: 2, anim: 'basic_attack', vfx: 'vfx.fire.hit.small', desc: 'Kurzer, physisch-feuriger Prankenhieb. Pilotwert: 2 Schaden, Reichweite 1.', pilot: true },
  'attack.lumi.basic': { id: 'attack.lumi.basic', speciesId: 'lumi', name: 'Lichtimpuls', icon: '✧', kind: 'light', range: 2, damage: 1, anim: 'basic_attack', vfx: 'vfx.light.hit.small', desc: 'Gebündelter Lichtstoß auf kurze Distanz. Pilotwert: 1 Schaden, Reichweite 2.', pilot: true },
  'attack.terra.basic': { id: 'attack.terra.basic', speciesId: 'terra', name: 'Pranke', icon: '◆', kind: 'earth', range: 1, damage: 2, anim: 'basic_attack', vfx: 'vfx.earth.hit.small', desc: 'Schwerer Stoß mit der Pranke. Pilotwert: 2 Schaden, Reichweite 1.', pilot: true },
  'attack.nivaro.basic': { id: 'attack.nivaro.basic', speciesId: 'nivaro', name: 'Energieimpuls', icon: '⟡', kind: 'energy', range: 2, damage: 1, anim: 'basic_attack', vfx: 'vfx.energy.hit.small', desc: 'Windgetragener Energiestoß. Pilotwert: 1 Schaden, Reichweite 2.', pilot: true },
  // Gegner (Werte identisch zu den bisherigen `damage`-Feldern, Reichweite 1 = bisheriges Angrenzen)
  'attack.rush.basic': { id: 'attack.rush.basic', speciesId: 'rush', name: 'Drängen', icon: '◆', kind: 'physical', range: 1, damage: 3, anim: 'basic_attack', vfx: 'vfx.noise.hit.small', desc: 'Stößt vorwärts, ohne zu zielen. Pilotwert: 3 Schaden, Reichweite 1.', pilot: true },
  'attack.flicker.basic': { id: 'attack.flicker.basic', speciesId: 'flicker', name: 'Flackern', icon: '✦', kind: 'energy', range: 1, damage: 2, anim: 'basic_attack', vfx: 'vfx.noise.hit.small', desc: 'Unruhiger Impuls aus dem Rauschen. Pilotwert: 2 Schaden, Reichweite 1.', pilot: true },
  'attack.brute.basic': { id: 'attack.brute.basic', speciesId: 'brute', name: 'Verdichten', icon: '⬢', kind: 'physical', range: 1, damage: 3, anim: 'basic_attack', vfx: 'vfx.noise.hit.small', desc: 'Schwerer Druckstoß. Pilotwert: 3 Schaden, Reichweite 1.', pilot: true },
};

export const basicAttackFor = (speciesId: string): BasicAttackDef => {
  const a = Object.values(BASIC_ATTACKS).find((d) => d.speciesId === speciesId);
  if (!a) throw new Error(`Kein Grundangriff für ${speciesId}`);
  return a;
};

export const basicAttackDef = (id: string): BasicAttackDef => {
  const a = BASIC_ATTACKS[id];
  if (!a) throw new Error(`Unbekannter Grundangriff: ${id}`);
  return a;
};
