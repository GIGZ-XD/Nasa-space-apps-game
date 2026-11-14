import { z } from "zod";

export const designSchema = z.object({
  missionId: z.string().min(1),
  name: z.string().min(1).max(80).optional(),
  componentIds: z.array(z.string().min(1)).min(1).refine((a) => new Set(a).size === a.length, "duplicate component IDs"),
  orbitId: z.string().min(1),
  launchVehicleId: z.string().min(1),
}).strict();

export const idParamSchema = z.object({ id: z.string().min(1) });
