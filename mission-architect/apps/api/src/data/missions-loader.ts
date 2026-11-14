import { readFileSync } from "node:fs";
import type { Mission } from "@mission-architect/shared";
import { z } from "zod";

export const CATEGORIES = ["structure", "power", "battery", "communications", "computer", "adcs", "instrument", "orbit", "launcher"] as const;

const missionSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  objective: z.string().min(1),
  difficulty: z.enum(["easy", "medium", "hard"]),
  budgetUsd: z.number().positive(),
  requirements: z.array(z.string()),
  mandatoryCategories: z.array(z.enum(CATEGORIES)).min(1),
  powerReserveFactor: z.number().min(1),
  allowedOrbitIds: z.array(z.string().min(1)).min(1),
  lifetimeMonths: z.number().positive(),
}).strict();

/** Parse + validate the mission seed. Throws with a clear message so bad data fails at startup, not at play time. */
export function parseMissions(raw: unknown): Mission[] {
  const list = z.array(missionSchema).min(1).parse(raw);
  const ids = list.map((m) => m.id);
  const dup = ids.find((id, i) => ids.indexOf(id) !== i);
  if (dup) throw new Error(`Duplicate mission id "${dup}" in missions.json`);
  return list;
}

export const loadMissions = (): Mission[] =>
  parseMissions(JSON.parse(readFileSync(new URL("./missions.json", import.meta.url), "utf8")));
