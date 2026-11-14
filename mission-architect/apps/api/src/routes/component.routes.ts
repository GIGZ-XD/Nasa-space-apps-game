import { Router } from "express";
import { components } from "../data/mock";
export const componentRoutes = Router();
componentRoutes.get("/", (req, res) => {
  const { category } = req.query;
  res.json({ components: typeof category === "string" ? components.filter((c) => c.category === category) : components });
});
