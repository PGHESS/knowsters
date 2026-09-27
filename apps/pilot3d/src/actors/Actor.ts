import { AbstractMesh, AnimationGroup, Color3, Mesh, MeshBuilder, PBRMaterial, Scene, SceneLoader, StandardMaterial, TransformNode, Vector3 } from '@babylonjs/core';
import type { Stage } from '../scene/setup';

/** Animationsvertrag (Bible §7). Fehlende Clips werden prozedural überlagert und im Log markiert. */
export type Clip = 'idle' | 'move' | 'basic_attack' | 'hit' | 'defend' | 'skill_01' | 'skill_02' | 'skill_03' | 'skill_04' | 'victory' | 'down' | 'command';
export type ActorState = 'idle' | 'move' | 'attack' | 'hit' | 'command' | 'down';
interface Phase {
  dur: number;
  from: number;
  to: number;
  ease: 'in' | 'out' | 'lin';
  impact?: boolean;
}

export interface ModelSpec {
  file: string;
  placeholder: boolean;
  scale: number;
  tint: string | null;
  anims: Partial<Record<Clip, string | null>>;
  /** Drehung des Modells, damit „vorn“ = +Z (Platzhalter sind unterschiedlich orientiert). */
  yawOffset?: number;
  /** Optionales Eigenleuchten (z. B. Rauschen-Gegner). */
  emissive?: string | null;
}

const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

/**
 * Ein Actor = Root-Node auf dem Brett + geladenes GLB + Animation-State-Machine.
 * Zustände: Idle ⇄ Move, Idle → Attack → Recovery → Idle, Idle → Hit → Idle, Idle → Command → Idle.
 * Übergänge sind Crossfades über AnimationGroup-Gewichte; keine harten Pose-Sprünge.
 * Attack/Hit/Command ohne eigenen Clip laufen als prozedurale Overlays auf dem Root (Lunge, Rückstoß, Heben).
 */
export class Actor {
  readonly root: TransformNode;
  readonly body: TransformNode;
  private meshes: AbstractMesh[] = [];
  private groups = new Map<Clip, AnimationGroup>();
  private weights = new Map<AnimationGroup, number>();
  private current: AnimationGroup | null = null;
  state: ActorState = 'idle';
  private yaw = 0;
  private targetYaw = 0;
  private flash: PBRMaterial[] = [];
  private flashT = 0;
  readonly missingClips: Clip[] = [];
  private shadowMesh: AbstractMesh | null = null;
  /** Bodenanker (Kontaktschatten), z. B. als Partikel-Emitter. */
  anchor: AbstractMesh | null = null;
  private baseAlbedo: Color3[] = [];

  constructor(
    private readonly stage: Stage,
    readonly id: string,
    readonly spec: ModelSpec,
    readonly height = 0.8,
  ) {
    this.root = new TransformNode(`actor-${id}`, stage.scene);
    this.body = new TransformNode(`body-${id}`, stage.scene);
    this.body.parent = this.root;
    this.root.metadata = { unit: id };
  }

  async load(assetBase: string): Promise<void> {
    const url = `${assetBase}${this.spec.file}`;
    const dir = url.slice(0, url.lastIndexOf('/') + 1);
    const file = url.slice(url.lastIndexOf('/') + 1);
    const result = await SceneLoader.ImportMeshAsync('', dir, file, this.stage.scene);
    const rootMesh = result.meshes[0] as AbstractMesh;
    rootMesh.parent = this.body;
    rootMesh.scaling.scaleInPlace(this.spec.scale);
    this.body.rotation.y = this.spec.yawOffset ?? 0;
    this.meshes = result.meshes;
    for (const m of result.meshes) {
      m.isPickable = true;
      m.metadata = { unit: this.id };
      if (m.material instanceof PBRMaterial) {
        this.flash.push(m.material);
        this.baseAlbedo.push(m.material.albedoColor.clone());
        if (this.spec.tint) m.material.albedoColor = Color3.FromHexString(this.spec.tint).scale(1.1);
        if (this.spec.emissive) m.material.emissiveColor = Color3.FromHexString(this.spec.emissive).scale(0.12);
      }
      if (m.getTotalVertices() > 0) {
        this.stage.shadows.addShadowCaster(m, true);
        m.receiveShadows = false;
        this.stage.glow.addExcludedMesh(m as Mesh);
      }
    }
    // Kontaktschatten (Bible §4: eindeutige Bodenverankerung)
    const blob = MeshBuilder.CreateDisc(`blob-${this.id}`, { radius: 0.34, tessellation: 24 }, this.stage.scene);
    blob.rotation.x = Math.PI / 2;
    blob.position.y = 0.085;
    const bm = new StandardMaterial(`blobMat-${this.id}`, this.stene());
    bm.diffuseColor = Color3.Black();
    bm.emissiveColor = Color3.Black();
    bm.alpha = 0.38;
    bm.disableLighting = true;
    blob.material = bm;
    blob.isPickable = false;
    blob.parent = this.root;
    this.shadowMesh = blob;
    this.anchor = blob;
    // Animationen: alle Gruppen parallel laufen lassen, Gewichte steuern die Mischung
    for (const g of result.animationGroups) g.stop();
    for (const [clip, name] of Object.entries(this.spec.anims) as [Clip, string | null][]) {
      const g = name === '*' ? result.animationGroups[0] : result.animationGroups.find((x) => x.name === name);
      if (g) this.groups.set(clip, g);
      else this.missingClips.push(clip);
    }
    for (const clip of ['basic_attack', 'hit', 'command'] as Clip[]) if (!this.groups.has(clip) && !this.missingClips.includes(clip)) this.missingClips.push(clip);
    for (const g of new Set(this.groups.values())) {
      g.play(true);
      g.setWeightForAllAnimatables(0);
      this.weights.set(g, 0);
    }
    this.play('idle');
    this.stage.scene.onBeforeRenderObservable.add(() => this.tick(this.stage.engine.getDeltaTime() / 1000));
  }

  private stene(): Scene {
    return this.stage.scene;
  }

  private play(clip: Clip, speed = 1): boolean {
    let g = this.groups.get(clip);
    if (!g && clip === 'idle') {
      // Platzhalter ohne Idle-Clip: Bewegungsclip sehr langsam als Gewichtsverlagerung statt T-Pose
      g = this.groups.get('move');
      speed = 0.22;
    }
    if (!g) return false;
    g.speedRatio = speed;
    this.current = g;
    return true;
  }

  /** Crossfade der Gewichte + Kopfdrehung + Flash-Abklingen. */
  private tick(dt: number): void {
    const k = Math.min(1, dt * 9);
    for (const [g, w] of this.weights) {
      const target = g === this.current ? 1 : 0;
      const nw = lerp(w, target, k);
      this.weights.set(g, nw);
      g.setWeightForAllAnimatables(nw);
    }
    this.yaw = lerp(this.yaw, this.targetYaw, Math.min(1, dt * 10));
    this.root.rotation.y = this.yaw;
    if (this.flashT > 0) {
      this.flashT = Math.max(0, this.flashT - dt * 5);
      this.flash.forEach((m) => (m.emissiveColor = new Color3(1, 0.85, 0.7).scale(this.flashT)));
    }
    if (this.shadowMesh) this.shadowMesh.position.y = 0.085 - this.root.position.y * 0 + 0;
  }

  setPosition(p: Vector3): void {
    this.root.position.copyFrom(p);
    this.root.position.y = 0.08;
  }

  faceToward(p: Vector3): void {
    const dx = p.x - this.root.position.x;
    const dz = p.z - this.root.position.z;
    if (Math.abs(dx) + Math.abs(dz) < 0.01) return;
    this.targetYaw = Math.atan2(dx, dz);
  }

  /** Idle → Move → Idle mit weichem Abbremsen. */
  moveTo(target: Vector3, onDone?: () => void): void {
    const start = this.root.position.clone();
    const end = target.clone();
    end.y = 0.08;
    this.faceToward(end);
    this.state = 'move';
    this.play('move', 1.2);
    const dist = Vector3.Distance(start, end);
    const dur = Math.max(0.35, dist * 0.28);
    let t = 0;
    const obs = this.stage.scene.onBeforeRenderObservable.add(() => {
      t += this.stage.engine.getDeltaTime() / 1000 / dur;
      const e = t >= 1 ? 1 : t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2; // easeInOutQuad
      this.root.position.x = lerp(start.x, end.x, e);
      this.root.position.z = lerp(start.z, end.z, e);
      this.body.position.y = Math.sin(Math.min(1, t) * Math.PI) * 0.06;
      if (t >= 1) {
        this.stage.scene.onBeforeRenderObservable.remove(obs);
        this.body.position.y = 0;
        this.state = 'idle';
        this.play('idle');
        onDone?.();
      }
    });
  }

  /** Idle → Attack (Anticipation → Lunge → Hit-Stop → Recovery) → Idle. */
  attack(target: Vector3, onImpact: () => void, onDone?: () => void): void {
    this.faceToward(target);
    this.state = 'attack';
    const hasClip = this.play('basic_attack', 1.6);
    const dir = target.subtract(this.root.position);
    dir.y = 0;
    const len = dir.length() || 1;
    dir.scaleInPlace(1 / len);
    const lunge = Math.min(0.45, len * 0.4);
    const phases: Phase[] = [
      { dur: 0.16, from: 0, to: -0.14, ease: 'out' },
      { dur: 0.1, from: -0.14, to: lunge, ease: 'in', impact: true },
      { dur: 0.07, from: lunge, to: lunge, ease: 'lin' },
      { dur: 0.24, from: lunge, to: 0, ease: 'out' },
    ];
    this.runPhases(phases, dir, () => {
      this.state = 'idle';
      this.play('idle');
      onDone?.();
    }, onImpact, hasClip);
  }

  /** Cast ohne Ortswechsel (Signature-Skill): Aufrichten + Leuchten. */
  cast(target: Vector3 | null, onImpact: () => void, onDone?: () => void): void {
    if (target) this.faceToward(target);
    this.state = 'attack';
    this.play('basic_attack', 0.9);
    const up = new Vector3(0, 1, 0);
    this.runPhases([
      { dur: 0.18, from: 0, to: 0.16, ease: 'out', impact: true },
      { dur: 0.26, from: 0.16, to: 0, ease: 'out' },
    ], up, () => {
      this.state = 'idle';
      this.play('idle');
      onDone?.();
    }, onImpact, false);
    this.flashT = 0.9;
  }

  /** Beschwörer-Kommando: Arm-/Körper-Heben als Overlay, Leuchten. */
  command(onImpact: () => void, onDone?: () => void): void {
    this.state = 'command';
    this.play('command', 1) || this.play('move', 0.6);
    this.runPhases([
      { dur: 0.22, from: 0, to: 0.22, ease: 'out' },
      { dur: 0.12, from: 0.22, to: 0.22, ease: 'lin', impact: true },
      { dur: 0.3, from: 0.22, to: 0, ease: 'out' },
    ], new Vector3(0, 1, 0), () => {
      this.state = 'idle';
      this.play('idle');
      onDone?.();
    }, onImpact, false);
  }

  /** Idle → Hit (Flash, Rückstoß weg vom Angreifer, Zittern) → Idle. */
  hit(from: Vector3, onDone?: () => void): void {
    this.state = 'hit';
    this.flashT = 1;
    this.play('hit', 1) || this.play('idle');
    const dir = this.root.position.subtract(from);
    dir.y = 0;
    const len = dir.length() || 1;
    dir.scaleInPlace(1 / len);
    this.runPhases([
      { dur: 0.07, from: 0, to: 0.18, ease: 'out' },
      { dur: 0.08, from: 0.18, to: -0.05, ease: 'lin' },
      { dur: 0.16, from: -0.05, to: 0, ease: 'out' },
    ], dir, () => {
      this.state = 'idle';
      this.play('idle');
      onDone?.();
    });
  }

  down(onDone?: () => void): void {
    this.state = 'down';
    this.play('down', 1) || this.play('idle', 0.4);
    let t = 0;
    const obs = this.stage.scene.onBeforeRenderObservable.add(() => {
      t += this.stage.engine.getDeltaTime() / 1000 / 0.45;
      const e = Math.min(1, t);
      this.body.scaling.setAll(lerp(1, 0.001, e * e));
      this.body.rotation.x = e * 0.6;
      if (t >= 1) {
        this.stage.scene.onBeforeRenderObservable.remove(obs);
        onDone?.();
      }
    });
  }

  dispose(): void {
    for (const m of this.meshes) m.dispose();
    this.shadowMesh?.dispose();
    this.root.dispose();
  }

  private runPhases(
    phases: Phase[],
    dir: Vector3,
    onDone: () => void,
    onImpact?: () => void,
    _hasClip = false,
  ): void {
    let i = 0;
    let t = 0;
    let impacted = false;
    const base = this.body.position.clone();
    const obs = this.stage.scene.onBeforeRenderObservable.add(() => {
      const ph = phases[i];
      if (!ph) return;
      t += this.stage.engine.getDeltaTime() / 1000;
      const u = Math.min(1, t / ph.dur);
      const e = ph.ease === 'in' ? u * u : ph.ease === 'out' ? 1 - (1 - u) * (1 - u) : u;
      const off = lerp(ph.from, ph.to, e);
      this.body.position.copyFrom(base.add(dir.scale(off)));
      if (ph.impact && !impacted && u >= 1) {
        impacted = true;
        onImpact?.();
      }
      if (u >= 1) {
        i++;
        t = 0;
        if (i >= phases.length) {
          this.stage.scene.onBeforeRenderObservable.remove(obs);
          this.body.position.copyFrom(base);
          onDone();
        }
      }
    });
  }
}
