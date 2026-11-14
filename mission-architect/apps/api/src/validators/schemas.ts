import { z } from "zod";

const id = z.string().trim().min(1).max(64);

export const designSchema = z.object({
  missionId: id,
  name: z.string().trim().min(1).max(80).optional(),
  componentIds: z.array(id).min(1).max(30).refine((a) => new Set(a).size === a.length, "duplicate component IDs"),
  orbitId: id,
  launchVehicleId: id,
}).strict();

export const idParamSchema = z.object({ id: id });
