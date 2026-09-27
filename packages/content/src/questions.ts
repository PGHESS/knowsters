import legacyJson from './data/questions-legacy.json';
import type { SubjectId } from './curriculum';

/**
 * Contentformat für Aufgaben (Auftrag §14). Generative Aufgaben (Mathematik, Logik)
 * erzeugen zur Laufzeit Items mit demselben Format, `source: 'generator'`.
 */
export interface QuestionItem {
  id: string;
  subject: SubjectId;
  /** Stufe 0–7. */
  level: number;
  topicId: string;
  type: 'choice' | 'numeric';
  prompt: string;
  /** Bei `choice`: alle Antwortoptionen inkl. der richtigen, noch nicht gemischt. */
  answers: string[];
  correctAnswer: string;
  explanation: string;
  source: string;
  checkedAt: string | null;
  version: number;
  /** Optionale Darstellungshilfe, z. B. Bruchbalken. */
  visual?: { kind: 'fraction'; n: number; d: number };
}

export const LEGACY_QUESTIONS = legacyJson as QuestionItem[];

export const questionsFor = (subject: SubjectId, level: number): QuestionItem[] =>
  LEGACY_QUESTIONS.filter((q) => q.subject === subject && q.level === level);
