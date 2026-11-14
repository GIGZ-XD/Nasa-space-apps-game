import type { Component, Mission } from "@mission-architect/shared";
import { checkMissionsAgainstCatalogue, loadComponents } from "./components-loader";
import { loadMissions } from "./missions-loader";

// Public data from Tanishka's missions.json and components.json, validated at startup.
export const missions: Mission[] = loadMissions();
export const components: Component[] = loadComponents();
checkMissionsAgainstCatalogue(missions, components);
