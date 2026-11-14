import type { Component } from "@mission-architect/shared";
import type { MissionScoringConfig } from "../types/scoring";

export function assertValidConfig(c: MissionScoringConfig): void {
  const total = c.categories.reduce((a, x) => a + x.weight, 0);
  if (Math.abs(total - 100) > 1e-9) throw new Error(`Scoring weights for "${c.missionId}" sum to ${total}, expected 100`);
  for (const [id, v] of Object.entries(c.suitability)) {
    if (!(v >= 0 && v <= 100)) throw new Error(`Suitability for "${id}" must be 0..100, got ${v}`);
  }
}

/** Suitability 0..100 of one component for this mission. Unlisted = 0 (unsuitable). */
export const suitabilityOf = (c: MissionScoringConfig, componentId: string): number =>
  c.suitability[componentId] ?? 0;

/**
 * Performance of one part category: the best suitability among selected parts
 * of that category (so adding a weaker extra instrument never lowers it); 0 if none selected.
 */
export function categoryPerformance(c: MissionScoringConfig, parts: Component[], category: string): number {
  const scores = parts.filter((p) => p.category === category).map((p) => suitabilityOf(c, p.id));
  return scores.length ? Math.max(...scores) : 0;
}
