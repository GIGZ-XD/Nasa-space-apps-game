import { randomUUID } from "node:crypto";
import type { DesignInput, Evaluation, Spacecraft } from "@mission-architect/shared";
import { HttpError } from "../middleware/error.middleware";
import { scoringConfigRepository } from "../repositories/scoring-config.repository";
import type { MissionScoringConfig } from "../types/scoring";
import { checkFeasibility } from "./feasibility.service";
import { calculateResources, resolveDesign, type ComponentLookup } from "./resource.service";
import { FAIL_THRESHOLD, passesScoreThreshold, scoreDesign } from "./scoring.service";

const designs = new Map<string, Spacecraft>();
const results = new Map<string, Evaluation>();

export function saveDesign(input: DesignInput): Spacecraft {
  const d: Spacecraft = { ...input, id: randomUUID(), createdAt: new Date().toISOString() };
  designs.set(d.id, d);
  return d;
}
export const getDesign = (id: string) => designs.get(id);
export const getResult = (id: string) => results.get(id);

export interface EvaluationDeps {
  catalogue?: ComponentLookup;
  config?: MissionScoringConfig;
}

/** Pure evaluation (no storage). Score and feasibility are independent; status needs both. */
export function buildEvaluation(d: Spacecraft, deps: EvaluationDeps = {}): Evaluation {
  const config = deps.config ?? scoringConfigRepository.findByMissionId(d.missionId);
  if (!config) throw new HttpError(503, "SCORING_NOT_CONFIGURED", `No scoring configuration for mission "${d.missionId}"`);

  const { parts, orbit, launcher } = resolveDesign(d, deps.catalogue);
  const { totals } = calculateResources(d, deps.catalogue);
  const { score, categoryScores } = scoreDesign(config, [...parts, orbit, launcher]);
  const feasibilityChecks = checkFeasibility(config.rules, parts, orbit, launcher, totals);
  const feasible = feasibilityChecks.every((c) => c.passed);
  const scoreOk = passesScoreThreshold(score);

  const feedback: string[] = feasibilityChecks.filter((c) => !c.passed).map((c) => c.message);
  for (const cat of config.categories) {
    const s = categoryScores.find((x) => x.category === cat.id)!.score;
    if (s === 0) feedback.push(`${cat.label}: nothing suitable selected. Choose a part that fits this mission.`);
    else if (s < 75) feedback.push(`${cat.label}: a weak fit for this mission (${s}/100). Consider a better-suited alternative.`);
  }
  if (!scoreOk) feedback.push(`Mission score ${score} is below the ${FAIL_THRESHOLD} minimum.`);
  if (!feedback.length) feedback.push("Strong design: every category is well matched and all checks pass.");

  return {
    id: randomUUID(), designId: d.id, missionId: d.missionId,
    status: feasible && scoreOk ? "success" : "failed",
    score, feasible, feasibilityChecks, categoryScores,
    resources: totals,
    // Finance is a placeholder until Phase 4.
    finance: { rewardUsd: 0, totalCostUsd: 0, profitUsd: 0 },
    feedback,
    mock: true,
  };
}

export function evaluateDesign(d: Spacecraft, deps?: EvaluationDeps): Evaluation {
  const e = buildEvaluation(d, deps);
  results.set(e.id, e);
  return e;
}
