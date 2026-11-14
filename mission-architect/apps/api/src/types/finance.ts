/** SERVER-ONLY finance configuration for one mission. */
export interface RewardTier {
  /** Inclusive minimum score for this tier. */
  minScore: number;
  /** Fraction (0..1) of baseRewardUsd paid. */
  fraction: number;
}

export interface MissionFinanceConfig {
  missionId: string;
  baseRewardUsd: number;
  /** Simplified fixed mission-operations cost. */
  operationsCostUsd: number;
  /** Optional override of DEFAULT_REWARD_TIERS. */
  tiers?: RewardTier[];
}
