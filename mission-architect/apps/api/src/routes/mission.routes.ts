import { Router } from "express";
import { missions } from "../data/mock";
import { HttpError } from "../middleware/error.middleware";
export const missionRoutes = Router();
missionRoutes.get("/", (_req, res) => res.json({ missions }));
missionRoutes.get("/:id", (req, res) => {
  const m = missions.find((x) => x.id === req.params.id);
  if (!m) throw new HttpError(404, "MISSION_NOT_FOUND", "Unknown mission");
  res.json({ mission: m });
});
