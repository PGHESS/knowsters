import { Color3, Color4, CreateSphere, ParticleSystem, StandardMaterial, Texture, Vector3, type Scene } from '../babylon';

/** Weiche runde Partikeltextur, prozedural (kein Asset nötig). */
let flare: Texture | null = null;
function flareTexture(scene: Scene): Texture {
  if (flare) return flare;
  const size = 64;
  const c = document.createElement('canvas');
  c.width = size;
  c.height = size;
  const ctx = c.getContext('2d')!;
  const g = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  g.addColorStop(0, 'rgba(255,255,255,1)');
  g.addColorStop(0.35, 'rgba(255,255,255,0.7)');
  g.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, size, size);
  flare = new Texture(c.toDataURL(), scene, false, false);
  flare.hasAlpha = true;
  return flare;
}

function burst(scene: Scene, pos: Vector3, color1: string, color2: string, count: number, speed: number, life: number, size: number, gravity = -2): void {
  const ps = new ParticleSystem(`burst-${Date.now()}`, count, scene);
  ps.particleTexture = flareTexture(scene);
  ps.emitter = pos.clone();
  ps.minEmitBox = new Vector3(-0.1, 0, -0.1);
  ps.maxEmitBox = new Vector3(0.1, 0.2, 0.1);
  ps.color1 = Color4.FromHexString(color1 + 'ff');
  ps.color2 = Color4.FromHexString(color2 + 'ff');
  ps.colorDead = new Color4(0, 0, 0, 0);
  ps.minSize = size * 0.5;
  ps.maxSize = size;
  ps.minLifeTime = life * 0.5;
  ps.maxLifeTime = life;
  ps.emitRate = count * 4;
  ps.blendMode = ParticleSystem.BLENDMODE_ADD;
  ps.gravity = new Vector3(0, gravity, 0);
  ps.direction1 = new Vector3(-1, 1, -1);
  ps.direction2 = new Vector3(1, 2.2, 1);
  ps.minEmitPower = speed * 0.5;
  ps.maxEmitPower = speed;
  ps.updateSpeed = 0.012;
  ps.targetStopDuration = 0.18;
  ps.disposeOnStop = true;
  ps.start();
}

export const VFX = {
  /** vfx.fire.hit.small */
  fireHit(scene: Scene, pos: Vector3): void {
    burst(scene, pos.add(new Vector3(0, 0.5, 0)), '#ffd27d', '#ff5a1f', 40, 2.4, 0.5, 0.28);
  },
  /** vfx.light.hit.small */
  lightHit(scene: Scene, pos: Vector3): void {
    burst(scene, pos.add(new Vector3(0, 0.5, 0)), '#ffffff', '#f2d08d', 30, 1.8, 0.45, 0.24, -0.5);
  },
  /** vfx.enemy.hit */
  enemyHit(scene: Scene, pos: Vector3): void {
    burst(scene, pos.add(new Vector3(0, 0.5, 0)), '#ff9fd0', '#b271e8', 30, 2, 0.45, 0.24);
  },
  /** vfx.command.rally */
  rally(scene: Scene, pos: Vector3): void {
    burst(scene, pos.add(new Vector3(0, 0.2, 0)), '#e2c8ff', '#b271e8', 60, 2.6, 0.8, 0.22, -0.8);
  },
  /** vfx.fire.trail: dauerhafte Glut auf einem Feld, bis dispose. */
  ember(scene: Scene, pos: Vector3): ParticleSystem {
    const ps = new ParticleSystem(`ember-${pos.x}-${pos.z}`, 60, scene);
    ps.particleTexture = flareTexture(scene);
    ps.emitter = pos.add(new Vector3(0, 0.1, 0));
    ps.minEmitBox = new Vector3(-0.38, 0, -0.38);
    ps.maxEmitBox = new Vector3(0.38, 0.05, 0.38);
    ps.color1 = Color4.FromHexString('#ffd27dff');
    ps.color2 = Color4.FromHexString('#ff6a2dff');
    ps.colorDead = new Color4(0.2, 0, 0, 0);
    ps.minSize = 0.08;
    ps.maxSize = 0.2;
    ps.minLifeTime = 0.5;
    ps.maxLifeTime = 1.1;
    ps.emitRate = 38;
    ps.blendMode = ParticleSystem.BLENDMODE_ADD;
    ps.gravity = new Vector3(0, 0.6, 0);
    ps.direction1 = new Vector3(-0.2, 0.6, -0.2);
    ps.direction2 = new Vector3(0.2, 1.2, 0.2);
    ps.minEmitPower = 0.3;
    ps.maxEmitPower = 0.7;
    ps.updateSpeed = 0.012;
    ps.start();
    return ps;
  },
  /** Element-Aura eines Actors (Idle-VFX, Bible §7). */
  aura(scene: Scene, color: string): ParticleSystem {
    const ps = new ParticleSystem(`aura-${Math.random()}`, 24, scene);
    ps.particleTexture = flareTexture(scene);
    ps.minEmitBox = new Vector3(-0.25, 0, -0.25);
    ps.maxEmitBox = new Vector3(0.25, 0.4, 0.25);
    ps.color1 = Color4.FromHexString(color + 'cc');
    ps.color2 = Color4.FromHexString(color + '66');
    ps.colorDead = new Color4(0, 0, 0, 0);
    ps.minSize = 0.05;
    ps.maxSize = 0.12;
    ps.minLifeTime = 0.8;
    ps.maxLifeTime = 1.6;
    ps.emitRate = 10;
    ps.blendMode = ParticleSystem.BLENDMODE_ADD;
    ps.gravity = new Vector3(0, 0.35, 0);
    ps.direction1 = new Vector3(-0.1, 0.3, -0.1);
    ps.direction2 = new Vector3(0.1, 0.6, 0.1);
    ps.minEmitPower = 0.1;
    ps.maxEmitPower = 0.25;
    ps.updateSpeed = 0.012;
    ps.start();
    return ps;
  },
  /** Projektil (Fokusstrahl u. ä.): leuchtende Kugel fliegt zum Ziel. */
  projectile(scene: Scene, from: Vector3, to: Vector3, color: string, onArrive: () => void): void {
    const orb = CreateSphere('orb', { diameter: 0.18, segments: 8 }, scene);
    const m = new StandardMaterial('orbMat', scene);
    m.emissiveColor = Color3.FromHexString(color);
    m.disableLighting = true;
    orb.material = m;
    orb.isPickable = false;
    const a = from.add(new Vector3(0, 0.55, 0));
    const b = to.add(new Vector3(0, 0.5, 0));
    let t = 0;
    const obs = scene.onBeforeRenderObservable.add(() => {
      t += scene.getEngine().getDeltaTime() / 1000 / 0.24;
      const e = Math.min(1, t);
      orb.position = Vector3.Lerp(a, b, e);
      orb.position.y += Math.sin(e * Math.PI) * 0.5;
      if (t >= 1) {
        scene.onBeforeRenderObservable.remove(obs);
        orb.dispose();
        onArrive();
      }
    });
  },
};
