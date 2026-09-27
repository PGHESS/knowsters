import { SceneInstrumentation, type Engine, type Scene } from '@babylonjs/core';

/**
 * Performance-Overlay (Auftrag Phase F): FPS, Renderer, Draw Calls, Dreiecke, Texturspeicher (Schätzung),
 * animierte Skelette, DPR / Hardware-Scaling. Werte werden gemessen, nicht erfunden.
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
  ) {
    this.instr = new SceneInstrumentation(scene);
    this.instr.captureFrameTime = true;
    this.instr.captureRenderTime = true;
    this.el = document.getElementById('metrics') as HTMLElement;
    this.el.hidden = false;
    this.caseLabel = caseLabel;
    setInterval(() => this.render(), 500);
  }

  snapshot() {
    const gl = this.engine.getGlInfo();
    let texBytes = 0;
    for (const t of this.scene.textures) {
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
    return {
      case: this.caseLabel,
      fps: Math.round(fps),
      fpsAvg30s: Math.round(avg),
      fpsMin30s: Math.round(min),
      frameMs: this.instr.frameTimeCounter.lastSecAverage.toFixed(1),
      renderMs: this.instr.renderTimeCounter.lastSecAverage.toFixed(1),
      drawCalls: this.instr.drawCallsCounter.current,
      triangles: Math.round(this.scene.getActiveIndices() / 3),
      meshes: this.scene.getActiveMeshes().length,
      texturesMB: (texBytes / 1048576).toFixed(1),
      textures: this.scene.textures.length,
      skeletons: activeSkeletons,
      animGroupsPlaying: playing,
      particles: this.scene.particleSystems.length,
      dpr: window.devicePixelRatio,
      hwScaling: this.engine.getHardwareScalingLevel().toFixed(2),
      renderSize: `${this.engine.getRenderWidth()}×${this.engine.getRenderHeight()}`,
      webgl: this.engine.webGLVersion,
      gpu: gl.renderer,
    };
  }

  private render(): void {
    const s = this.snapshot();
    this.el.textContent = [
      `${s.case} · ${s.fps} fps (Ø ${s.fpsAvg30s}, min ${s.fpsMin30s})`,
      `frame ${s.frameMs} ms · render ${s.renderMs} ms`,
      `draw calls ${s.drawCalls} · tris ${s.triangles} · meshes ${s.meshes}`,
      `textures ${s.textures} ≈ ${s.texturesMB} MB · skeletons ${s.skeletons} · anims ${s.animGroupsPlaying} · particles ${s.particles}`,
      `${s.renderSize} · DPR ${s.dpr} · scaling ${s.hwScaling} · WebGL${s.webgl}`,
      `${String(s.gpu).slice(0, 44)}`,
    ].join('\n');
  }
}
