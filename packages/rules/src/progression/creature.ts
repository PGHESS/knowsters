import { ABILITIES, guardianDef, type AbilityDef, type AttributeId } from '@knowsters/content';
import { type Rng, defaultRng } from '../rng';
import { createAttributes, type AttributeSet } from './attributes';
import type { PlayerKnowledge } from './knowledge';

/** Eine individuelle Weseninstanz. Wissen liegt NICHT hier, sondern im Spielerprofil. */
export interface CreatureInstance {
  id: string;
  speciesId: string;
  name: string;
  attributes: AttributeSet;
  skillPoints: number;
  unlocked: string[];
  /** Entwicklung, die nach Erreichen des Potenzials gesammelt wurde (Meisterschaft, später). */
  mastery: Partial<Record<AttributeId, number>>;
}

export function createCreature(speciesId: string, id: string, rng: Rng = defaultRng, name?: string): CreatureInstance {
  const species = guardianDef(speciesId);
  return {
    id,
    speciesId,
    name: name ?? species.name,
    attributes: createAttributes(species.potentialTemplate, species.startTemplate, rng),
    skillPoints: 0,
    unlocked: [...species.innate],
    mastery: {},
  };
}

export interface UnlockCheck {
  ok: boolean;
  /** Menschlich lesbare fehlende Voraussetzungen. */
  missing: string[];
  attributeGaps: { attributeId: AttributeId; have: number; need: number }[];
  needsProof: string | null;
  needsSkillPoints: number;
}

/** Prüft alle Voraussetzungen einer Fähigkeit gegen Instanz UND Spielerprofil. */
export function checkUnlock(creature: CreatureInstance, knowledge: PlayerKnowledge, ability: AbilityDef): UnlockCheck {
  const missing: string[] = [];
  const attributeGaps: UnlockCheck['attributeGaps'] = [];
  let needsProof: string | null = null;
  let needsSkillPoints = 0;
  const req = ability.requirements;
  if (creature.unlocked.includes(ability.id)) return { ok: false, missing: ['bereits gelernt'], attributeGaps, needsProof, needsSkillPoints };
  if (!req) return { ok: true, missing, attributeGaps, needsProof, needsSkillPoints };
  if (req.requiresAbility && !creature.unlocked.includes(req.requiresAbility)) {
    missing.push(`Voraussetzung: ${ABILITIES[req.requiresAbility]?.name ?? req.requiresAbility}`);
  }
  for (const [attr, need] of Object.entries(req.attributes ?? {}) as [AttributeId, number][]) {
    const have = creature.attributes[attr].value;
    if (have < need) {
      attributeGaps.push({ attributeId: attr, have, need });
      missing.push(`${attr} ${have}/${need}`);
    }
  }
  if (req.skillPoints && creature.skillPoints < req.skillPoints) {
    needsSkillPoints = req.skillPoints;
    missing.push(`${req.skillPoints} Fähigkeitspunkt${req.skillPoints > 1 ? 'e' : ''}`);
  }
  if (req.knowledgeProof && !knowledge.proofs.includes(req.knowledgeProof)) {
    needsProof = req.knowledgeProof;
    missing.push(`Wissensnachweis ${req.knowledgeProof}`);
  }
  return { ok: missing.length === 0, missing, attributeGaps, needsProof, needsSkillPoints };
}

export function unlockAbility(creature: CreatureInstance, knowledge: PlayerKnowledge, abilityId: string): UnlockCheck {
  const ability = ABILITIES[abilityId];
  if (!ability) throw new Error(`Unbekannte Fähigkeit ${abilityId}`);
  const check = checkUnlock(creature, knowledge, ability);
  if (!check.ok) return check;
  creature.skillPoints -= ability.requirements?.skillPoints ?? 0;
  creature.unlocked.push(abilityId);
  return check;
}
