import { Router } from "express";
import { getMission, listMissions } from "../services/mission.service";
import { HttpError } from "../middleware/error.middleware";
export const missionRoutes = Router();
missionRoutes.get("/", (_req, res) => res.json({ missions: listMissions() }));
missionRoutes.get("/:id", (req, res) => {
  const m = getMission(req.params.id);
  if (!m) throw new HttpError(404, "MISSION_NOT_FOUND", "Unknown mission");
  res.json({ mission: m });
});
