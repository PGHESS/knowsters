import {
  ATTRIBUTE_MAX,
  ATTRIBUTE_MIN_POTENTIAL,
  ATTRIBUTE_ORDER,
  COMBAT_DERIVATION,
  DEVELOPMENT_COST_TABLE,
  POTENTIAL_TOTAL,
  type AttributeId,
  type AttributeTemplate,
  type DerivedStatId,
} from '@knowsters/content';
import { type Rng, defaultRng } from '../rng';

export interface AttributeState {
  value: number;
  /** Entwicklungsfortschritt bis zum nächsten sichtbaren Punkt. */
  progress: number;
  /** Individuelles Maximum dieser Instanz. */
  potential: number;
}

export type AttributeSet = Record<AttributeId, AttributeState>;

/**
 * Verteilt das Potenzial einer Instanz: Template ± Verschiebungen, Summe bleibt exakt 8.000,
 * kein Wert über 999 oder unter 500. 8 % Chance auf ein atypisches Individuum.
 * Port von legacy/v22/progression.js `createPotential`.
 */
export function createPotential(template: AttributeTemplate, rng: Rng = defaultRng): AttributeTemplate {
  const out: AttributeTemplate = { ...template };
  const transfer = (from: AttributeId, to: AttributeId, amount: number) => {
    const room = ATTRIBUTE_MAX - out[to];
    const available = out[from] - ATTRIBUTE_MIN_POTENTIAL;
    const move = Math.max(0, Math.min(amount, room, available));
    out[from] -= move;
    out[to] += move;
  };
  for (let i = 0; i < 18; i++) {
    const from = ATTRIBUTE_ORDER[Math.floor(rng() * 10)] as AttributeId;
    const to = ATTRIBUTE_ORDER[Math.floor(rng() * 10)] as AttributeId;
    if (from === to) continue;
    transfer(from, to, 5 + Math.floor(rng() * 26));
  }
  if (rng() < 0.08) {
    const to = ATTRIBUTE_ORDER[Math.floor(rng() * 10)] as AttributeId;
    for (let i = 0; i < 8 && out[to] < 930; i++) {
      const from = ATTRIBUTE_ORDER[Math.floor(rng() * 10)] as AttributeId;
      if (from !== to) transfer(from, to, 18 + Math.floor(rng() * 25));
    }
  }
  return out;
}

export const potentialTotal = (p: AttributeTemplate): number => ATTRIBUTE_ORDER.reduce((s, id) => s + p[id], 0);

export function createAttributes(potentialTemplate: AttributeTemplate, startTemplate: AttributeTemplate, rng: Rng = defaultRng): AttributeSet {
  const potential = createPotential(potentialTemplate, rng);
  if (potentialTotal(potential) !== POTENTIAL_TOTAL) throw new Error('Potenzialsumme verletzt');
  const out = {} as AttributeSet;
  for (const id of ATTRIBUTE_ORDER) {
    out[id] = { value: Math.min(potential[id], startTemplate[id]), progress: 0, potential: potential[id] };
  }
  return out;
}

export function attributeCost(value: number): number {
  for (const [bound, cost] of DEVELOPMENT_COST_TABLE) if (value < bound) return cost;
  return 8;
}

export interface TrainResult {
  attributeId: AttributeId;
  development: number;
  before: number;
  after: number;
  progress: number;
  needed: number;
  levels: number;
  capped: boolean;
}

/** Fügt Entwicklungspunkte hinzu und wandelt sie nach Kostentabelle in sichtbare Punkte. */
export function trainAttribute(attributes: AttributeSet, attributeId: AttributeId, amount: number): TrainResult {
  const a = attributes[attributeId];
  const before = a.value;
  const development = Math.max(0, Math.floor(amount));
  if (a.value >= a.potential) {
    return { attributeId, development: 0, before, after: a.value, progress: 0, needed: 0, levels: 0, capped: true };
  }
  a.progress += development;
  let levels = 0;
  while (a.value < a.potential) {
    const need = attributeCost(a.value);
    if (a.progress < need) break;
    a.progress -= need;
    a.value++;
    levels++;
  }
  const capped = a.value >= a.potential;
  if (capped) a.progress = 0;
  return { attributeId, development, before, after: a.value, progress: a.progress, needed: capped ? 0 : attributeCost(a.value), levels, capped };
}

export type DerivedStats = Record<DerivedStatId, number> & { initiative: number };

/** Datengetriebene Ableitung kleiner Kampfmodifikatoren aus den zehn Attributen. */
export function deriveStats(attributes: AttributeSet): DerivedStats {
  const out = { initiative: attributes.initiative.value } as DerivedStats;
  for (const [stat, rule] of Object.entries(COMBAT_DERIVATION) as [DerivedStatId, (typeof COMBAT_DERIVATION)[DerivedStatId]][]) {
    const value = attributes[rule.attribute].value;
    let bonus = 0;
    for (const [from, b] of rule.steps) if (value >= from) bonus = b;
    out[stat] = bonus;
  }
  return out;
}
