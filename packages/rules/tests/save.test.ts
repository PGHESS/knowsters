import { describe, expect, it } from 'vitest';
import { KeyValueSaveAdapter, LEGACY_KEY, MemoryStore, SAVE_KEY, SAVE_VERSION, createFreshSave, migrateLegacyV22, migrateSave, seededRng } from '../src';

const legacyFixture = {
  schemaVersion: 22,
  stage: 'world',
  chosen: 'ember',
  points: 12,
  player: { name: 'Patrick', ageBand: '16-17', avatar: { face: 7, hair: 5, hairColor: 8, top: 1, pants: 0 }, avatarCreated: true },
  knowledge: {
    version: 2,
    ageBand: '16-17',
    domains: {
      math: { correct: 4, wrong: 1, attempts: 5, level: 5, topics: {} },
      english: { correct: 0, wrong: 0, attempts: 0, level: 4, topics: {} },
    },
  },
  prolog: { completed: true, battle: null },
  pets: { ember: { xp: 20 } },
};

describe('save: fresh state', () => {
  it('creates four team creatures and a companion', () => {
    const s = createFreshSave(seededRng(1), new Date('2026-09-27T10:00:00Z'));
    expect(s.schemaVersion).toBe(SAVE_VERSION);
    expect(s.team).toHaveLength(4);
    expect(s.creatures[s.companionId!]?.speciesId).toBe('pyro');
    expect(s.player.knowledge.proofs).toEqual([]);
  });
});

describe('save: migration from v22', () => {
  it('keeps age band, avatar, knowledge levels and prolog flag; rebuilds creatures', () => {
    const s = migrateLegacyV22(legacyFixture, seededRng(2))!;
    expect(s).not.toBeNull();
    expect(s.origin).toBe('legacy-v22');
    expect(s.player.name).toBe('Patrick');
    expect(s.player.ageBand).toBe('16-17');
    expect(s.player.avatar).toEqual({ face: 7, hair: 5, hairColor: 8, top: 1, pants: 0 });
    expect(s.player.knowledge.subjects.math.level).toBe(5);
    expect(s.player.knowledge.subjects.math.correct).toBe(4);
    expect(s.player.knowledge.subjects.english.level).toBe(4); // Altersstart 16-17
    expect(s.flags.prologDone).toBe(true);
    expect(Object.keys(s.creatures)).toHaveLength(4);
  });
  it('rejects unknown or too old schemas', () => {
    expect(migrateLegacyV22({ schemaVersion: 11 })).toBeNull();
    expect(migrateSave('garbage')).toBeNull();
    expect(migrateSave({ schemaVersion: 999 })).toBeNull();
  });
});

describe('save: adapter', () => {
  it('loads a legacy stand once, persists it under the new key, exports and imports', () => {
    const store = new MemoryStore();
    store.setItem(LEGACY_KEY, JSON.stringify(legacyFixture));
    const adapter = new KeyValueSaveAdapter(store);
    const loaded = adapter.load()!;
    expect(loaded.origin).toBe('legacy-v22');
    expect(store.getItem(SAVE_KEY)).not.toBeNull();
    loaded.player.name = 'Neu';
    adapter.save(loaded);
    expect(adapter.load()!.player.name).toBe('Neu');
    const json = adapter.export();
    adapter.clear();
    expect(adapter.load()!.player.name).toBe('Patrick'); // Legacy erneut migriert
    const imported = adapter.import(json);
    expect(imported.player.name).toBe('Neu');
    expect(() => adapter.import('{"schemaVersion":3}')).toThrow();
  });
});
