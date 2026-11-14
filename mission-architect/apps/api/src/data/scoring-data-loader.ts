import { readFileSync } from "node:fs";
import type { Component, ComponentCategory } from "@mission-architect/shared";
import { z } from "zod";
import type { ScoringCategoryDef } from "../types/scoring";

// SERVER-ONLY. Reads component-suitability.json (Tanishka). Never import from a route or serve its contents.

/** Her weight keys -> part categories that feed each scoring category (per her _weightRef notes). */
const WEIGHT_GROUPS: Record<string, { label: string; members: ComponentCategory[] }> = {
  structure: { label: "Structure & subsystems", members: ["structure", "computer", "adcs"] },
  instruments: { label: "Scientific instruments", members: ["instrument"] },
  power: { label: "Power system", members: ["power", "battery"] },
  communications: { label: "Communications", members: ["communications"] },
  orbit: { label: "Orbit selection", members: ["orbit"] },
  launcher: { label: "Launch vehicle", members: ["launcher"] },
};
const PART_CATEGORIES = ["structure", "power", "battery", "communications", "computer", "adcs", "instrument", "orbit", "launcher"] as const;

const fileSchema = z.object({
  missionId: z.string().min(1),
  categoryWeights: z.record(z.union([z.number(), z.string()])),
  componentSuitability: z.record(z.any()),
}).passthrough();

export interface ParsedScoringData {
  missionId: string;
  categories: ScoringCategoryDef[];
  suitability: Record<string, number>;
  conditionalSuitability: Record<string, Record<string, number>>;
  combinationBonus: Record<string, number>;
}

export function parseScoringData(raw: unknown, components: Component[]): ParsedScoringData {
  const f = fileSchema.parse(raw);

  const categories: ScoringCategoryDef[] = [];
  for (const [key, w] of Object.entries(f.categoryWeights)) {
    if (key.startsWith("_")) continue;
    const g = WEIGHT_GROUPS[key];
    if (!g) throw new Error(`Unknown scoring category "${key}" in categoryWeights`);
    if (typeof w !== "number") throw new Error(`Weight for "${key}" must be a number`);
    categories.push({ id: key, label: g.label, weight: w, memberCategories: g.members });
  }
  const total = categories.reduce((a, c) => a + c.weight, 0);
  if (Math.abs(total - 100) > 1e-9) throw new Error(`categoryWeights sum to ${total}, expected 100`);

  const suitability: Record<string, number> = {};
  const conditionalSuitability: Record<string, Record<string, number>> = {};
  let combinationBonus: Record<string, number> = {};
  for (const cat of PART_CATEGORIES) {
    const block = f.componentSuitability[cat];
    if (!block) throw new Error(`componentSuitability is missing category "${cat}"`);
    for (const [id, entry] of Object.entries<any>(block)) {
      if (id === "_combinationBonus") { combinationBonus = parseBonus(entry); continue; }
      if (id.startsWith("_")) continue;
      const score = entry?.suitabilityScore;
      if (typeof score !== "number" || score < 0 || score > 100) throw new Error(`Bad suitabilityScore for "${id}"`);
      suitability[id] = score;
      if (entry.instrumentPenalty) {
        conditionalSuitability[id] = {};
        for (const [inst, v] of Object.entries<any>(entry.instrumentPenalty)) {
          if (typeof v !== "number" || v < 0 || v > 100) throw new Error(`Bad instrumentPenalty for "${id}"`);
          conditionalSuitability[id][inst] = v;
        }
      }
    }
  }

  // Integrity: every catalogue component has a score, and no score refers to an unknown component.
  const ids = new Set(components.map((c) => c.id));
  const missing = [...ids].filter((id) => !(id in suitability));
  if (missing.length) throw new Error(`No suitability score for: ${missing.join(", ")}`);
  const orphan = Object.keys(suitability).filter((id) => !ids.has(id));
  if (orphan.length) throw new Error(`Suitability for unknown components: ${orphan.join(", ")}`);
  for (const [id, m] of Object.entries(conditionalSuitability))
    for (const other of Object.keys(m)) if (!ids.has(other)) throw new Error(`instrumentPenalty on "${id}" refers to unknown "${other}"`);

  return { missionId: f.missionId, categories, suitability, conditionalSuitability, combinationBonus };
}

/** "optical+multispectral" -> sorted ["camera-multispectral","camera-optical"] joined with "+". */
function parseBonus(entry: Record<string, any>): Record<string, number> {
  const out: Record<string, number> = {};
  for (const [k, v] of Object.entries(entry)) {
    if (k.startsWith("_")) continue;
    if (typeof v?.bonusPoints !== "number" || v.bonusPoints < 0) throw new Error(`Bad bonusPoints for "${k}"`);
    out[k.split("+").map((s) => `camera-${s}`).sort().join("+")] = v.bonusPoints;
  }
  return out;
}

export const loadScoringData = (components: Component[]): ParsedScoringData =>
  parseScoringData(JSON.parse(readFileSync(new URL("./component-suitability.json", import.meta.url), "utf8")), components);
