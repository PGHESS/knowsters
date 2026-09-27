/**
 * Beschwörer-Kommandos (Bible §9). Regeln liegen in `packages/rules/src/battle/engine.ts`
 * (`rally`); hier nur Existenz, Darstellung und Verfügbarkeit.
 */
export interface CommandDef {
  /** `human.command.<name>` */
  id: string;
  /** Schlüssel in der Engine. */
  rule: 'rally';
  name: string;
  icon: string;
  desc: string;
  /** Nutzungen pro Kampf. */
  usesPerBattle: number;
  /** Animationsvertrag für den Menschen. */
  anim: 'command';
  vfx: string;
}

export const COMMANDS: Record<string, CommandDef> = {
  'human.command.rally': {
    id: 'human.command.rally',
    rule: 'rally',
    name: 'Sammeln',
    icon: '⚑',
    desc: 'Das Team rückt diese Runde ein Feld weiter und erhält einen kleinen Schild (stärker mit Charisma).',
    usesPerBattle: 1,
    anim: 'command',
    vfx: 'vfx.command.rally',
  },
};

export const commandDef = (id: string): CommandDef => {
  const c = COMMANDS[id];
  if (!c) throw new Error(`Unbekanntes Kommando: ${id}`);
  return c;
};
