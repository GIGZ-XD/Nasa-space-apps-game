import cors from "cors";
import express from "express";
import { errorHandler, notFound } from "./middleware/error.middleware";
import { componentRoutes } from "./routes/component.routes";
import { designRoutes } from "./routes/design.routes";
import { missionRoutes } from "./routes/mission.routes";
import { resultRoutes } from "./routes/result.routes";

export const app = express();
app.use(cors({ origin: process.env.WEB_ORIGIN ?? true }));
app.use(express.json({ limit: "100kb" }));

app.get("/health", (_req, res) => res.json({ status: "ok" }));
app.use("/api/missions", missionRoutes);
app.use("/api/components", componentRoutes);
app.use("/api/designs", designRoutes);
app.use("/api/results", resultRoutes);

app.use(notFound);
app.use(errorHandler);
