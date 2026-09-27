import { questionsFor, type QuestionItem, type SubjectId } from '@knowsters/content';
import { randInt, shuffle, type Rng } from '../rng';
import { generateLogic } from './logic';
import { generateMath } from './math';

/** Ein Item für Fach/Stufe; generativ (Mathe, Logik) oder aus den Fragenpools. */
export function generateQuestion(subject: SubjectId, level: number, rng: Rng, avoidPrompt: string | null = null): QuestionItem {
  const gen = subject === 'math' ? generateMath : subject === 'logic' ? generateLogic : null;
  if (gen) {
    let q = gen(level, rng);
    for (let i = 0; i < 8 && q.prompt === avoidPrompt; i++) q = gen(level, rng);
    return q;
  }
  const pool = questionsFor(subject, level);
  if (!pool.length) throw new Error(`Keine Aufgaben für ${subject} Stufe ${level + 1}`);
  const candidates = pool.filter((q) => q.prompt !== avoidPrompt);
  const pick = (candidates.length ? candidates : pool)[randInt(rng, 0, (candidates.length ? candidates : pool).length - 1)] as QuestionItem;
  return { ...pick, answers: shuffle(rng, pick.answers) };
}

/** Prüfungsset: n unterschiedliche Items derselben Stufe. Generatoren liefern beliebig viele. */
export function generateExamSet(subject: SubjectId, level: number, rng: Rng, n: number): QuestionItem[] {
  const out: QuestionItem[] = [];
  const seen = new Set<string>();
  for (let guard = 0; guard < n * 20 && out.length < n; guard++) {
    const q = generateQuestion(subject, level, rng);
    if (seen.has(q.prompt)) continue;
    seen.add(q.prompt);
    out.push(q);
  }
  return out;
}

/** Ob für Fach/Stufe genug unterschiedliche Aufgaben für eine Prüfung existieren. */
export function examAvailable(subject: SubjectId, level: number, n: number): boolean {
  if (subject === 'math' || subject === 'logic') return true;
  return new Set(questionsFor(subject, level).map((q) => q.prompt)).size >= n;
}
