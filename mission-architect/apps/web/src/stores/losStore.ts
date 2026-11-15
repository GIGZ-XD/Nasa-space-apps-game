import { create } from "zustand";

export interface EquipmentScore {
  slotId: string;
  categoryId: number;
  categoryName: string;
  label: string;
  selectedPartId: string | null;
  selectedUniqueId: number | null;
  selectedName: string;
  idealUniqueId: number;
  idealName: string;
  idealSuitability: number;
  suitability: number;
  difference: number;
  weight: number;
  contribution: number;
  maxContribution: number;
}

export interface ConstraintCheck {
  id: "budget" | "mass" | "power" | "deltaV" | "equipment";
  label: string;
  passed: boolean;
  actual: number;
  limit: number;
  unit: string;
  detail: string;
}

export interface ConstraintResult {
  level: number;
  destination: string;
  checks: ConstraintCheck[];
  mission_readiness_score: number;
  all_passed: boolean;
  launch_allowed: boolean;
  blockers: string[];
}

export interface SelectedEquipmentReport {
  partId: string;
  playerName: string;
  uniqueId: number | null;
  equipmentName: string | null;
  status: "USED" | "UNUSED" | "LOCKED" | "INVALID";
  slotLabel: string | null;
  suitability: number | null;
  message: string;
}

export interface LOSResult {
  level: number;
  variant: string | null;
  variant_name: string;
  los: number;
  ideal_los: number;
  success_rate: number;
  required_total: number;
  required_completed: number;
  missing_equipment: string[];
  equipment_scores: EquipmentScore[];
  rejected_equipment: { partId: string; reason: string; message: string }[];
  selected_equipment: SelectedEquipmentReport[];
  mission_status: "PENDING" | "SUCCESS" | "FAILED";
  success_threshold?: number;
  projected_status?: "SUCCESS" | "FAILED";
  constraints?: ConstraintResult;
  launch_allowed?: boolean;
}

export interface EvaluationResult extends LOSResult {
  attemptId: string;
  coinsAwarded: number;
  xpAwarded: number;
  rewarded: boolean;
  next_level_unlocked: boolean;
  success_threshold: number;
  constraints: ConstraintResult;
}

interface LOSState {
  liveResult: LOSResult | null;
  evaluationResult: EvaluationResult | null;
  loadingLive: boolean;
  isEvaluating: boolean;
  error: string | null;

  fetchLiveLOS: (level: number, selectedParts: string[], variant?: string) => Promise<LOSResult | null>;
  evaluateMission: (level: number, selectedParts: string[], variant?: string) => Promise<EvaluationResult | null>;
  /** Idempotency key for the current launch attempt (prevents double rewards). */
  attemptId: string | null;
  clearEvaluation: () => void;
}

let liveRequestSeq = 0;

export const useLOSStore = create<LOSState>((set, get) => ({
  liveResult: null,
  evaluationResult: null,
  loadingLive: false,
  isEvaluating: false,
  error: null,
  attemptId: null,

  fetchLiveLOS: async (level: number, selectedParts: string[], variant?: string) => {
    try {
      const seq = ++liveRequestSeq;
      set({ loadingLive: true, error: null });
      const query = new URLSearchParams({
        level: level.toString(),
        parts: selectedParts.join(","),
      });
      if (variant) query.set("variant", variant);

      const res = await fetch(`/api/evaluate/live?${query.toString()}`);
      if (!res.ok) {
        throw new Error(`Failed to fetch live evaluation: ${res.statusText}`);
      }
      const data: LOSResult = await res.json();
      if (seq === liveRequestSeq) set({ liveResult: data, loadingLive: false }); // ignore stale responses
      return data;
    } catch (err: any) {
      set({ error: err.message, loadingLive: false });
      return null;
    }
  },

  evaluateMission: async (level: number, selectedParts: string[], variant?: string) => {
    try {
      set({ isEvaluating: true, error: null });
      const token = localStorage.getItem("ma_auth_token") || "";
      // One attempt id per launch session; repeating the request can never pay twice.
      const attemptId =
        get().attemptId ?? `att-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
      set({ attemptId });

      const res = await fetch("/api/evaluate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ level, selectedParts, attemptId, variant }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || `Evaluation request failed: ${res.statusText}`);
      }

      const data: EvaluationResult = await res.json();
      set({ evaluationResult: data, isEvaluating: false, attemptId: null });
      return data;
    } catch (err: any) {
      set({ error: err.message, isEvaluating: false });
      return null;
    }
  },

  clearEvaluation: () => {
    set({ evaluationResult: null, error: null, attemptId: null });
  },
}));
