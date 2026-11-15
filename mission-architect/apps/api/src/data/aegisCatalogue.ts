// ====================================================================
// AEGIS CATALOGUE — Backend Authoritative Equipment Data
// All suitability values, weights, and configurations live here.
// ====================================================================

export interface EquipmentItem {
  uniqueId: number;
  categoryId: number;
  name: string;
  suitability: number; // 0–100
}

export interface CategoryWeight {
  categoryId: number;
  name: string;
  weight: number;
}

/** A single required slot: a category and the ideal uniqueId (benchmark) */
export interface RequiredSlot {
  categoryId: number;
  label: string; // human-readable slot name
}

export interface IdealConfig {
  level: number;
  requiredSlots: RequiredSlot[];
  idealUniqueIds: number[]; // for reference only
}

export interface MissionRewardConfig {
  level: number;
  baseCoins: number; // base reward for 100% LOS
  baseXP: number;    // B in the XP formula
  difficulty: number; // D (1–10)
}

// -----------------------------------------------------------------------
// 1. Equipment catalogue
// -----------------------------------------------------------------------
export const EQUIPMENT_CATALOGUE: EquipmentItem[] = [
  // --- Level 1 ---
  { uniqueId: 1001, categoryId: 1,  name: "Wallops Flight Facility (Pad 0A)", suitability: 100 },
  { uniqueId: 2001, categoryId: 2,  name: "Pegasus XL", suitability: 100 },
  { uniqueId: 2002, categoryId: 2,  name: "Electron VADR", suitability: 95 },
  { uniqueId: 3001, categoryId: 3,  name: "RainCube 6U CubeSat Bus", suitability: 100 },
  { uniqueId: 4001, categoryId: 4,  name: "OLI-2 Mini Optical Camera", suitability: 100 },

  // --- Level 2 ---
  { uniqueId: 1002, categoryId: 1,  name: "Kennedy Space Center (LC-39A)", suitability: 100 },
  { uniqueId: 2003, categoryId: 2,  name: "Falcon 9", suitability: 100 },
  { uniqueId: 2004, categoryId: 2,  name: "Minotaur V", suitability: 95 },
  { uniqueId: 3002, categoryId: 3,  name: "CAPSTONE Deep-Space CubeSat", suitability: 100 },
  { uniqueId: 3003, categoryId: 3,  name: "Lunar Reconnaissance Orbiter Bus", suitability: 98 },
  { uniqueId: 5001, categoryId: 5,  name: "IRIS Deep-Space X-Band Transponder", suitability: 100 },
  { uniqueId: 4002, categoryId: 4,  name: "LROC Camera", suitability: 100 },
  { uniqueId: 4003, categoryId: 4,  name: "Neutron Spectrometer", suitability: 95 },

  // --- Level 3 ---
  { uniqueId: 1003, categoryId: 1,  name: "Cape Canaveral SLC-41", suitability: 100 },
  { uniqueId: 2005, categoryId: 2,  name: "Atlas V", suitability: 100 },
  { uniqueId: 2006, categoryId: 2,  name: "Vulcan Centaur", suitability: 98 },
  { uniqueId: 6001, categoryId: 6,  name: "Nova-C Lander", suitability: 100 },
  { uniqueId: 6002, categoryId: 6,  name: "Blue Ghost Lander", suitability: 100 },
  { uniqueId: 6003, categoryId: 6,  name: "InSight Mars Lander", suitability: 95 },
  { uniqueId: 7001, categoryId: 7,  name: "Solar Wings + RHUs", suitability: 100 },
  { uniqueId: 5002, categoryId: 5,  name: "High-Gain X-Band Dish Antenna", suitability: 100 },
  { uniqueId: 8001, categoryId: 8,  name: "Robotic Arm", suitability: 100 },
  { uniqueId: 8002, categoryId: 8,  name: "Seismometer", suitability: 98 },
  { uniqueId: 8003, categoryId: 8,  name: "Drill", suitability: 98 },

  // --- Level 4 ---
  { uniqueId: 2007, categoryId: 2,  name: "Atlas V 541", suitability: 100 },
  { uniqueId: 2008, categoryId: 2,  name: "Falcon Heavy", suitability: 98 },
  { uniqueId: 6004, categoryId: 6,  name: "Aeroshell Heat Shield + Sky Crane", suitability: 100 },
  { uniqueId: 9001, categoryId: 9,  name: "Perseverance Rover", suitability: 100 },
  { uniqueId: 9002, categoryId: 9,  name: "Curiosity Rover", suitability: 98 },
  { uniqueId: 7002, categoryId: 7,  name: "MMRTG", suitability: 100 },
  { uniqueId: 10001, categoryId: 10, name: "Navcam Stereo Cameras + AutoNav", suitability: 100 },
  { uniqueId: 4004, categoryId: 4,  name: "SHERLOC Spectrometer", suitability: 100 },
  { uniqueId: 11001, categoryId: 11, name: "Rotary Percussive Drill + Sample Caching System", suitability: 100 },

  // --- Level 5 ---
  { uniqueId: 1004, categoryId: 1,  name: "Kennedy Space Center (LC-39B)", suitability: 100 },
  { uniqueId: 1005, categoryId: 1,  name: "Heavy Integration Pad", suitability: 98 },
  { uniqueId: 2009, categoryId: 2,  name: "SLS Block 1B", suitability: 100 },
  { uniqueId: 3004, categoryId: 3,  name: "OSIRIS-REx Interplanetary Bus", suitability: 100 },
  { uniqueId: 3005, categoryId: 3,  name: "Mars Sample Return Orbiter Bus", suitability: 98 },
  { uniqueId: 10002, categoryId: 10, name: "Autonomous Optical Guidance + LiDAR", suitability: 100 },
  { uniqueId: 11002, categoryId: 11, name: "TAGSAM Robotic Arm", suitability: 100 },
  { uniqueId: 11003, categoryId: 11, name: "Coring Drill", suitability: 98 },
  { uniqueId: 12001, categoryId: 12, name: "Mars Ascent Vehicle", suitability: 100 },
  { uniqueId: 12002, categoryId: 12, name: "Sample Return Capsule", suitability: 98 },
  { uniqueId: 13001, categoryId: 13, name: "PICA-X Reinforced Aeroshell Capsule", suitability: 100 },
];

// -----------------------------------------------------------------------
// 2. Category weights (configurable)
// -----------------------------------------------------------------------
export const CATEGORY_WEIGHTS: CategoryWeight[] = [
  { categoryId: 1,  name: "Launch Pad",                  weight: 5  },
  { categoryId: 2,  name: "Launch Vehicle",              weight: 20 },
  { categoryId: 3,  name: "Spacecraft Bus",              weight: 15 },
  { categoryId: 4,  name: "Sensor",                      weight: 8  },
  { categoryId: 5,  name: "Communications",              weight: 10 },
  { categoryId: 6,  name: "Lander / Entry System",       weight: 15 },
  { categoryId: 7,  name: "Power & Thermal",             weight: 10 },
  { categoryId: 8,  name: "Deployable Science Equipment",weight: 7  },
  { categoryId: 9,  name: "Rover",                       weight: 15 },
  { categoryId: 10, name: "Navigation & Autonomy",       weight: 10 },
  { categoryId: 11, name: "Sample Collection Tools",     weight: 10 },
  { categoryId: 12, name: "Ascent / Return Vehicle",     weight: 12 },
  { categoryId: 13, name: "Earth Entry Vehicle",         weight: 8  },
];

// -----------------------------------------------------------------------
// 3. Ideal configurations per mission level
//    Each slot specifies the category and the ideal uniqueId (benchmark)
// -----------------------------------------------------------------------
export const IDEAL_CONFIGS: IdealConfig[] = [
  {
    level: 1,
    requiredSlots: [
      { categoryId: 1, label: "Launch Pad" },
      { categoryId: 2, label: "Launch Vehicle" },
      { categoryId: 3, label: "Spacecraft Bus" },
      { categoryId: 4, label: "Sensor" },
    ],
    idealUniqueIds: [1001, 2001, 3001, 4001],
  },
  {
    level: 2,
    requiredSlots: [
      { categoryId: 1, label: "Launch Pad" },
      { categoryId: 2, label: "Launch Vehicle" },
      { categoryId: 3, label: "Spacecraft Bus" },
      { categoryId: 4, label: "Sensor" },
      { categoryId: 5, label: "Communications" },
    ],
    idealUniqueIds: [1002, 2003, 3002, 4002, 5001],
  },
  {
    level: 3,
    requiredSlots: [
      { categoryId: 1, label: "Launch Pad" },
      { categoryId: 2, label: "Launch Vehicle" },
      { categoryId: 5, label: "Communications" },
      { categoryId: 6, label: "Lander" },
      { categoryId: 7, label: "Power & Thermal" },
      { categoryId: 8, label: "Robotic Arm" },
      { categoryId: 8, label: "Seismometer" },
    ],
    idealUniqueIds: [1002, 2005, 5002, 6001, 7001, 8001, 8002],
  },
  {
    level: 4,
    requiredSlots: [
      { categoryId: 1,  label: "Launch Pad" },
      { categoryId: 2,  label: "Launch Vehicle" },
      { categoryId: 6,  label: "Entry System" },
      { categoryId: 7,  label: "Power System" },
      { categoryId: 9,  label: "Rover" },
      { categoryId: 10, label: "Navigation" },
      { categoryId: 4,  label: "Sensor" },
      { categoryId: 11, label: "Sample Collection" },
    ],
    idealUniqueIds: [1003, 2007, 6004, 7002, 9001, 10001, 4004, 11001],
  },
  {
    level: 5,
    requiredSlots: [
      { categoryId: 1,  label: "Launch Pad" },
      { categoryId: 2,  label: "Launch Vehicle" },
      { categoryId: 3,  label: "Spacecraft Bus" },
      { categoryId: 10, label: "Navigation" },
      { categoryId: 11, label: "Sample Collection" },
      { categoryId: 12, label: "Ascent / Return Vehicle" },
      { categoryId: 13, label: "Earth Entry Vehicle" },
    ],
    idealUniqueIds: [1004, 2009, 3004, 10002, 11002, 12001, 13001],
  },
];

// -----------------------------------------------------------------------
// 4. Mission reward configuration
// -----------------------------------------------------------------------
export const MISSION_REWARDS: MissionRewardConfig[] = [
  { level: 1, baseCoins: 500000,   baseXP: 500,  difficulty: 2 },
  { level: 2, baseCoins: 750000,   baseXP: 700,  difficulty: 4 },
  { level: 3, baseCoins: 1000000,  baseXP: 900,  difficulty: 6 },
  { level: 4, baseCoins: 1500000,  baseXP: 1200, difficulty: 8 },
  { level: 5, baseCoins: 2000000,  baseXP: 1500, difficulty: 10 },
];

// -----------------------------------------------------------------------
// 5. Market part ID → LOS unique_id mapping
// -----------------------------------------------------------------------
export const PART_ID_TO_UNIQUE_ID: Record<string, number> = {
  // Launchpads
  "lp1": 1001, // Wallops Flight Facility
  "lp2": 1002, // Kennedy Space Center (LC-39A)
  "lp3": 1003, // Cape Canaveral SLC-41

  // Launch Vehicles
  "lv1": 2001, // Pegasus XL (Suborbital Sounding Rocket mapped to Pegasus XL)
  "lv2": 2002, // Electron VADR (Pegasus XL / Electron VADR in market)
  "lv3": 2003, // Falcon 9
  "lv4": 2005, // Atlas V (401/541)
  "lv5": 2008, // Falcon Heavy
  "lv6": 2009, // SLS Block 1B

  // Satellites / Spacecraft Buses
  "sat1": 3001, // 1U/3U → mapped to RainCube 6U (closest)
  "sat2": 3001, // RainCube 6U CubeSat Bus
  "sat3": 3002, // CAPSTONE Deep-Space CubeSat
  "sat4": 3002, // CAPSTONE
  "sat5": 3003, // Lunar Reconnaissance Orbiter Bus
  "sat6": 3004, // OSIRIS-REx Interplanetary Bus

  // Sensors & Payloads
  "sp1":  4001, // Basic VHF → OLI-2 (closest category 4)
  "sp2":  4001, // OLI-2 Mini Optical Camera
  "sp3":  5002, // S-Band/X-Band High-Gain → Communications category
  "sp4":  4002, // LROC Camera
  "sp5":  4003, // Neutron Spectrometer
  "sp6":  10002, // Autonomous Optical Nav & LiDAR → Navigation
  "sp7":  8002, // SEIS Seismometer
  "sp8":  4004, // Mastcam-Z / SHERLOC Spectrometer
  "sp9":  11001, // TRIDENT Drill → Sample Collection
  "sp10": 11003, // Heavy Core-Drill → Coring Drill

  // Landers & Rovers
  "lr1":  6003, // DART → InSight-class lander
  "lr2":  6001, // Nova-C / Blue Ghost Lander
  "lr3":  6003, // InSight Mars Stationary Lander
  "lr4":  6002, // CLPS Heavy → Blue Ghost
  "lr5":  6004, // Aeroshell + Sky Crane
  "lr6":  12001, // Mars Sample Retrieval + MAV → Ascent Vehicle
  "lr7":  9002, // VIPER Rover → Curiosity (closest rover)
  "lr8":  9001, // Perseverance 6-Wheeled Rover
  "lr9":  11001, // Sample Cache Retrieval Rover
};

// Helper: get uniqueId from market part id
export function getUniqueId(partId: string): number | undefined {
  return PART_ID_TO_UNIQUE_ID[partId];
}

// Helper: get equipment item by uniqueId
export function getEquipmentByUniqueId(uniqueId: number): EquipmentItem | undefined {
  return EQUIPMENT_CATALOGUE.find((e) => e.uniqueId === uniqueId);
}

// Helper: get category weight
export function getCategoryWeight(categoryId: number): number {
  return CATEGORY_WEIGHTS.find((c) => c.categoryId === categoryId)?.weight ?? 0;
}

// Helper: get ideal config for level
export function getIdealConfig(level: number): IdealConfig | undefined {
  return IDEAL_CONFIGS.find((c) => c.level === level);
}

// Helper: get mission rewards for level
export function getMissionRewards(level: number): MissionRewardConfig | undefined {
  return MISSION_REWARDS.find((r) => r.level === level);
}
