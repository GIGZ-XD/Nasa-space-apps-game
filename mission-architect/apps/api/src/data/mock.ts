import type { Component, Mission } from "@mission-architect/shared";

// Phase 1 placeholders. Replaced by Tanishka's seed data in Phase 2.
export const missions: Mission[] = [
  {
    id: "earth-observation-01",
    name: "Earth Observation",
    objective: "Image land and ocean changes from low Earth orbit.",
    difficulty: "easy",
    budgetUsd: 500_000,
    requirements: ["Imaging instrument", "Enough power for the payload", "Launcher supports orbit"],
  },
];

export const components: Component[] = [
  { id: "bus-basic", category: "structure", name: "Basic Bus", description: "Light, cheap frame.", massKg: 40, costUsd: 30_000 },
  { id: "solar-std", category: "power", name: "Standard Solar Array", description: "Modest output.", massKg: 10, powerOutputW: 120, costUsd: 25_000 },
  { id: "inst-optical", category: "instrument", name: "Optical Camera", description: "Visible-light imaging.", massKg: 15, powerDrawW: 40, costUsd: 60_000 },
  { id: "orbit-leo", category: "orbit", name: "Low Earth Orbit", description: "~500 km.", costUsd: 0 },
  { id: "launch-a", category: "launcher", name: "Launcher A", description: "Small launcher.", payloadCapacityKg: 150, costUsd: 150_000 },
];
