/**
 * Die zehn Wesenattribute, das Potenzialmodell und die datengetriebene Ableitung
 * kleiner Kampfmodifikatoren. Nur Daten – keine Regeln.
 */
export type AttributeId =
  | 'vitality'
  | 'attack'
  | 'defense'
  | 'initiative'
  | 'agility'
  | 'resonance'
  | 'focus'
  | 'charisma'
  | 'intuition'
  | 'willpower';

export const ATTRIBUTE_ORDER: readonly AttributeId[] = [
  'vitality',
  'attack',
  'defense',
  'initiative',
  'agility',
  'resonance',
  'focus',
  'charisma',
  'intuition',
  'willpower',
];

export const ATTRIBUTE_DEFS: Record<AttributeId, { label: string; short: string; hint: string }> = {
  vitality: { label: 'Vitalität', short: 'LP', hint: 'Lebenspunkte im Kampf' },
  attack: { label: 'Angriff', short: 'ANG', hint: 'Offensiver Bonus auf Schadensfähigkeiten' },
  defense: { label: 'Abwehr', short: 'ABW', hint: 'Zusätzlicher Schild bei Schutzfähigkeiten' },
  initiative: { label: 'Initiative', short: 'INI', hint: 'Zugreihenfolge (Initiative-Modus)' },
  agility: { label: 'Beweglichkeit', short: 'BEW', hint: 'Zusätzliche Bewegung' },
  resonance: { label: 'Mana / Resonanz', short: 'RES', hint: 'Ressource für Signature-Fähigkeiten' },
  focus: { label: 'Fokus', short: 'FOK', hint: 'Längere Kontrolle (Analyse, Wurzeln, Spuren)' },
  charisma: { label: 'Charisma', short: 'CHA', hint: 'Stärkerer Beschwörer-Befehl' },
  intuition: { label: 'Intuition', short: 'INT', hint: 'Hinweise und Entdeckungen' },
  willpower: { label: 'Willenskraft', short: 'WIL', hint: 'Widerstand gegen Statuseffekte' },
};

export const POTENTIAL_TOTAL = 8000;
export const ATTRIBUTE_MAX = 999;
export const ATTRIBUTE_MIN_POTENTIAL = 500;

/** Entwicklungskosten für +1 sichtbaren Punkt, abhängig vom aktuellen Wert (obere Grenze exklusiv). */
export const DEVELOPMENT_COST_TABLE: readonly (readonly [upperBound: number, cost: number])[] = [
  [250, 2],
  [500, 3],
  [700, 4],
  [850, 5],
  [950, 6],
  [Infinity, 8],
];

export type DerivedStatId =
  | 'hpBonus'
  | 'attackBonus'
  | 'shieldBonus'
  | 'moveBonus'
  | 'resonance'
  | 'controlBonus'
  | 'commandBonus'
  | 'insight'
  | 'statusResist';

/**
 * Arbeitsmapping (Auftrag §10). Jede Stufe: ab Attributwert `from` gilt `bonus`.
 * Die Werte sind bewusst klein, damit 0–999 nicht direkt in Kampfzahlen kippt.
 */
export const COMBAT_DERIVATION: Record<DerivedStatId, { attribute: AttributeId; steps: readonly (readonly [from: number, bonus: number])[] }> = {
  hpBonus: { attribute: 'vitality', steps: [[400, 1], [600, 2], [800, 3], [950, 4]] },
  attackBonus: { attribute: 'attack', steps: [[550, 1], [800, 2], [950, 3]] },
  shieldBonus: { attribute: 'defense', steps: [[550, 1], [800, 2], [950, 3]] },
  moveBonus: { attribute: 'agility', steps: [[700, 1], [950, 2]] },
  resonance: { attribute: 'resonance', steps: [[0, 1], [500, 2], [800, 3]] },
  controlBonus: { attribute: 'focus', steps: [[600, 1], [900, 2]] },
  commandBonus: { attribute: 'charisma', steps: [[500, 1], [850, 2]] },
  insight: { attribute: 'intuition', steps: [[500, 1], [850, 2]] },
  statusResist: { attribute: 'willpower', steps: [[600, 1], [900, 2]] },
};
