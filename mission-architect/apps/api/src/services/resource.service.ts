import type { Component, DesignInput, ResourceBreakdown, ResourceTotals } from "@mission-architect/shared";
import { componentRepository } from "../repositories/component.repository";

export class DesignValidationError extends Error {
  constructor(public problems: string[]) { super(problems.join("; ")); }
}

/** Resolve and validate IDs. Throws DesignValidationError listing every problem. */
export function resolveDesign(input: Pick<DesignInput, "componentIds" | "orbitId" | "launchVehicleId">) {
  const problems: string[] = [];
  const parts: Component[] = [];
  const seen = new Map<string, string>();

  for (const id of input.componentIds) {
    const c = componentRepository.findById(id);
    if (!c) { problems.push(`Unknown component "${id}"`); continue; }
    if (c.category === "orbit" || c.category === "launcher") {
      problems.push(`"${id}" is an ${c.category}; set it via ${c.category === "orbit" ? "orbitId" : "launchVehicleId"}, not componentIds`);
      continue;
    }
    // One part per category, except instruments (several allowed).
    if (c.category !== "instrument" && seen.has(c.category)) {
      problems.push(`Only one ${c.category} allowed ("${seen.get(c.category)}" and "${id}")`);
      continue;
    }
    seen.set(c.category, id);
    parts.push(c);
  }

  const orbit = componentRepository.findById(input.orbitId);
  if (!orbit) problems.push(`Unknown orbit "${input.orbitId}"`);
  else if (orbit.category !== "orbit") problems.push(`"${input.orbitId}" is not an orbit`);

  const launcher = componentRepository.findById(input.launchVehicleId);
  if (!launcher) problems.push(`Unknown launch vehicle "${input.launchVehicleId}"`);
  else if (launcher.category !== "launcher") problems.push(`"${input.launchVehicleId}" is not a launch vehicle`);

  if (problems.length) throw new DesignValidationError(problems);
  return { parts, orbit: orbit!, launcher: launcher! };
}

const n = (v: number | undefined) => v ?? 0;

/** Deterministic totals. Mass/power cover spacecraft parts only (the launcher is not payload). Cost includes orbit and launcher. */
export function calculateResources(input: Pick<DesignInput, "componentIds" | "orbitId" | "launchVehicleId">): ResourceBreakdown {
  const { parts, orbit, launcher } = resolveDesign(input);
  const lines = parts.map((c) => ({
    componentId: c.id, category: c.category,
    massKg: n(c.massKg), powerDrawW: n(c.powerDrawW), powerOutputW: n(c.powerOutputW), costUsd: c.costUsd,
  }));
  const sum = (f: (c: Component) => number) => parts.reduce((a, c) => a + f(c), 0);
  const totals: ResourceTotals = {
    massKg: sum((c) => n(c.massKg)),
    powerDrawW: sum((c) => n(c.powerDrawW)),
    powerOutputW: sum((c) => n(c.powerOutputW)),
    batteryWh: sum((c) => n(c.capacityWh)),
    dataRateMbps: sum((c) => n(c.dataRateMbps)),
    launcherCapacityKg: n(launcher.payloadCapacityKg),
    costUsd: sum((c) => c.costUsd) + orbit.costUsd + launcher.costUsd,
  };
  return { totals, lines };
}
