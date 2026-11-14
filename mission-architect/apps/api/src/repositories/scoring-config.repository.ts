import { componentSuitability } from "../data/component-suitability";
import { missionRules } from "../data/mission-rules";
import { scoringWeights } from "../data/scoring-weights";
import type { MissionScoringConfig } from "../types/scoring";

/** Assemble private scoring config for a mission, or undefined if not configured. */
export const scoringConfigRepository = {
  findByMissionId(missionId: string): MissionScoringConfig | undefined {
    if (!Object.hasOwn(missionRules, missionId) || !Object.hasOwn(scoringWeights, missionId)) return undefined;
    const rules = missionRules[missionId];
    const categories = scoringWeights[missionId];
    if (!rules || !categories) return undefined;
    return { missionId, rules, categories, suitability: Object.hasOwn(componentSuitability, missionId) ? componentSuitability[missionId] : {} };
  },
};
