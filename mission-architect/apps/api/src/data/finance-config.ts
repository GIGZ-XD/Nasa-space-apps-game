import type { MissionFinanceConfig } from "../types/finance";
import { missions } from "./mock";

// PROVISIONAL (UNCONFIRMED): base reward = mission budget (the roadmap's worked example), operations cost = 0
// (Tanishka's cost totals are parts + launcher only). Replace with agreed values.
export const financeConfigs: Record<string, MissionFinanceConfig> = Object.fromEntries(
  missions.map((m) => [m.id, { missionId: m.id, baseRewardUsd: m.budgetUsd, operationsCostUsd: 0 }]),
);
