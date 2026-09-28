import type { Engine, Scene } from './babylon';

/**
 * Quality-Presets und Frame-Pacing (Issue #3, Punkt 6).
 *
 *   high        Ziel 60 fps, volle Schatten (1024, weich), Glow, Render-DPR bis 2
 *   balanced    Ziel 60 fps, Schatten 512 hart, kleinerer Glow, Render-DPR bis 1.5
 *   fallback30  feste 30 fps mit stabilem Pacing, Schatten 512 hart, kein Glow, Render-DPR bis 1.25
 *
 * Der Governor startet bei `high` und stuft ab, wenn der gemessene Durchschnitt zweimal hinter-
 * einander (je 3 s) unter der Schwelle liegt. Unruhige 40–50 fps landen so in festen 30 fps
 * statt zu flackern. Aufwärts wird nie automatisch gestuft (kein Ping-Pong); `?quality=` setzt fest.
 */
export type QualityPreset = 'high' | 'balanced' | 'fallback30';

export interface QualitySettings {
  label: string;
  targetFps: 60 | 30;
  /** Obergrenze des effektiven Device-Pixel-Ratio beim Rendern (Hardware-Scaling = 1/min(DPR, dprCap)). */
  dprCap: number;
  shadowMapSize: number;
  shadowBlur: boolean;
  glow: boolean;
  glowKernel: number;
  particles: boolean;
}

export const PRESETS: Record<QualityPreset, QualitySettings> = {
  high: { label: 'High', targetFps: 60, dprCap: 2, shadowMapSize: 1024, shadowBlur: true, glow: true, glowKernel: 48, particles: true },
  balanced: { label: 'Balanced', targetFps: 60, dprCap: 1.5, shadowMapSize: 512, shadowBlur: false, glow: true, glowKernel: 24, particles: true },
  fallback30: { label: '30 fps', targetFps: 30, dprCap: 1.25, shadowMapSize: 512, shadowBlur: false, glow: false, glowKernel: 16, particles: true },
};

export const PRESET_ORDER: QualityPreset[] = ['high', 'balanced', 'fallback30'];

export const isPreset = (v: string | null): v is QualityPreset => v !== null && v in PRESETS;

/**
 * Eigener Render-Loop statt `engine.runRenderLoop`: rendert nur, wenn seit dem letzten Bild
 * mindestens 1000/targetFps ms vergangen sind. `engine.beginFrame()` misst die Frame-Zeit selbst,
 * deshalb bleibt `getDeltaTime()` bei 30 fps korrekt (33 ms) und Animationen laufen in Echtzeit.
 * Der Rest (`elapsed % interval`) wird verrechnet, damit die Bildabstände nicht driften.
 */
export class FrameLoop {
  private handle = 0;
  private last = 0;
  targetFps: number;
  /** Anzahl gerenderter Bilder (Overlay/Test). */
  frames = 0;

  constructor(
    private readonly engine: Engine,
    private readonly scene: Scene,
    targetFps: number,
  ) {
    this.targetFps = targetFps;
  }

  start(): void {
    const step = (now: number) => {
      this.handle = requestAnimationFrame(step);
      const interval = 1000 / this.targetFps;
      const elapsed = now - this.last;
      if (elapsed < interval - 1.5) return;
      this.last = now - (elapsed % interval);
      if (!this.scene.activeCamera) return;
      this.engine.beginFrame();
      this.scene.render();
      this.engine.endFrame();
      this.frames++;
    };
    this.handle = requestAnimationFrame(step);
  }

  stop(): void {
    cancelAnimationFrame(this.handle);
  }
}

export interface QualityHost {
  engine: Engine;
  applyQuality(q: QualitySettings): void;
}

export interface GovernorOptions {
  initial: QualityPreset;
  auto: boolean;
  onChange?: (preset: QualityPreset, reason: string) => void;
}

export class QualityGovernor {
  current: QualityPreset;
  reason: string;
  readonly auto: boolean;
  readonly history: { at: number; preset: QualityPreset; reason: string; fpsAvg?: number }[] = [];
  private samples: number[] = [];
  private lowWindows = 0;
  private appliedAt = 0;
  private timer = 0;
  private readonly onChange: GovernorOptions['onChange'];

  constructor(
    private readonly host: QualityHost,
    private readonly loop: FrameLoop,
    opts: GovernorOptions,
  ) {
    this.current = opts.initial;
    this.auto = opts.auto;
    this.onChange = opts.onChange;
    this.reason = opts.auto ? 'Start (auto)' : 'per URL/Chip festgelegt';
    this.apply(opts.initial, this.reason);
  }

  get settings(): QualitySettings {
    return PRESETS[this.current];
  }

  apply(preset: QualityPreset, reason: string, fpsAvg?: number): void {
    this.current = preset;
    this.reason = reason;
    this.host.applyQuality(PRESETS[preset]);
    this.loop.targetFps = PRESETS[preset].targetFps;
    this.appliedAt = performance.now();
    this.samples = [];
    this.lowWindows = 0;
    this.history.push({ at: Math.round(this.appliedAt), preset, reason, fpsAvg });
    this.onChange?.(preset, reason);
  }

  start(): void {
    if (this.timer) return;
    this.timer = window.setInterval(() => this.tick(), 500);
  }

  /** Alle 500 ms: 6 Messwerte = 3-s-Fenster. Warmlaufzeit nach jedem Wechsel 4 s (Shader, Ladephasen). */
  private tick(): void {
    if (!this.auto || document.hidden) return;
    if (performance.now() - this.appliedAt < 4000) return;
    this.samples.push(this.host.engine.getFps());
    if (this.samples.length < 6) return;
    const avg = this.samples.reduce((a, b) => a + b, 0) / this.samples.length;
    this.samples = [];
    const target = PRESETS[this.current].targetFps;
    const threshold = target === 60 ? 54 : 27;
    if (avg < threshold) this.lowWindows++;
    else this.lowWindows = 0;
    if (this.lowWindows < 2) return;
    const next = PRESET_ORDER[PRESET_ORDER.indexOf(this.current) + 1];
    if (!next) {
      this.lowWindows = 0;
      return;
    }
    this.apply(next, `Ø ${avg.toFixed(0)} fps < ${threshold} bei ${PRESETS[this.current].label}`, avg);
  }
}
