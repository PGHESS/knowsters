import { SceneInstrumentation, type BaseTexture, type Engine, type Scene } from '../babylon';
import type { AssetRegistry } from '../assets/registry';
import type { FrameLoop, QualityGovernor } from '../quality';

/**
 * Performance-Overlay (Auftrag Phase F, Issue #3 Punkt 7): FPS, Renderer, Draw Calls, Dreiecke,
 * Texturspeicher (Schätzung), Skelette, DPR / Hardware-Scaling, Quality-Preset, Bundle- und
 * Asset-Größe (Resource Timing bzw. Registry), Diagnosen. Werte werden gemessen, nicht erfunden.
 */
export class Metrics {
  private readonly instr: SceneInstrumentation;
  private readonly el: HTMLElement;
  private samples: number[] = [];
  readonly caseLabel: string;

  constructor(
    private readonly engine: Engine,
    private readonly scene: Scene,
    caseLabel: string,
    private readonly registry: AssetRegistry,
    private readonly governor: QualityGovernor,
    private readonly loop: FrameLoop,
  ) {
    this.instr = new SceneInstrumentation(scene);
    this.instr.captureFrameTime = true;
    this.instr.captureRenderTime = true;
    this.el = document.getElementById('metrics') as HTMLElement;
    this.el.hidden = false;
    this.caseLabel = caseLabel;
    setInterval(() => this.render(), 500);
  }

  /** Build-Info (vite.config.ts schreibt bundle-info.json): Gesamtgröße aller JS-Chunks des Builds. */
  private buildInfo: { jsKB: number; gzipKB: number; chunks: number; entryKB: number } | null = null;

  loadBuildInfo(base: string): void {
    fetch(`${base}bundle-info.json`).then((r) => (r.ok ? r.json() : null)).then((j) => { if (j) this.buildInfo = j; }).catch(() => undefined);
  }

  /** Zur Laufzeit geladene JS-Chunks aus dem Resource-Timing (0 KB = aus dem Browser-Cache, dann zählt nur die Anzahl). */
  bundle(): { files: number; decodedKB: number; transferKB: number } {
    let decoded = 0;
    let transfer = 0;
    let files = 0;
    for (const e of performance.getEntriesByType('resource') as PerformanceResourceTiming[]) {
      if (!/\.js(\?|$)/.test(e.name)) continue;
      files++;
      decoded += e.decodedBodySize || 0;
      transfer += e.transferSize || 0;
    }
    return { files, decodedKB: Math.round(decoded / 1024), transferKB: Math.round(transfer / 1024) };
  }

  snapshot() {
    const gl = this.engine.getGlInfo();
    // Texturen: Szene + Materialien (Container-Texturen stehen nicht in scene.textures). Gezählt wird
    // je GPU-Textur (InternalTexture): geklonte Material-Texturen teilen sich dieselbe GPU-Textur.
    const wrappers = new Set<BaseTexture>(this.scene.textures);
    for (const m of this.scene.materials) for (const t of m.getActiveTextures()) wrappers.add(t);
    const gpu = new Map<number, BaseTexture>();
    for (const t of wrappers) {
      const it = t.getInternalTexture();
      gpu.set(it ? it.uniqueId : -t.uniqueId, t);
    }
    let texBytes = 0;
    for (const t of gpu.values()) {
      const s = t.getSize();
      texBytes += s.width * s.height * 4;
    }
    const activeSkeletons = this.scene.skeletons.filter((s) => s.bones.length > 0).length;
    const playing = this.scene.animationGroups.filter((g) => g.isPlaying).length;
    const fps = this.engine.getFps();
    this.samples.push(fps);
    if (this.samples.length > 60) this.samples.shift();
    const avg = this.samples.reduce((a, b) => a + b, 0) / this.samples.length;
    const min = Math.min(...this.samples);
    const assets = this.registry.summary();
    const bundle = this.bundle();
    return {
      case: this.caseLabel,
      quality: this.governor.current,
      qualityReason: this.governor.reason,
      qualityAuto: this.governor.auto,
      targetFps: this.loop.targetFps,
      fps: Math.round(fps),
      fpsAvg30s: Math.round(avg),
      fpsMin30s: Math.round(min),
      frameMs: this.instr.frameTimeCounter.lastSecAverage.toFixed(1),
      renderMs: this.instr.renderTimeCounter.lastSecAverage.toFixed(1),
      drawCalls: this.instr.drawCallsCounter.current,
      triangles: Math.round(this.scene.getActiveIndices() / 3),
      meshes: this.scene.getActiveMeshes().length,
      texturesMB: (texBytes / 1048576).toFixed(1),
      textures: gpu.size,
      textureWrappers: wrappers.size,
      skeletons: activeSkeletons,
      animGroupsPlaying: playing,
      particles: this.scene.particleSystems.length,
      dpr: window.devicePixelRatio,
      hwScaling: this.engine.getHardwareScalingLevel().toFixed(2),
      renderSize: `${this.engine.getRenderWidth()}×${this.engine.getRenderHeight()}`,
      webgl: this.engine.webGLVersion,
      gpu: gl.renderer,
      bundleJsKB: bundle.decodedKB,
      bundleTransferKB: bundle.transferKB,
      bundleFiles: bundle.files,
      build: this.buildInfo,
      glbFiles: assets.files,
      glbMB: (assets.bytes / 1048576).toFixed(2),
      glbInstances: assets.instances,
      diagnostics: { errors: this.registry.errors.length, warnings: this.registry.warnings.length, total: this.registry.diagnostics.length },
    };
  }

  private render(): void {
    const s = this.snapshot();
    const diag = s.diagnostics.errors ? `✖ ${s.diagnostics.errors} Fehler` : s.diagnostics.warnings ? `⚠ ${s.diagnostics.warnings} Hinweise` : '✓ keine Diagnosen';
    this.el.textContent = [
      `${s.case} · ${s.fps} fps (Ø ${s.fpsAvg30s}, min ${s.fpsMin30s}) · Ziel ${s.targetFps}`,
      `quality ${s.quality}${s.qualityAuto ? ' (auto)' : ''} · ${s.qualityReason}`,
      `frame ${s.frameMs} ms · render ${s.renderMs} ms`,
      `draw calls ${s.drawCalls} · tris ${s.triangles} · meshes ${s.meshes}`,
      `textures ≈ ${s.texturesMB} MB · skeletons ${s.skeletons} · anims ${s.animGroupsPlaying} · particles ${s.particles}`,
      `js loaded ${s.bundleFiles} chunks ${s.bundleJsKB ? `${s.bundleJsKB} KB (transfer ${s.bundleTransferKB} KB)` : '(cache)'}${s.build ? ` · build ${s.build.jsKB} KB / gz ${s.build.gzipKB} KB in ${s.build.chunks}` : ''}`,
      `glb ${s.glbFiles} files ${s.glbMB} MB → ${s.glbInstances} instances · gpu textures ${s.textures} (${s.textureWrappers} refs)`,
      `${s.renderSize} · DPR ${s.dpr} · scaling ${s.hwScaling} · WebGL${s.webgl} · ${diag}`,
      `${String(s.gpu).slice(0, 44)}`,
    ].join('\n');
  }
}
