import { scoringData } from "./scoring-weights";

// PRIVATE, server-only. missionId -> componentId -> suitability 0..100. Never serve this.
export const componentSuitability: Record<string, Record<string, number>> = { [scoringData.missionId]: scoringData.suitability };
export const conditionalSuitability = { [scoringData.missionId]: scoringData.conditionalSuitability };
export const combinationBonus = { [scoringData.missionId]: scoringData.combinationBonus };
