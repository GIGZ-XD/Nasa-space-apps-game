import { Router, Request, Response } from "express";
import { evaluationService } from "../services/evaluation.service";
import { calculateLOS } from "../services/scoring.service";
import { userRepository } from "../repositories/user.repository";

export const evaluationRoutes = Router();

// Middleware to extract auth user if token present
function extractUser(req: Request) {
  const auth = req.headers.authorization;
  if (!auth) return null;
  const token = auth.replace(/^Bearer\s+/i, "");
  return userRepository.getSessionUser(token);
}

/**
 * GET /api/evaluate/live
 * Calculates live LOS without storing attempts or granting rewards.
 * Query: level (number), parts (comma-separated or multiple params)
 */
evaluationRoutes.get("/evaluate/live", (req: Request, res: Response) => {
  try {
    const level = Number(req.query.level || 1);
    const partsParam = req.query.parts;
    let parts: string[] = [];

    if (typeof partsParam === "string") {
      parts = partsParam.split(",").map((s) => s.trim()).filter(Boolean);
    } else if (Array.isArray(partsParam)) {
      parts = partsParam.map((s) => String(s).trim()).filter(Boolean);
    }

    const result = calculateLOS(level, parts);
    return res.json(result);
  } catch (err: any) {
    return res.status(400).json({ error: err.message || "Failed to calculate live LOS" });
  }
});

/**
 * POST /api/evaluate
 * Evaluates the mission attempt, records it, and immediately grants rewards (preventing duplication).
 * Body: { level: number, selectedParts: string[] }
 */
evaluationRoutes.post("/evaluate", async (req: Request, res: Response) => {
  try {
    const user = extractUser(req);
    const userId = user ? user.id : "usr-commander-001"; // Fallback to demo commander if in guest/offline mode

    const { level, selectedParts } = req.body;
    if (!level || !Array.isArray(selectedParts)) {
      return res.status(400).json({ error: "Missing level or selectedParts array" });
    }

    const evaluation = await evaluationService.evaluateMission(userId, Number(level), selectedParts);
    
    // Automatically claim / grant rewards
    const rewardGrant = evaluationService.grantRewards(evaluation.attemptId, userId);
    const rewarded = rewardGrant !== null;

    return res.json({
      ...evaluation,
      rewarded,
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message || "Evaluation failed" });
  }
});

/**
 * GET /api/attempts
 * List previous attempts for user
 */
evaluationRoutes.get("/attempts", (req: Request, res: Response) => {
  const user = extractUser(req);
  const userId = user ? user.id : "usr-commander-001";
  const userAttempts = evaluationService.getUserAttempts(userId);
  return res.json(userAttempts);
});
