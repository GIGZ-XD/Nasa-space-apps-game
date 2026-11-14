import type { ComponentCategory } from "@mission-architect/shared";

/** SERVER-ONLY. Never import this into packages/shared or serialize it to a response. */
export interface ScoringCategoryDef {
  id: string;
  label: string;
  /** Weights across a mission's categories must sum to 100. */
  weight: number;
  /** Part categories that feed this scoring category. */
  memberCategories: ComponentCategory[];
}

export interface MissionRules {
  mandatoryCategories: ComponentCategory[];
  /** Power output must be >= powerDraw * this factor (1.1 = 10% reserve). */
  powerReserveFactor: number;
  /** If set, the selected orbit must be in this list. */
  allowedOrbitIds?: string[];
}

export interface MissionScoringConfig {
  missionId: string;
  rules: MissionRules;
  categories: ScoringCategoryDef[];
  /** componentId -> 0..100. Unlisted components score 0 (UNCONFIRMED policy). */
  suitability: Record<string, number>;
}
