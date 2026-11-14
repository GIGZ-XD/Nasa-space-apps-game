import type { CategoryScore, Component } from "@mission-architect/shared";
import type { MissionScoringConfig } from "../types/scoring";
import { assertValidConfig, categoryPerformance } from "./compatibility.service";

export const FAIL_THRESHOLD = 30;
const round2 = (n: number) => Math.round(n * 100) / 100;

/**
 * Category performance (0..100) = mean of its member part-categories' performance.
 * Overall = sum(weight * performance) / 100, rounded to 2 decimals.
 * The 30% threshold is applied to the rounded score: < 30 fails, exactly 30 passes.
 */
export function scoreDesign(config: MissionScoringConfig, allParts: Component[]) {
  assertValidConfig(config);
  const perf = config.categories.map((cat) => {
    const perfs = cat.memberCategories.map((m) => categoryPerformance(config, allParts, m));
    return perfs.length ? perfs.reduce((a, b) => a + b, 0) / perfs.length : 0;
  });
  const categoryScores: CategoryScore[] = config.categories.map((cat, i) => ({
    category: cat.id, score: round2(perf[i]), weight: cat.weight,
  }));
  const raw = config.categories.reduce((acc, cat, i) => acc + (cat.weight * perf[i]) / 100, 0);
  return { score: round2(raw), categoryScores };
}

export const passesScoreThreshold = (score: number) => score >= FAIL_THRESHOLD;
