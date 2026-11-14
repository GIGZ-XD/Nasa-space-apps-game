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
  resources: { massKg: number; powerDrawW: number; powerOutputW: number; costUsd: number };
  finance: { rewardUsd: number; totalCostUsd: number; profitUsd: number };
  feedback: string[];
  /** True while the backend still returns placeholder values (Phase 1). */
  mock: boolean;
}

export interface ApiError {
  error: { code: string; message: string; details?: unknown };
}
