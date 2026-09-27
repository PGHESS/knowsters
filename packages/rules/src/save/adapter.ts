import { LEGACY_KEY, SAVE_KEY, createFreshSave, migrateLegacyV22, migrateSave } from './migrations';
import type { SaveV30 } from './schema';

/** Speicherschnittstelle (Auftrag §7): load / save / export / import. */
export interface SaveAdapter {
  load(): SaveV30 | null;
  save(state: SaveV30): void;
  export(): string;
  import(json: string): SaveV30;
  clear(): void;
}

/** Minimaler Key-Value-Speicher, kompatibel zu `localStorage`. */
export interface KeyValueStore {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

export class MemoryStore implements KeyValueStore {
  private data = new Map<string, string>();
  getItem(key: string): string | null {
    return this.data.get(key) ?? null;
  }
  setItem(key: string, value: string): void {
    this.data.set(key, value);
  }
  removeItem(key: string): void {
    this.data.delete(key);
  }
}

export class KeyValueSaveAdapter implements SaveAdapter {
  constructor(private readonly store: KeyValueStore) {}

  /** Lädt v30; fehlt er, wird einmalig ein v22-Stand migriert. */
  load(): SaveV30 | null {
    const current = safeParse(this.store.getItem(SAVE_KEY));
    if (current) return migrateSave(current);
    const legacy = safeParse(this.store.getItem(LEGACY_KEY));
    if (legacy) {
      const migrated = migrateLegacyV22(legacy);
      if (migrated) {
        this.save(migrated);
        return migrated;
      }
    }
    return null;
  }

  save(state: SaveV30): void {
    state.updatedAt = new Date().toISOString();
    this.store.setItem(SAVE_KEY, JSON.stringify(state));
  }

  export(): string {
    const s = this.load() ?? createFreshSave();
    return JSON.stringify(s, null, 2);
  }

  import(json: string): SaveV30 {
    const parsed = safeParse(json);
    const migrated = migrateSave(parsed);
    if (!migrated) throw new Error('Spielstand konnte nicht gelesen werden.');
    this.save(migrated);
    return migrated;
  }

  /** Löscht den aktuellen UND den alten v22-Stand, sonst würde der alte beim nächsten Start erneut migriert. */
  clear(): void {
    this.store.removeItem(SAVE_KEY);
    this.store.removeItem(LEGACY_KEY);
  }
}

function safeParse(text: string | null): unknown {
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}
