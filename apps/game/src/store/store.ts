import { encounterDef, type AgeBandId } from '@knowsters/content';
import {
  KeyValueSaveAdapter,
  applyAgeBand,
  createBattle,
  createFreshSave,
  hydrateBattle,
  type BattleState,
  type CreatureInstance,
  type SaveAdapter,
  type SaveV30,
} from '@knowsters/rules';

type Listener = (state: SaveV30) => void;

/** Ein zentraler Store (Auftrag §7). Alle Änderungen laufen über `update`, danach wird gespeichert. */
export class GameStore {
  private listeners = new Set<Listener>();

  constructor(
    public state: SaveV30,
    private readonly adapter: SaveAdapter,
  ) {}

  static boot(adapter: SaveAdapter = new KeyValueSaveAdapter(localStorage)): GameStore {
    let state: SaveV30 | null = null;
    try {
      state = adapter.load();
    } catch {
      state = null;
    }
    if (!state) {
      state = createFreshSave();
      adapter.save(state);
    }
    if (state.battle) state.battle = hydrateBattle(state.battle);
    return new GameStore(state, adapter);
  }

  subscribe(fn: Listener): () => void {
    this.listeners.add(fn);
    return () => this.listeners.delete(fn);
  }

  update(mutator: (s: SaveV30) => void): void {
    mutator(this.state);
    this.persist();
  }

  persist(): void {
    try {
      this.adapter.save(this.state);
    } catch (e) {
      console.warn('Speichern fehlgeschlagen', e);
    }
    for (const fn of this.listeners) fn(this.state);
  }

  exportJson(): string {
    return this.adapter.export();
  }

  importJson(json: string): void {
    this.state = this.adapter.import(json);
    if (this.state.battle) this.state.battle = hydrateBattle(this.state.battle);
    for (const fn of this.listeners) fn(this.state);
  }

  reset(): void {
    this.state = createFreshSave();
    this.persist();
  }

  // ---- Bequeme Zugriffe

  team(): CreatureInstance[] {
    return this.state.team.map((id) => this.state.creatures[id]).filter((c): c is CreatureInstance => !!c);
  }

  creature(id: string | null): CreatureInstance | null {
    return id ? (this.state.creatures[id] ?? null) : null;
  }

  companion(): CreatureInstance | null {
    return this.creature(this.state.companionId) ?? this.team()[0] ?? null;
  }

  flag(key: string): string | number | boolean | undefined {
    return this.state.flags[key];
  }

  setFlag(key: string, value: string | number | boolean): void {
    this.update((s) => {
      s.flags[key] = value;
    });
  }

  /** Alter ist nur die Startschätzung; bearbeitete Fächer behalten ihren Stand. */
  setAgeBand(band: AgeBandId | null): void {
    this.update((s) => {
      s.player.ageBand = band;
      applyAgeBand(s.player.knowledge, band);
    });
  }

  // ---- Kampf

  startBattle(encounterId: string): BattleState {
    const encounter = encounterDef(encounterId);
    const battle = createBattle(encounter, this.team(), { turnOrder: this.state.settings.turnOrder });
    this.update((s) => {
      s.battle = battle;
    });
    return battle;
  }

  /** Nach jeder Kampfaktion aufrufen: Zustand bleibt reload-fest. */
  saveBattle(): void {
    this.persist();
  }

  finishBattle(): { result: 'won' | 'lost'; rewardSkillPoints: number } | null {
    const battle = this.state.battle;
    if (!battle || !battle.result) return null;
    const encounter = encounterDef(battle.encounterId);
    const result = battle.result;
    this.update((s) => {
      if (result === 'won') {
        for (const c of this.team()) c.skillPoints += encounter.rewardSkillPoints;
        s.flags[`won:${encounter.id}`] = Number(s.flags[`won:${encounter.id}`] ?? 0) + 1;
      } else {
        s.flags[`lost:${encounter.id}`] = Number(s.flags[`lost:${encounter.id}`] ?? 0) + 1;
      }
      s.battle = null;
    });
    return { result, rewardSkillPoints: result === 'won' ? encounter.rewardSkillPoints : 0 };
  }

  abandonBattle(): void {
    this.update((s) => {
      s.battle = null;
    });
  }
}
