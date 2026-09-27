import { describe, expect, it } from 'vitest';
import { BASIC_ATTACKS, ENCOUNTER_PILOT_3D, ENCOUNTER_WORKSHOP, GUARDIANS, basicAttackDef } from '@knowsters/content';
import { createBattle, createCreature, hydrateBattle, living, nextEnemyAction, seededRng, select, setMode, tile, validTiles, wait } from '../src';
import { ENEMIES } from '@knowsters/content';

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
  it('enemies attack through their own content-defined basic attack (AI picks it)', () => {
    for (const e of Object.values(ENEMIES)) {
      const def = basicAttackDef(e.basicAttack);
      expect(def.speciesId).toBe(e.id);
      expect(def.damage).toBe(e.damage); // Pilotwerte identisch zum bisherigen Verhalten
    }
    const { b } = start();
    const pyro = pyroOf(b);
    const enemy = living(b, 'enemy')[0]!;
    enemy.x = pyro.x;
    enemy.y = pyro.y - 1;
    expect(enemy.basicAttack).toBe('attack.rush.basic');
    wait(b, pyro.id); // Gegnerphase beginnt
    const hp = pyro.hp;
    const step = nextEnemyAction(b);
    expect(step.type).toBe('attack');
    const ev = b.events.find((x) => x.type === 'enemy-hit')!;
    expect(ev.ability).toBe('attack.rush.basic');
    expect(ev.amount).toBe(basicAttackDef('attack.rush.basic').damage);
    expect(pyro.hp).toBe(hp - ev.amount!);
  });
  it('hydrating an older v30 battle without basicAttack fills it from the species', () => {
    const { b } = start();
    const raw = JSON.parse(JSON.stringify(b)) as { units: Record<string, unknown>[] };
    for (const u of raw.units) {
      delete u.basicAttack;
      if (u.kind === 'enemy') delete u.damage;
    }
    const h = hydrateBattle(raw)!;
    expect(h).not.toBeNull();
    expect(h.units.find((u) => u.speciesId === 'pyro')!.basicAttack).toBe('attack.pyro.basic');
    const enemy = h.units.find((u) => u.kind === 'enemy')!;
    expect(enemy.basicAttack).toBe('attack.rush.basic');
    expect(enemy.damage).toBe(3);
    select(h, h.units.find((u) => u.speciesId === 'pyro')!.id);
    expect(setMode(h, 'basic').ok).toBe(true);
  });
  it('lumi reaches two fields, enemies keep their attack out of the player action set, waiting still works', () => {
    const { b } = start(ENCOUNTER_WORKSHOP);
    const lumi = b.units.find((u) => u.speciesId === 'lumi')!;
    const enemy = living(b, 'enemy')[0]!;
    enemy.x = lumi.x;
    enemy.y = lumi.y - 2;
    select(b, lumi.id);
    expect(setMode(b, 'basic').ok).toBe(true);
    expect(validTiles(b, lumi.id, 'basic').has(`${enemy.x}:${enemy.y}`)).toBe(true);
    expect(enemy.basicAttack).toMatch(/^attack\.(rush|flicker|brute)\.basic$/);
    expect(enemy.abilities).toEqual([]); // kein Spielerzugriff auf Gegnerangriffe
    expect(wait(b).ok).toBe(true);
  });
});
