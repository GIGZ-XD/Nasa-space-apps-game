import { readFileSync } from "node:fs";
import type { Component, Mission } from "@mission-architect/shared";
import { z } from "zod";
import { CATEGORIES } from "./missions-loader";

const num = z.number().finite().nonnegative();
const componentSchema = z.object({
  id: z.string().min(1),
  category: z.enum(CATEGORIES),
  name: z.string().min(1),
  description: z.string().min(1),
  massKg: num.optional(),
  powerDrawW: num.optional(),
  powerOutputW: num.optional(),
  capacityWh: num.optional(),
  dataRateMbps: num.optional(),
  payloadCapacityKg: num.optional(),
  supportedOrbitIds: z.array(z.string().min(1)).optional(),
  eclipseMinutes: num.optional(),
  contactWindowMinutesPerOrbit: num.optional(),
  costUsd: num,
}).strict();

/** Parse the catalogue and check its internal integrity. Throws a clear error on bad data. */
export function parseComponents(raw: unknown): Component[] {
  const list = z.array(componentSchema).min(1).parse(raw) as Component[];
  const ids = list.map((c) => c.id);
  const dup = ids.find((id, i) => ids.indexOf(id) !== i);
  if (dup) throw new Error(`Duplicate component id "${dup}" in components.json`);
  const orbitIds = new Set(list.filter((c) => c.category === "orbit").map((c) => c.id));
  for (const c of list) {
    if (c.category === "launcher") {
      if (!c.payloadCapacityKg) throw new Error(`Launcher "${c.id}" needs payloadCapacityKg`);
      if (!c.supportedOrbitIds?.length) throw new Error(`Launcher "${c.id}" needs supportedOrbitIds`);
      for (const o of c.supportedOrbitIds) if (!orbitIds.has(o)) throw new Error(`Launcher "${c.id}" supports unknown orbit "${o}"`);
    }
    if (c.category === "orbit" && c.eclipseMinutes === undefined) throw new Error(`Orbit "${c.id}" needs eclipseMinutes`);
  }
  return list;
}

/** Cross-check missions against the catalogue (e.g. allowed orbits must exist and be orbits). */
export function checkMissionsAgainstCatalogue(missions: Mission[], components: Component[]): void {
  const orbitIds = new Set(components.filter((c) => c.category === "orbit").map((c) => c.id));
  for (const m of missions)
    for (const o of m.allowedOrbitIds)
      if (!orbitIds.has(o)) throw new Error(`Mission "${m.id}" allows unknown orbit "${o}"`);
}

export const loadComponents = (): Component[] =>
  parseComponents(JSON.parse(readFileSync(new URL("./components.json", import.meta.url), "utf8")));
