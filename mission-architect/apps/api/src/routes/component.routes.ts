import { Router } from "express";
import { listComponents } from "../services/component.service";
export const componentRoutes = Router();
componentRoutes.get("/", (req, res) => {
  const { category } = req.query;
  res.json({ components: listComponents(typeof category === "string" ? category : undefined) });
});
