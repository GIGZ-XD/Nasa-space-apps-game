import { Router } from "express";
import { designSchema } from "../validators/schemas";
import { evaluateDesign, getDesign, saveDesign } from "../services/evaluation.service";
import { HttpError } from "../middleware/error.middleware";
import { missions } from "../data/mock";
export const designRoutes = Router();

designRoutes.post("/", (req, res) => {
  const input = designSchema.parse(req.body);
  if (!missions.some((m) => m.id === input.missionId)) throw new HttpError(404, "MISSION_NOT_FOUND", "Unknown mission");
  res.status(201).json({ design: saveDesign(input) });
});

designRoutes.post("/:id/evaluate", (req, res) => {
  const d = getDesign(req.params.id);
  if (!d) throw new HttpError(404, "DESIGN_NOT_FOUND", "Unknown design");
  res.json({ evaluation: evaluateDesign(d) });
});
