import crypto from "crypto";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { calculateLOS, type LOSResult } from "./scoring.service";
import { validateConstraints, type ConstraintResult } from "./constraints.service";
import { getMissionRewards } from "../data/aegisCatalogue";
import { MISSION_SUCCESS_THRESHOLD } from "../config/missionConfig";

export type MissionStatus = "SUCCESS" | "FAILED";

export interface MissionAttempt {
  attemptId: string;
  userId: string;
  missionLevel: number;
  variant?: string | null;
  los: number;
  successRate: number;
  missionStatus: MissionStatus;
  coinsAwarded: number;
  xpAwarded: number;
  rewarded: boolean; // true once rewards have been paid (exactly once)
  nextLevelUnlocked: boolean;
  completedAt: string;
  equipmentScores: LOSResult["equipment_scores"];
  missingEquipment: string[];
}

export interface EvaluationResult extends LOSResult {
  attemptId: string;
  coinsAwarded: number;
  xpAwarded: number;
  rewarded: boolean; // true only on the request that actually granted the rewards
  next_level_unlocked: boolean;
  success_threshold: number;
  constraints: ConstraintResult;
}

export class LaunchBlockedError extends Error {
  constructor(public constraints: ConstraintResult) {
    super(`Launch blocked: ${constraints.blockers.join(", ")}`);
    this.name = "LaunchBlockedError";
  }
}

/** Mission result for a given LOS (threshold is configurable). */
export function getMissionStatus(successRate: number): MissionStatus {
  return successRate >= MISSION_SUCCESS_THRESHOLD ? "SUCCESS" : "FAILED";
}

/** Coins = Base Reward × (LOS / 100), rounded; none on failure. */
export function calculateCoins(baseCoins: number, los: number, status: MissionStatus): number {
  return status === "SUCCESS" ? Math.round(baseCoins * (los / 100)) : 0;
}

/** XP = the mission's configured XP prize on success; none on failure. */
export function calculateXP(baseXP: number, status: MissionStatus): number {
  return status === "SUCCESS" ? Math.round(baseXP) : 0;
}

// ---- Persistence (JSON file so attempts/reward records survive restarts) ----
const STORE_PATH = process.env.ATTEMPTS_FILE || path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../data/attempts.json");
const attempts = new Map<string, MissionAttempt>();

function load() {
  try {
    const rows: MissionAttempt[] = JSON.parse(fs.readFileSync(STORE_PATH, "utf8"));
    for (const r of rows) attempts.set(r.attemptId, r);
  } catch {
    /* no store yet */
  }
}
function persist() {
  if (process.env.ATTEMPTS_FILE === ":memory:") return;
  try {
    fs.mkdirSync(path.dirname(STORE_PATH), { recursive: true });
    fs.writeFileSync(STORE_PATH, JSON.stringify([...attempts.values()], null, 2));
  } catch {
    /* non-fatal */
  }
}
if (process.env.ATTEMPTS_FILE !== ":memory:") load();

function toResult(a: MissionAttempt, constraints: ConstraintResult, rewardedNow: boolean): EvaluationResult {
  const los = calculateLOS(a.missionLevel, a.equipmentScores.map((s) => s.selectedUniqueId).filter((x): x is number => x !== null), { variant: a.variant ?? undefined });
  return {
    ...los,
    los: a.los,
    success_rate: a.successRate,
    equipment_scores: a.equipmentScores,
    missing_equipment: a.missingEquipment,
    mission_status: a.missionStatus,
    attemptId: a.attemptId,
    coinsAwarded: a.coinsAwarded,
    xpAwarded: a.xpAwarded,
    rewarded: rewardedNow,
    next_level_unlocked: a.nextLevelUnlocked,
    success_threshold: MISSION_SUCCESS_THRESHOLD,
    constraints,
  };
}

export const evaluationService = {
  /**
   * Evaluate a launch and pay rewards atomically (single synchronous step).
   * `attemptId` is an idempotency key: repeating the same id returns the stored
   * result and never pays twice. Throws EquipmentError for invalid/locked
   * equipment and LaunchBlockedError when a hard constraint fails.
   */
  async evaluateMission(
    userId: string,
    level: number,
    selectedParts: Array<string | number>,
    attemptId?: string,
    variant?: string,
  ): Promise<EvaluationResult> {
    const constraints = validateConstraints(level, selectedParts, variant);

    if (attemptId) {
      const existing = attempts.get(attemptId);
      if (existing) {
        if (existing.userId !== userId) throw new Error("Unauthorized");
        return toResult(existing, constraints, false);
      }
    }

    const losResult = calculateLOS(level, selectedParts, { strict: true, variant });
    if (!constraints.launch_allowed) throw new LaunchBlockedError(constraints);

    const rewardConfig = getMissionRewards(level);
    if (!rewardConfig) throw new Error(`No reward config for level ${level}`);

    const { los } = losResult;
    const status = getMissionStatus(los);
    const attempt: MissionAttempt = {
      attemptId: attemptId || `att-${Date.now()}-${crypto.randomBytes(3).toString("hex")}`,
      userId,
      missionLevel: level,
      variant: losResult.variant,
      los,
      successRate: los,
      missionStatus: status,
      coinsAwarded: calculateCoins(rewardConfig.baseCoins, los, status),
      xpAwarded: calculateXP(rewardConfig.baseXP, status),
      rewarded: true,
      nextLevelUnlocked: status === "SUCCESS" && getMissionRewards(level + 1) !== undefined,
      completedAt: new Date().toISOString(),
      equipmentScores: losResult.equipment_scores,
      missingEquipment: losResult.missing_equipment,
    };
    attempts.set(attempt.attemptId, attempt);
    persist();

    return toResult(attempt, constraints, true);
  },

  getAttempt(attemptId: string): MissionAttempt | undefined {
    return attempts.get(attemptId);
  },

  getUserAttempts(userId: string): MissionAttempt[] {
    return [...attempts.values()].filter((a) => a.userId === userId);
  },
};
