import type { AgeBandId } from '@knowsters/content';
import type { BattleState } from '../battle/types';
import type { CreatureInstance } from '../progression/creature';
import type { PlayerKnowledge } from '../progression/knowledge';

export const SAVE_VERSION = 30;

export interface AvatarLook {
  face: number;
  hair: number;
  hairColor: number;
  top: number;
  pants: number;
}

export interface SaveV30 {
  schemaVersion: 30;
  createdAt: string;
  updatedAt: string;
  player: {
    name: string;
    ageBand: AgeBandId | null;
    avatar: AvatarLook;
    knowledge: PlayerKnowledge;
  };
  creatures: Record<string, CreatureInstance>;
  /** Instanz-IDs des aktiven Teams (max. 4). */
  team: string[];
  companionId: string | null;
  world: {
    zone: string;
    /** Position in Prozentkoordinaten der Terrain-Karte. */
    position: [number, number] | null;
  };
  flags: Record<string, string | number | boolean>;
  battle: BattleState | null;
  settings: {
    turnOrder: 'sides' | 'initiative';
    reducedMotion: boolean;
    sound: boolean;
  };
  /** Herkunft, z. B. 'fresh' oder 'legacy-v22'. */
  origin: string;
}
