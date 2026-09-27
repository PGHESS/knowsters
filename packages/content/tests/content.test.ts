import { describe, expect, it } from 'vitest';
import {
  ABILITIES,
  AGE_BANDS,
  ATTRIBUTE_ORDER,
  BOARDS,
  CURRICULUM,
  ENCOUNTERS,
  GUARDIANS,
  ENEMIES,
  LEGACY_QUESTIONS,
  SUBJECT_ORDER,
  boardDef,
  STAGE_COUNT,
} from '../src';

describe('content: creatures and abilities', () => {
  it('every guardian references four existing abilities and innate ⊆ abilities', () => {
    for (const g of Object.values(GUARDIANS)) {
      expect(g.abilities).toHaveLength(4);
      for (const id of g.abilities) expect(ABILITIES[id], id).toBeDefined();
      for (const id of g.innate) expect(g.abilities).toContain(id);
      expect(ATTRIBUTE_ORDER.every((a) => g.potentialTemplate[a] >= 500 && g.potentialTemplate[a] <= 999)).toBe(true);
      expect(ATTRIBUTE_ORDER.every((a) => g.startTemplate[a] <= g.potentialTemplate[a])).toBe(true);
    }
  });
  it('potential templates sum to exactly 8000', () => {
    for (const g of Object.values(GUARDIANS)) {
      const sum = ATTRIBUTE_ORDER.reduce((s, a) => s + g.potentialTemplate[a], 0);
      expect(sum, g.id).toBe(8000);
    }
  });
  it('ability requirements only reference known abilities and curriculum topics', () => {
    const topics = new Set(Object.values(CURRICULUM).flat().map((s) => s.id));
    for (const a of Object.values(ABILITIES)) {
      if (a.requirements?.requiresAbility) expect(ABILITIES[a.requirements.requiresAbility]).toBeDefined();
      if (a.requirements?.knowledgeProof) expect(topics.has(a.requirements.knowledgeProof), a.requirements.knowledgeProof).toBe(true);
    }
  });
});

describe('content: boards and encounters', () => {
  it('placements lie inside the board and never on obstacles', () => {
    for (const e of Object.values(ENCOUNTERS)) {
      const b = boardDef(e.boardId);
      const all = [...e.team, ...e.enemies, ...Object.values(e.spawns).flat()];
      for (const p of all) {
        expect(p.x >= 0 && p.x < b.width && p.y >= 0 && p.y < b.height, `${e.id} ${p.species}`).toBe(true);
        expect(b.obstacles.some((o) => o.x === p.x && o.y === p.y), `${e.id} ${p.species} on obstacle`).toBe(false);
        expect(GUARDIANS[p.species] ?? ENEMIES[p.species], p.species).toBeDefined();
      }
      const keys = e.team.map((t) => `${t.x}:${t.y}`).concat(e.enemies.map((t) => `${t.x}:${t.y}`));
      expect(new Set(keys).size).toBe(keys.length);
    }
    expect(Object.keys(BOARDS).length).toBeGreaterThanOrEqual(3);
  });
});

describe('content: curriculum and questions', () => {
  it('ten subjects with eight stages each', () => {
    expect(SUBJECT_ORDER).toHaveLength(10);
    for (const s of SUBJECT_ORDER) expect(CURRICULUM[s], s).toHaveLength(STAGE_COUNT);
    for (const band of Object.values(AGE_BANDS)) for (const s of SUBJECT_ORDER) expect(band.base[s]).toBeGreaterThanOrEqual(0);
  });
  it('legacy questions are valid items with unique ids and matching topics', () => {
    const ids = new Set<string>();
    for (const q of LEGACY_QUESTIONS) {
      expect(ids.has(q.id), q.id).toBe(false);
      ids.add(q.id);
      expect(q.answers).toContain(q.correctAnswer);
      expect(new Set(q.answers).size).toBe(q.answers.length);
      expect(q.explanation.length).toBeGreaterThan(10);
      expect(CURRICULUM[q.subject][q.level]?.id).toBe(q.topicId);
    }
    expect(LEGACY_QUESTIONS.length).toBeGreaterThan(150);
  });
});
