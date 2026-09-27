import curriculumJson from '../data/curriculum.json';
import domainsJson from '../data/domains.json';
import ageBandsJson from '../data/age-bands.json';
import difficultyJson from '../data/difficulty-labels.json';
import type { AttributeId } from '../attributes';

export type SubjectId =
  | 'math'
  | 'logic'
  | 'language'
  | 'english'
  | 'nature'
  | 'history'
  | 'civics'
  | 'media'
  | 'geography'
  | 'economy';

export const SUBJECT_ORDER: readonly SubjectId[] = ['math', 'logic', 'language', 'english', 'nature', 'history', 'civics', 'media', 'geography', 'economy'];

export interface CurriculumStage {
  id: string;
  title: string;
  goal: string;
  scope: string;
}

export interface SubjectDef {
  label: string;
  icon: string;
  /** Attribute, die mit diesem Fach trainiert werden können. */
  attributes: readonly AttributeId[];
}

export type AgeBandId = '12-13' | '14-15' | '16-17' | '18-24' | '25-40';

export interface AgeBandDef {
  label: string;
  hint: string;
  /** Startstufe (0–7) je Fach. */
  base: Record<SubjectId, number>;
}

export const CURRICULUM = curriculumJson as Record<SubjectId, CurriculumStage[]>;
export const SUBJECTS = domainsJson as Record<SubjectId, SubjectDef>;
export const AGE_BANDS = ageBandsJson as Record<AgeBandId, AgeBandDef>;
export const DIFFICULTY_LABELS = difficultyJson as string[];
export const STAGE_COUNT = 8;

export const stageOf = (subject: SubjectId, level: number): CurriculumStage => {
  const stages = CURRICULUM[subject];
  const s = stages[Math.max(0, Math.min(STAGE_COUNT - 1, level))];
  if (!s) throw new Error(`Keine Stufe ${level} für ${subject}`);
  return s;
};

export const isSubject = (value: string): value is SubjectId => (SUBJECT_ORDER as readonly string[]).includes(value);
export const isAgeBand = (value: string | null | undefined): value is AgeBandId => !!value && value in AGE_BANDS;
