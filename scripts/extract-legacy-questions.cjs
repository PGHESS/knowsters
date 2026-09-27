/*
 * Extrahiert Curriculum, Domänen, Altersbänder und die handgeschriebenen Fragenbanken
 * aus legacy/v22/progression.js in JSON-Dateien unter packages/content/src/data/.
 *
 * Reproduzierbar: `npm run extract:legacy-questions`. Die JSON-Dateien sind eingecheckt,
 * damit der Content ohne den Legacy-Code lesbar und redaktionell prüfbar ist.
 */
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const root = path.resolve(__dirname, '..');
const src = fs.readFileSync(path.join(root, 'legacy/v22/progression.js'), 'utf8');
const outDir = path.join(root, 'packages/content/src/data');
fs.mkdirSync(outDir, { recursive: true });

// 1. Exportierte Strukturen über das Modul selbst
const ctx = { window: {}, Math };
vm.createContext(ctx);
vm.runInContext(src, ctx);
const P = ctx.window.KnowstersProgress;

// 2. Nicht exportierte Konstanten per Quelltext-Ausschnitt
function sliceConst(name) {
  const start = src.indexOf(`const ${name}=`);
  if (start < 0) throw new Error(`const ${name} nicht gefunden`);
  // Ende: erste Zeile, die mit "};" endet und zur Deklaration gehört
  let depth = 0, i = src.indexOf('=', start) + 1, started = false;
  for (; i < src.length; i++) {
    const c = src[i];
    if (c === '[' || c === '{') { depth++; started = true; }
    else if (c === ']' || c === '}') { depth--; if (started && depth === 0) { i++; break; } }
  }
  return src.slice(start, i) + ';';
}
const { languageBank, genericBanks, curriculumQuestionBanks } = vm.runInNewContext(
  sliceConst('languageBank') + sliceConst('genericBanks') + sliceConst('curriculumQuestionBanks') +
  ';({languageBank,genericBanks,curriculumQuestionBanks})',
  {},
);

const items = [];
const seen = new Set();
function push(subject, level, row) {
  const [prompt, answer, wrong, explanation] = row;
  const stage = P.curriculum[subject][level];
  const base = `${subject}-L${level + 1}`;
  let n = 1, id = `${base}-${String(n).padStart(2, '0')}`;
  while (seen.has(id)) { n++; id = `${base}-${String(n).padStart(2, '0')}`; }
  const key = `${subject}|${level}|${prompt}`;
  if (seen.has(key)) return; // gleiche Frage doppelt in generic + curriculum
  seen.add(key); seen.add(id);
  items.push({
    id, subject, level, topicId: stage.id, type: 'choice',
    prompt, answers: [String(answer), ...wrong.map(String)], correctAnswer: String(answer), explanation,
    source: 'legacy-v22', checkedAt: null, version: 1,
  });
}
languageBank.forEach((bank, level) => bank.forEach((row) => push('language', level, row)));
for (const [subject, banks] of Object.entries(curriculumQuestionBanks)) {
  banks.forEach((bank, level) => bank.forEach((row) => push(subject, Math.min(7, level), row)));
}
for (const [subject, banks] of Object.entries(genericBanks)) {
  // generic banks decken 4 Stufenblöcke ab; sie sind in curriculumQuestionBanks bereits eingebettet,
  // doppelte Prompts werden über den Set-Schlüssel übersprungen.
  banks.forEach((bank, block) => bank.forEach((row) => push(subject, Math.min(7, block * 2), row)));
}

const write = (name, data) => fs.writeFileSync(path.join(outDir, name), JSON.stringify(data, null, 1) + '\n');
write('questions-legacy.json', items);
write('curriculum.json', P.curriculum);
write('domains.json', Object.fromEntries(Object.entries(P.domains).map(([id, d]) => [id, { label: d.label, icon: d.icon, attributes: d.attributes }])));
write('age-bands.json', P.ageBands);
write('difficulty-labels.json', P.difficultyLabels);
console.log(`items: ${items.length}, subjects: ${[...new Set(items.map((i) => i.subject))].join(',')}`);
