import { Router, Request, Response } from "express";
import { evaluationService, LaunchBlockedError } from "../services/evaluation.service";
import { calculateLOS, EquipmentError } from "../services/scoring.service";
import { validateConstraints } from "../services/constraints.service";
import { MISSION_SUCCESS_THRESHOLD } from "../config/missionConfig";
import { userRepository } from "../repositories/user.repository";

export const evaluationRoutes = Router();

function extractUser(req: Request) {
  const auth = req.headers.authorization;
  if (!auth) return null;
  return userRepository.getSessionUser(auth.replace(/^Bearer\s+/i, ""));
}

function parseParts(raw: unknown): string[] {
  if (typeof raw === "string") return raw.split(",").map((s) => s.trim()).filter(Boolean);
  if (Array.isArray(raw)) return raw.map((s) => String(s).trim()).filter(Boolean);
  return [];
}

/**
 * GET /api/evaluate/live?level=1&parts=lp1,lv1
 * Live LOS + hard-constraint status. Stores nothing and grants nothing.
 * Invalid/locked equipment is reported in rejected_equipment and excluded.
 */
evaluationRoutes.get("/evaluate/live", (req: Request, res: Response) => {
  try {
    const level = Number(req.query.level || 1);
    const parts = parseParts(req.query.parts);
    const los = calculateLOS(level, parts, { strict: false });
    const constraints = validateConstraints(level, parts);
    const launchAllowed = constraints.launch_allowed && los.rejected_equipment.length === 0;
    return res.json({
      ...los,
      success_threshold: MISSION_SUCCESS_THRESHOLD,
      projected_status: los.los >= MISSION_SUCCESS_THRESHOLD ? "SUCCESS" : "FAILED",
      constraints,
      launch_allowed: launchAllowed,
    });
  } catch (err: any) {
    return res.status(400).json({ error: err.message || "Failed to calculate live LOS" });
  }
});

/**
 * POST /api/evaluate   body: { level, selectedParts, attemptId? }
 * Authoritative evaluation + one-time reward. Repeating the same attemptId
 * returns the stored result with rewarded:false (no second payout).
 */
evaluationRoutes.post("/evaluate", async (req: Request, res: Response) => {
  try {
    const user = extractUser(req);
    const userId = user ? user.id : "usr-commander-001";
    const { level, selectedParts, attemptId } = req.body ?? {};
    if (!level || !Array.isArray(selectedParts)) {
      return res.status(400).json({ error: "Missing level or selectedParts array" });
    }
    const result = await evaluationService.evaluateMission(
      userId,
      Number(level),
      selectedParts,
      typeof attemptId === "string" && attemptId ? attemptId : undefined,
    );
    return res.json(result);
  } catch (err: any) {
    if (err instanceof LaunchBlockedError) {
      return res.status(409).json({ error: err.message, constraints: err.constraints, launch_allowed: false });
    }
    if (err instanceof EquipmentError) return res.status(400).json({ error: err.message, code: err.code });
    return res.status(500).json({ error: err.message || "Evaluation failed" });
  }
});

evaluationRoutes.get("/attempts", (req: Request, res: Response) => {
  const user = extractUser(req);
  return res.json(evaluationService.getUserAttempts(user ? user.id : "usr-commander-001"));
});
