import { ABILITIES, AGE_BANDS, ATTRIBUTE_DEFS, CURRICULUM, DIFFICULTY_LABELS, SUBJECTS, SUBJECT_ORDER, guardianDef, isAgeBand, type AttributeId, type QuestionItem, type SubjectId } from '@knowsters/content';
import {
  EXAM_DEVELOPMENT_BONUS,
  EXAM_SIZE,
  answerExam,
  applyExamReward,
  attributeCost,
  awardLearning,
  checkUnlock,
  currentExamItem,
  defaultTrainingAttribute,
  developmentFor,
  examAvailable,
  examScore,
  generateExamSet,
  generateQuestion,
  normalize,
  recordWrong,
  startExam,
  validTrainingAttributes,
  type CreatureInstance,
  type ExamState,
  type LearningAward,
} from '@knowsters/rules';
import type { GameStore } from '../store/store';
import { esc, hideSheet, onAction, showSheet } from './overlay';

/**
 * Wissensscreen (Auftrag §12). Übung ist frei, Prüfung = 5 neue Aufgaben ohne Hilfen, 4/5 = Nachweis.
 * Wissen wird im Spielerprofil gespeichert, Entwicklung fließt in das gewählte Wesen.
 * Für den Slice ist nur Mathematik vollständig; die übrigen Fächer sind sichtbar, aber markiert.
 */

type Mode = 'overview' | 'practice' | 'exam';

interface Session {
  subject: SubjectId;
  creatureId: string;
  attributeId: AttributeId;
  mode: Mode;
  task: QuestionItem | null;
  /** Ergebnis der letzten Antwort in der Übung. */
  outcome: null | { correct: boolean; given: string; award: LearningAward | null };
  exam: ExamState | null;
  examLevel: number;
  examLast: null | { correct: boolean; given: string; item: QuestionItem };
  examReward: null | { attributeId: AttributeId; before: number; after: number };
  /** Prüfung bestanden, aber Nachweis war schon vorhanden: kein Bonus. */
  examRepeat: boolean;
}

let session: Session | null = null;

export function showKnowledge(store: GameStore, onClose: () => void): void {
  const team = store.team();
  const comp = store.companion() ?? team[0];
  if (!comp) return;
  if (!session || !store.creature(session.creatureId)) {
    session = { subject: 'math', creatureId: comp.id, attributeId: defaultTrainingAttribute('math', comp), mode: 'overview', task: null, outcome: null, exam: null, examLevel: 0, examLast: null, examReward: null, examRepeat: false };
  }
  render(store, onClose);
}

const rng = () => Math.random();

function render(store: GameStore, onClose: () => void): void {
  const s = session!;
  const creature = store.creature(s.creatureId)!;
  const html = s.mode === 'overview' ? overviewHtml(store, creature) : s.mode === 'practice' ? practiceHtml(store, creature) : examHtml(store, creature);
  const sheet = showSheet(html, { dismissible: s.mode === 'overview', onDismiss: onClose });
  const rerender = () => render(store, onClose);
  onAction(sheet, {
    close: () => {
      hideSheet();
      onClose();
    },
    back: () => {
      s.mode = 'overview';
      s.task = null;
      s.outcome = null;
      s.exam = null;
      rerender();
    },
    age: (el) => {
      const id = el.dataset.id ?? '';
      store.setAgeBand(isAgeBand(id) ? id : null);
      rerender();
    },
    creature: (el) => {
      s.creatureId = el.dataset.id ?? s.creatureId;
      const c = store.creature(s.creatureId)!;
      if (!validTrainingAttributes(s.subject).includes(s.attributeId)) s.attributeId = defaultTrainingAttribute(s.subject, c);
      rerender();
    },
    attribute: (el) => {
      s.attributeId = (el.dataset.id as AttributeId) ?? s.attributeId;
      rerender();
    },
    practice: () => {
      s.mode = 'practice';
      s.outcome = null;
      s.task = generateQuestion(s.subject, store.state.player.knowledge.subjects[s.subject].level, rng);
      rerender();
    },
    next: () => {
      s.outcome = null;
      s.task = generateQuestion(s.subject, store.state.player.knowledge.subjects[s.subject].level, rng, s.task?.prompt ?? null);
      rerender();
    },
    similar: () => {
      // gleiche Stufe, neue Aufgabe – die eingeblendete Lösung ist nicht anklickbar (Auftrag §2)
      const level = s.task?.level ?? store.state.player.knowledge.subjects[s.subject].level;
      s.outcome = null;
      s.task = generateQuestion(s.subject, level, rng, s.task?.prompt ?? null);
      rerender();
    },
    answer: (el) => {
      if (!s.task || s.outcome) return;
      submitPractice(store, el.dataset.value ?? '');
      rerender();
    },
    'answer-numeric': () => {
      if (!s.task || s.outcome) return;
      const input = sheet.querySelector<HTMLInputElement>('#numeric-answer');
      const value = input?.value.trim() ?? '';
      if (!value) return;
      submitPractice(store, value);
      rerender();
    },
    'exam-level': (el) => {
      s.examLevel = Number(el.dataset.level ?? 0);
      rerender();
    },
    'exam-start': () => {
      const items = generateExamSet(s.subject, s.examLevel, rng, EXAM_SIZE);
      s.exam = startExam(s.subject, s.examLevel, items);
      s.mode = 'exam';
      s.examLast = null;
      s.examReward = null;
      s.examRepeat = false;
      rerender();
    },
    'exam-answer': (el) => submitExam(store, el.dataset.value ?? '', rerender),
    'exam-answer-numeric': () => {
      const input = sheet.querySelector<HTMLInputElement>('#numeric-answer');
      const value = input?.value.trim() ?? '';
      if (value) submitExam(store, value, rerender);
    },
    'exam-next': () => {
      s.examLast = null;
      rerender();
    },
  });
  const input = sheet.querySelector<HTMLInputElement>('#numeric-answer');
  if (input) {
    input.focus();
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') (sheet.querySelector<HTMLElement>('[data-action="answer-numeric"],[data-action="exam-answer-numeric"]'))?.click();
    });
  }
}

function submitPractice(store: GameStore, given: string): void {
  const s = session!;
  const task = s.task!;
  const creature = store.creature(s.creatureId)!;
  const correct = normalize(given) === normalize(task.correctAnswer);
  let award: LearningAward | null = null;
  store.update((st) => {
    if (correct) award = awardLearning(creature, st.player.knowledge, task.subject, task.topicId, task.level, s.attributeId);
    else recordWrong(st.player.knowledge, task.subject, task.topicId);
  });
  s.outcome = { correct, given, award };
}

function submitExam(store: GameStore, given: string, rerender: () => void): void {
  const s = session!;
  if (!s.exam || s.examLast) return;
  const creature = store.creature(s.creatureId)!;
  const item = currentExamItem(s.exam);
  if (!item) return;
  let correct = false;
  store.update((st) => {
    const result = answerExam(s.exam!, st.player.knowledge, given);
    correct = result.correct;
    if (result.finished && result.passed) {
      const r = applyExamReward(creature, s.attributeId, s.exam!);
      if (r) s.examReward = { attributeId: s.attributeId, before: r.before, after: r.after };
      else s.examRepeat = true;
    }
  });
  s.examLast = { correct, given, item };
  rerender();
}

// ---------------------------------------------------------------- Markup

function attributeChips(creature: CreatureInstance, subject: SubjectId, active: AttributeId): string {
  return validTrainingAttributes(subject)
    .map((a) => `<button class="chip ${a === active ? 'active' : ''}" data-action="attribute" data-id="${a}">${esc(ATTRIBUTE_DEFS[a].label)} ${creature.attributes[a].value}</button>`)
    .join('');
}

function creatureChips(store: GameStore, active: string): string {
  return store
    .team()
    .map((c) => `<button class="chip ${c.id === active ? 'active' : ''}" data-action="creature" data-id="${esc(c.id)}">${esc(c.name)}</button>`)
    .join('');
}

function progressHtml(creature: CreatureInstance, attributeId: AttributeId): string {
  const a = creature.attributes[attributeId];
  const need = attributeCost(a.value);
  const pct = a.value >= a.potential ? 100 : Math.min(100, (a.progress / need) * 100);
  return `<div class="stat"><span>${esc(ATTRIBUTE_DEFS[attributeId].label)} von ${esc(creature.name)}</span><b>${a.value}<small> / ${a.potential}</small></b></div>
    <div class="progress"><i style="width:${pct.toFixed(0)}%"></i></div>
    <div class="stat"><span>${a.value >= a.potential ? 'Potenzial erreicht' : `${a.progress} / ${need} Entwicklung bis zum nächsten Punkt`}</span></div>`;
}

function unlockHint(store: GameStore): string {
  const pyro = store.team().find((c) => c.speciesId === 'pyro');
  if (!pyro) return '';
  const trail = ABILITIES['pyro-trail']!;
  if (pyro.unlocked.includes(trail.id)) return `<div class="chips"><span class="chip ok">Glutspur gelernt – Pyro setzt sie im nächsten Kampf ein.</span></div>`;
  const check = checkUnlock(pyro, store.state.player.knowledge, trail);
  const parts: string[] = [];
  if (check.needsProof) parts.push(`Nachweis „Prozentrechnung“`);
  for (const g of check.attributeGaps) parts.push(`${ATTRIBUTE_DEFS[g.attributeId].label} ${g.have}/${g.need}`);
  if (check.needsSkillPoints) parts.push(`${check.needsSkillPoints} Fähigkeitspunkt (Kampf gewinnen)`);
  return `<div class="chips"><span class="chip ${check.ok ? 'ok' : 'warn'}">Glutspur: ${check.ok ? 'jetzt unter Team lernen' : parts.join(' · ')}</span></div>`;
}

function overviewHtml(store: GameStore, creature: CreatureInstance): string {
  const s = session!;
  const k = store.state.player.knowledge;
  const st = k.subjects[s.subject];
  const stage = CURRICULUM[s.subject][st.level]!;
  const levels = CURRICULUM[s.subject]
    .map((stg, i) => {
      const proven = k.proofs.includes(stg.id);
      const allowed = i <= st.level && examAvailable(s.subject, i, EXAM_SIZE);
      return `<button class="chip ${i === s.examLevel ? 'active' : ''} ${proven ? 'ok' : ''}" data-action="exam-level" data-level="${i}" ${allowed ? '' : 'disabled'} title="${esc(stg.title)}">${i + 1}${proven ? ' ✓' : ''}</button>`;
    })
    .join('');
  if (s.examLevel > st.level) s.examLevel = st.level;
  const examStage = CURRICULUM[s.subject][s.examLevel]!;
  const others = SUBJECT_ORDER.filter((x) => x !== 'math')
    .map((x) => `<span class="chip" style="opacity:.55">${esc(SUBJECTS[x].icon)} ${esc(SUBJECTS[x].label)} · Stufe ${k.subjects[x].level + 1}</span>`)
    .join('');
  const ages = (Object.keys(AGE_BANDS) as (keyof typeof AGE_BANDS)[])
    .map((id) => `<button class="chip ${k.ageBand === id ? 'active' : ''}" data-action="age" data-id="${id}">${esc(AGE_BANDS[id].label)}</button>`)
    .join('');
  return `<div class="kicker">Wissen · ${esc(SUBJECTS[s.subject].label)}</div>
    <h2>Stufe ${st.level + 1}/8 · ${esc(stage.title)}</h2>
    ${k.ageBand ? '' : '<p><b>Startniveau wählen.</b> Dein Alter setzt nur den ersten Einstieg; danach passt sich jedes Fach an deine Antworten an.</p>'}
    <div class="chips">${ages}</div>
    <p>${esc(stage.goal)} <small>· ${esc(DIFFICULTY_LABELS[st.level] ?? '')}</small></p>
    <div class="stat"><span>${st.correct} richtig · ${st.wrong} Lernschritte · sichere Stufe ${st.peakLevel + 1}</span><span>Nachweise: ${k.proofs.length}</span></div>
    ${unlockHint(store)}
    <p><b>Wer entwickelt sich?</b> Wissen bleibt bei dir. Die Entwicklung geht an:</p>
    <div class="chips">${creatureChips(store, creature.id)}</div>
    <div class="chips">${attributeChips(creature, s.subject, s.attributeId)}</div>
    ${progressHtml(creature, s.attributeId)}
    <div class="row">
      <button class="btn primary" data-action="practice">Üben · frei</button>
    </div>
    <p style="margin-top:14px"><b>Prüfung</b> · ${EXAM_SIZE} neue Aufgaben, keine Hilfen, ${EXAM_SIZE - 1}/${EXAM_SIZE} richtig = Nachweis. Bestanden: +${EXAM_DEVELOPMENT_BONUS} Entwicklung.</p>
    <div class="level-pills">${levels}</div>
    <div class="row"><button class="btn" data-action="exam-start">Prüfung „${esc(examStage.title)}“ ablegen</button></div>
    <p style="margin-top:14px"><small>Weitere Fächer (Aufgabenpools im Aufbau, noch ohne Prüfung):</small></p>
    <div class="chips">${others}</div>
    <div class="row"><button class="btn ghost" data-action="close">Schließen</button></div>`;
}

function answersHtml(task: QuestionItem, outcome: Session['outcome'], action: string, numericAction: string): string {
  if (task.type === 'numeric') {
    if (!outcome) return `<div class="numeric"><input id="numeric-answer" inputmode="decimal" autocomplete="off" placeholder="Zahl" aria-label="Antwort" /><button class="btn primary" data-action="${numericAction}" style="flex:0 0 auto">Antworten</button></div>`;
    return `<div class="answers">
      <button class="btn ${outcome.correct ? 'correct' : 'wrong'}" disabled>${esc(outcome.given)} <small>${outcome.correct ? '✓ richtig' : 'deine Antwort'}</small></button>
      ${outcome.correct ? '' : `<button class="btn correct" disabled>${esc(task.correctAnswer)} <small>✓ richtig</small></button>`}
    </div>`;
  }
  return `<div class="answers">${task.answers
    .map((a) => {
      const cls = !outcome ? '' : normalize(a) === normalize(task.correctAnswer) ? 'correct' : normalize(a) === normalize(outcome.given) ? 'wrong' : 'muted';
      const suffix = !outcome ? '' : normalize(a) === normalize(task.correctAnswer) ? ' <small>✓ richtig</small>' : normalize(a) === normalize(outcome.given) ? ' <small>deine Antwort</small>' : '';
      return `<button class="btn ${cls}" data-action="${action}" data-value="${esc(a)}" ${outcome ? 'disabled' : ''}>${esc(a)}${suffix}</button>`;
    })
    .join('')}</div>`;
}

const visualHtml = (task: QuestionItem): string =>
  task.visual?.kind === 'fraction' ? `<div class="fraction" role="img" aria-label="${task.visual.n} von ${task.visual.d} Teilen">${Array.from({ length: task.visual.d }, (_, i) => `<i class="${i < task.visual!.n ? 'on' : ''}"></i>`).join('')}</div>` : '';

function practiceHtml(store: GameStore, creature: CreatureInstance): string {
  const s = session!;
  const task = s.task!;
  const k = store.state.player.knowledge.subjects[s.subject];
  const stage = CURRICULUM[s.subject][task.level]!;
  const dev = developmentFor(task.level, k.peakLevel);
  let feedback = '';
  if (s.outcome) {
    if (s.outcome.correct) {
      const aw = s.outcome.award;
      const label = ATTRIBUTE_DEFS[s.attributeId].label;
      feedback = `<div class="explain"><strong>Richtig.</strong> ${esc(task.explanation)}</div>
        <div class="explain" style="border-left-color:var(--green)"><strong>${aw?.practiceOnly ? 'Übung' : `+${aw?.development} ${esc(label)}entwicklung`}</strong>
        ${aw?.practiceOnly ? ' Diese Stufe liegt deutlich unter deiner sicheren Kompetenz – sie zählt als Wiederholung, nicht als Entwicklung.' : aw?.attribute?.levels ? ` ${esc(label)} steigt von ${aw.attribute.before} auf ${aw.attribute.after}.` : ' Der Fortschrittsbalken füllt sich.'}
        ${aw?.levelUp ? '<br><b>Stufe erhöht.</b> Drei richtige in Folge.' : ''}</div>
        ${progressHtml(creature, s.attributeId)}
        <div class="row"><button class="btn primary" data-action="next">Nächste Aufgabe</button><button class="btn ghost" data-action="back">Zur Übersicht</button></div>`;
    } else {
      feedback = `<div class="explain"><strong>Wissensbaustein</strong> ${esc(task.explanation)}<br><small>Die Antworten bleiben gesperrt. Du bekommst jetzt eine neue Aufgabe zum selben Lernziel – die eingeblendete Lösung zählt nicht.</small></div>
        <div class="row"><button class="btn primary" data-action="similar">Ähnliche Aufgabe</button><button class="btn ghost" data-action="back">Zur Übersicht</button></div>`;
    }
  }
  return `<div class="kicker">Üben · ${esc(SUBJECTS[s.subject].label)} · Stufe ${task.level + 1}/8 · ${esc(stage.title)}</div>
    <div class="stat"><span>${esc(stage.goal)}</span><span>${dev ? `+${dev} Entwicklung` : 'nur Übung'}</span></div>
    <div class="task-prompt">${esc(task.prompt)}</div>
    ${visualHtml(task)}
    ${answersHtml(task, s.outcome, 'answer', 'answer-numeric')}
    ${feedback}
    ${s.outcome ? '' : '<div class="row"><button class="btn ghost small" data-action="back">Abbrechen</button></div>'}`;
}

function examHtml(store: GameStore, creature: CreatureInstance): string {
  const s = session!;
  const exam = s.exam!;
  const stage = CURRICULUM[s.subject][exam.level]!;
  if (exam.finished && !s.examLast) {
    const score = examScore(exam);
    const reward = s.examReward;
    const species = guardianDef(creature.speciesId);
    return `<div class="kicker">Prüfung · ${esc(stage.title)}</div>
      <h2>${exam.passed ? 'Nachweis erbracht.' : 'Noch nicht.'}</h2>
      <p class="lead">${score} von ${exam.items.length} richtig.${exam.passed ? ' Der Nachweis ist in deinem Profil gespeichert.' : ` Für den Nachweis brauchst du ${EXAM_SIZE - 1}. Üben ist jederzeit frei.`}</p>
      ${reward ? `<div class="explain" style="border-left-color:var(--green)"><strong>+${EXAM_DEVELOPMENT_BONUS} ${esc(ATTRIBUTE_DEFS[reward.attributeId].label)}entwicklung</strong> für ${esc(species.name)}${reward.after > reward.before ? `: ${reward.before} → ${reward.after}` : ''}.</div>${progressHtml(creature, reward.attributeId)}` : s.examRepeat ? '<div class="explain"><strong>Nachweis bestätigt.</strong> Er war schon in deinem Profil – den Entwicklungsbonus gibt es nur beim ersten Erwerb. Üben bringt weiterhin Entwicklung.</div>' : ''}
      ${exam.passed ? unlockHint(store) : ''}
      <div class="row"><button class="btn primary" data-action="back">Zur Übersicht</button></div>`;
  }
  const item = s.examLast ? s.examLast.item : currentExamItem(exam)!;
  const shownIndex = s.examLast ? exam.index - 1 : exam.index;
  const outcome = s.examLast ? { correct: s.examLast.correct, given: s.examLast.given, award: null } : null;
  return `<div class="kicker">Prüfung · ${esc(stage.title)} · Aufgabe ${shownIndex + 1}/${exam.items.length}</div>
    <div class="stat"><span>Keine Hilfen, ein Versuch je Aufgabe.</span><span>${examScore(exam)} richtig</span></div>
    <div class="task-prompt">${esc(item.prompt)}</div>
    ${visualHtml(item)}
    ${answersHtml(item, outcome, 'exam-answer', 'exam-answer-numeric')}
    ${s.examLast ? `<div class="row"><button class="btn primary" data-action="exam-next">${exam.finished ? 'Ergebnis' : 'Weiter'}</button></div>` : '<div class="row"><button class="btn ghost small" data-action="back">Prüfung abbrechen</button></div>'}`;
}
