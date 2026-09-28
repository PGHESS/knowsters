import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { OPTIONAL_CLIPS, REQUIRED_CLIPS, SUPPORTED_GLTF_EXTENSIONS, resolutionChain, resolveClips, validateManifest, type Manifest, type ModelSpec } from '../src/assets/contract';

const here = dirname(fileURLToPath(import.meta.url));
const manifest = JSON.parse(readFileSync(resolve(here, '../../game/public/assets/manifests/pilot.json'), 'utf8')) as Manifest;

const production = (over: Partial<ModelSpec> = {}): ModelSpec => ({ role: 'creature', file: 'models/creatures/pyro/pyro.glb', placeholder: false, scale: 1, ...over });
const placeholder = (over: Partial<ModelSpec> = {}): ModelSpec => ({ role: 'creature', file: 'models/placeholders/fox.glb', placeholder: true, scale: 0.01, source: 'Khronos', anims: { idle: 'Survey', move: 'Run', basic_attack: 'Run', hit: null }, ...over });

describe('Animationsvertrag (Issue #3, Punkt 4/5)', () => {
  it('Produktionsasset mit allen Pflichtclips: keine Fehler, Clip-Namen = Vertragsnamen', () => {
    const r = resolveClips('creature.pyro', production(), ['idle', 'move', 'basic_attack', 'hit', 'skill_04', 'down']);
    expect(r.missingRequired).toEqual([]);
    expect(r.clips).toEqual({ idle: 'idle', move: 'move', basic_attack: 'basic_attack', hit: 'hit', skill_04: 'skill_04', down: 'down' });
    expect(r.diagnostics.filter((d) => d.level === 'error')).toEqual([]);
    expect(r.missingOptional).toEqual([...OPTIONAL_CLIPS.creature]);
  });
  it('Produktionsasset ohne Pflichtclip: Diagnose error (Abnahme blockiert), kein stiller Fallback', () => {
    const r = resolveClips('creature.pyro', production(), ['idle', 'move', 'basic_attack', 'skill_04', 'down']);
    expect(r.missingRequired).toEqual(['hit']);
    const err = r.diagnostics.find((d) => d.level === 'error');
    expect(err).toBeDefined();
    expect(err!.message).toMatch(/hit/);
    expect(err!.message).toMatch(/Abnahme blockiert/);
  });
  it('Produktionsasset: ungenutzte Clips werden gemeldet (Tippfehler im Export sichtbar)', () => {
    const r = resolveClips('creature.pyro', production(), ['idle', 'move', 'basic_attack', 'hit', 'skill_04', 'down', 'Basic_Attack', 'attack']);
    expect(r.unused).toEqual(['Basic_Attack', 'attack']);
    expect(r.diagnostics.some((d) => d.level === 'info' && /ungenutzt/.test(d.message))).toBe(true);
  });
  it('Platzhalter: fehlende Clips sind nur eine Info; explizites null zählt als fehlend', () => {
    const r = resolveClips('placeholder.fox.pyro', placeholder(), ['Survey', 'Walk', 'Run']);
    expect(r.clips.idle).toBe('Survey');
    expect(r.clips.move).toBe('Run');
    expect(r.missingRequired).toEqual(['hit', 'skill_04', 'down']);
    expect(r.diagnostics.every((d) => d.level === 'info')).toBe(true);
  });
  it('`*` nimmt die erste AnimationGroup (CesiumMan ohne Clip-Namen)', () => {
    const r = resolveClips('placeholder.cesium-man', placeholder({ role: 'human', anims: { idle: null, move: '*', command: null } }), ['']);
    expect(r.clips.move).toBe('');
    expect(r.missingRequired).toEqual(['idle', 'command']);
  });
  it('Mensch-Vertrag: idle, move, command sind Pflicht', () => {
    expect(REQUIRED_CLIPS.human).toEqual(['idle', 'move', 'command']);
    const r = resolveClips('human.summoner', production({ role: 'human', file: 'models/humans/base/human_base.glb' }), ['idle', 'move']);
    expect(r.missingRequired).toEqual(['command']);
  });
});

describe('Manifest v2', () => {
  it('das eingecheckte pilot.json ist strukturell gültig', () => {
    const problems = validateManifest(manifest).filter((d) => d.level !== 'info');
    expect(problems).toEqual([]);
    expect(manifest.version).toBe(2);
  });
  it('Produktionsschlüssel lösen auf Produktion → Platzhalter auf (nie umgekehrt)', () => {
    expect(resolutionChain(manifest.models, 'creature.pyro')).toEqual(['creature.pyro', 'placeholder.fox.pyro']);
    expect(resolutionChain(manifest.models, 'human.summoner')).toEqual(['human.summoner', 'placeholder.cesium-man']);
    expect(resolutionChain(manifest.environments, 'arena.workshop')).toEqual(['arena.workshop', 'placeholder.arena.procedural']);
    expect(manifest.models['creature.pyro']!.placeholder).toBe(false);
    expect(manifest.models['placeholder.fox.pyro']!.placeholder).toBe(true);
  });
  it('alle Species der Encounter haben einen Manifest-Eintrag', () => {
    for (const k of ['creature.pyro', 'creature.lumi', 'creature.terra', 'creature.nivaro', 'enemy.rush', 'enemy.flicker', 'enemy.brute', 'human.summoner']) expect(manifest.models[k], k).toBeDefined();
  });
  it('erkennt kaputte Fallbacks, falsche Rollen und Tint auf Produktionsassets', () => {
    const bad: Manifest = {
      version: 2,
      models: {
        a: production({ fallback: 'nope' }),
        b: production({ fallback: 'h' }),
        h: production({ role: 'human', tint: '#fff' }),
      },
      environments: { x: { file: null, placeholder: false } },
    };
    const msgs = validateManifest(bad).map((d) => `${d.level}:${d.asset}:${d.message}`);
    expect(msgs.some((m) => m.startsWith('error:a:') && /nope/.test(m))).toBe(true);
    expect(msgs.some((m) => m.startsWith('error:b:') && /Rolle/.test(m))).toBe(true);
    expect(msgs.some((m) => m.startsWith('warn:h:') && /tint/.test(m))).toBe(true);
    expect(msgs.some((m) => m.startsWith('error:x:'))).toBe(true);
    expect(validateManifest({ ...bad, version: 1 }).some((d) => /Version/.test(d.message))).toBe(true);
  });
});

describe('scripts/check-glb.mjs teilt den Vertrag mit dem Piloten', () => {
  const src = readFileSync(resolve(here, '../../../scripts/check-glb.mjs'), 'utf8');
  const pick = (name: string): unknown => {
    const m = src.match(new RegExp(`const ${name} = (\\{[\\s\\S]*?\\n\\});`)) ?? src.match(new RegExp(`const ${name} = (\\[[^\\]]*\\]);`));
    expect(m, `${name} im Skript`).toBeTruthy();
    return new Function(`return ${m![1]}`)();
  };
  it('REQUIRED_CLIPS und SUPPORTED_GLTF_EXTENSIONS sind identisch', () => {
    expect(pick('REQUIRED_CLIPS')).toEqual(REQUIRED_CLIPS);
    expect(pick('SUPPORTED_GLTF_EXTENSIONS')).toEqual([...SUPPORTED_GLTF_EXTENSIONS]);
  });
});
