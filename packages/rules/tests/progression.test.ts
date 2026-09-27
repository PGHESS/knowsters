import { describe, expect, it } from 'vitest';
import { ABILITIES, ATTRIBUTE_ORDER, GUARDIAN_ORDER, POTENTIAL_TOTAL, guardianDef } from '@knowsters/content';
import {
  answerExam,
  attributeCost,
  awardLearning,
  checkUnlock,
  createCreature,
  createKnowledge,
  createPotential,
  developmentFor,
  generateExamSet,
  grantProof,
  potentialTotal,
  recordCorrect,
  recordWrong,
  seededRng,
  startExam,
  trainAttribute,
  unlockAbility,
  applyAgeBand,
} from '../src';

describe('potential model', () => {
  it('every instance sums to exactly 8000 with 500 ≤ value ≤ 999', () => {
    const rng = seededRng(1);
    for (const species of GUARDIAN_ORDER)
      for (let i = 0; i < 200; i++) {
        const p = createPotential(guardianDef(species).potentialTemplate, rng);
        expect(potentialTotal(p)).toBe(POTENTIAL_TOTAL);
        for (const id of ATTRIBUTE_ORDER) expect(p[id] >= 500 && p[id] <= 999, `${species} ${id}`).toBe(true);
      }
  });
  it('rare atypical individuals exist', () => {
    const rng = seededRng(3);
    let atypical = 0;
    for (let i = 0; i < 300; i++) {
      const p = createPotential(guardianDef('terra').potentialTemplate, rng);
      if (p.attack >= 900) atypical++;
    }
    expect(atypical).toBeGreaterThan(0);
    expect(atypical).toBeLessThan(80);
  });
  it('development cost rises with value and stops at potential', () => {
    expect(attributeCost(100)).toBe(2);
    expect(attributeCost(450)).toBe(3);
    expect(attributeCost(999)).toBe(8);
    const c = createCreature('pyro', 'p', seededRng(5));
    const a = c.attributes.attack;
    a.value = a.potential - 1;
    a.progress = 0;
    const r = trainAttribute(c.attributes, 'attack', 50);
    expect(r.after).toBe(a.potential);
    expect(r.capped).toBe(true);
    expect(trainAttribute(c.attributes, 'attack', 2).development).toBe(0);
  });
});

describe('knowledge and farming protection', () => {
  it('developmentFor: full at/above peak, half one below, zero further below', () => {
    expect(developmentFor(5, 5)).toBe(2);
    expect(developmentFor(7, 5)).toBe(2);
    expect(developmentFor(4, 5)).toBe(1);
    expect(developmentFor(3, 5)).toBe(0);
  });
  it('lowering the level on purpose keeps peakLevel and yields no development', () => {
    const k = createKnowledge('16-17');
    const c = createCreature('pyro', 'p', seededRng(9));
    const start = k.subjects.math.level;
    expect(k.subjects.math.peakLevel).toBe(start);
    recordWrong(k, 'math', 'math-percent');
    recordWrong(k, 'math', 'math-percent');
    expect(k.subjects.math.level).toBe(start - 1);
    expect(k.subjects.math.peakLevel).toBe(start);
    recordWrong(k, 'math', 'math-percent');
    recordWrong(k, 'math', 'math-percent');
    expect(k.subjects.math.level).toBe(start - 2);
    const award = awardLearning(c, k, 'math', 'math-order', start - 2, 'attack');
    expect(award.practiceOnly).toBe(true);
    expect(award.attribute).toBeNull();
    const full = awardLearning(c, k, 'math', 'math-percent', start, 'attack');
    expect(full.development).toBe(2);
    expect(full.attribute?.development).toBe(2);
  });
  it('three correct in a row raise level and peak; age band only places untouched subjects', () => {
    const k = createKnowledge('12-13');
    const lvl = k.subjects.math.level;
    for (let i = 0; i < 3; i++) recordCorrect(k, 'math', 'math-fractions');
    expect(k.subjects.math.level).toBe(lvl + 1);
    expect(k.subjects.math.peakLevel).toBe(lvl + 1);
    applyAgeBand(k, '25-40');
    expect(k.subjects.math.level).toBe(lvl + 1); // bearbeitet → bleibt
    expect(k.subjects.english.level).toBe(5); // unbearbeitet → neu platziert
  });
});

describe('exam and skill gating', () => {
  it('5 new items, 4 correct = proof; 3 correct = no proof', () => {
    const rng = seededRng(11);
    const k = createKnowledge('14-15');
    const items = generateExamSet('math', 5, rng, 5);
    expect(new Set(items.map((i) => i.prompt)).size).toBe(5);
    const exam = startExam('math', 5, items);
    let i = 0;
    for (const item of items) answerExam(exam, k, i++ < 4 ? item.correctAnswer : 'falsch');
    expect(exam.finished).toBe(true);
    expect(exam.passed).toBe(true);
    expect(k.proofs).toContain('math-percent');
    expect(k.subjects.math.peakLevel).toBeGreaterThanOrEqual(5);

    const k2 = createKnowledge('14-15');
    const exam2 = startExam('math', 5, generateExamSet('math', 5, rng, 5));
    let j = 0;
    for (const item of exam2.items) answerExam(exam2, k2, j++ < 3 ? item.correctAnswer : 'x');
    expect(exam2.passed).toBe(false);
    expect(k2.proofs).toHaveLength(0);
    expect(() => startExam('math', 5, items.slice(0, 3))).toThrow();
  });
  it('Glutspur needs attack ≥ 480, a skill point and the math-percent proof', () => {
    const c = createCreature('pyro', 'p', seededRng(2));
    const k = createKnowledge('14-15');
    c.attributes.attack.value = 450;
    let check = checkUnlock(c, k, ABILITIES['pyro-trail']!);
    expect(check.ok).toBe(false);
    expect(check.attributeGaps[0]?.attributeId).toBe('attack');
    expect(check.needsProof).toBe('math-percent');
    expect(check.needsSkillPoints).toBe(1);
    c.attributes.attack.value = 480;
    c.skillPoints = 1;
    grantProof(k, 'math', 'math-percent');
    check = unlockAbility(c, k, 'pyro-trail');
    expect(check.ok).toBe(true);
    expect(c.unlocked).toContain('pyro-trail');
    expect(c.skillPoints).toBe(0);
    expect(unlockAbility(c, k, 'pyro-trail').ok).toBe(false);
  });
});
