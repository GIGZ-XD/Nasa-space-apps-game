// ====================================================================
// Mission scoring & balance configuration (all values are tunable).
// Nothing in the scoring/reward/constraint code hardcodes these numbers.
// ====================================================================

/** Success threshold (percent). successRate >= threshold => MISSION SUCCESSFUL. */
export const MISSION_SUCCESS_THRESHOLD = 30;

export interface MissionRewardConfig {
  level: number;
  baseCoins: number; // base coin reward at 100% LOS
  baseXP: number; // B in XP = B + D*10 + LOS*5
  difficulty: number; // D (1-10)
}

export const MISSION_REWARDS: MissionRewardConfig[] = [
  { level: 1, baseCoins: 500_000, baseXP: 500, difficulty: 2 },
  { level: 2, baseCoins: 750_000, baseXP: 700, difficulty: 4 },
  { level: 3, baseCoins: 1_000_000, baseXP: 900, difficulty: 6 },
  { level: 4, baseCoins: 1_500_000, baseXP: 1200, difficulty: 8 },
  { level: 5, baseCoins: 2_000_000, baseXP: 1500, difficulty: 10 },
];

export interface MissionConstraintConfig {
  level: number;
  destination: "LEO" | "Lunar" | "Mars";
  budget: number; // max total spacecraft cost (USD)
  requiredDeltaV: number; // m/s the launch vehicle must provide
  fuelMassKg: number; // propellant mass added to the payload mass
}

/**
 * Hard-constraint requirements per mission level.
 * NOTE: Math_calculations.pdf was not available in the repository, so these are
 * game-balancing values; edit them here to match the official numbers.
 */
export const MISSION_CONSTRAINTS: MissionConstraintConfig[] = [
  { level: 1, destination: "LEO", budget: 1_500_000, requiredDeltaV: 9_400, fuelMassKg: 50 },
  { level: 2, destination: "Lunar", budget: 3_000_000, requiredDeltaV: 12_500, fuelMassKg: 150 },
  { level: 3, destination: "Lunar", budget: 10_000_000, requiredDeltaV: 12_500, fuelMassKg: 800 },
  { level: 4, destination: "Mars", budget: 14_000_000, requiredDeltaV: 13_800, fuelMassKg: 1_500 },
  { level: 5, destination: "Mars", budget: 18_000_000, requiredDeltaV: 14_200, fuelMassKg: 4_000 },
];
