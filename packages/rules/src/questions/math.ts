import { stageOf, type QuestionItem } from '@knowsters/content';
import { randInt, shuffle, type Rng } from '../rng';

/**
 * Generative Mathematikaufgaben, Port von legacy/v22/progression.js `math(count)`.
 * Stufe 0–7 statt Zählerschwelle; Rechenwege unverändert, damit die 960-Aufgaben-Prüfung
 * (tests/questions.test.ts) weiterhin unabhängig nachrechnen kann.
 */

const gcd = (a: number, b: number): number => (b ? gcd(b, a % b) : a);
export const fraction = (n: number, d: number): string => {
  const g = gcd(Math.abs(n), d);
  return d / g === 1 ? String(n / g) : `${n / g}/${d / g}`;
};

let counter = 0;
const nextId = (level: number) => `math-gen-L${level + 1}-${(++counter).toString(36)}`;

function numericItem(level: number, prompt: string, answer: number, explanation: string, visual?: QuestionItem['visual']): QuestionItem {
  const item: QuestionItem = {
    id: nextId(level),
    subject: 'math',
    level,
    topicId: stageOf('math', level).id,
    type: 'numeric',
    prompt,
    answers: [String(answer)],
    correctAnswer: String(answer),
    explanation,
    source: 'generator',
    checkedAt: null,
    version: 1,
  };
  if (visual) item.visual = visual;
  return item;
}

function choiceItem(rng: Rng, level: number, prompt: string, answer: string, wrong: string[], explanation: string, visual?: QuestionItem['visual']): QuestionItem {
  const opts = [...new Set([answer, ...wrong])];
  let i = 1;
  while (opts.length < 4) {
    const v = String(Number(answer) + i++);
    if (!opts.includes(v)) opts.push(v);
  }
  const item: QuestionItem = {
    id: nextId(level),
    subject: 'math',
    level,
    topicId: stageOf('math', level).id,
    type: 'choice',
    prompt,
    answers: shuffle(rng, opts.slice(0, 4)),
    correctAnswer: answer,
    explanation,
    source: 'generator',
    checkedAt: null,
    version: 1,
  };
  if (visual) item.visual = visual;
  return item;
}

export function generateMath(level: number, rng: Rng): QuestionItem {
  const t = Math.max(0, Math.min(7, level));
  const v = randInt(rng, 0, 2);
  const a = randInt(rng, 3, 12);
  const b = randInt(rng, 2, 9);
  const c = randInt(rng, 2, 6);
  if (t === 0) {
    const sub = v === 1;
    const x = randInt(rng, 8, 30);
    const y = randInt(rng, 2, 8);
    return numericItem(t, `${x} ${sub ? '−' : '+'} ${y} = ?`, sub ? x - y : x + y, sub ? `Ziehe ${y} von ${x} ab: ${x} − ${y} = ${x - y}.` : `Addiere ${y} zu ${x}: ${x} + ${y} = ${x + y}.`);
  }
  if (t === 1) {
    const divide = v === 1;
    return numericItem(t, divide ? `${a * b} ÷ ${b} = ?` : `${a} × ${b} = ?`, divide ? a : a * b, `${a} × ${b} = ${a * b}. Deshalb ist ${a * b} ÷ ${b} = ${a}.`);
  }
  if (t === 2) {
    const divide = v === 1;
    return numericItem(
      t,
      divide ? `${a} + ${b * c} ÷ ${c} = ?` : `${a} + ${b} × ${c} = ?`,
      divide ? a + b : a + b * c,
      divide ? `Zuerst teilen: ${b * c} ÷ ${c} = ${b}. Dann ${a} + ${b} = ${a + b}.` : `Punkt vor Strich: ${b} × ${c} = ${b * c}. Dann ${a} + ${b * c} = ${a + b * c}.`,
    );
  }
  if (t === 3) {
    return numericItem(t, `(${a} + ${b}) × ${c} = ?`, (a + b) * c, `Zuerst die Klammer: ${a} + ${b} = ${a + b}. Dann ${a + b} × ${c} = ${(a + b) * c}.`);
  }
  if (t === 4) {
    const d = randInt(rng, 3, 10);
    const n = randInt(rng, 1, d - 1);
    if (v === 0) {
      const whole = d * randInt(rng, 2, 8);
      return numericItem(t, `Wie viel ist ${n}/${d} von ${whole}?`, (whole / d) * n, `Teile ${whole} in ${d} gleiche Teile: ${whole / d} je Teil. Nimm ${n} davon: ${(whole / d) * n}.`, { kind: 'fraction', n, d });
    }
    if (v === 1) {
      const answer = fraction(n + 1, d);
      return choiceItem(rng, t, `${n}/${d} + 1/${d} = ?`, answer, [fraction(n, d), fraction(n + 2, d), fraction(n + 1, d * 2)], `Gleicher Nenner: Addiere die Zähler. (${n} + 1)/${d} = ${answer}.`, { kind: 'fraction', n, d });
    }
    const answer = fraction(n, d * c);
    return choiceItem(rng, t, `${n}/${d} ÷ ${c} = ?`, answer, [fraction(n * c, d), fraction(n, d + c), fraction(n + 1, d * c)], `Beim Teilen durch ${c} wird jeder Anteil ${c}-mal kleiner: ${n}/(${d} × ${c}) = ${answer}.`);
  }
  if (t === 5) {
    const pct = [10, 20, 25, 50, 75][randInt(rng, 0, 4)] as number;
    const base = randInt(rng, 2, 15) * 20;
    const val = (base * pct) / 100;
    return numericItem(
      t,
      v === 1 ? `Ein Gegenstand kostet ${base} Münzen. Du erhältst ${pct} % Rabatt. Was zahlst du?` : `Wie viel sind ${pct} % von ${base}?`,
      v === 1 ? base - val : val,
      `${pct} % bedeutet ${pct}/100. ${base} × ${pct} ÷ 100 = ${val}.${v === 1 ? ` Nach dem Rabatt: ${base} − ${val} = ${base - val}.` : ''}`,
    );
  }
  if (t === 6) {
    if (v === 0) return numericItem(t, `(${a * b} ÷ ${b} + ${c}) × ${b} = ?`, (a + c) * b, `In der Klammer zuerst teilen: ${a * b} ÷ ${b} = ${a}. Danach ${a} + ${c} = ${a + c}. Zuletzt mal ${b}: ${(a + c) * b}.`);
    const base = 20 * randInt(rng, 2, 10);
    const pct = [10, 25, 50][randInt(rng, 0, 2)] as number;
    const part = (base * pct) / 100;
    return numericItem(t, `${pct} % von ${base} + (${a} × ${c}) = ?`, part + a * c, `${pct} % von ${base} sind ${part}. Die Klammer ergibt ${a * c}. Zusammen: ${part + a * c}.`);
  }
  const x = randInt(rng, 2, 20);
  const coef = randInt(rng, 2, 9);
  const offset = randInt(rng, 2, 15);
  const right = coef * x + offset;
  return numericItem(t, `Finde x: ${coef} × x + ${offset} = ${right}`, x, `Ziehe zuerst ${offset} ab: ${right - offset}. Teile dann durch ${coef}: x = ${x}.`);
}
