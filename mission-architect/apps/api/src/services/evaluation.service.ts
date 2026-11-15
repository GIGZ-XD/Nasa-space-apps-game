import crypto from "crypto";
import { calculateLOS, type LOSResult } from "./scoring.service";
import { getMissionRewards } from "../data/aegisCatalogue";

export interface MissionAttempt {
  attemptId: string;
  userId: string;
  missionLevel: number;
  los: number;
  successRate: number;
  missionStatus: "SUCCESS" | "FAILED";
  coinsAwarded: number;
  xpAwarded: number;
  rewarded: boolean;
  completedAt: string;
  equipmentScores: LOSResult["equipment_scores"];
  missingEquipment: string[];
}

export interface EvaluationResult extends LOSResult {
  attemptId: string;
  coinsAwarded: number;
  xpAwarded: number;
  rewarded: boolean;
}

// In-memory store for mission attempts
const attempts = new Map<string, MissionAttempt>();

export const evaluationService = {
  /**
   * Evaluate a mission attempt and store the result.
   * Does NOT grant rewards yet — call grantRewards() after.
   */
  async evaluateMission(
    userId: string,
    level: number,
    selectedParts: string[]
  ): Promise<EvaluationResult> {
    const losResult = calculateLOS(level, selectedParts);
    const rewardConfig = getMissionRewards(level);

    if (!rewardConfig) throw new Error(`No reward config for level ${level}`);

    const { los } = losResult;
    const { baseCoins, baseXP, difficulty } = rewardConfig;
    const SUCCESS_THRESHOLD = 30;

    const missionStatus: "SUCCESS" | "FAILED" = los >= SUCCESS_THRESHOLD ? "SUCCESS" : "FAILED";

    // Coins: base × (LOS / 100), 0 on failure
    const coinsAwarded = missionStatus === "SUCCESS" ? Math.round(baseCoins * (los / 100)) : 0;

    // XP: B + D×10 + LOS×5; B=0 on failure
    const B = missionStatus === "SUCCESS" ? baseXP : 0;
    const xpAwarded = Math.round(B + difficulty * 10 + los * 5);

    const attemptId = `att-${Date.now()}-${crypto.randomBytes(3).toString("hex")}`;

    const attempt: MissionAttempt = {
      attemptId,
      userId,
      missionLevel: level,
      los,
      successRate: los,
      missionStatus,
      coinsAwarded,
      xpAwarded,
      rewarded: false,
      completedAt: new Date().toISOString(),
      equipmentScores: losResult.equipment_scores,
      missingEquipment: losResult.missing_equipment,
    };

    attempts.set(attemptId, attempt);

    return {
      ...losResult,
      mission_status: missionStatus,
      attemptId,
      coinsAwarded,
      xpAwarded,
      rewarded: false,
    };
  },

  /**
   * Mark a mission attempt as rewarded (idempotent — only pays once).
   * Returns the coins/XP to grant, or null if already paid.
   */
  grantRewards(
    attemptId: string,
    userId: string
  ): { coinsAwarded: number; xpAwarded: number } | null {
    const attempt = attempts.get(attemptId);
    if (!attempt) throw new Error("Attempt not found");
    if (attempt.userId !== userId) throw new Error("Unauthorized");
    if (attempt.rewarded) return null; // already paid

    attempt.rewarded = true;
    return { coinsAwarded: attempt.coinsAwarded, xpAwarded: attempt.xpAwarded };
  },

  getAttempt(attemptId: string): MissionAttempt | undefined {
    return attempts.get(attemptId);
  },

  getUserAttempts(userId: string): MissionAttempt[] {
    return [...attempts.values()].filter((a) => a.userId === userId);
  },
};
