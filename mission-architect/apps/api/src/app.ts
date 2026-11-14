import cors from "cors";
import express from "express";
import { errorHandler } from "./middleware/error.middleware";
import { authRoutes } from "./routes/auth.routes";
import { MISSIONS } from "../../web/src/data/missions";

export const app = express();
app.use(cors());
app.use(express.json());

app.get("/health", (_req, res) => res.json({ status: "ok" }));

// Auth endpoints
app.use("/api/auth", authRoutes);

// Mission endpoints
app.get("/api/missions", (_req, res) => res.json(MISSIONS));
app.get("/api/missions/:id", (req, res) => {
  const mission = MISSIONS.find((m) => m.id === Number(req.params.id));
  if (!mission) return res.status(404).json({ error: "Mission not found" });
  res.json(mission);
});

// Central error handler
app.use(errorHandler);
