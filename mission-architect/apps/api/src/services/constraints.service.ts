import { MISSION_CONSTRAINTS, type MissionConstraintConfig } from "../config/missionConfig";
import { getEquipmentByUniqueId, getIdealConfig, getUniqueId } from "../data/aegisCatalogue";
import { ALL_MARKET_PARTS } from "../../../web/src/data/marketData";

/**
 * Per-equipment physical data (game-balancing values; Math_calculations.pdf
 * was not available). mass in kg, power in W (+generated / -consumed),
 * vehicles also carry payloadLimitKg and deltaV (m/s).
 */
interface Physics {
  mass: number;
  power: number;
  payloadLimitKg?: number;
  deltaV?: number;
}

export const EQUIPMENT_PHYSICS: Record<number, Physics> = {
  // pads (not part of spacecraft mass)
  1001: { mass: 0, power: 0 }, 1002: { mass: 0, power: 0 }, 1003: { mass: 0, power: 0 },
  1004: { mass: 0, power: 0 }, 1005: { mass: 0, power: 0 },
  // launch vehicles
  2001: { mass: 0, power: 0, payloadLimitKg: 450, deltaV: 9_500 },
  2002: { mass: 0, power: 0, payloadLimitKg: 300, deltaV: 9_450 },
  2003: { mass: 0, power: 0, payloadLimitKg: 22_800, deltaV: 13_000 },
  2004: { mass: 0, power: 0, payloadLimitKg: 600, deltaV: 12_600 },
  2005: { mass: 0, power: 0, payloadLimitKg: 18_500, deltaV: 13_000 },
  2006: { mass: 0, power: 0, payloadLimitKg: 27_200, deltaV: 13_000 },
  2007: { mass: 0, power: 0, payloadLimitKg: 17_400, deltaV: 14_200 },
  2008: { mass: 0, power: 0, payloadLimitKg: 63_800, deltaV: 14_800 },
  2009: { mass: 0, power: 0, payloadLimitKg: 105_000, deltaV: 15_500 },
  // buses
  3001: { mass: 12, power: 40 }, 3002: { mass: 25, power: 200 }, 3003: { mass: 1_900, power: 1_800 },
  3004: { mass: 880, power: 3_000 }, 3005: { mass: 2_500, power: 3_500 },
  // sensors / comms
  4001: { mass: 5, power: -15 }, 4002: { mass: 60, power: -100 }, 4003: { mass: 9, power: -20 },
  4004: { mass: 4, power: -40 },
  5001: { mass: 3, power: -15 }, 5002: { mass: 30, power: -60 },
  // landers / entry
  6001: { mass: 1_900, power: -150 }, 6002: { mass: 1_500, power: -150 }, 6003: { mass: 360, power: -120 },
  6004: { mass: 2_400, power: -80 },
  // power
  7001: { mass: 90, power: 900 }, 7002: { mass: 45, power: 400 },
  // deployables
  8001: { mass: 20, power: -60 }, 8002: { mass: 29, power: -40 }, 8003: { mass: 15, power: -50 },
  // rovers / nav / sampling
  9001: { mass: 1_025, power: -100 }, 9002: { mass: 900, power: -100 },
  10001: { mass: 6, power: -30 }, 10002: { mass: 15, power: -50 },
  11001: { mass: 50, power: -60 }, 11002: { mass: 70, power: -70 }, 11003: { mass: 40, power: -60 },
  // return
  12001: { mass: 500, power: -100 }, 12002: { mass: 45, power: -10 }, 13001: { mass: 60, power: 0 },
};

export interface ConstraintCheck {
  id: "budget" | "mass" | "power" | "deltaV" | "equipment";
  label: string;
  passed: boolean;
  actual: number;
  limit: number;
  unit: string;
  detail: string;
}

export interface ConstraintResult {
  level: number;
  destination: string;
  checks: ConstraintCheck[];
  mission_readiness_score: number; // MRS = available / total required × 100
  all_passed: boolean;
  launch_allowed: boolean;
  blockers: string[];
}

export function getConstraintConfig(level: number): MissionConstraintConfig | undefined {
  return MISSION_CONSTRAINTS.find((c) => c.level === level);
}

/** Total cost: market price for market part ids (the amount the player paid). */
function partCost(partId: string): number {
  return ALL_MARKET_PARTS.find((p) => p.id === partId)?.price ?? 0;
}

/**
 * Hard-constraint validation, kept separate from LOS.
 * LOS alone never overrides a failed hard constraint.
 */
export function validateConstraints(level: number, selectedParts: Array<string | number>): ConstraintResult {
  const cfg = getConstraintConfig(level);
  const ideal = getIdealConfig(level);
  if (!cfg || !ideal) throw new Error(`No constraint configuration for level ${level}`);

  // Resolve valid, unlocked, de-duplicated equipment.
  const items = new Map<number, { partId: string; uniqueId: number }>();
  for (const raw of selectedParts) {
    const partId = String(raw);
    const uniqueId = getUniqueId(partId);
    const eq = uniqueId === undefined ? undefined : getEquipmentByUniqueId(uniqueId);
    if (!eq || eq.unlockLevel > level) continue;
    if (!items.has(eq.uniqueId)) items.set(eq.uniqueId, { partId, uniqueId: eq.uniqueId });
  }

  // Mission Readiness Score: required slots that are filled.
  const filled = ideal.requiredSlots.filter((s) => s.options.some((o) => items.has(o.uniqueId))).length;
  const mrs = Math.round((filled / ideal.requiredSlots.length) * 10000) / 100;

  let cost = 0;
  let payloadMass = cfg.fuelMassKg;
  let powerNet = 0;
  let vehicle: Physics | undefined;
  for (const { partId, uniqueId } of items.values()) {
    const ph = EQUIPMENT_PHYSICS[uniqueId];
    cost += partCost(partId);
    if (!ph) continue;
    if (ph.payloadLimitKg !== undefined) vehicle = vehicle ?? ph;
    payloadMass += ph.mass;
    powerNet += ph.power;
  }
  const payloadLimit = vehicle?.payloadLimitKg ?? 0;
  const deltaV = vehicle?.deltaV ?? 0;

  const checks: ConstraintCheck[] = [
    {
      id: "equipment",
      label: "Mandatory Equipment",
      passed: filled === ideal.requiredSlots.length,
      actual: filled,
      limit: ideal.requiredSlots.length,
      unit: "slots",
      detail: `${filled}/${ideal.requiredSlots.length} required slots filled`,
    },
    {
      id: "budget",
      label: "Budget",
      passed: cost <= cfg.budget,
      actual: cost,
      limit: cfg.budget,
      unit: "USD",
      detail: `Total cost ≤ mission budget`,
    },
    {
      id: "mass",
      label: "Mass",
      passed: !!vehicle && payloadMass <= payloadLimit,
      actual: payloadMass,
      limit: payloadLimit,
      unit: "kg",
      detail: vehicle ? "Spacecraft mass + fuel ≤ rocket payload limit" : "No launch vehicle selected",
    },
    {
      id: "power",
      label: "Power",
      passed: powerNet >= 0,
      actual: powerNet,
      limit: 0,
      unit: "W",
      detail: "Power generated − power consumed ≥ 0",
    },
    {
      id: "deltaV",
      label: "Delta-V",
      passed: !!vehicle && deltaV >= cfg.requiredDeltaV,
      actual: deltaV,
      limit: cfg.requiredDeltaV,
      unit: "m/s",
      detail: vehicle ? `Rocket Δv ≥ ${cfg.destination} requirement` : "No launch vehicle selected",
    },
  ];

  const blockers = checks.filter((c) => !c.passed).map((c) => `${c.label} check failed`);
  const all_passed = blockers.length === 0;
  return {
    level,
    destination: cfg.destination,
    checks,
    mission_readiness_score: mrs,
    all_passed,
    launch_allowed: all_passed,
    blockers,
  };
}
