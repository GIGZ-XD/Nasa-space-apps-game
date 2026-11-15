import { create } from "zustand";

export interface EquipmentScore {
  categoryId: number;
  categoryName: string;
  label: string;
  selectedPartId: string | null;
  selectedName: string;
  suitability: number;
  weight: number;
}

export interface LOSResult {
  level: number;
  los: number;
  ideal_los: number;
  success_rate: number;
  missing_equipment: string[];
  equipment_scores: EquipmentScore[];
  mission_status: "PENDING" | "SUCCESS" | "FAILED";
}

export interface EvaluationResult extends LOSResult {
  attemptId: string;
  coinsAwarded: number;
  xpAwarded: number;
  rewarded: boolean;
}

interface LOSState {
  liveResult: LOSResult | null;
  evaluationResult: EvaluationResult | null;
  loadingLive: boolean;
  isEvaluating: boolean;
  error: string | null;

  fetchLiveLOS: (level: number, selectedParts: string[]) => Promise<LOSResult | null>;
  evaluateMission: (level: number, selectedParts: string[]) => Promise<EvaluationResult | null>;
  clearEvaluation: () => void;
}

export const useLOSStore = create<LOSState>((set) => ({
  liveResult: null,
  evaluationResult: null,
  loadingLive: false,
  isEvaluating: false,
  error: null,

  fetchLiveLOS: async (level: number, selectedParts: string[]) => {
    try {
      set({ loadingLive: true, error: null });
      const query = new URLSearchParams({
        level: level.toString(),
        parts: selectedParts.join(","),
      });

      const res = await fetch(`/api/evaluate/live?${query.toString()}`);
      if (!res.ok) {
        throw new Error(`Failed to fetch live evaluation: ${res.statusText}`);
      }
      const data: LOSResult = await res.json();
      set({ liveResult: data, loadingLive: false });
      return data;
    } catch (err: any) {
      set({ error: err.message, loadingLive: false });
      return null;
    }
  },

  evaluateMission: async (level: number, selectedParts: string[]) => {
    try {
      set({ isEvaluating: true, error: null });
      const token = localStorage.getItem("token") || "";

      const res = await fetch("/api/evaluate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ level, selectedParts }),
      });

      if (!res.ok) {
        throw new Error(`Evaluation request failed: ${res.statusText}`);
      }

      const data: EvaluationResult = await res.json();
      set({ evaluationResult: data, isEvaluating: false });
      return data;
    } catch (err: any) {
      set({ error: err.message, isEvaluating: false });
      return null;
    }
  },

  clearEvaluation: () => {
    set({ evaluationResult: null, error: null });
  },
}));
