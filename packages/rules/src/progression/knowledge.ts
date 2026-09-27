import { AGE_BANDS, CURRICULUM, STAGE_COUNT, SUBJECT_ORDER, isAgeBand, type AgeBandId, type SubjectId } from '@knowsters/content';

export interface TopicStats {
  correct: number;
  wrong: number;
  attempts: number;
}

export interface SubjectState {
  /** Aktuelle Aufgabenstufe 0–7 (adaptiv). */
  level: number;
  /** Höchste Stufe, auf der der Spieler nachweislich sicher war (Farming-Schutz). */
  peakLevel: number;
  correct: number;
  wrong: number;
  correctStreak: number;
  wrongStreak: number;
  recentPrompt: string | null;
  topics: Record<string, TopicStats>;
}

/** Wissen gehört dem Spieler (Auftrag §2). */
export interface PlayerKnowledge {
  version: 3;
  ageBand: AgeBandId | null;
  subjects: Record<SubjectId, SubjectState>;
  /** Themen-IDs mit bestandenem Wissensnachweis. */
  proofs: string[];
}

export const ageStartLevel = (ageBand: AgeBandId | null, subject: SubjectId): number => (ageBand ? AGE_BANDS[ageBand].base[subject] : 0);

const freshSubject = (subject: SubjectId, level: number): SubjectState => ({
  level,
  peakLevel: level,
  correct: 0,
  wrong: 0,
  correctStreak: 0,
  wrongStreak: 0,
  recentPrompt: null,
  topics: Object.fromEntries(CURRICULUM[subject].map((stage) => [stage.id, { correct: 0, wrong: 0, attempts: 0 }])),
});

export function createKnowledge(ageBand: AgeBandId | null = null): PlayerKnowledge {
  const band = isAgeBand(ageBand) ? ageBand : null;
  const subjects = {} as Record<SubjectId, SubjectState>;
  for (const s of SUBJECT_ORDER) subjects[s] = freshSubject(s, ageStartLevel(band, s));
  return { version: 3, ageBand: band, subjects, proofs: [] };
}

/** Alter nachträglich ändern: nur noch unbearbeitete Fächer werden neu platziert. */
export function applyAgeBand(k: PlayerKnowledge, ageBand: AgeBandId | null): void {
  k.ageBand = isAgeBand(ageBand) ? ageBand : null;
  for (const s of SUBJECT_ORDER) {
    const st = k.subjects[s];
    if (st.correct + st.wrong === 0) {
      st.level = ageStartLevel(k.ageBand, s);
      st.peakLevel = st.level;
    }
  }
}

const clampLevel = (v: number) => Math.max(0, Math.min(STAGE_COUNT - 1, v));

export function recordCorrect(k: PlayerKnowledge, subject: SubjectId, topicId: string): { levelUp: boolean } {
  const st = k.subjects[subject];
  st.correct++;
  st.correctStreak++;
  st.wrongStreak = 0;
  const t = (st.topics[topicId] ??= { correct: 0, wrong: 0, attempts: 0 });
  t.correct++;
  t.attempts++;
  let levelUp = false;
  if (st.correctStreak >= 3) {
    const next = clampLevel(st.level + 1);
    levelUp = next !== st.level;
    st.level = next;
    st.peakLevel = Math.max(st.peakLevel, st.level);
    st.correctStreak = 0;
  }
  return { levelUp };
}

export function recordWrong(k: PlayerKnowledge, subject: SubjectId, topicId: string): { levelDown: boolean } {
  const st = k.subjects[subject];
  st.wrong++;
  st.wrongStreak++;
  st.correctStreak = 0;
  const t = (st.topics[topicId] ??= { correct: 0, wrong: 0, attempts: 0 });
  t.wrong++;
  t.attempts++;
  let levelDown = false;
  if (st.wrongStreak >= 2) {
    const next = clampLevel(st.level - 1);
    levelDown = next !== st.level;
    st.level = next; // peakLevel bleibt: absichtliches Absenken bringt keinen Entwicklungsvorteil
    st.wrongStreak = 0;
  }
  return { levelDown };
}

export const hasProof = (k: PlayerKnowledge, topicId: string): boolean => k.proofs.includes(topicId);

export function grantProof(k: PlayerKnowledge, subject: SubjectId, topicId: string): void {
  if (!k.proofs.includes(topicId)) k.proofs.push(topicId);
  const level = CURRICULUM[subject].findIndex((s) => s.id === topicId);
  if (level >= 0) k.subjects[subject].peakLevel = Math.max(k.subjects[subject].peakLevel, level);
}
