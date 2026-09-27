/**
 * Passive Eigenschaften von Wesen (Struktur nach Bible §13). Noch keine Einträge im Slice;
 * die Registry existiert, damit Regeln und Renderer denselben Vertrag kennen.
 */
export interface PassiveDef {
  /** `passive.<species>.<name>` */
  id: string;
  name: string;
  desc: string;
  /** Regelhaken, den `packages/rules` auswertet (z. B. 'onRoundStart', 'onHit'). */
  hook: 'onRoundStart' | 'onHit' | 'onDamageDealt' | 'onMove';
}

export const PASSIVES: Record<string, PassiveDef> = {};
