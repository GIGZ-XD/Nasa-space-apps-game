export type Difficulty = "easy" | "medium" | "hard";

/** Public mission info only. Ideal configs / weights never appear here. */
export interface Mission {
  id: string;
  name: string;
  objective: string;
  difficulty: Difficulty;
  /** Starting budget in USD */
  budgetUsd: number;
  requirements: string[];
}
