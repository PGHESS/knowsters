import { CURRICULUM, type QuestionItem, type SubjectId } from '@knowsters/content';
import { grantProof, type PlayerKnowledge } from './knowledge';
import { trainAttribute, type TrainResult } from './attributes';
import type { CreatureInstance } from './creature';
import type { AttributeId } from '@knowsters/content';

export const EXAM_SIZE = 5;
export const EXAM_PASS = 4;
/** Entwicklungspunkte für das gewählte Attribut nach bestandener Prüfung. */
export const EXAM_DEVELOPMENT_BONUS = 10;

export interface ExamState {
  subject: SubjectId;
  topicId: string;
  level: number;
  items: QuestionItem[];
  index: number;
  answers: { itemId: string; given: string; correct: boolean }[];
  finished: boolean;
  passed: boolean | null;
}

/** Prüfung (Auftrag §12): 5 neue Aufgaben, keine Hilfen, 4/5 = Nachweis. */
export function startExam(subject: SubjectId, level: number, items: QuestionItem[]): ExamState {
  const stage = CURRICULUM[subject][level];
  if (!stage) throw new Error(`Keine Stufe ${level} für ${subject}`);
  if (items.length < EXAM_SIZE) throw new Error(`Prüfung braucht ${EXAM_SIZE} Aufgaben, ${items.length} vorhanden`);
  const unique = new Set(items.map((i) => i.prompt));
  if (unique.size < EXAM_SIZE) throw new Error('Prüfungsaufgaben müssen unterschiedlich sein');
  return { subject, topicId: stage.id, level, items: items.slice(0, EXAM_SIZE), index: 0, answers: [], finished: false, passed: null };
}

export const currentExamItem = (exam: ExamState): QuestionItem | null => (exam.finished ? null : (exam.items[exam.index] ?? null));

export function answerExam(exam: ExamState, knowledge: PlayerKnowledge, given: string): { correct: boolean; finished: boolean; passed: boolean | null } {
  const item = currentExamItem(exam);
  if (!item) throw new Error('Prüfung ist beendet');
  const correct = normalize(given) === normalize(item.correctAnswer);
  exam.answers.push({ itemId: item.id, given, correct });
  exam.index++;
  if (exam.index >= exam.items.length) {
    exam.finished = true;
    const score = exam.answers.filter((a) => a.correct).length;
    exam.passed = score >= EXAM_PASS;
    if (exam.passed) grantProof(knowledge, exam.subject, exam.topicId);
  }
  return { correct, finished: exam.finished, passed: exam.passed };
}

export const examScore = (exam: ExamState): number => exam.answers.filter((a) => a.correct).length;

/** Antwortvergleich: Dezimalkomma, Leerzeichen und führende Nullen tolerant. */
export function normalize(value: string): string {
  const v = value.trim().replace(',', '.').replace(/\s+/g, '');
  const n = Number(v);
  if (v !== '' && Number.isFinite(n) && /^-?\d*(\.\d+)?$/.test(v)) return String(n);
  return v.toLowerCase();
}

/** Nach bestandener Prüfung: spürbare Entwicklung für das gewählte, zum Fach passende Attribut. */
export function applyExamReward(creature: CreatureInstance, attributeId: AttributeId): TrainResult {
  return trainAttribute(creature.attributes, attributeId, EXAM_DEVELOPMENT_BONUS);
}
