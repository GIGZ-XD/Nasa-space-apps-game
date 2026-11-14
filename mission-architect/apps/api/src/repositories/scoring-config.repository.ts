import { combinationBonus, componentSuitability, conditionalSuitability } from "../data/component-suitability";
import { missionRules } from "../data/mission-rules";
import { scoringWeights } from "../data/scoring-weights";
import type { MissionScoringConfig } from "../types/scoring";

const own = <T>(o: Record<string, T>, k: string): T | undefined => (Object.hasOwn(o, k) ? o[k] : undefined);

/** Assemble private scoring config for a mission, or undefined if not configured. */
export const scoringConfigRepository = {
  findByMissionId(missionId: string): MissionScoringConfig | undefined {
    const rules = own(missionRules, missionId);
    const categories = own(scoringWeights, missionId);
    if (!rules || !categories) return undefined;
    return {
      missionId, rules, categories,
      suitability: own(componentSuitability, missionId) ?? {},
      conditionalSuitability: own(conditionalSuitability, missionId),
      combinationBonus: own(combinationBonus, missionId),
    };
  },
};
