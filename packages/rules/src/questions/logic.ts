import { stageOf, type QuestionItem } from '@knowsters/content';
import { randInt, shuffle, type Rng } from '../rng';

let counter = 0;
const make = (rng: Rng, level: number, prompt: string, answer: string, wrong: string[], explanation: string): QuestionItem => {
  const opts = [...new Set([answer, ...wrong])];
  let i = 1;
  while (opts.length < 4) {
    const v = String(Number(answer) + i++);
    if (!opts.includes(v)) opts.push(v);
  }
  return {
    id: `logic-gen-L${level + 1}-${(++counter).toString(36)}`,
    subject: 'logic',
    level,
    topicId: stageOf('logic', level).id,
    type: 'choice',
    prompt,
    answers: shuffle(rng, opts.slice(0, 4)),
    correctAnswer: answer,
    explanation,
    source: 'generator',
    checkedAt: null,
    version: 1,
  };
};
const num = (rng: Rng, level: number, prompt: string, answer: number, explanation: string) =>
  make(rng, level, prompt, String(answer), [String(answer + 1), String(answer - 1), String(answer + 3)], explanation);

/** Port von legacy/v22/progression.js `logic(count)`. */
export function generateLogic(level: number, rng: Rng): QuestionItem {
  const t = Math.max(0, Math.min(7, level));
  const a = randInt(rng, 2, 9);
  const b = randInt(rng, 2, 6);
  if (t === 0) return num(rng, t, `Wie geht die Reihe weiter? ${a}, ${a + b}, ${a + 2 * b}, ?`, a + 3 * b, `Jedes Mal kommen ${b} dazu. ${a + 2 * b} + ${b} = ${a + 3 * b}.`);
  if (t === 1) return num(rng, t, `Die Regel wechselt. ${a}, ${a + 2}, ${a + 5}, ${a + 7}, ?`, a + 10, 'Die Schritte wechseln zwischen +2 und +3. Als Nächstes kommt +3.');
  if (t === 2) return num(rng, t, `Welche Zahl folgt? ${a}, ${a * 2}, ${a * 4}, ?`, a * 8, 'Jede Zahl wird verdoppelt. Multipliziere die letzte Zahl mit 2.');
  if (t === 3) {
    const dirs = ['Norden', 'Osten', 'Süden', 'Westen'];
    const start = randInt(rng, 0, 3);
    const right = randInt(rng, 1, 3);
    const answer = dirs[(start + right) % 4] as string;
    return make(rng, t, `Du schaust nach ${dirs[start]} und drehst dich ${right}-mal um 90° nach rechts. Wohin schaust du?`, answer, dirs.filter((x) => x !== answer), `Eine Rechtsdrehung folgt dieser Reihenfolge: Norden → Osten → Süden → Westen. Gehe ${right} Schritte ab ${dirs[start]} weiter.`);
  }
  if (t === 4) {
    const names = ['Lumo', 'Mika', 'Runa', 'Taro', 'Suri', 'Nilo'];
    const name = names[randInt(rng, 0, 5)] as string;
    const groups = [['Quellgeister', 'schwimmen', 'Quellgeist'], ['Waldhüter', 'klettern', 'Waldhüter'], ['Glutfüchse', 'Feuer spüren', 'Glutfuchs']][randInt(rng, 0, 2)] as string[];
    return make(rng, t, `Alle ${groups[0]} können ${groups[1]}. ${name} ist ein ${groups[2]}. Was folgt sicher?`, `${name} kann ${groups[1]}.`, [`Nur ${name} kann ${groups[1]}.`, `${name} kann nicht ${groups[1]}.`, `${name} ist das einzige Wesen im Wald.`], `Die Regel gilt für alle ${groups[0]} und damit auch für ${name}. Eine Aussage über andere Wesen folgt daraus nicht.`);
  }
  if (t === 5) {
    const order = shuffle(rng, ['Lumi', 'Pyro', 'Terra']);
    return make(rng, t, `${order[0]} kommt vor ${order[1]}. ${order[2]} kommt nach ${order[1]}. Wer kommt als Zweites?`, order[1] as string, [order[0] as string, order[2] as string, 'Nicht bestimmbar'], `Die Reihenfolge ist ${order.join(' → ')}.`);
  }
  if (t === 6) {
    const kinds = randInt(rng, 2, 5);
    const colors = randInt(rng, 2, 5);
    return num(rng, t, `Du hast ${kinds} verschiedene Umhänge und ${colors} verschiedene Abzeichen. Wie viele Kombinationen aus je einem Umhang und einem Abzeichen gibt es?`, kinds * colors, `Zu jedem der ${kinds} Umhänge passen ${colors} Abzeichen. Also ${kinds} × ${colors} = ${kinds * colors}.`);
  }
  const conditions = [
    ['die Laterne leuchtet', 'jemand im Turm ist', 'Niemand ist im Turm.', 'Die Laterne leuchtet nicht.'],
    ['das Tor offen ist', 'die Glocke läutet', 'Die Glocke läutet nicht.', 'Das Tor ist nicht offen.'],
    ['die Quelle warm ist', 'der Kristall leuchtet', 'Der Kristall leuchtet nicht.', 'Die Quelle ist nicht warm.'],
  ][randInt(rng, 0, 2)] as string[];
  return make(rng, t, `Es gilt: Wenn ${conditions[0]}, dann gilt, dass ${conditions[1]}. ${conditions[2]} Was folgt sicher?`, conditions[3] as string, ['Die Regel hat keine Bedeutung.', 'Beide Bedingungen sind trotzdem erfüllt.', 'Die umgekehrte Regel gilt immer.'], 'Wäre die erste Bedingung erfüllt, müsste auch die zweite erfüllt sein. Da die zweite nicht erfüllt ist, kann auch die erste nicht erfüllt sein.');
}
