import type { BoardConfig, Cell, EncounterDef } from '@knowsters/content';

export type TurnOrderMode = 'sides' | 'initiative';

export interface BattleUnit {
  id: string;
  kind: 'guardian' | 'enemy';
  speciesId: string;
  name: string;
  x: number;
  y: number;
  hp: number;
  maxHp: number;
  shield: number;
  /** Runden, die die Einheit festgehalten wird. */
  root: number;
  /** Runden, in denen das Ziel analysiert ist (+2 Schaden). */
  analyzed: number;
  /** Angriffsbonus durch „Entfachen“. */
  buff: number;
  /** Runden, in denen die Einheit nicht verschoben werden kann. */
  immovable: number;
  alive: boolean;
  move: number;
  initiative: number;
  /** Gegner: fester Schaden. Wächter: 0. */
  damage: number;
  attackBonus: number;
  shieldBonus: number;
  controlBonus: number;
  statusResist: number;
  insight: number;
  commandBonus: number;
  resonance: number;
  maxResonance: number;
  /** Beherrschte Fähigkeiten (Wächter). */
  abilities: string[];
  /** Grundangriff-ID (Wächter), immer verfügbar. */
  basicAttack: string | null;
}

export interface TimedCell extends Cell {
  turns: number;
  static?: boolean;
}

export interface BattleEvent {
  seq: number;
  type: string;
  unit?: string;
  ability?: string;
  sourcePos?: Cell;
  targetPos?: Cell;
  targetId?: string;
  from?: Cell;
  to?: Cell;
  targetFrom?: Cell;
  targetTo?: Cell;
  tile?: Cell;
  amount?: number;
  label?: string;
  pushes?: number;
  spawnSide?: 'enemy';
}

export interface BattleState {
  version: 30;
  encounterId: string;
  boardId: string;
  turnOrder: TurnOrderMode;
  round: number;
  phase: 'player' | 'enemy';
  result: null | 'won' | 'lost';
  escaped: number;
  selected: string | null;
  /** 'move' | Fähigkeits-ID | null */
  mode: string | null;
  message: string;
  acted: Record<string, boolean>;
  /** Initiative-Modus: Zugreihenfolge der laufenden Runde. */
  order: string[];
  orderIndex: number;
  /** Seiten-Modus: noch ausstehende Gegner der Gegnerphase. */
  enemyQueue: string[];
  teamMoveBonus: number;
  nextMoveBonus: number;
  rallyUsed: boolean;
  walls: TimedCell[];
  hazards: TimedCell[];
  traces: TimedCell[];
  units: BattleUnit[];
  eventSeq: number;
  /** Ereignisse der letzten Aktion, für die Darstellung. */
  events: BattleEvent[];
  enemySeq: number;
}

export interface ActionResult {
  ok: boolean;
  message?: string;
}

export interface EnemyStep extends ActionResult {
  done: boolean;
  unit?: string;
  type?: 'attack' | 'rooted' | 'move' | 'hazard' | 'escape' | 'wait';
  newRound?: boolean;
  result?: BattleState['result'];
}

export interface BattleContext {
  encounter: EncounterDef;
  board: BoardConfig;
}
