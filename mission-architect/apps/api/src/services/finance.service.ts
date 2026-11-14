import type { Component, Finance } from "@mission-architect/shared";
import type { MissionFinanceConfig, RewardTier } from "../types/finance";

/** Illustrative tiers from the roadmap (project balance values, UNCONFIRMED). */
export const DEFAULT_REWARD_TIERS: RewardTier[] = [
  { minScore: 90, fraction: 1 },
  { minScore: 70, fraction: 0.85 },
  { minScore: 50, fraction: 0.6 },
  { minScore: 30, fraction: 0.3 },
];

export function rewardFractionFor(score: number, tiers: RewardTier[] = DEFAULT_REWARD_TIERS): number {
  const sorted = [...tiers].sort((a, b) => b.minScore - a.minScore);
  return sorted.find((t) => score >= t.minScore)?.fraction ?? 0;
}

const usd = (n: number) => Math.round(n);

/**
 * Failed-mission policy: a failed mission (infeasible OR score below 30) earns NO reward
 * but still incurs all costs, so its profit is negative. Profit = reward - total cost.
 */
export function calculateFinance(
  config: MissionFinanceConfig, success: boolean, score: number,
  parts: Component[], orbit: Component, launcher: Component,
): Finance {
  const costBreakdown = {
    componentsUsd: usd(parts.reduce((a, p) => a + p.costUsd, 0)),
    orbitUsd: usd(orbit.costUsd),
    launchUsd: usd(launcher.costUsd),
    operationsUsd: usd(config.operationsCostUsd),
  };
  const totalCostUsd = Object.values(costBreakdown).reduce((a, b) => a + b, 0);
  const rewardFraction = success ? rewardFractionFor(score, config.tiers) : 0;
  const rewardUsd = usd(config.baseRewardUsd * rewardFraction);
  return { rewardUsd, totalCostUsd, profitUsd: rewardUsd - totalCostUsd, costBreakdown, rewardFraction };
}
