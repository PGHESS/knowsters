import { LoadAssetContainerAsync, type AssetContainer, type InstantiatedEntries, type Scene } from '../babylon';
import { formatDiagnostic, resolutionChain, resolveClips, type ArenaSpec, type ClipResolution, type Diagnostic, type Manifest, type ModelSpec } from './contract';

export interface LoadedGlb {
  file: string;
  bytes: number;
  container: AssetContainer;
  /** Wie oft aus diesem Container instanziiert wurde (Fall 2: 7× Fox aus EINER Datei). */
  instances: number;
}

export interface ResolvedModel {
  /** Schlüssel, der ursprünglich angefragt wurde (z. B. creature.pyro). */
  requested: string;
  /** Schlüssel, der tatsächlich geladen wurde (z. B. placeholder.fox.pyro). */
  key: string;
  spec: ModelSpec;
  container: AssetContainer;
  clips: ClipResolution;
}

export interface ResolvedArena {
  requested: string;
  key: string;
  spec: ArenaSpec;
  /** null = prozedural. */
  container: AssetContainer | null;
}

/**
 * Asset-Registry (Issue #3, Punkte 2, 3, 5): jede GLB-Datei wird genau einmal geholt und in einen
 * AssetContainer geladen; Einheiten werden daraus instanziiert (Geometrie und Texturen geteilt,
 * Skelett und Materialien je Einheit). Produktionsassets werden zuerst versucht; fehlt die Datei,
 * greift die Fallback-Kette aus dem Manifest, und das wird als Diagnose gemeldet, nie still.
 */
export class AssetRegistry {
  private readonly cache = new Map<string, Promise<LoadedGlb>>();
  private readonly availability = new Map<string, Promise<boolean>>();
  readonly files: LoadedGlb[] = [];
  readonly diagnostics: Diagnostic[] = [];
  /** requested → geladener Platzhalter-Schlüssel */
  readonly placeholdersInUse = new Map<string, string>();

  constructor(
    private readonly scene: Scene,
    readonly assetBase: string,
    readonly manifest: Manifest,
  ) {}

  report(d: Diagnostic): void {
    if (this.diagnostics.some((x) => x.level === d.level && x.asset === d.asset && x.message === d.message)) return;
    this.diagnostics.push(d);
    const line = formatDiagnostic(d);
    if (d.level === 'error') console.error(line);
    else if (d.level === 'warn') console.warn(line);
    else console.info(line);
  }

  get errors(): Diagnostic[] {
    return this.diagnostics.filter((d) => d.level === 'error');
  }

  get warnings(): Diagnostic[] {
    return this.diagnostics.filter((d) => d.level === 'warn');
  }

  /** HEAD-Anfrage: Datei vorhanden und kein HTML-Fallback (Dev-Server/Pages liefern sonst index.html oder 404). */
  exists(file: string): Promise<boolean> {
    let p = this.availability.get(file);
    if (!p) {
      p = fetch(`${this.assetBase}${file}`, { method: 'HEAD', cache: 'no-cache' })
        .then((r) => r.ok && !(r.headers.get('content-type') ?? '').includes('text/html'))
        .catch(() => false);
      this.availability.set(file, p);
    }
    return p;
  }

  /** GLB einmal holen (ArrayBuffer → exakte Bytezahl) und als AssetContainer laden. */
  glb(file: string): Promise<LoadedGlb> {
    let p = this.cache.get(file);
    if (!p) {
      p = (async () => {
        const url = `${this.assetBase}${file}`;
        const res = await fetch(url);
        if (!res.ok) throw new Error(`${file}: HTTP ${res.status}`);
        const buf = await res.arrayBuffer();
        const name = file.slice(file.lastIndexOf('/') + 1);
        const rootUrl = url.slice(0, url.lastIndexOf('/') + 1);
        const container = await LoadAssetContainerAsync(new Uint8Array(buf), this.scene, { pluginExtension: '.glb', name, rootUrl });
        const entry: LoadedGlb = { file, bytes: buf.byteLength, container, instances: 0 };
        this.files.push(entry);
        return entry;
      })();
      this.cache.set(file, p);
    }
    return p;
  }

  async resolveModel(requested: string): Promise<ResolvedModel> {
    const chain = resolutionChain(this.manifest.models, requested);
    if (!chain.length) throw new Error(`Manifest: unbekanntes Modell ${requested}`);
    for (let i = 0; i < chain.length; i++) {
      const key = chain[i]!;
      const spec = this.manifest.models[key]!;
      if (!(await this.exists(spec.file))) {
        const next = chain[i + 1];
        this.report({
          level: next ? 'warn' : 'error',
          asset: key,
          message: next ? `${spec.file} nicht vorhanden → Fallback ${next}` : `${spec.file} nicht vorhanden, kein Fallback`,
        });
        continue;
      }
      const g = await this.glb(spec.file);
      g.instances++;
      const clips = resolveClips(key, spec, g.container.animationGroups.map((a) => a.name));
      for (const d of clips.diagnostics) this.report(d);
      if (spec.placeholder) this.placeholdersInUse.set(requested, key);
      return { requested, key, spec, container: g.container, clips };
    }
    throw new Error(`Kein ladbares Modell für ${requested} (Kette: ${chain.join(' → ')})`);
  }

  async resolveArena(requested: string): Promise<ResolvedArena> {
    const chain = resolutionChain(this.manifest.environments, requested);
    if (!chain.length) throw new Error(`Manifest: unbekannte Arena ${requested}`);
    for (let i = 0; i < chain.length; i++) {
      const key = chain[i]!;
      const spec = this.manifest.environments[key]!;
      if (spec.file === null) {
        if (spec.placeholder) this.placeholdersInUse.set(requested, key);
        return { requested, key, spec, container: null };
      }
      if (!(await this.exists(spec.file))) {
        const next = chain[i + 1];
        this.report({ level: next ? 'warn' : 'error', asset: key, message: next ? `${spec.file} nicht vorhanden → Fallback ${next}` : `${spec.file} nicht vorhanden, kein Fallback` });
        continue;
      }
      const g = await this.glb(spec.file);
      g.instances++;
      if (spec.placeholder) this.placeholdersInUse.set(requested, key);
      return { requested, key, spec, container: g.container };
    }
    throw new Error(`Keine ladbare Arena für ${requested}`);
  }

  /**
   * Einheit aus dem Container erzeugen. Geometrie (VertexData) und Texturen bleiben geteilt;
   * Meshes werden geklont (Skinned Meshes können nicht instanziert werden, jede Einheit hat ihre
   * eigene Pose), Materialien werden je Einheit geklont (Treffer-Flash, Platzhalter-Tint).
   */
  instantiate(container: AssetContainer, cloneMaterials = true): InstantiatedEntries {
    return container.instantiateModelsToScene((n) => n, cloneMaterials, { doNotInstantiate: true });
  }

  summary(): { files: number; bytes: number; instances: number } {
    return {
      files: this.files.length,
      bytes: this.files.reduce((a, f) => a + f.bytes, 0),
      instances: this.files.reduce((a, f) => a + f.instances, 0),
    };
  }
}
