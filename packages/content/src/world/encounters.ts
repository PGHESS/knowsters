import type { Cell } from './boards';

export type Objective =
  | { type: 'holdGate'; rounds: number; maxEscapes: number }
  | { type: 'defeatAll'; maxRounds: number };

export interface UnitPlacement extends Cell {
  /** Wächter-Species-ID (Team) oder Gegner-Species-ID. */
  species: string;
}

export interface TutorialHint {
  unit: string | null;
  title: string;
  text: string;
}

export interface EncounterDef {
  id: string;
  title: string;
  boardId: string;
  objective: Objective;
  /** Startaufstellung der Wächter (Reihenfolge = Zugreihenfolge im Seiten-Modus). */
  team: readonly UnitPlacement[];
  enemies: readonly UnitPlacement[];
  /** Zusätzliche Gegner je Rundenbeginn. */
  spawns: Readonly<Record<number, readonly UnitPlacement[]>>;
  tutorial: Readonly<Record<number, TutorialHint>>;
  intro: string;
  victory: string;
  defeat: string;
  /** Belohnung: Fähigkeitspunkte für jedes Teammitglied. */
  rewardSkillPoints: number;
}

export const ENCOUNTER_PROLOG: EncounterDef = {
  id: 'prolog-bridge',
  title: 'Die letzte Brücke',
  boardId: 'bridge-6x7',
  objective: { type: 'holdGate', rounds: 6, maxEscapes: 3 },
  team: [
    { species: 'lumi', x: 0, y: 4 },
    { species: 'pyro', x: 2, y: 3 },
    { species: 'terra', x: 3, y: 4 },
    { species: 'nivaro', x: 5, y: 4 },
  ],
  enemies: [
    { species: 'rush', x: 1, y: 0 },
    { species: 'rush', x: 2, y: 0 },
    { species: 'rush', x: 4, y: 0 },
  ],
  spawns: {
    2: [{ species: 'rush', x: 1, y: 0 }, { species: 'flicker', x: 2, y: 1 }],
    3: [{ species: 'brute', x: 3, y: 0 }],
    4: [{ species: 'rush', x: 0, y: 0 }, { species: 'flicker', x: 5, y: 0 }],
    5: [{ species: 'rush', x: 2, y: 0 }],
    6: [{ species: 'flicker', x: 4, y: 0 }],
  },
  tutorial: {
    1: { unit: 'pyro', title: 'Tempo verändert eine Lage.', text: 'Pyro kann mit „Vorwärts!“ die erste Linie erreichen, bevor sie das Tor bedroht.' },
    2: { unit: 'terra', title: 'Schutz ist eine Handlung.', text: 'Terra kann mit einem Schutzwall einen Durchgang verändern – ohne einen Gegner besiegen zu müssen.' },
    3: { unit: 'nivaro', title: 'Position ist Macht.', text: 'Nivaro kann einen Gegner mit „Impuls“ vom Tor wegschieben.' },
    4: { unit: 'lumi', title: 'Erst verstehen, dann handeln.', text: 'Der Verdichter ist zäh. Lumis „Klarblick“ macht seine Schwachstelle sichtbar.' },
    5: { unit: null, title: 'Jetzt gehört die Brücke euch.', text: 'Kombiniert Bewegung, Schutz, Analyse und Angriff. Es gibt nicht nur eine richtige Zugfolge.' },
    6: { unit: null, title: 'Eine letzte Runde.', text: 'Haltet die Linie. Weniger als drei Gegner dürfen das Tor erreichen.' },
  },
  intro: 'Die Brücke darf nicht fallen. Sechs Runden – und keine Stärke reicht allein.',
  victory: 'Die sechste Runde endet. Die Brücke hält.',
  defeat: 'Die Linie ist gebrochen. Probiert eine andere Kombination aus Schutz, Bewegung, Analyse und Angriff.',
  rewardSkillPoints: 1,
};

export const ENCOUNTER_WORKSHOP: EncounterDef = {
  id: 'workshop-flicker',
  title: 'Das Flimmern in der Werkhalle',
  boardId: 'workshop-6x7',
  objective: { type: 'defeatAll', maxRounds: 8 },
  team: [
    { species: 'lumi', x: 0, y: 5 },
    { species: 'pyro', x: 2, y: 4 },
    { species: 'terra', x: 3, y: 5 },
    { species: 'nivaro', x: 5, y: 5 },
  ],
  enemies: [
    { species: 'flicker', x: 1, y: 0 },
    { species: 'rush', x: 3, y: 1 },
    { species: 'flicker', x: 4, y: 0 },
  ],
  spawns: {
    3: [{ species: 'brute', x: 2, y: 0 }],
  },
  tutorial: {
    1: { unit: 'pyro', title: 'Das Flimmern hat einen Ursprung.', text: 'Die Flimmerer weichen aus. Wer zuerst die Deckung nutzt, bestimmt die Reihenfolge.' },
    3: { unit: 'lumi', title: 'Etwas Schweres kommt.', text: 'Ein Verdichter betritt die Halle. Analyse vor Angriff spart Runden.' },
  },
  intro: 'In der Werkhalle flackern die Lichtfugen. Drei Wesen des Rauschens treiben zwischen den Maschinen.',
  victory: 'Die Halle wird still. Die Lichtfugen leuchten wieder gleichmäßig.',
  defeat: 'Das Flimmern bleibt. Ihr zieht euch auf den Platz zurück und versucht es erneut.',
  rewardSkillPoints: 1,
};

/** 3D-Pilot (Auftrag Phase C): 1 Mensch + Pyro + 1 Gegner, 6×7 Werkhalle. */
export const ENCOUNTER_PILOT_3D: EncounterDef = {
  id: 'pilot-3d',
  title: '3D-Pilot · Werkhalle',
  boardId: 'workshop-6x7',
  objective: { type: 'defeatAll', maxRounds: 10 },
  team: [{ species: 'pyro', x: 2, y: 4 }],
  enemies: [{ species: 'rush', x: 3, y: 1 }],
  spawns: {},
  tutorial: { 1: { unit: 'pyro', title: 'Pilot.', text: 'Bewegen, Grundangriff, Glutspur, Sammeln – alles über den Regelkern.' } },
  intro: 'Pilot-Arena. Ein Dränger zwischen den Maschinen.',
  victory: 'Pilot bestanden: der Dränger ist gebannt.',
  defeat: 'Der Dränger hält die Halle.',
  rewardSkillPoints: 0,
};

export const ENCOUNTERS: Record<string, EncounterDef> = {
  [ENCOUNTER_PILOT_3D.id]: ENCOUNTER_PILOT_3D,
  [ENCOUNTER_PROLOG.id]: ENCOUNTER_PROLOG,
  [ENCOUNTER_WORKSHOP.id]: ENCOUNTER_WORKSHOP,
};

export const encounterDef = (id: string): EncounterDef => {
  const e = ENCOUNTERS[id];
  if (!e) throw new Error(`Unbekannter Encounter: ${id}`);
  return e;
};
