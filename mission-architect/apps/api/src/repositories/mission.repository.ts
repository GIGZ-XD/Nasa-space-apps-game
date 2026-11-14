import type { Mission } from "@mission-architect/shared";
import { missions } from "../data/mock";

// Swap point: replace the data source (seed JSON / Prisma) without touching services.
export const missionRepository = {
  list: (): Mission[] => missions,
  findById: (id: string): Mission | undefined => missions.find((m) => m.id === id),
};
