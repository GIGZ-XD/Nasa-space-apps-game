import cors from "cors";
import express from "express";
import { errorHandler } from "./middleware/error.middleware";
import { authRoutes } from "./routes/auth.routes";
import { evaluationRoutes } from "./routes/evaluation.routes";
import { MISSIONS } from "../../web/src/data/missions";
import { getLeaderboardData } from "../../web/src/data/leaderboardData";
import { LeaderboardTimeframe } from "../../web/src/types/leaderboard";

export const app = express();
app.use(cors());
app.use(express.json());

app.get("/health", (_req, res) => res.json({ status: "ok" }));

// Auth endpoints
app.use("/api/auth", authRoutes);

// Spacecraft Evaluation & LOS endpoints
app.use("/api", evaluationRoutes);

// Mission endpoints
app.get("/api/missions", (_req, res) => res.json(MISSIONS));
app.get("/api/missions/:id", (req, res) => {
  const mission = MISSIONS.find((m) => m.id === Number(req.params.id));
  if (!mission) return res.status(404).json({ error: "Mission not found" });
  res.json(mission);
});

app.get("/api/leaderboard", (req, res) => {
  const timeframe = (req.query.timeframe as LeaderboardTimeframe) || "all-time";
  const data = getLeaderboardData(timeframe);
  res.json(data);
});

// Central error handler
app.use(errorHandler);
