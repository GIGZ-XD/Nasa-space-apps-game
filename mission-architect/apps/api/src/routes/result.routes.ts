import { Router } from "express";
import { getResult } from "../services/evaluation.service";
import { HttpError } from "../middleware/error.middleware";
export const resultRoutes = Router();
resultRoutes.get("/:id", (req, res) => {
  const r = getResult(req.params.id);
  if (!r) throw new HttpError(404, "RESULT_NOT_FOUND", "Unknown result");
  res.json({ evaluation: r });
});
