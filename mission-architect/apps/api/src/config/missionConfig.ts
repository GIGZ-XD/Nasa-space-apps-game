// ====================================================================
// Mission scoring & balance configuration (all values are tunable).
// Nothing in the scoring/reward/constraint code hardcodes these numbers.
// ====================================================================

/** Success threshold (percent). successRate >= threshold => MISSION SUCCESSFUL. */
export const MISSION_SUCCESS_THRESHOLD = 60;

/**
 * Parts that are not the ideal/listed alternative for a slot but belong to the
 * same equipment category still count: their catalogue suitability is scaled by
 * this factor (0.6 => a 100-rated off-spec part scores 60).
 */
export const OFF_SPEC_SUITABILITY_FACTOR = 0.6;

/**
 * Equipment categories that are different "types" of the same kind of hardware.
 * A part from one category can still fill an empty slot of a sibling category,
 * but at a further reduced suitability (CROSS_TYPE_SUITABILITY_FACTOR on top of
 * the off-spec factor). Example: a comms radio counted as a science sensor.
 */
export const EQUIPMENT_FAMILIES: number[][] = [
  [4, 5, 8, 10, 11], // sensors, comms, deployable science, navigation, sampling tools
  [6, 9, 12], // landers / entry systems, rovers, ascent vehicles
];
export const CROSS_TYPE_SUITABILITY_FACTOR = 0.5;

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

/** Budget cap (USD) on total spacecraft cost, applied to every mission. */
export const MISSION_BUDGET = 20_000_000;

export interface MissionConstraintConfig {
  level: number;
  destination: "LEO" | "Lunar" | "Mars";
  budget: number; // max total spacecraft cost (USD)
  /** Power check limit (W): generated − consumed must be at least this. */
  minNetPower: number;
  /** Per-variant override of minNetPower (Level 5 expert missions). */
  variantMinNetPower?: Record<string, number>;
  requiredDeltaV: number; // m/s the launch vehicle must provide
  fuelMassKg: number; // propellant mass added to the payload mass
}

/**
 * Hard-constraint requirements per mission level.
 * NOTE: Math_calculations.pdf was not available in the repository, so these are
 * game-balancing values; edit them here to match the official numbers.
 */
export const MISSION_CONSTRAINTS: MissionConstraintConfig[] = [
  { level: 1, destination: "LEO", budget: MISSION_BUDGET, minNetPower: 25, requiredDeltaV: 9_400, fuelMassKg: 50 },
  { level: 2, destination: "Lunar", budget: MISSION_BUDGET, minNetPower: 85, requiredDeltaV: 12_500, fuelMassKg: 150 },
  { level: 3, destination: "Lunar", budget: MISSION_BUDGET, minNetPower: 590, requiredDeltaV: 12_500, fuelMassKg: 800 },
  { level: 4, destination: "Mars", budget: MISSION_BUDGET, minNetPower: 90, requiredDeltaV: 13_800, fuelMassKg: 1_500 },
  { level: 5, destination: "Mars", budget: MISSION_BUDGET, minNetPower: 2_880, variantMinNetPower: { bennu: 2_880, msr: 3_320 }, requiredDeltaV: 14_200, fuelMassKg: 4_000 },
];
