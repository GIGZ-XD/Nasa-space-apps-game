import type { Evaluation } from "@mission-architect/shared";

// In-memory for the MVP. Swap point for Prisma/PostgreSQL later; results are lost on restart.
const results = new Map<string, Evaluation>();

export const resultRepository = {
  save(e: Evaluation): Evaluation { results.set(e.id, e); return e; },
  findById: (id: string): Evaluation | undefined => results.get(id),
};
