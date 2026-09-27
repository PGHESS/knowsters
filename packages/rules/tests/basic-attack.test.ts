import { describe, expect, it } from 'vitest';
import { BASIC_ATTACKS, ENCOUNTER_PILOT_3D, ENCOUNTER_WORKSHOP, GUARDIANS, basicAttackDef } from '@knowsters/content';
import { createBattle, createCreature, living, seededRng, select, setMode, tile, validTiles, wait } from '../src';

const start = (encounter = ENCOUNTER_PILOT_3D) => {
  const rng = seededRng(3);
  const team = encounter.team.map((p) => createCreature(p.species, `${p.species}-1`, rng));
  return { b: createBattle(encounter, team), team };
};
const pyroOf = (b: ReturnType<typeof start>['b']) => b.units.find((u) => u.speciesId === 'pyro' && u.kind === 'guardian')!;

describe('basic attack (Bible §8)', () => {
  it('every species defines exactly one basic attack, marked as pilot value', () => {
    for (const g of Object.values(GUARDIANS)) {
      const def = basicAttackDef(g.basicAttack);
      expect(def.speciesId).toBe(g.id);
      expect(def.pilot).toBe(true);
      expect(def.range).toBeGreaterThanOrEqual(1);
    }
    expect(Object.values(BASIC_ATTACKS).filter((a) => a.speciesId === 'pyro')).toHaveLength(1);
  });
  it('is always available: no resonance cost, no skill slot, works with resonance 0', () => {
    const { b } = start();
    const pyro = pyroOf(b);
    pyro.resonance = 0;
    expect(pyro.abilities).not.toContain('attack.pyro.basic');
    const enemy = living(b, 'enemy')[0]!;
    enemy.x = pyro.x;
    enemy.y = pyro.y - 1;
    expect(setMode(b, 'basic').ok).toBe(true);
    expect(validTiles(b, pyro.id, 'basic').has(`${enemy.x}:${enemy.y}`)).toBe(true);
    const hpBefore = enemy.hp;
    expect(tile(b, enemy.x, enemy.y).ok).toBe(true);
    expect(pyro.resonance).toBe(0);
    expect(enemy.hp).toBe(hpBefore - (2 + pyro.attackBonus));
    expect(b.acted[pyro.id]).toBe(true);
  });
  it('checks range in the rule core and refuses targets beyond it', () => {
    const { b } = start();
    const pyro = pyroOf(b);
    const enemy = living(b, 'enemy')[0]!;
    enemy.x = pyro.x;
    enemy.y = pyro.y - 2; // Flammenklaue: Reichweite 1
    setMode(b, 'basic');
    expect(validTiles(b, pyro.id, 'basic').size).toBe(0);
    const r = tile(b, enemy.x, enemy.y);
    expect(r.ok).toBe(false);
    expect(r.message).toMatch(/reicht/);
    expect(b.acted[pyro.id]).toBeUndefined();
  });
  it('damage is computed only in the rule core (analysed target, ignite bonus) and emitted as event', () => {
    const { b } = start();
    const pyro = pyroOf(b);
    const enemy = living(b, 'enemy')[0]!;
    enemy.x = pyro.x + 1;
    enemy.y = pyro.y;
    enemy.analyzed = 2;
    pyro.buff = 2;
    enemy.hp = 20;
    enemy.maxHp = 20;
    setMode(b, 'basic');
    expect(tile(b, enemy.x, enemy.y).ok).toBe(true);
    const ev = b.events.find((e) => e.type === 'basic-attack')!;
    expect(ev).toBeDefined();
    expect(ev.ability).toBe('attack.pyro.basic');
    expect(ev.targetId).toBe(enemy.id);
    expect(ev.amount).toBe(2 + pyro.attackBonus + 2 + 2);
    expect(enemy.hp).toBe(20 - ev.amount!);
    expect(pyro.buff).toBe(0);
  });
  it('lumi reaches two fields, enemies have no basic attack, waiting still works', () => {
    const { b } = start(ENCOUNTER_WORKSHOP);
    const lumi = b.units.find((u) => u.speciesId === 'lumi')!;
    const enemy = living(b, 'enemy')[0]!;
    enemy.x = lumi.x;
    enemy.y = lumi.y - 2;
    select(b, lumi.id);
    expect(setMode(b, 'basic').ok).toBe(true);
    expect(validTiles(b, lumi.id, 'basic').has(`${enemy.x}:${enemy.y}`)).toBe(true);
    expect(enemy.basicAttack).toBeNull();
    expect(wait(b).ok).toBe(true);
  });
});
