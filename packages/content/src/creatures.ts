import type { AttributeId } from './attributes';

export type AttributeTemplate = Record<AttributeId, number>;

export interface GuardianSpecies {
  kind: 'guardian';
  id: string;
  name: string;
  title: string;
  role: string;
  trait: string;
  about: string;
  element: 'light' | 'fire' | 'earth' | 'wind';
  accent: string;
  /** Basiswerte aus dem Prolog; die Attribute addieren nur kleine Boni. */
  baseHp: number;
  baseMove: number;
  /** Vier Fähigkeiten in fester Reihenfolge; die vierte ist die Signature-Fähigkeit. */
  abilities: readonly [string, string, string, string];
  /** Von Anfang an beherrschte Fähigkeiten. */
  innate: readonly string[];
  potentialTemplate: AttributeTemplate;
  startTemplate: AttributeTemplate;
  /** Asset-Schlüssel (apps/game/public/assets/creatures/<sprite>.png). */
  sprite: string;
}

export interface EnemySpecies {
  kind: 'enemy';
  id: string;
  name: string;
  about: string;
  maxHp: number;
  damage: number;
  move: number;
  /** Feste Initiative für den Initiative-Modus. */
  initiative: number;
  icon: string;
  sprite: string;
}

export const GUARDIANS: Record<string, GuardianSpecies> = {
  lumi: {
    kind: 'guardian', id: 'lumi', name: 'Lumi', title: 'Hüterin des klaren Lichts', role: 'Aufklärung · Kontrolle',
    trait: 'ruhig · neugierig · analytisch', about: 'Lumi prüft erst, bevor sie handelt. Sie macht Muster und Schwachstellen sichtbar.',
    element: 'light', accent: '#e9c76d', baseHp: 8, baseMove: 2,
    abilities: ['lumi-insight', 'lumi-trace', 'lumi-order', 'lumi-beam'], innate: ['lumi-insight', 'lumi-trace', 'lumi-order', 'lumi-beam'],
    potentialTemplate: { vitality: 700, attack: 720, defense: 740, initiative: 860, agility: 780, resonance: 900, focus: 990, charisma: 780, intuition: 940, willpower: 590 },
    startTemplate: { vitality: 330, attack: 340, defense: 350, initiative: 420, agility: 380, resonance: 430, focus: 460, charisma: 370, intuition: 440, willpower: 330 },
    sprite: 'lumi',
  },
  pyro: {
    kind: 'guardian', id: 'pyro', name: 'Pyro', title: 'Wächter der Glut', role: 'Angriff · Durchbruch',
    trait: 'temperamentvoll · direkt · mutig', about: 'Pyro handelt entschlossen. Seine Stärke ist Tempo – nicht gedankenloser Angriff.',
    element: 'fire', accent: '#ff7f45', baseHp: 9, baseMove: 3,
    abilities: ['pyro-flame', 'pyro-charge', 'pyro-ignite', 'pyro-trail'], innate: ['pyro-flame', 'pyro-charge', 'pyro-ignite'],
    potentialTemplate: { vitality: 760, attack: 980, defense: 660, initiative: 900, agility: 900, resonance: 820, focus: 730, charisma: 650, intuition: 720, willpower: 880 },
    startTemplate: { vitality: 330, attack: 450, defense: 290, initiative: 430, agility: 440, resonance: 390, focus: 350, charisma: 320, intuition: 340, willpower: 390 },
    sprite: 'pyro',
  },
  terra: {
    kind: 'guardian', id: 'terra', name: 'Terra', title: 'Hüterin des ruhenden Steins', role: 'Schutz · Raumkontrolle',
    trait: 'geduldig · freundlich · standhaft', about: 'Terra bestimmt, wo gekämpft wird. Geduld ist bei ihr eine aktive Stärke.',
    element: 'earth', accent: '#6fe48c', baseHp: 12, baseMove: 1,
    abilities: ['terra-stand', 'terra-wall', 'terra-root', 'terra-refuge'], innate: ['terra-stand', 'terra-wall', 'terra-root', 'terra-refuge'],
    potentialTemplate: { vitality: 950, attack: 680, defense: 990, initiative: 620, agility: 650, resonance: 760, focus: 820, charisma: 800, intuition: 790, willpower: 940 },
    startTemplate: { vitality: 430, attack: 300, defense: 450, initiative: 270, agility: 300, resonance: 340, focus: 380, charisma: 360, intuition: 340, willpower: 410 },
    sprite: 'terra',
  },
  nivaro: {
    kind: 'guardian', id: 'nivaro', name: 'Nivaro', title: 'Wächter der offenen Wege', role: 'Bewegung · Manipulation',
    trait: 'kreativ · wach · unkonventionell', about: 'Nivaro sucht nicht nach dem offensichtlichsten Weg, sondern nach einem weiteren.',
    element: 'wind', accent: '#55c8ff', baseHp: 8, baseMove: 3,
    abilities: ['nivaro-swap', 'nivaro-pulse', 'nivaro-jump', 'nivaro-detour'], innate: ['nivaro-swap', 'nivaro-pulse', 'nivaro-jump', 'nivaro-detour'],
    potentialTemplate: { vitality: 720, attack: 700, defense: 640, initiative: 960, agility: 990, resonance: 800, focus: 760, charisma: 820, intuition: 880, willpower: 730 },
    startTemplate: { vitality: 330, attack: 330, defense: 300, initiative: 460, agility: 470, resonance: 380, focus: 360, charisma: 390, intuition: 420, willpower: 350 },
    sprite: 'nivaro',
  },
};

export const ENEMIES: Record<string, EnemySpecies> = {
  rush: { kind: 'enemy', id: 'rush', name: 'Dränger', about: 'Ein vom Rauschen getriebenes Wesen. Es kennt nur noch eine Richtung.', maxHp: 5, damage: 3, move: 2, initiative: 480, icon: '◆', sprite: 'enemy-rush' },
  flicker: { kind: 'enemy', id: 'flicker', name: 'Flimmerer', about: 'Unruhig und schwer zu lesen.', maxHp: 6, damage: 2, move: 1, initiative: 700, icon: '✦', sprite: 'enemy-flicker' },
  brute: { kind: 'enemy', id: 'brute', name: 'Verdichter', about: 'Eine schwere Verdichtung des Rauschens. Direkte Angriffe allein reichen selten.', maxHp: 9, damage: 3, move: 1, initiative: 240, icon: '⬢', sprite: 'enemy-brute' },
};

export const GUARDIAN_ORDER: readonly string[] = ['lumi', 'pyro', 'terra', 'nivaro'];

export const guardianDef = (id: string): GuardianSpecies => {
  const g = GUARDIANS[id];
  if (!g) throw new Error(`Unbekannter Wächter: ${id}`);
  return g;
};
export const enemyDef = (id: string): EnemySpecies => {
  const e = ENEMIES[id];
  if (!e) throw new Error(`Unbekannter Gegner: ${id}`);
  return e;
};
