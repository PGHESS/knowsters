/**
 * Eigene Fähigkeiten des Menschen (später: Fokus, Neuordnung, Resonanzimpuls, Schutzbefehl).
 * Noch leer; Struktur nach Bible §9/§13.
 */
export interface HumanAbilityDef {
  /** `human.ability.<name>` */
  id: string;
  name: string;
  desc: string;
}

export const HUMAN_ABILITIES: Record<string, HumanAbilityDef> = {};
