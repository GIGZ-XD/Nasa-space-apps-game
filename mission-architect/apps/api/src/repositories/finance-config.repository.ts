import { financeConfigs } from "../data/finance-config";
import type { MissionFinanceConfig } from "../types/finance";

export const financeConfigRepository = {
  findByMissionId: (missionId: string): MissionFinanceConfig | undefined => Object.hasOwn(financeConfigs, missionId) ? financeConfigs[missionId] : undefined,
};
