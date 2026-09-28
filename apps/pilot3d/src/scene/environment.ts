import type { BoardConfig } from '@knowsters/content';
import { isGateCell } from '@knowsters/rules';
import { Color3, CreateBox, CreateCylinder, CreateGround, CreateSphere, Mesh, PBRMaterial, PointLight, StandardMaterial, TransformNode, Vector3, type AbstractMesh, type Scene } from '../babylon';
import type { AssetRegistry } from '../assets/registry';
import { TILE, boardToWorld, type Stage } from './setup';

export type TileMode = 'none' | 'move' | 'target' | 'selected' | 'hazard' | 'trace' | 'wall';

export interface Arena {
  kind: 'procedural' | 'glb';
  key: string;
  root: TransformNode;
  tiles: Map<string, Mesh>;
  setTile(x: number, y: number, mode: TileMode): void;
  clearTiles(): void;
  lamps: PointLight[];
}

const key = (x: number, y: number) => `${x}:${y}`;

function pbr(scene: Scene, name: string, albedo: string, metallic: number, roughness: number, emissive?: string, emissiveStrength = 1): PBRMaterial {
  const m = new PBRMaterial(name, scene);
  m.albedoColor = Color3.FromHexString(albedo);
  m.metallic = metallic;
  m.roughness = roughness;
  if (emissive) m.emissiveColor = Color3.FromHexString(emissive).scale(emissiveStrength);
  m.environmentIntensity = 0.6;
  return m;
}

/** Viele kleine Einzelteile zu einem Mesh verschmelzen (Draw Calls). */
function merge(name: string, parts: Mesh[], parent: TransformNode): Mesh | null {
  if (!parts.length) return null;
  const m = Mesh.MergeMeshes(parts, true, true, undefined, false, true);
  if (m) {
    m.name = name;
    m.isPickable = false;
    m.parent = parent;
  }
  return m;
}

interface TileLayer {
  tiles: Map<string, Mesh>;
  setTile(x: number, y: number, mode: TileMode): void;
  clearTiles(): void;
}

/**
 * Feldebene: pickbare Felder + Highlight-Materialien. `visibleBase` = Felder sind sichtbare
 * Metallplatten (prozedurale Arena); sonst sind sie unsichtbar und erscheinen nur als Highlight
 * über dem Boden des Arena-GLB (Raster nur kontextuell, Bible §5).
 */
function createTileLayer(stage: Stage, board: BoardConfig, root: TransformNode, visibleBase: boolean): TileLayer {
  const { scene } = stage;
  const cols = board.width;
  const rows = board.height;
  const matPlate = pbr(scene, 'plate', '#2a3946', 0.55, 0.62);
  const matPlateAlt = pbr(scene, 'plateAlt', '#233240', 0.6, 0.58);
  const matGate = pbr(scene, 'gate', '#3a3a30', 0.5, 0.5, '#f2d08d', 0.35);
  const mats: Record<TileMode, PBRMaterial | null> = {
    none: null,
    move: pbr(scene, 'tileMove', '#1a4b58', 0.3, 0.6, '#3fc9d8', 0.7),
    target: pbr(scene, 'tileTarget', '#5a2f18', 0.3, 0.6, '#ff7a3a', 0.8),
    selected: pbr(scene, 'tileSel', '#2b4b5a', 0.3, 0.6, '#9ff5fb', 0.35),
    hazard: pbr(scene, 'tileHazard', '#4a2412', 0.2, 0.8, '#ff6a2d', 2.2),
    trace: pbr(scene, 'tileTrace', '#4a4020', 0.2, 0.7, '#f2d08d', 1.4),
    wall: pbr(scene, 'tileWall', '#2f5a3e', 0.2, 0.8, '#73eaa0', 0.9),
  };
  const tiles = new Map<string, Mesh>();
  const baseMats = new Map<string, PBRMaterial>();
  const height = visibleBase ? 0.08 : 0.03;
  // GLB-Arena: Spielfläche liegt laut Exportvertrag bei Y = 0; Highlights schweben knapp darüber.
  const lift = visibleBase ? 0 : 0.02;
  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < cols; x++) {
      const p = boardToWorld(cols, rows, x, y);
      const tile = CreateBox(`tile-${x}-${y}`, { width: TILE * 0.94, depth: TILE * 0.94, height }, scene);
      tile.position = new Vector3(p.x, lift + height / 2, p.z);
      const base = isGateCell(board, x, y) ? matGate : (x + y) % 2 ? matPlate : matPlateAlt;
      tile.material = base;
      baseMats.set(key(x, y), base);
      tile.receiveShadows = visibleBase;
      tile.isVisible = visibleBase;
      tile.metadata = { tile: { x, y } };
      tile.parent = root;
      tiles.set(key(x, y), tile);
    }
  }
  const current = new Map<string, TileMode>();
  const setTile = (x: number, y: number, mode: TileMode) => {
    const t = tiles.get(key(x, y));
    if (!t) return;
    current.set(key(x, y), mode);
    const m = mats[mode];
    t.material = m ?? baseMats.get(key(x, y)) ?? matPlate;
    const raised = mode === 'move' || mode === 'target' || mode === 'selected';
    t.position.y = lift + height / 2 + (raised ? 0.02 : 0);
    if (!visibleBase) t.isVisible = mode !== 'none';
  };
  const clearTiles = () => {
    for (const k of current.keys()) {
      const [x, y] = k.split(':').map(Number) as [number, number];
      setTile(x, y, 'none');
    }
    current.clear();
  };
  return { tiles, setTile, clearTiles };
}

/**
 * Werkhalle Lichtquell (Bible §5/§6, Auftrag Phase E), PROZEDURALER PLATZHALTER bis
 * `environments/workshop/workshop_arena.glb` existiert: Metallplatten mit Lichtfugen als Raster,
 * Maschinenband, Fenster, Lampen, Werkbank/Kisten als Hindernisse.
 */
export function buildWorkshopArena(stage: Stage, board: BoardConfig, arenaKey = 'placeholder.arena.procedural'): Arena {
  const { scene, shadows, glow } = stage;
  const root = new TransformNode('arena', scene);
  const cols = board.width;
  const rows = board.height;
  const layer = createTileLayer(stage, board, root, true);

  const matSeam = pbr(scene, 'seam', '#0b1a24', 0.3, 0.7, '#5de5f1', 0.45);
  const matSeamDim = pbr(scene, 'seamDim', '#0b1a24', 0.3, 0.7, '#123a44', 0.35);
  const bolts: Mesh[] = [];
  const seamsBright: Mesh[] = [];
  const seamsDim: Mesh[] = [];

  // Hallenboden unter den Platten
  const floor = CreateGround('floor', { width: cols * TILE + 14, height: rows * TILE + 16 }, scene);
  floor.material = pbr(scene, 'floor', '#101b25', 0.4, 0.85);
  floor.receiveShadows = true;
  floor.position.y = -0.06;
  floor.isPickable = false;
  floor.parent = root;

  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < cols; x++) {
      const p = boardToWorld(cols, rows, x, y);
      // Schrauben in den Ecken (kleine Details, kein Raster-Look)
      for (const [sx, sz] of [[-0.4, -0.4], [0.4, 0.4]] as const) {
        const bolt = CreateCylinder(`bolt-${x}-${y}-${sx}`, { diameter: 0.06, height: 0.02, tessellation: 8 }, scene);
        bolt.position = new Vector3(p.x + sx, 0.09, p.z + sz);
        bolts.push(bolt);
      }
    }
  }
  // Lichtfugen: jede dritte Reihe/Spalte leuchtet, die anderen bleiben dunkel
  for (let x = 0; x <= cols; x++) {
    const seam = CreateBox(`seamx-${x}`, { width: 0.06, depth: rows * TILE, height: 0.02 }, scene);
    seam.position = new Vector3((x - cols / 2) * TILE, 0.01, 0);
    (x % 3 === 0 ? seamsBright : seamsDim).push(seam);
  }
  for (let y = 0; y <= rows; y++) {
    const seam = CreateBox(`seamz-${y}`, { width: cols * TILE, depth: 0.06, height: 0.02 }, scene);
    seam.position = new Vector3(0, 0.01, (rows / 2 - y) * TILE);
    (y % 3 === 1 ? seamsBright : seamsDim).push(seam);
  }
  const boltMesh = merge('bolts', bolts, root);
  if (boltMesh) boltMesh.material = matSeamDim;
  const seamBrightMesh = merge('seamsBright', seamsBright, root);
  if (seamBrightMesh) seamBrightMesh.material = matSeam;
  const seamDimMesh = merge('seamsDim', seamsDim, root);
  if (seamDimMesh) seamDimMesh.material = matSeamDim;

  // Hindernisse aus dem Brett: Kisten
  const matCrate = pbr(scene, 'crate', '#4a3a2b', 0.05, 0.85);
  const matCrateTop = pbr(scene, 'crateTop', '#5c4936', 0.05, 0.8);
  const matBand = pbr(scene, 'band', '#f2c66d', 0.4, 0.5, '#f2c66d', 0.6);
  for (const o of board.obstacles) {
    const p = boardToWorld(cols, rows, o.x, o.y);
    const crate = CreateBox(`crate-${o.x}-${o.y}`, { width: 0.78, depth: 0.78, height: 0.62 }, scene);
    crate.position = new Vector3(p.x, 0.39, p.z);
    crate.material = matCrate;
    const lid = CreateBox(`lid-${o.x}-${o.y}`, { width: 0.82, depth: 0.82, height: 0.08 }, scene);
    lid.position = new Vector3(p.x, 0.72, p.z);
    lid.material = matCrateTop;
    const strap = CreateBox(`strap-${o.x}-${o.y}`, { width: 0.84, depth: 0.1, height: 0.64 }, scene);
    strap.position = new Vector3(p.x, 0.4, p.z);
    strap.material = matBand;
    for (const m of [crate, lid, strap]) {
      shadows.addShadowCaster(m);
      m.isPickable = false;
      m.parent = root;
    }
  }

  // Rückwand mit Fenstern und Maschinenband (Gegnerseite)
  const backZ = (rows / 2) * TILE + 1.2;
  const wall = CreateBox('wall', { width: cols * TILE + 6, depth: 0.5, height: 4.2 }, scene);
  wall.position = new Vector3(0, 2.1, backZ);
  wall.material = pbr(scene, 'wallMat', '#1a2a38', 0.2, 0.9);
  wall.receiveShadows = true;
  wall.isPickable = false;
  wall.parent = root;
  const matWindow = pbr(scene, 'window', '#c9a35a', 0.1, 0.4, '#e8b25a', 0.55);
  const matWindowDark = pbr(scene, 'windowDark', '#22384a', 0.2, 0.6);
  for (let i = 0; i < 6; i++) {
    const w = CreateBox(`win-${i}`, { width: 0.9, depth: 0.06, height: 1.1 }, scene);
    w.position = new Vector3((i - 2.5) * 1.5, 2.9, backZ - 0.28);
    w.material = i % 2 === 0 ? matWindow : matWindowDark;
    w.isPickable = false;
    w.parent = root;
  }
  const band = CreateBox('band', { width: cols * TILE + 6, depth: 0.7, height: 0.9 }, scene);
  band.position = new Vector3(0, 0.45, backZ - 0.55);
  band.material = pbr(scene, 'bandMat', '#24384a', 0.6, 0.5);
  band.isPickable = false;
  band.parent = root;
  shadows.addShadowCaster(band);
  const ledsOn: Mesh[] = [];
  const ledsOff: Mesh[] = [];
  for (let i = 0; i < 9; i++) {
    const led = CreateBox(`led-${i}`, { width: 0.4, depth: 0.05, height: 0.06 }, scene);
    led.position = new Vector3((i - 4) * 0.95, 0.72, backZ - 0.92);
    (i % 3 === 0 ? ledsOn : ledsOff).push(led);
  }
  const ledOnMesh = merge('ledsOn', ledsOn, root);
  if (ledOnMesh) ledOnMesh.material = matSeam;
  const ledOffMesh = merge('ledsOff', ledsOff, root);
  if (ledOffMesh) ledOffMesh.material = matSeamDim;
  // Energieleitung über der Arena
  const cable = CreateCylinder('cable', { diameter: 0.05, height: cols * TILE + 6, tessellation: 6 }, scene);
  cable.rotation.z = Math.PI / 2;
  cable.position = new Vector3(0, 3.6, 0.5);
  cable.material = matSeam;
  cable.isPickable = false;
  cable.parent = root;

  // Seitliche Werkbank + Regal (links/rechts, außerhalb des Bretts)
  const sideX = (cols / 2) * TILE + 1.1;
  for (const s of [-1, 1] as const) {
    const bench = CreateBox(`bench-${s}`, { width: 0.9, depth: 3.2, height: 0.8 }, scene);
    bench.position = new Vector3(s * sideX, 0.4, -0.5);
    bench.material = pbr(scene, `benchMat${s}`, '#30414d', 0.6, 0.55);
    bench.isPickable = false;
    bench.parent = root;
    shadows.addShadowCaster(bench);
    const top = CreateBox(`benchTop-${s}`, { width: 0.98, depth: 3.3, height: 0.08 }, scene);
    top.position = new Vector3(s * sideX, 0.84, -0.5);
    top.material = pbr(scene, `benchTop${s}`, '#3d525f', 0.7, 0.4);
    top.isPickable = false;
    top.parent = root;
    for (let i = 0; i < 3; i++) {
      const tool = CreateBox(`tool-${s}-${i}`, { width: 0.25, depth: 0.4, height: 0.18 }, scene);
      tool.position = new Vector3(s * sideX + (i - 1) * 0.2, 0.97, -1.4 + i * 0.9);
      tool.material = i === 1 ? matBand : matSeamDim;
      tool.isPickable = false;
      tool.parent = root;
    }
  }

  // Laternen mit Punktlicht
  const lamps: PointLight[] = [];
  const matPost = pbr(scene, 'post', '#1a2733', 0.6, 0.5);
  const matBulb = new StandardMaterial('bulb', scene);
  matBulb.emissiveColor = new Color3(1, 0.94, 0.78);
  matBulb.disableLighting = true;
  for (const s of [-1, 1] as const) {
    const post = CreateCylinder(`post-${s}`, { diameter: 0.12, height: 3.2, tessellation: 8 }, scene);
    post.position = new Vector3(s * (sideX - 0.2), 1.6, (rows / 2) * TILE + 0.4);
    post.material = matPost;
    post.isPickable = false;
    post.parent = root;
    const bulb = CreateSphere(`bulb-${s}`, { diameter: 0.28, segments: 8 }, scene);
    bulb.position = new Vector3(post.position.x, 3.25, post.position.z);
    bulb.material = matBulb;
    bulb.isPickable = false;
    bulb.parent = root;
    const light = new PointLight(`lamp-${s}`, bulb.position.clone(), scene);
    light.diffuse = new Color3(1, 0.85, 0.6);
    light.intensity = 6;
    light.range = 9;
    lamps.push(light);
  }
  glow.intensity = 0.65;

  return { kind: 'procedural', key: arenaKey, root, tiles: layer.tiles, setTile: layer.setTile, clearTiles: layer.clearTiles, lamps };
}

/**
 * Arena aus dem Manifest laden (Issue #3, Punkt 3): `workshop_arena.glb`, sobald vorhanden, sonst die
 * prozedurale Werkhalle. Exportvertrag: Ursprung = Brettmitte, Boden bei Y = 0, 1 Einheit = 1 Feld,
 * Reihe 0 (Gegnerseite) in +Z. Lichter aus KHR_lights_punctual werden übernommen.
 */
export async function loadArena(stage: Stage, board: BoardConfig, registry: AssetRegistry, requested = 'arena.workshop'): Promise<Arena> {
  const res = await registry.resolveArena(requested);
  if (!res.container) return buildWorkshopArena(stage, board, res.key);
  const { scene, shadows } = stage;
  const container = res.container;
  container.addAllToScene();
  const root = new TransformNode('arena', scene);
  for (const n of container.rootNodes) {
    n.parent = root;
  }
  root.scaling.setAll(res.spec.scale ?? 1);
  root.rotation.y = res.spec.yawOffset ?? 0;
  const meshes: AbstractMesh[] = container.meshes.filter((m) => m.getTotalVertices() > 0);
  for (const m of meshes) {
    m.isPickable = false;
    m.receiveShadows = true;
    shadows.addShadowCaster(m);
  }
  root.computeWorldMatrix(true);
  // Deckt die Arena das Brett ab? (Diagnose statt stiller Lücke)
  let minX = Infinity, maxX = -Infinity, minZ = Infinity, maxZ = -Infinity;
  for (const m of meshes) {
    m.computeWorldMatrix(true);
    const b = m.getBoundingInfo().boundingBox;
    minX = Math.min(minX, b.minimumWorld.x);
    maxX = Math.max(maxX, b.maximumWorld.x);
    minZ = Math.min(minZ, b.minimumWorld.z);
    maxZ = Math.max(maxZ, b.maximumWorld.z);
  }
  const halfW = (board.width * TILE) / 2;
  const halfD = (board.height * TILE) / 2;
  if (minX > -halfW || maxX < halfW || minZ > -halfD || maxZ < halfD) {
    registry.report({ level: 'warn', asset: res.key, message: `Arena deckt das Brett nicht ab: X ${minX.toFixed(1)}…${maxX.toFixed(1)}, Z ${minZ.toFixed(1)}…${maxZ.toFixed(1)}; Brett ±${halfW}×±${halfD}` });
  }
  registry.report({ level: 'info', asset: res.key, message: `Arena-GLB: ${meshes.length} Meshes, ${container.materials.length} Materialien, ${container.lights.length} Lichter` });
  const layer = createTileLayer(stage, board, root, false);
  const lamps = container.lights.filter((l): l is PointLight => l instanceof PointLight);
  return { kind: 'glb', key: res.key, root, tiles: layer.tiles, setTile: layer.setTile, clearTiles: layer.clearTiles, lamps };
}
