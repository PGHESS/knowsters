import { describe, expect, it } from 'vitest';
import { clear, moveToward, route, safePoint, walkable, type TerrainMap } from '../src';

const map: TerrainMap = {
  id: 'test-yard',
  ground: [[[5, 10], [95, 10], [95, 90], [5, 90]]],
  solid: [[[40, 30], [60, 30], [60, 70], [40, 70]]],
  spawn: [20, 50],
};

describe('terrain', () => {
  it('walkable respects ground and solid polygons', () => {
    expect(walkable(map, [20, 50])).toBe(true);
    expect(walkable(map, [50, 50])).toBe(false);
    expect(walkable(map, [2, 50])).toBe(false);
  });
  it('routes around the solid block and every hop is clear', () => {
    const path = route(map, [20, 50], [80, 50]);
    expect(path.length).toBeGreaterThan(2);
    for (let i = 1; i < path.length; i++) expect(clear(map, path[i - 1]!, path[i]!)).toBe(true);
    expect(path[path.length - 1]).toEqual([80, 50]);
  });
  it('safePoint snaps into the yard, moveToward slides along edges', () => {
    const p = safePoint(map, [50, 50]);
    expect(walkable(map, p)).toBe(true);
    const moved = moveToward(map, [30, 50], [55, 50]);
    expect(walkable(map, moved)).toBe(true);
    expect(moved[0]).toBeLessThan(40);
  });
});
