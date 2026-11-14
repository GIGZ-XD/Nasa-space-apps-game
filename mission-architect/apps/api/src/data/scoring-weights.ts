import type { ScoringCategoryDef } from "../types/scoring";
import { components } from "./mock";
import { loadScoringData } from "./scoring-data-loader";

// PRIVATE, server-only. Derived from component-suitability.json (Tanishka).
const data = loadScoringData(components);
export const scoringWeights: Record<string, ScoringCategoryDef[]> = { [data.missionId]: data.categories };
export const scoringData = data;
