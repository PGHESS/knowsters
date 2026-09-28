/**
 * Animationsvertrag (Bible §7) und Runtime-Manifest (Issue #3, Punkte 3–5).
 *
 * DOM- und Babylon-frei, damit die Auflösung in Vitest testbar ist. Der Pilot bindet den Vertrag
 * strikt an: Produktionsassets ohne Pflichtclip erzeugen eine Diagnose auf Stufe `error`
 * (Abnahme blockiert), Platzhalter dürfen Clips fehlen (prozedurale Overlays, Stufe `info`).
 */

export type Clip =
  | 'idle'
  | 'move'
  | 'basic_attack'
  | 'hit'
  | 'defend'
  | 'skill_01'
  | 'skill_02'
  | 'skill_03'
  | 'skill_04'
  | 'victory'
  | 'down'
  | 'command';

export type ModelRole = 'creature' | 'human';

/** Pflichtclips je Rolle (Issue #3, Punkt 4). Clip-Namen im GLB = Vertragsnamen. */
export const REQUIRED_CLIPS: Record<ModelRole, readonly Clip[]> = {
  creature: ['idle', 'move', 'basic_attack', 'hit', 'skill_04', 'down'],
  human: ['idle', 'move', 'command'],
};

/** Optionale Clips: werden genutzt, wenn vorhanden; ihr Fehlen ist nur eine Info. */
export const OPTIONAL_CLIPS: Record<ModelRole, readonly Clip[]> = {
  creature: ['defend', 'skill_01', 'skill_02', 'skill_03', 'victory'],
  human: ['victory', 'down'],
};

/**
 * glTF-Erweiterungen, die der Pilot registriert (siehe `src/babylon.ts`). Ein GLB, dessen
 * `extensionsRequired` etwas anderes verlangt, lädt nicht und muss neu exportiert werden.
 */
export const SUPPORTED_GLTF_EXTENSIONS: readonly string[] = [
  'KHR_materials_emissive_strength',
  'KHR_texture_transform',
  'KHR_mesh_quantization',
  'KHR_materials_unlit',
  'KHR_lights_punctual',
  'EXT_texture_webp',
];

/** Exportregeln (Bible §11/§14, Issue #3): Blickrichtung +Z, Bodenlinie Y = 0, 1 Einheit = 1 Feldmeter. */
export const EXPORT_RULES = {
  forward: '+Z',
  floorY: 0,
  unitsPerTile: 1,
  /** Plausible Modellhöhe in Metern je Rolle (für die GLB-Prüfung, keine Stilvorgabe). */
  heightRange: { creature: [0.5, 1.8], human: [1.5, 2.0] } as Record<ModelRole, [number, number]>,
  /** Dreiecksbudget je Modell (Mobile). Überschreitung ist eine Warnung, kein Fehler. */
  triangleBudget: { creature: 20000, human: 25000 } as Record<ModelRole, number>,
  maxTextureSize: 2048,
} as const;

export interface ModelSpec {
  role: ModelRole;
  /** Pfad relativ zu `assets/`. */
  file: string;
  /** true = technischer Platzhalter (keine Aussage zur Zielgrafik); fehlende Clips sind erlaubt. */
  placeholder: boolean;
  scale: number;
  /** Albedo-Tönung nur für Platzhalter. Produktionsassets bringen ihre Materialien mit. */
  tint?: string | null;
  emissive?: string | null;
  /** Drehung, damit „vorn“ = +Z (Platzhalter sind unterschiedlich orientiert). */
  yawOffset?: number;
  /**
   * Vertragsname → Clip-Name im GLB. Fehlt der Eintrag, gilt der Vertragsname selbst (Produktions-
   * konvention). `null` = ausdrücklich nicht vorhanden. `*` = erste AnimationGroup.
   */
  anims?: Partial<Record<Clip, string | null>>;
  /** Schlüssel eines Ersatzmodells, wenn die Datei fehlt (Produktion → Platzhalter). */
  fallback?: string;
  source?: string;
  note?: string;
}

export interface ArenaSpec {
  /** null = prozedural (siehe scene/environment.ts). */
  file: string | null;
  placeholder: boolean;
  scale?: number;
  yawOffset?: number;
  fallback?: string;
  source?: string;
  note?: string;
}

export interface Manifest {
  version: number;
  models: Record<string, ModelSpec>;
  environments: Record<string, ArenaSpec>;
}

export type DiagLevel = 'info' | 'warn' | 'error';

export interface Diagnostic {
  level: DiagLevel;
  /** Manifest-Schlüssel oder Dateiname. */
  asset: string;
  message: string;
}

export interface ClipResolution {
  /** Vertragsname → tatsächlicher Clip-Name im GLB. */
  clips: Partial<Record<Clip, string>>;
  missingRequired: Clip[];
  missingOptional: Clip[];
  /** Clips im GLB, die kein Vertragsname anspricht. */
  unused: string[];
  diagnostics: Diagnostic[];
}

/** Vertragsclips einer Modellbeschreibung gegen die im GLB vorhandenen AnimationGroups auflösen. */
export function resolveClips(key: string, spec: ModelSpec, available: readonly string[]): ClipResolution {
  const clips: Partial<Record<Clip, string>> = {};
  const missingRequired: Clip[] = [];
  const missingOptional: Clip[] = [];
  const diagnostics: Diagnostic[] = [];
  const used = new Set<string>();
  const required = REQUIRED_CLIPS[spec.role];
  const find = (clip: Clip): string | undefined => {
    const mapped = spec.anims?.[clip];
    if (mapped === null) return undefined;
    const name = mapped === undefined ? clip : mapped;
    if (name === '*') return available[0];
    return available.includes(name) ? name : undefined;
  };
  for (const clip of [...required, ...OPTIONAL_CLIPS[spec.role]]) {
    const name = find(clip);
    if (name !== undefined) {
      clips[clip] = name;
      used.add(name);
    } else if (required.includes(clip)) missingRequired.push(clip);
    else missingOptional.push(clip);
  }
  const unused = available.filter((n) => !used.has(n));
  if (missingRequired.length) {
    diagnostics.push(
      spec.placeholder
        ? { level: 'info', asset: key, message: `Platzhalter ohne Clips ${missingRequired.join(', ')} – prozedurale Overlays aktiv` }
        : { level: 'error', asset: key, message: `Pflichtclips fehlen: ${missingRequired.join(', ')} (Vertrag ${spec.role}: ${required.join(', ')}) – Abnahme blockiert` },
    );
  }
  if (!spec.placeholder && missingOptional.length) diagnostics.push({ level: 'info', asset: key, message: `optionale Clips fehlen: ${missingOptional.join(', ')}` });
  if (!spec.placeholder && unused.length) diagnostics.push({ level: 'info', asset: key, message: `Clips ohne Vertragsnamen (ungenutzt): ${unused.join(', ')}` });
  return { clips, missingRequired, missingOptional, unused, diagnostics };
}

/** Auflösungskette eines Schlüssels: Produktion → Fallback → … (ohne Zyklen). */
export function resolutionChain<T extends { fallback?: string }>(table: Record<string, T>, key: string): string[] {
  const chain: string[] = [];
  const seen = new Set<string>();
  let k: string | undefined = key;
  while (k && !seen.has(k) && table[k]) {
    chain.push(k);
    seen.add(k);
    k = table[k]!.fallback;
  }
  return chain;
}

/** Strukturprüfung des Manifests (unabhängig von Dateien auf dem Server). */
export function validateManifest(m: Manifest): Diagnostic[] {
  const out: Diagnostic[] = [];
  if (m.version !== 2) out.push({ level: 'error', asset: 'manifest', message: `Manifest-Version ${String(m.version)} – erwartet 2` });
  for (const [key, spec] of Object.entries(m.models ?? {})) {
    if (!spec.role || !(spec.role in REQUIRED_CLIPS)) out.push({ level: 'error', asset: key, message: `Rolle fehlt oder unbekannt: ${String(spec.role)}` });
    if (!spec.file) out.push({ level: 'error', asset: key, message: 'Datei fehlt' });
    if (!(spec.scale > 0)) out.push({ level: 'error', asset: key, message: `scale ungültig: ${String(spec.scale)}` });
    if (spec.fallback) {
      const fb = m.models[spec.fallback];
      if (!fb) out.push({ level: 'error', asset: key, message: `Fallback ${spec.fallback} existiert nicht` });
      else if (fb.role !== spec.role) out.push({ level: 'error', asset: key, message: `Fallback ${spec.fallback} hat Rolle ${fb.role}, erwartet ${spec.role}` });
      const chain = resolutionChain(m.models, key);
      const last = m.models[chain[chain.length - 1]!]!;
      if (last.fallback && !chain.includes(last.fallback)) out.push({ level: 'error', asset: key, message: 'Fallback-Kette bricht ab' });
    }
    if (spec.placeholder && !spec.source) out.push({ level: 'warn', asset: key, message: 'Platzhalter ohne Quellenangabe (THIRD_PARTY_ASSETS.md)' });
    if (!spec.placeholder && (spec.tint || spec.emissive)) out.push({ level: 'warn', asset: key, message: 'tint/emissive auf einem Produktionsasset – Materialien sollen aus dem GLB kommen' });
  }
  for (const [key, spec] of Object.entries(m.environments ?? {})) {
    if (spec.fallback && !m.environments[spec.fallback]) out.push({ level: 'error', asset: key, message: `Fallback ${spec.fallback} existiert nicht` });
    if (spec.file === null && !spec.placeholder) out.push({ level: 'error', asset: key, message: 'Arena ohne Datei muss als Platzhalter markiert sein' });
  }
  return out;
}

export const formatDiagnostic = (d: Diagnostic): string => `[${d.level}] ${d.asset}: ${d.message}`;
