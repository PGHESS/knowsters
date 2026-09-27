/**
 * Begehbare Flächen als Polygone in Prozentkoordinaten (0–100), Routing per A* über ein
 * 101×101-Raster. Port von legacy/v22/terrain.js, jetzt mit übergebener Kartendefinition.
 */
export type Point = readonly [number, number];

export interface TerrainMap {
  id: string;
  ground: readonly (readonly Point[])[];
  solid: readonly (readonly Point[])[];
  spawn: Point;
  /** Seitenverhältnis-Faktor für Distanzen (x-Achse breiter als y). */
  aspect?: number;
}

const W = 101;

export const terrainDistance = (a: Point, b: Point, aspect = 1.5): number => Math.hypot((a[0] - b[0]) * aspect, a[1] - b[1]);

const bounds = (p: Point): Point => [Math.max(1.5, Math.min(98.5, Number(p[0]) || 1.5)), Math.max(5, Math.min(96, Number(p[1]) || 5))];

function inside(p: Point, polygon: readonly Point[]): boolean {
  let yes = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const a = polygon[i] as Point;
    const b = polygon[j] as Point;
    if (a[1] > p[1] !== b[1] > p[1] && p[0] < ((b[0] - a[0]) * (p[1] - a[1])) / (b[1] - a[1]) + a[0]) yes = !yes;
  }
  return yes;
}

function raw(map: TerrainMap, p: Point): boolean {
  return p[0] >= 1.5 && p[0] <= 98.5 && p[1] >= 5 && p[1] <= 96 && map.ground.some((poly) => inside(p, poly)) && !map.solid.some((poly) => inside(p, poly));
}

export function walkable(map: TerrainMap, p: Point): boolean {
  return [[0, 0], [-0.38, 0], [0.38, 0], [0, -0.55], [0, 0.55]].every(([x, y]) => raw(map, [p[0] + (x as number), p[1] + (y as number)]));
}

export function clear(map: TerrainMap, a: Point, b: Point): boolean {
  const aspect = map.aspect ?? 1.5;
  const n = Math.max(1, Math.ceil(terrainDistance(a, b, aspect) / 0.35));
  for (let i = 0; i <= n; i++) if (!walkable(map, [a[0] + ((b[0] - a[0]) * i) / n, a[1] + ((b[1] - a[1]) * i) / n])) return false;
  return true;
}

interface Grid {
  cells: Uint8Array;
  points: Point[];
}
const cache = new Map<string, Grid>();

function grid(map: TerrainMap): Grid {
  const hit = cache.get(map.id);
  if (hit) return hit;
  const aspect = map.aspect ?? 1.5;
  const cells = new Uint8Array(W * W);
  const points: Point[] = [];
  for (let y = 5; y <= 96; y++) for (let x = 2; x <= 98; x++) if (walkable(map, [x, y])) { cells[y * W + x] = 1; points.push([x, y]); }
  const start = points.reduce((a, b) => (terrainDistance(a, map.spawn, aspect) < terrainDistance(b, map.spawn, aspect) ? a : b));
  const queue = [start[1] * W + start[0]];
  const connected = new Uint8Array(W * W);
  connected[queue[0] as number] = 1;
  for (let head = 0; head < queue.length; head++) {
    const at = queue[head] as number;
    const a: Point = [at % W, Math.floor(at / W)];
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]] as const) {
      const b: Point = [a[0] + dx, a[1] + dy];
      const i = b[1] * W + b[0];
      if (cells[i] && !connected[i] && clear(map, a, b)) { connected[i] = 1; queue.push(i); }
    }
  }
  const result: Grid = { cells: connected, points: points.filter((p) => connected[p[1] * W + p[0]]) };
  cache.set(map.id, result);
  return result;
}

/** Nächster sicher begehbarer Punkt. */
export function safePoint(map: TerrainMap, p: Point): Point {
  const aspect = map.aspect ?? 1.5;
  const q = bounds(p);
  const g = grid(map);
  const near = g.points.reduce((a, b) => (terrainDistance(a, q, aspect) < terrainDistance(b, q, aspect) ? a : b));
  return walkable(map, q) && clear(map, q, near) ? q : [...near];
}

export function route(map: TerrainMap, from: Point, to: Point): Point[] {
  const aspect = map.aspect ?? 1.5;
  const dist = (a: Point, b: Point) => terrainDistance(a, b, aspect);
  const start = safePoint(map, from);
  const end = safePoint(map, to);
  if (clear(map, start, end)) return [start, end];
  const g = grid(map);
  const anchor = (p: Point) => g.points.filter((q) => dist(p, q) < 3 && clear(map, p, q)).sort((a, b) => dist(a, p) - dist(b, p))[0];
  const a = anchor(start);
  const b = anchor(end);
  if (!a || !b) return [start];
  const begin = a[1] * W + a[0];
  const goal = b[1] * W + b[0];
  const cost = new Float64Array(W * W).fill(Infinity);
  const prev = new Int32Array(W * W).fill(-1);
  const closed = new Uint8Array(W * W);
  const heap: { i: number; f: number }[] = [];
  const push = (i: number, f: number) => {
    let n = heap.length;
    heap.push({ i, f });
    while (n) {
      const p = (n - 1) >> 1;
      if ((heap[p] as { f: number }).f <= f) break;
      heap[n] = heap[p] as { i: number; f: number };
      n = p;
    }
    heap[n] = { i, f };
  };
  const pop = (): number => {
    const top = heap[0] as { i: number; f: number };
    const last = heap.pop() as { i: number; f: number };
    if (heap.length) {
      let n = 0;
      heap[0] = last;
      for (;;) {
        let c = n * 2 + 1;
        if (c >= heap.length) break;
        if (c + 1 < heap.length && (heap[c + 1] as { f: number }).f < (heap[c] as { f: number }).f) c++;
        if ((heap[c] as { f: number }).f >= last.f) break;
        heap[n] = heap[c] as { i: number; f: number };
        n = c;
      }
      heap[n] = last;
    }
    return top.i;
  };
  cost[begin] = 0;
  push(begin, dist(a, b));
  while (heap.length) {
    const i = pop();
    if (closed[i]) continue;
    if (i === goal) break;
    closed[i] = 1;
    const p: Point = [i % W, Math.floor(i / W)];
    for (let dy = -1; dy <= 1; dy++)
      for (let dx = -1; dx <= 1; dx++) {
        if (!dx && !dy) continue;
        const q: Point = [p[0] + dx, p[1] + dy];
        const j = q[1] * W + q[0];
        if (!g.cells[j] || closed[j] || !clear(map, p, q)) continue;
        const c = (cost[i] as number) + dist(p, q);
        if (c < (cost[j] as number)) { cost[j] = c; prev[j] = i; push(j, c + dist(q, b)); }
      }
  }
  if (!Number.isFinite(cost[goal])) return [start];
  const path: Point[] = [end];
  for (let i = goal; i !== -1; i = prev[i] as number) path.unshift([i % W, Math.floor(i / W)]);
  path.unshift(start);
  const smooth: Point[] = [start];
  let at = 0;
  while (at < path.length - 1) {
    let next = path.length - 1;
    while (next > at + 1 && !clear(map, path[at] as Point, path[next] as Point)) next--;
    smooth.push(path[next] as Point);
    at = next;
  }
  return smooth;
}

/** Bewegt einen Punkt Richtung Ziel, gleitet an Kanten entlang. */
export function moveToward(map: TerrainMap, from: Point, to: Point, slide = true): Point {
  const aspect = map.aspect ?? 1.5;
  const n = Math.max(1, Math.ceil(terrainDistance(from, to, aspect) / 0.3));
  let p: [number, number] = [from[0], from[1]];
  for (let i = 0; i < n; i++) {
    const dx = (to[0] - from[0]) / n;
    const dy = (to[1] - from[1]) / n;
    const next: Point = [p[0] + dx, p[1] + dy];
    if (walkable(map, next)) p = [next[0], next[1]];
    else if (slide) {
      if (walkable(map, [p[0] + dx, p[1]])) p[0] += dx;
      if (walkable(map, [p[0], p[1] + dy])) p[1] += dy;
    } else break;
  }
  return p;
}
