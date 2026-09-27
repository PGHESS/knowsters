import type { AttributeId } from './attributes';

export type TargetKind = 'enemy' | 'ally' | 'tile' | 'self';

export interface AbilityRequirements {
  /** Mindestwerte einzelner Attribute der Weseninstanz. */
  attributes?: Partial<Record<AttributeId, number>>;
  /** Fähigkeitspunkte, die beim Lernen ausgegeben werden. */
  skillPoints?: number;
  /** Themen-ID eines Wissensnachweises im Spielerprofil (z. B. `math-percent`). */
  knowledgeProof?: string;
  /** Vorgängerfähigkeit. */
  requiresAbility?: string;
}

export interface AbilityDef {
  id: string;
  name: string;
  icon: string;
  target: TargetKind;
  range: number;
  /** Kosten in Resonanz (Signature-Fähigkeiten). 0 = frei. */
  resonanceCost: number;
  desc: string;
  requirements?: AbilityRequirements;
}

/** Die 16 Prolog-Fähigkeiten, Werte unverändert aus legacy/v22/prolog.js. */
export const ABILITIES: Record<string, AbilityDef> = {
  'lumi-insight': { id: 'lumi-insight', name: 'Klarblick', icon: '◉', target: 'enemy', range: 5, resonanceCost: 0, desc: 'Analysiert ein Ziel. Es erleidet 2 Runden lang +2 Schaden.' },
  'lumi-trace': { id: 'lumi-trace', name: 'Lichtspur', icon: '✧', target: 'tile', range: 4, resonanceCost: 0, desc: 'Markiert einen Bereich. Gegner darin werden 2 Runden lang verlangsamt.' },
  'lumi-order': { id: 'lumi-order', name: 'Ordnen', icon: '♡', target: 'ally', range: 3, resonanceCost: 0, desc: 'Heilt 3 LP und löst Festhalten.' },
  'lumi-beam': { id: 'lumi-beam', name: 'Fokusstrahl', icon: '✦', target: 'enemy', range: 4, resonanceCost: 1, desc: '3 Schaden, gegen analysierte Ziele 5. Kostet 1 Resonanz.' },

  'pyro-flame': { id: 'pyro-flame', name: 'Flammenstoß', icon: '🔥', target: 'enemy', range: 2, resonanceCost: 0, desc: '4 Schaden auf kurze Distanz.' },
  'pyro-charge': { id: 'pyro-charge', name: 'Vorwärts!', icon: '➤', target: 'tile', range: 3, resonanceCost: 0, desc: 'Stürmt auf ein freies Feld und trifft einen angrenzenden Gegner für 3 Schaden.' },
  'pyro-ignite': { id: 'pyro-ignite', name: 'Entfachen', icon: '✹', target: 'ally', range: 3, resonanceCost: 0, desc: 'Der nächste Angriff des Verbündeten verursacht +2 Schaden.' },
  'pyro-trail': {
    id: 'pyro-trail', name: 'Glutspur', icon: '♨', target: 'tile', range: 2, resonanceCost: 1,
    desc: 'Erzeugt 2 Runden lang gefährliches Gelände. Kostet 1 Resonanz.',
    requirements: { attributes: { attack: 460 }, skillPoints: 1, knowledgeProof: 'math-percent', requiresAbility: 'pyro-flame' },
  },

  'terra-stand': { id: 'terra-stand', name: 'Standhalten', icon: '◆', target: 'self', range: 0, resonanceCost: 0, desc: 'Erhält 4 Schild und kann bis zur nächsten Runde nicht verschoben werden.' },
  'terra-wall': { id: 'terra-wall', name: 'Schutzwall', icon: '▰', target: 'tile', range: 2, resonanceCost: 0, desc: 'Errichtet 2 Runden lang ein unpassierbares Hindernis.' },
  'terra-root': { id: 'terra-root', name: 'Wurzelgriff', icon: '⌁', target: 'enemy', range: 3, resonanceCost: 0, desc: 'Hält einen Gegner für seine nächste Bewegung fest.' },
  'terra-refuge': { id: 'terra-refuge', name: 'Zuflucht', icon: '⛨', target: 'self', range: 1, resonanceCost: 1, desc: 'Terra und angrenzende Verbündete erhalten 3 Schild. Kostet 1 Resonanz.' },

  'nivaro-swap': { id: 'nivaro-swap', name: 'Wechselwind', icon: '⇄', target: 'ally', range: 4, resonanceCost: 0, desc: 'Tauscht die Position mit einem Verbündeten.' },
  'nivaro-pulse': { id: 'nivaro-pulse', name: 'Impuls', icon: '⟲', target: 'enemy', range: 3, resonanceCost: 0, desc: 'Schiebt einen Gegner bis zu 2 Felder vom Tor weg.' },
  'nivaro-jump': { id: 'nivaro-jump', name: 'Sprunglinie', icon: '↗', target: 'tile', range: 4, resonanceCost: 0, desc: 'Springt auf ein sichtbares freies Feld.' },
  'nivaro-detour': { id: 'nivaro-detour', name: 'Umweg', icon: '∞', target: 'self', range: 0, resonanceCost: 1, desc: 'Alle Wächter erhalten in der nächsten Runde +1 Bewegung. Kostet 1 Resonanz.' },
};

export const abilityDef = (id: string): AbilityDef => {
  const a = ABILITIES[id];
  if (!a) throw new Error(`Unbekannte Fähigkeit: ${id}`);
  return a;
};
