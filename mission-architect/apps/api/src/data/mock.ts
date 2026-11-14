import type { Component, Mission } from "@mission-architect/shared";
import { loadMissions } from "./missions-loader";

// Missions come from Tanishka's missions.json (validated at startup).
export const missions: Mission[] = loadMissions();
// Intentionally empty until Tanishka's components.json is integrated (Phase 2).
export const components: Component[] = [];
