import type { MissionRules } from "../types/scoring";
import { missions } from "./mock";

// Server-side feasibility rules, derived from each mission in missions.json.
export const missionRules: Record<string, MissionRules> = Object.fromEntries(
  missions.map((m) => [m.id, {
    mandatoryCategories: m.mandatoryCategories,
    powerReserveFactor: m.powerReserveFactor,
    allowedOrbitIds: m.allowedOrbitIds,
  }]),
);
