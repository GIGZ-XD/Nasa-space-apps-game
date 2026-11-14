import type { Component } from "@mission-architect/shared";
import type { MissionScoringConfig } from "../types/scoring";

export function assertValidConfig(c: MissionScoringConfig): void {
  const total = c.categories.reduce((a, x) => a + x.weight, 0);
  if (Math.abs(total - 100) > 1e-9) throw new Error(`Scoring weights for "${c.missionId}" sum to ${total}, expected 100`);
  for (const [id, v] of Object.entries(c.suitability)) {
    if (!(v >= 0 && v <= 100)) throw new Error(`Suitability for "${id}" must be 0..100, got ${v}`);
  }
}

/**
 * Suitability 0..100 of one component. Unlisted = 0. A conditional rule can cap it when a specific
 * other component is selected (e.g. standard ADCS with the IR imager).
 */
export function suitabilityOf(c: MissionScoringConfig, componentId: string, selectedIds: string[] = []): number {
  const base = Object.hasOwn(c.suitability, componentId) ? c.suitability[componentId] : 0;
  const caps = c.conditionalSuitability && Object.hasOwn(c.conditionalSuitability, componentId) ? c.conditionalSuitability[componentId] : undefined;
  if (!caps) return base;
  const hits = selectedIds.filter((id) => Object.hasOwn(caps, id)).map((id) => caps[id]);
  return hits.length ? Math.min(base, ...hits) : base;
}

/**
 * Performance of one part category: best suitability among selected parts of that category
 * (so a weaker extra instrument never lowers it); 0 if none. Instruments with 2+ selected may
 * earn a configured combination bonus, capped at 100.
 */
export function categoryPerformance(c: MissionScoringConfig, parts: Component[], category: string): number {
  const selectedIds = parts.map((p) => p.id);
  const inCat = parts.filter((p) => p.category === category);
  const scores = inCat.map((p) => suitabilityOf(c, p.id, selectedIds));
  if (!scores.length) return 0;
  const best = Math.max(...scores);
  if (category === "instrument" && inCat.length > 1 && c.combinationBonus) {
    const key = inCat.map((p) => p.id).sort().join("+");
    return Math.min(100, best + (Object.hasOwn(c.combinationBonus, key) ? c.combinationBonus[key] : 0));
  }
  return best;
}
