import type { Component } from "@mission-architect/shared";
import type { ComponentLookup } from "../../apps/api/src/services/resource.service";

// TEST-ONLY data. Not the real catalogue and not served by the API.
export const fixtureComponents: Component[] = [
  { id: "bus-basic", category: "structure", name: "Basic Bus", description: "t", massKg: 40, costUsd: 30_000 },
  { id: "bus-reinforced", category: "structure", name: "Reinforced Bus", description: "t", massKg: 70, costUsd: 55_000 },
  { id: "solar-std", category: "power", name: "Solar", description: "t", massKg: 10, powerOutputW: 120, costUsd: 25_000 },
  { id: "battery-std", category: "battery", name: "Battery", description: "t", massKg: 8, capacityWh: 200, costUsd: 15_000 },
  { id: "comms-basic", category: "communications", name: "Antenna", description: "t", massKg: 5, powerDrawW: 15, dataRateMbps: 2, costUsd: 20_000 },
  { id: "computer-std", category: "computer", name: "Computer", description: "t", massKg: 3, powerDrawW: 10, costUsd: 12_000 },
  { id: "adcs-basic", category: "adcs", name: "ADCS", description: "t", massKg: 4, powerDrawW: 8, costUsd: 18_000 },
  { id: "inst-a", category: "instrument", name: "Instrument A", description: "t", massKg: 15, powerDrawW: 40, costUsd: 60_000 },
  { id: "inst-b", category: "instrument", name: "Instrument B", description: "t", massKg: 22, powerDrawW: 55, costUsd: 90_000 },
  { id: "orbit-x", category: "orbit", name: "Orbit X", description: "t", costUsd: 0 },
  { id: "launch-x", category: "launcher", name: "Launcher X", description: "t", payloadCapacityKg: 150, costUsd: 150_000, supportedOrbitIds: ["orbit-x"] },
];

const byId = new Map(fixtureComponents.map((c) => [c.id, c]));
export const fixtureCatalogue: ComponentLookup = { findById: (id) => byId.get(id) };
