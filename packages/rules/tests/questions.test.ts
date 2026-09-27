import { describe, expect, it } from 'vitest';
import { examAvailable, generateExamSet, generateLogic, generateMath, generateQuestion, normalize, seededRng } from '../src';

/** Unabhängige Nachrechnung aus dem Prompt (Port von legacy/tests-v20/learning.test.cjs). */
function recompute(prompt: string): number {
  let m: RegExpMatchArray | null;
  if ((m = prompt.match(/^Wie viel ist (\d+)\/(\d+) von (\d+)\?/))) return (+m[1]! / +m[2]!) * +m[3]!;
  if ((m = prompt.match(/^Wie viel sind (\d+) % von (\d+)\?/))) return (+m[1]! / 100) * +m[2]!;
  if ((m = prompt.match(/^Ein Gegenstand kostet (\d+) Münzen\. Du erhältst (\d+) % Rabatt/))) return +m[1]! * (1 - +m[2]! / 100);
  if ((m = prompt.match(/^Finde x: (\d+) × x \+ (\d+) = (\d+)/))) return (+m[3]! - +m[2]!) / +m[1]!;
  const expression = prompt
    .replace(/ = \?$/, '')
    .replace(/(\d+) % von (\d+)/g, '($1/100*$2)')
    .replace(/(\d+)\/(\d+)/g, '($1/$2)')
    .replaceAll('×', '*')
    .replaceAll('÷', '/')
    .replaceAll('−', '-');
  if (!/^[\d\s+*\-/().]+$/.test(expression)) throw new Error(`unparsable: ${prompt}`);
  return Function(`return (${expression})`)() as number;
}
const evalAnswer = (s: string): number => (s.includes('/') ? Function(`return (${s})`)() : Number(s));

describe('generated math', () => {
  it('960 tasks recompute independently; choice items have 4 unique options with one correct value', () => {
    const rng = seededRng(42);
    let checked = 0;
    for (let level = 0; level < 8; level++)
      for (let i = 0; i < 120; i++) {
        const q = generateMath(level, rng);
        expect(q.level).toBe(level);
        expect(q.subject).toBe('math');
        expect(Math.abs(recompute(q.prompt) - evalAnswer(q.correctAnswer)), q.prompt).toBeLessThan(1e-8);
        expect(q.explanation.length).toBeGreaterThan(15);
        if (q.type === 'choice') {
          expect(q.answers).toHaveLength(4);
          expect(new Set(q.answers).size).toBe(4);
          const eq = q.answers.filter((a) => Math.abs(evalAnswer(a) - evalAnswer(q.correctAnswer)) < 1e-8);
          expect(eq).toHaveLength(1);
        } else {
          expect(q.answers).toEqual([q.correctAnswer]);
        }
        checked++;
      }
    expect(checked).toBe(960);
  });
  it('numeric answers tolerate decimal comma and spaces', () => {
    expect(normalize(' 12 ')).toBe('12');
    expect(normalize('12,5')).toBe('12.5');
    expect(normalize('012')).toBe('12');
    expect(normalize('3/5')).toBe('3/5');
  });
});

describe('logic, pools and exam sets', () => {
  it('logic items are valid on all levels', () => {
    const rng = seededRng(5);
    for (let level = 0; level < 8; level++)
      for (let i = 0; i < 25; i++) {
        const q = generateLogic(level, rng);
        expect(q.answers).toHaveLength(4);
        expect(new Set(q.answers).size).toBe(4);
        expect(q.answers).toContain(q.correctAnswer);
      }
  });
  it('pool subjects deliver shuffled legacy items; avoidPrompt is respected when possible', () => {
    const rng = seededRng(8);
    const q1 = generateQuestion('media', 2, rng);
    const q2 = generateQuestion('media', 2, rng, q1.prompt);
    expect(q1.subject).toBe('media');
    expect(q2.prompt).not.toBe(q1.prompt);
    expect(q1.answers).toContain(q1.correctAnswer);
  });
  it('exam availability: generators always, pools only with ≥5 distinct items', () => {
    expect(examAvailable('math', 5, 5)).toBe(true);
    expect(examAvailable('logic', 0, 5)).toBe(true);
    expect(examAvailable('english', 3, 5)).toBe(false);
    expect(generateExamSet('math', 7, seededRng(1), 5)).toHaveLength(5);
  });
});
