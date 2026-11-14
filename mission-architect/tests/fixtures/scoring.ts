import type { Spacecraft } from "@mission-architect/shared";
import type { MissionScoringConfig } from "../../apps/api/src/types/scoring";

// TEST-ONLY scoring config. Not real mission data.
export const fixtureConfig: MissionScoringConfig = {
  missionId: "test-mission",
  rules: {
    mandatoryCategories: ["structure", "power", "battery", "communications", "computer", "adcs", "instrument", "orbit", "launcher"],
    powerReserveFactor: 1.1,
  },
  categories: [
    { id: "subsystems", label: "Structure & subsystems", weight: 20, memberCategories: ["structure", "battery", "computer", "adcs"] },
    { id: "instruments", label: "Instruments", weight: 25, memberCategories: ["instrument"] },
    { id: "power", label: "Power", weight: 15, memberCategories: ["power"] },
    { id: "communications", label: "Communications", weight: 10, memberCategories: ["communications"] },
    { id: "orbit", label: "Orbit", weight: 15, memberCategories: ["orbit"] },
    { id: "launcher", label: "Launch vehicle", weight: 15, memberCategories: ["launcher"] },
  ],
  suitability: {
    "bus-basic": 100, "bus-reinforced": 90, "solar-std": 100, "battery-std": 100, "comms-basic": 100,
    "computer-std": 100, "adcs-basic": 100, "inst-a": 100, "inst-b": 75, "orbit-x": 100, "orbit-y": 100, "launch-x": 100,
  },
};

export const goodDesign: Spacecraft = {
  id: "d1", createdAt: "2026-01-01T00:00:00Z", missionId: "test-mission",
  componentIds: ["bus-basic", "solar-std", "battery-std", "comms-basic", "computer-std", "adcs-basic", "inst-a"],
  orbitId: "orbit-x", launchVehicleId: "launch-x",
};

export const withConfig = (suitability: Record<string, number>, categories = fixtureConfig.categories): MissionScoringConfig =>
  ({ ...fixtureConfig, categories, suitability: { ...fixtureConfig.suitability, ...suitability } });
