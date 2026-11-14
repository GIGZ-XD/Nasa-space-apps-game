import type { ComponentCategory } from "./component";

export type Difficulty = "easy" | "medium" | "hard";

/** Public mission info (loaded from apps/api/src/data/missions.json). Scoring weights/suitability are never here. */
export interface Mission {
  id: string;
  name: string;
  objective: string;
  difficulty: Difficulty;
  /** Starting budget in USD */
  budgetUsd: number;
  requirements: string[];
  /** Categories a valid design must contain (feasibility check "mandatory"). */
  mandatoryCategories: ComponentCategory[];
  /** Power output must be >= total draw x this factor (1.1 = 10% reserve). */
  powerReserveFactor: number;
  /** Orbit component IDs allowed for this mission (feasibility check "orbit-allowed"). */
  allowedOrbitIds: string[];
  lifetimeMonths: number;
}
