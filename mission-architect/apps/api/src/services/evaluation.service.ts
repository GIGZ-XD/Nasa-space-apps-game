import { randomUUID } from "node:crypto";
import type { DesignInput, Evaluation, Spacecraft } from "@mission-architect/shared";

const designs = new Map<string, Spacecraft>();
const results = new Map<string, Evaluation>();

export function saveDesign(input: DesignInput): Spacecraft {
  const d: Spacecraft = { ...input, id: randomUUID(), createdAt: new Date().toISOString() };
  designs.set(d.id, d);
  return d;
}
export const getDesign = (id: string) => designs.get(id);
export const getResult = (id: string) => results.get(id);

/** PHASE 1 MOCK: fixed placeholder. Real scoring arrives in Phase 3/4. */
export function evaluateDesign(d: Spacecraft): Evaluation {
  const e: Evaluation = {
    id: randomUUID(), designId: d.id, missionId: d.missionId,
    status: "success", score: 75, feasible: true,
    feasibilityChecks: [{ id: "mock", passed: true, message: "Mock check (Phase 1)" }],
    categoryScores: [{ category: "instruments", score: 75, weight: 100 }],
    resources: { massKg: 0, powerDrawW: 0, powerOutputW: 0, costUsd: 0 },
    finance: { rewardUsd: 0, totalCostUsd: 0, profitUsd: 0 },
    feedback: ["Placeholder evaluation. Real scoring is not implemented yet."],
    mock: true,
  };
  results.set(e.id, e);
  return e;
}
