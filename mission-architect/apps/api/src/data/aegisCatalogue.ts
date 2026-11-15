// ====================================================================
// AEGIS CATALOGUE — backend-authoritative equipment data.
// Equipment, suitability values, category weights and ideal spacecraft
// configurations live here. The frontend never supplies suitability.
// ====================================================================
import { MISSION_REWARDS, type MissionRewardConfig } from "../config/missionConfig";

export type { MissionRewardConfig };

export interface EquipmentItem {
  uniqueId: number;
  categoryId: number; // equipment_id (category)
  name: string;
  suitability: number; // default suitability 0-100
  unlockLevel: number; // first mission level where it may be used
}

export interface CategoryWeight {
  categoryId: number;
  name: string;
  weight: number;
}

/** One selectable option for a slot, with its suitability for this level. */
export interface SlotOption {
  uniqueId: number;
  suitability: number;
}

/** A required slot: the ideal item plus acceptable alternatives. */
export interface RequiredSlot {
  slotId: string;
  categoryId: number;
  label: string;
  idealUniqueId: number;
  options: SlotOption[]; // ideal first, then alternatives
}

export interface IdealConfig {
  level: number;
  name: string;
  requiredSlots: RequiredSlot[];
  minimumRequiredCount: number; // slots that must be filled
}

// -----------------------------------------------------------------------
// 1. Equipment catalogue
// -----------------------------------------------------------------------
export const EQUIPMENT_CATALOGUE: EquipmentItem[] = [
  // Level 1
  { uniqueId: 1001, categoryId: 1, name: "Wallops Flight Facility (Pad 0A)", suitability: 100, unlockLevel: 1 },
  { uniqueId: 2001, categoryId: 2, name: "Pegasus XL", suitability: 100, unlockLevel: 1 },
  { uniqueId: 2002, categoryId: 2, name: "Electron VADR", suitability: 95, unlockLevel: 1 },
  { uniqueId: 3001, categoryId: 3, name: "RainCube 6U CubeSat Bus", suitability: 100, unlockLevel: 1 },
  { uniqueId: 4001, categoryId: 4, name: "OLI-2 Mini Optical Camera", suitability: 100, unlockLevel: 1 },
  // Level 2
  { uniqueId: 1002, categoryId: 1, name: "Kennedy Space Center (LC-39A)", suitability: 100, unlockLevel: 2 },
  { uniqueId: 2003, categoryId: 2, name: "Falcon 9", suitability: 100, unlockLevel: 2 },
  { uniqueId: 2004, categoryId: 2, name: "Minotaur V", suitability: 95, unlockLevel: 2 },
  { uniqueId: 3002, categoryId: 3, name: "CAPSTONE Deep-Space CubeSat", suitability: 100, unlockLevel: 2 },
  { uniqueId: 3003, categoryId: 3, name: "Lunar Reconnaissance Orbiter Bus", suitability: 98, unlockLevel: 2 },
  { uniqueId: 5001, categoryId: 5, name: "IRIS Deep-Space X-Band Transponder", suitability: 100, unlockLevel: 2 },
  { uniqueId: 4002, categoryId: 4, name: "LROC Camera", suitability: 100, unlockLevel: 2 },
  { uniqueId: 4003, categoryId: 4, name: "Neutron Spectrometer", suitability: 95, unlockLevel: 2 },
  // Level 3
  { uniqueId: 1003, categoryId: 1, name: "Cape Canaveral SLC-41", suitability: 100, unlockLevel: 3 },
  { uniqueId: 2005, categoryId: 2, name: "Atlas V", suitability: 100, unlockLevel: 3 },
  { uniqueId: 2006, categoryId: 2, name: "Vulcan Centaur", suitability: 98, unlockLevel: 3 },
  { uniqueId: 6001, categoryId: 6, name: "Nova-C Lander", suitability: 100, unlockLevel: 3 },
  { uniqueId: 6002, categoryId: 6, name: "Blue Ghost Lander", suitability: 100, unlockLevel: 3 },
  { uniqueId: 6003, categoryId: 6, name: "InSight Mars Lander", suitability: 95, unlockLevel: 3 },
  { uniqueId: 7001, categoryId: 7, name: "Solar Wings + RHUs", suitability: 100, unlockLevel: 3 },
  { uniqueId: 5002, categoryId: 5, name: "High-Gain X-Band Dish Antenna", suitability: 100, unlockLevel: 3 },
  { uniqueId: 8001, categoryId: 8, name: "Robotic Arm", suitability: 100, unlockLevel: 3 },
  { uniqueId: 8002, categoryId: 8, name: "Seismometer", suitability: 98, unlockLevel: 3 },
  { uniqueId: 8003, categoryId: 8, name: "Drill", suitability: 98, unlockLevel: 3 },
  // Level 4
  { uniqueId: 2007, categoryId: 2, name: "Atlas V 541", suitability: 100, unlockLevel: 4 },
  { uniqueId: 2008, categoryId: 2, name: "Falcon Heavy", suitability: 98, unlockLevel: 4 },
  { uniqueId: 6004, categoryId: 6, name: "Aeroshell Heat Shield + Sky Crane", suitability: 100, unlockLevel: 4 },
  { uniqueId: 9001, categoryId: 9, name: "Perseverance Rover", suitability: 100, unlockLevel: 4 },
  { uniqueId: 9002, categoryId: 9, name: "Curiosity Rover", suitability: 98, unlockLevel: 4 },
  { uniqueId: 7002, categoryId: 7, name: "MMRTG", suitability: 100, unlockLevel: 4 },
  { uniqueId: 10001, categoryId: 10, name: "Navcam Stereo Cameras + AutoNav", suitability: 100, unlockLevel: 4 },
  { uniqueId: 4004, categoryId: 4, name: "SHERLOC Spectrometer", suitability: 100, unlockLevel: 4 },
  { uniqueId: 11001, categoryId: 11, name: "Rotary Percussive Drill + Sample Caching System", suitability: 100, unlockLevel: 4 },
  // Level 5
  { uniqueId: 1004, categoryId: 1, name: "Kennedy Space Center (LC-39B)", suitability: 100, unlockLevel: 5 },
  { uniqueId: 1005, categoryId: 1, name: "Heavy Integration Pad", suitability: 98, unlockLevel: 5 },
  { uniqueId: 2009, categoryId: 2, name: "SLS Block 1B", suitability: 100, unlockLevel: 5 },
  { uniqueId: 3004, categoryId: 3, name: "OSIRIS-REx Interplanetary Bus", suitability: 100, unlockLevel: 5 },
  { uniqueId: 3005, categoryId: 3, name: "Mars Sample Return Orbiter Bus", suitability: 98, unlockLevel: 5 },
  { uniqueId: 10002, categoryId: 10, name: "Autonomous Optical Guidance + LiDAR", suitability: 100, unlockLevel: 5 },
  { uniqueId: 11002, categoryId: 11, name: "TAGSAM Robotic Arm", suitability: 100, unlockLevel: 5 },
  { uniqueId: 11003, categoryId: 11, name: "Coring Drill", suitability: 98, unlockLevel: 5 },
  { uniqueId: 12001, categoryId: 12, name: "Mars Ascent Vehicle", suitability: 100, unlockLevel: 5 },
  { uniqueId: 12002, categoryId: 12, name: "Sample Return Capsule", suitability: 98, unlockLevel: 5 },
  { uniqueId: 13001, categoryId: 13, name: "PICA-X Reinforced Aeroshell Capsule", suitability: 100, unlockLevel: 5 },
];

// -----------------------------------------------------------------------
// 2. Category weights (configurable)
// -----------------------------------------------------------------------
export const CATEGORY_WEIGHTS: CategoryWeight[] = [
  { categoryId: 1, name: "Launch Pad", weight: 5 },
  { categoryId: 2, name: "Launch Vehicle", weight: 20 },
  { categoryId: 3, name: "Spacecraft Bus", weight: 15 },
  { categoryId: 4, name: "Sensor", weight: 8 },
  { categoryId: 5, name: "Communications", weight: 10 },
  { categoryId: 6, name: "Lander / Entry System", weight: 15 },
  { categoryId: 7, name: "Power & Thermal", weight: 10 },
  { categoryId: 8, name: "Deployable Science Equipment", weight: 7 },
  { categoryId: 9, name: "Rover", weight: 15 },
  { categoryId: 10, name: "Navigation & Autonomy", weight: 10 },
  { categoryId: 11, name: "Sample Collection Tools", weight: 10 },
  { categoryId: 12, name: "Ascent / Return Vehicle", weight: 12 },
  { categoryId: 13, name: "Earth Entry Vehicle", weight: 8 },
];

// -----------------------------------------------------------------------
// 3. Ideal configurations (edit here — scoring code is data-driven)
// -----------------------------------------------------------------------
const slot = (
  slotId: string,
  categoryId: number,
  label: string,
  ideal: number,
  alternatives: SlotOption[] = [],
): RequiredSlot => ({
  slotId,
  categoryId,
  label,
  idealUniqueId: ideal,
  // The ideal item defines the benchmark, so it always scores 100 in its slot.
  options: [{ uniqueId: ideal, suitability: 100 }, ...alternatives],
});

export const IDEAL_CONFIGS: IdealConfig[] = [
  {
    level: 1,
    name: "Earth Observation",
    minimumRequiredCount: 4,
    requiredSlots: [
      slot("pad", 1, "Launch Pad", 1001),
      slot("vehicle", 2, "Launch Vehicle", 2001, [{ uniqueId: 2002, suitability: 95 }]),
      slot("bus", 3, "Spacecraft Bus", 3001),
      slot("sensor", 4, "Sensor", 4001),
    ],
  },
  {
    level: 2,
    name: "Lunar Mission",
    minimumRequiredCount: 5,
    requiredSlots: [
      slot("pad", 1, "Launch Pad", 1002),
      slot("vehicle", 2, "Launch Vehicle", 2003, [{ uniqueId: 2004, suitability: 95 }]),
      slot("bus", 3, "Spacecraft Bus", 3002, [{ uniqueId: 3003, suitability: 98 }]),
      slot("sensor", 4, "Sensor", 4002, [{ uniqueId: 4003, suitability: 95 }]),
      slot("comms", 5, "Communications", 5001),
    ],
  },
  {
    level: 3,
    name: "Planetary Landing",
    minimumRequiredCount: 7,
    requiredSlots: [
      slot("pad", 1, "Launch Pad", 1002, [{ uniqueId: 1003, suitability: 98 }]),
      slot("vehicle", 2, "Launch Vehicle", 2005, [{ uniqueId: 2006, suitability: 98 }]),
      slot("comms", 5, "Communications", 5002),
      slot("lander", 6, "Lander", 6001, [
        { uniqueId: 6002, suitability: 100 },
        { uniqueId: 6003, suitability: 95 },
      ]),
      slot("power", 7, "Power & Thermal", 7001),
      slot("arm", 8, "Robotic Arm", 8001),
      slot("seismometer", 8, "Seismometer", 8002, [{ uniqueId: 8003, suitability: 98 }]),
    ],
  },
  {
    level: 4,
    name: "Mars Rover Mission",
    minimumRequiredCount: 8,
    requiredSlots: [
      slot("pad", 1, "Launch Pad", 1003),
      slot("vehicle", 2, "Launch Vehicle", 2007, [{ uniqueId: 2008, suitability: 98 }]),
      slot("entry", 6, "Entry System", 6004),
      slot("power", 7, "Power System", 7002),
      slot("rover", 9, "Rover", 9001, [{ uniqueId: 9002, suitability: 98 }]),
      slot("nav", 10, "Navigation", 10001),
      slot("sensor", 4, "Sensor", 4004),
      slot("sampling", 11, "Sample Collection", 11001),
    ],
  },
  {
    level: 5,
    name: "Asteroid Sample Return",
    minimumRequiredCount: 7,
    requiredSlots: [
      slot("pad", 1, "Launch Pad", 1004, [{ uniqueId: 1005, suitability: 98 }]),
      slot("vehicle", 2, "Launch Vehicle", 2009),
      slot("bus", 3, "Spacecraft Bus", 3004, [{ uniqueId: 3005, suitability: 98 }]),
      slot("nav", 10, "Navigation", 10002),
      slot("sampling", 11, "Sample Collection", 11002, [{ uniqueId: 11003, suitability: 98 }]),
      slot("ascent", 12, "Ascent / Return Vehicle", 12001, [{ uniqueId: 12002, suitability: 98 }]),
      slot("entry", 13, "Earth Entry Vehicle", 13001),
    ],
  },
];

// -----------------------------------------------------------------------
// 4. Rewards (re-exported from the central config)
// -----------------------------------------------------------------------
export { MISSION_REWARDS };

// -----------------------------------------------------------------------
// 5. Market part id -> LOS unique_id mapping
// -----------------------------------------------------------------------
export const PART_ID_TO_UNIQUE_ID: Record<string, number> = {
  lp1: 1001, lp2: 1002, lp3: 1003,
  lv1: 2001, lv2: 2002, lv3: 2003, lv4: 2005, lv5: 2008, lv6: 2009,
  sat1: 3001, sat2: 3001, sat3: 3002, sat4: 3002, sat5: 3003, sat6: 3004,
  sp1: 5001, sp2: 4001, sp3: 5002, sp4: 4002, sp5: 4003, sp6: 10002,
  sp7: 8002, sp8: 4004, sp9: 11001, sp10: 11003,
  lr1: 6003, lr2: 6001, lr3: 6003, lr4: 6002, lr5: 6004, lr6: 12001,
  lr7: 9002, lr8: 9001, lr9: 11001,
};

/** Resolve a market part id ("lp1") or a numeric unique id ("1001"/1001). */
export function getUniqueId(partId: string | number): number | undefined {
  const key = String(partId).trim();
  if (key in PART_ID_TO_UNIQUE_ID) return PART_ID_TO_UNIQUE_ID[key];
  if (/^\d+$/.test(key)) {
    const n = Number(key);
    return EQUIPMENT_CATALOGUE.some((e) => e.uniqueId === n) ? n : undefined;
  }
  return undefined;
}

export function getEquipmentByUniqueId(uniqueId: number): EquipmentItem | undefined {
  return EQUIPMENT_CATALOGUE.find((e) => e.uniqueId === uniqueId);
}

export function getCategoryWeight(categoryId: number): number {
  return CATEGORY_WEIGHTS.find((c) => c.categoryId === categoryId)?.weight ?? 0;
}

export function getCategoryName(categoryId: number): string {
  return CATEGORY_WEIGHTS.find((c) => c.categoryId === categoryId)?.name ?? "Unknown";
}

export function getIdealConfig(level: number): IdealConfig | undefined {
  return IDEAL_CONFIGS.find((c) => c.level === level);
}

export function getMissionRewards(level: number): MissionRewardConfig | undefined {
  return MISSION_REWARDS.find((r) => r.level === level);
}
