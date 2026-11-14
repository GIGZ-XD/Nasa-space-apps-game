import type { ResourceTotals } from "./resources";

export type MissionStatus = "success" | "failed";

export interface FeasibilityCheck {
  id: string;
  passed: boolean;
  message: string;
}

export interface CategoryScore {
  category: string;
  score: number; // 0-100
  weight: number; // weights sum to 100
}

/** USD, whole dollars. profitUsd = rewardUsd - totalCostUsd and may be negative (a loss). */
export interface Finance {
  rewardUsd: number;
  totalCostUsd: number;
  profitUsd: number;
  costBreakdown: { componentsUsd: number; orbitUsd: number; launchUsd: number; operationsUsd: number };
  /** Fraction (0..1) of the base reward earned. 0 for any failed mission. */
  rewardFraction: number;
}

export interface Evaluation {
  id: string;
  designId: string;
  missionId: string;
  status: MissionStatus;
  /** Overall 0-100. Below 30 fails the score threshold. */
  score: number;
  feasible: boolean;
  feasibilityChecks: FeasibilityCheck[];
  categoryScores: CategoryScore[];
  resources: ResourceTotals;
  finance: Finance;
  feedback: string[];
  /** Always false now that scoring and finance are real. Kept for contract stability. */
  mock: boolean;
}

export interface ApiError {
  error: { code: string; message: string; details?: unknown };
}
