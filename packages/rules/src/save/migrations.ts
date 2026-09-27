import { GUARDIAN_ORDER, SUBJECT_ORDER, isAgeBand, type SubjectId } from '@knowsters/content';
import { createCreature } from '../progression/creature';
import { createKnowledge } from '../progression/knowledge';
import { seededRng, type Rng } from '../rng';
import { SAVE_VERSION, type SaveV30 } from './schema';

/** Schlüssel des alten Prototyps (v11–v22). */
export const LEGACY_KEY = 'knowsters-story-v2';
export const SAVE_KEY = 'knowsters-save-v30';

export function createFreshSave(rng: Rng = seededRng(Date.now() >>> 0), now = new Date()): SaveV30 {
  const creatures: Record<string, CreatureInstanceLike> = {};
  const team: string[] = [];
  for (const species of GUARDIAN_ORDER) {
    const id = `${species}-1`;
    creatures[id] = createCreature(species, id, rng);
    team.push(id);
  }
  return {
    schemaVersion: SAVE_VERSION,
    createdAt: now.toISOString(),
    updatedAt: now.toISOString(),
    player: { name: 'Du', ageBand: null, avatar: { face: 2, hair: 0, hairColor: 1, top: 0, pants: 0 }, knowledge: createKnowledge(null) },
    creatures,
    team,
    companionId: 'pyro-1',
    world: { zone: 'lichtquell-werkstatt', position: null },
    flags: {},
    battle: null,
    settings: { turnOrder: 'sides', reducedMotion: false, sound: true },
    origin: 'fresh',
  };
}
type CreatureInstanceLike = SaveV30['creatures'][string];

/**
 * Explizite Migration v22 → v30. Übernommen werden Alter, Avatar und das Wissensprofil
 * (Stufe, richtig/falsch je Fach). Wesen werden neu erzeugt: Das alte 1v1-Duell-System
 * (Moos/Funke/Welle) ist nicht Teil des Slice; sein Schema wird nicht fortgeführt.
 */
export function migrateLegacyV22(legacy: unknown, rng: Rng = seededRng(22), now = new Date()): SaveV30 | null {
  if (!legacy || typeof legacy !== 'object') return null;
  const old = legacy as Record<string, unknown>;
  const schema = Number(old.schemaVersion) || 0;
  if (schema < 16 || schema > 29) return null;
  const save = createFreshSave(rng, now);
  save.origin = `legacy-v${schema}`;
  const player = (old.player ?? {}) as Record<string, unknown>;
  if (typeof player.name === 'string' && player.name.trim()) save.player.name = player.name.trim().slice(0, 32);
  const band = typeof player.ageBand === 'string' ? player.ageBand : null;
  save.player.ageBand = isAgeBand(band) ? band : null;
  const avatar = (player.avatar ?? {}) as Record<string, unknown>;
  const clamp = (v: unknown, max: number) => Math.max(0, Math.min(max - 1, Number.isFinite(Number(v)) ? Math.trunc(Number(v)) : 0));
  save.player.avatar = { face: clamp(avatar.face, 16), hair: clamp(avatar.hair, 16), hairColor: clamp(avatar.hairColor, 10), top: clamp(avatar.top, 16), pants: clamp(avatar.pants, 16) };
  save.player.knowledge = createKnowledge(save.player.ageBand);
  const domains = ((old.knowledge as Record<string, unknown> | undefined)?.domains ?? {}) as Record<string, Record<string, unknown>>;
  for (const s of SUBJECT_ORDER) {
    const d = domains[s];
    if (!d) continue;
    const st = save.player.knowledge.subjects[s as SubjectId];
    st.correct = Math.max(0, Number(d.correct) || 0);
    st.wrong = Math.max(0, Number(d.wrong) || 0);
    if (st.correct + st.wrong > 0 && Number.isFinite(Number(d.level))) {
      st.level = Math.max(0, Math.min(7, Number(d.level)));
      st.peakLevel = st.level;
    }
  }
  if ((old.prolog as Record<string, unknown> | undefined)?.completed) save.flags.prologDone = true;
  return save;
}

export type Migration = (raw: Record<string, unknown>) => Record<string, unknown>;

/** Registry nummerierter Migrationen ab v30. Neue Versionen: `31: (s) => ...`. */
export const MIGRATIONS: Record<number, Migration> = {};

/** Bringt einen v30+-Stand auf die aktuelle Version. Ältere Stände laufen über migrateLegacyV22. */
export function migrateSave(raw: unknown): SaveV30 | null {
  if (!raw || typeof raw !== 'object') return null;
  let s = raw as Record<string, unknown>;
  let v = Number(s.schemaVersion) || 0;
  if (v < SAVE_VERSION) {
    const legacy = migrateLegacyV22(s);
    if (!legacy) return null;
    return legacy;
  }
  while (v < SAVE_VERSION) {
    const step = MIGRATIONS[v + 1];
    if (!step) return null;
    s = step(s);
    v = Number(s.schemaVersion) || v + 1;
  }
  if (v !== SAVE_VERSION) return null;
  return s as unknown as SaveV30;
}
