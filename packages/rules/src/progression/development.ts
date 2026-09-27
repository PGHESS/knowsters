import { SUBJECTS, type AttributeId, type SubjectId } from '@knowsters/content';
import type { CreatureInstance } from './creature';
import { trainAttribute, type TrainResult } from './attributes';
import { recordCorrect, type PlayerKnowledge } from './knowledge';

export const BASE_DEVELOPMENT = 2;

/**
 * Farming-Schutz (Auftrag §13): Entwicklung hängt davon ab, wie die Aufgabenstufe zur
 * nachgewiesenen Kompetenz (peakLevel) des Spielers steht.
 *  - Stufe ≥ peakLevel      → voller Wert (2)
 *  - Stufe = peakLevel − 1  → halber Wert (1)
 *  - darunter               → 0 (nur Übung)
 */
export function developmentFor(taskLevel: number, peakLevel: number): number {
  if (taskLevel >= peakLevel) return BASE_DEVELOPMENT;
  if (taskLevel === peakLevel - 1) return Math.floor(BASE_DEVELOPMENT / 2);
  return 0;
}

export const validTrainingAttributes = (subject: SubjectId): readonly AttributeId[] => SUBJECTS[subject].attributes;

export function defaultTrainingAttribute(subject: SubjectId, creature: CreatureInstance): AttributeId {
  const candidates = validTrainingAttributes(subject);
  let best: AttributeId = candidates[0] ?? 'focus';
  for (const id of candidates) if (creature.attributes[id].potential > creature.attributes[best].potential) best = id;
  return best;
}

export interface LearningAward {
  development: number;
  attribute: TrainResult | null;
  levelUp: boolean;
  /** true, wenn die Aufgabe deutlich unter Kompetenz lag und nur als Übung zählt. */
  practiceOnly: boolean;
}

/** Richtige Übungsaufgabe: Wissen beim Spieler, Entwicklung beim Wesen. */
export function awardLearning(
  creature: CreatureInstance,
  knowledge: PlayerKnowledge,
  subject: SubjectId,
  topicId: string,
  taskLevel: number,
  attributeId: AttributeId,
): LearningAward {
  const peak = knowledge.subjects[subject].peakLevel;
  const development = developmentFor(taskLevel, peak);
  const { levelUp } = recordCorrect(knowledge, subject, topicId);
  const target = validTrainingAttributes(subject).includes(attributeId) ? attributeId : defaultTrainingAttribute(subject, creature);
  const attribute = development > 0 ? trainAttribute(creature.attributes, target, development) : null;
  return { development, attribute, levelUp, practiceOnly: development === 0 };
}
