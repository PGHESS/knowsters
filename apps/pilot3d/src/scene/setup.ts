import { ArcRotateCamera, Camera, Color3, Color4, DirectionalLight, Engine, GlowLayer, HemisphericLight, Scene, ShadowGenerator, Vector3 } from '../babylon';
import type { QualitySettings } from '../quality';

export interface Stage {
  engine: Engine;
  scene: Scene;
  camera: ArcRotateCamera;
  sun: DirectionalLight;
  shadows: ShadowGenerator;
  glow: GlowLayer;
  /** Quality-Preset zur Laufzeit anwenden (Schatten, Glow, Render-DPR). */
  applyQuality(q: QualitySettings): void;
  quality: QualitySettings;
}

/** Brett-Koordinaten → Welt: Spalte x → X, Reihe y → Z (Reihe 0 hinten = Gegnerseite). */
export const TILE = 1.0;
export const boardToWorld = (cols: number, rows: number, x: number, y: number): Vector3 =>
  new Vector3((x - (cols - 1) / 2) * TILE, 0, ((rows - 1) / 2 - y) * TILE);

/**
 * Kamera- und Lichtaufbau (Bible §2: feste, schräg von oben blickende Kampfkamera).
 * Weiches Licht: Sonne mit geblurtem Schatten, Himmel-Fill, kalte Rückseite.
 * Der Render-Loop läuft NICHT hier, sondern in `quality.ts` (FrameLoop mit Pacing).
 */
export function createStage(canvas: HTMLCanvasElement, cols: number, rows: number, initial: QualitySettings): Stage {
  const engine = new Engine(canvas, true, { preserveDrawingBuffer: false, stencil: true, antialias: true, adaptToDeviceRatio: true, powerPreference: 'high-performance' });
  const scene = new Scene(engine);
  scene.clearColor = new Color4(0.02, 0.05, 0.08, 1);
  scene.ambientColor = new Color3(0.25, 0.3, 0.36);
  scene.fogMode = Scene.FOGMODE_EXP2;
  scene.fogColor = new Color3(0.03, 0.07, 0.11);
  scene.fogDensity = 0.028;

  const target = new Vector3(0, 0.2, -0.9);
  const camera = new ArcRotateCamera('cam', -Math.PI / 2, 0.86, 12.5, target, scene);
  camera.fovMode = Camera.FOVMODE_VERTICAL_FIXED;
  camera.fov = 0.72;
  camera.minZ = 0.5;
  camera.maxZ = 60;
  camera.inputs.clear(); // feste Kamera, keine Drehung
  fitCamera(camera, engine, cols, rows);
  engine.onResizeObservable.add(() => fitCamera(camera, engine, cols, rows));

  const sky = new HemisphericLight('sky', new Vector3(0.2, 1, 0.1), scene);
  sky.intensity = 0.55;
  sky.diffuse = new Color3(0.72, 0.84, 0.96);
  sky.groundColor = new Color3(0.12, 0.16, 0.22);

  const sun = new DirectionalLight('sun', new Vector3(-0.55, -1, 0.35), scene);
  sun.position = new Vector3(6, 12, -4);
  sun.intensity = 2.2;
  sun.diffuse = new Color3(1, 0.93, 0.82);
  sun.shadowMinZ = 1;
  sun.shadowMaxZ = 40;

  const rim = new DirectionalLight('rim', new Vector3(0.4, -0.6, -1), scene);
  rim.intensity = 0.5;
  rim.diffuse = new Color3(0.45, 0.85, 1);

  const shadows = new ShadowGenerator(initial.shadowMapSize, sun);
  shadows.darkness = 0.35;
  shadows.bias = 0.0015;
  shadows.normalBias = 0.02;

  const glow = new GlowLayer('glow', scene, { mainTextureSamples: 2, blurKernelSize: initial.glowKernel });
  glow.intensity = 0.7;

  const stage: Stage = {
    engine,
    scene,
    camera,
    sun,
    shadows,
    glow,
    quality: initial,
    applyQuality(q) {
      stage.quality = q;
      const dpr = Math.min(window.devicePixelRatio || 1, q.dprCap);
      engine.setHardwareScalingLevel(1 / dpr);
      if (shadows.mapSize !== q.shadowMapSize) shadows.mapSize = q.shadowMapSize;
      if (q.shadowBlur) {
        shadows.useBlurExponentialShadowMap = true;
        shadows.blurKernel = 24;
      } else {
        shadows.useExponentialShadowMap = true;
      }
      glow.isEnabled = q.glow;
      glow.blurKernelSize = q.glowKernel;
      scene.particlesEnabled = q.particles;
      engine.resize();
    },
  };
  stage.applyQuality(initial);
  window.addEventListener('resize', () => engine.resize());
  return stage;
}

/** Portrait: das Brett soll die Breite füllen; die Kameradistanz folgt dem Seitenverhältnis. */
function fitCamera(camera: ArcRotateCamera, engine: Engine, cols: number, rows: number): void {
  const aspect = engine.getRenderWidth() / Math.max(1, engine.getRenderHeight());
  const boardW = cols * TILE + 1.6;
  const boardD = rows * TILE + 2.2;
  const tanHalf = Math.tan(camera.fov / 2);
  const byWidth = boardW / (2 * tanHalf * aspect);
  const byDepth = boardD / (2 * tanHalf);
  camera.radius = Math.max(byWidth, byDepth * 0.95) * 1.05;
}
