import {
  EQUIPMENT_CATALOGUE,
  IDEAL_CONFIGS,
  CATEGORY_WEIGHTS,
  PART_ID_TO_UNIQUE_ID,
  getEquipmentByUniqueId,
  getCategoryWeight,
  getIdealConfig,
} from "../data/aegisCatalogue";

export interface EquipmentInput {
  partId: string;   // market part id (e.g. "lp1")
  categoryId?: number;
}

export interface EquipmentScore {
  categoryId: number;
  categoryName: string;
  label: string;
  selectedPartId: string | null;
  selectedName: string;
  suitability: number;
  weight: number;
}

export interface LOSResult {
  level: number;
  los: number;
  ideal_los: number;
  success_rate: number;
  missing_equipment: string[];
  equipment_scores: EquipmentScore[];
  mission_status: "PENDING" | "SUCCESS" | "FAILED";
}

/**
 * calculateLOS — backend-authoritative LOS calculation.
 * Never trusts suitability from the frontend.
 *
 * @param level       Mission level 1–5
 * @param selectedParts  Array of market part ids the player has installed
 */
export function calculateLOS(level: number, selectedParts: string[]): LOSResult {
  const config = getIdealConfig(level);
  if (!config) {
    throw new Error(`No ideal configuration found for level ${level}`);
  }

  const catWeightMap = new Map<number, number>();
  for (const cw of CATEGORY_WEIGHTS) {
    catWeightMap.set(cw.categoryId, cw.weight);
  }

  const catNameMap = new Map<number, string>();
  for (const cw of CATEGORY_WEIGHTS) {
    catNameMap.set(cw.categoryId, cw.name);
  }

  // Build a map: categoryId → array of installed suitabilities (from backend catalogue)
  // A player may install multiple items in the same category (e.g. two deployables for level 3).
  const installedByCat = new Map<number, { suitability: number; name: string; partId: string }[]>();

  for (const partId of selectedParts) {
    const uniqueId = PART_ID_TO_UNIQUE_ID[partId];
    if (uniqueId === undefined) continue;
    const item = getEquipmentByUniqueId(uniqueId);
    if (!item) continue;
    const existing = installedByCat.get(item.categoryId) ?? [];
    existing.push({ suitability: item.suitability, name: item.name, partId });
    installedByCat.set(item.categoryId, existing);
  }

  // Count required slots per category
  const requiredCountByCat = new Map<number, number>();
  for (const slot of config.requiredSlots) {
    requiredCountByCat.set(slot.categoryId, (requiredCountByCat.get(slot.categoryId) ?? 0) + 1);
  }

  // Build per-slot scores
  const slotSuitabilities = new Map<number, number[]>(); // categoryId → list of per-slot suitabilities
  for (const [catId, count] of requiredCountByCat) {
    const installed = installedByCat.get(catId) ?? [];
    const perSlot: number[] = [];
    for (let i = 0; i < count; i++) {
      perSlot.push(installed[i]?.suitability ?? 0);
    }
    slotSuitabilities.set(catId, perSlot);
  }

  // Build equipment_scores list
  const equipment_scores: EquipmentScore[] = [];
  const missing_equipment: string[] = [];

  for (const slot of config.requiredSlots) {
    const { categoryId, label } = slot;
    const installed = installedByCat.get(categoryId) ?? [];
    const slotIndex = equipment_scores.filter((s) => s.categoryId === categoryId).length;
    const item = installed[slotIndex];

    const suitability = item?.suitability ?? 0;
    if (!item) missing_equipment.push(label);

    equipment_scores.push({
      categoryId,
      categoryName: catNameMap.get(categoryId) ?? "Unknown",
      label,
      selectedPartId: item?.partId ?? null,
      selectedName: item?.name ?? "— not installed —",
      suitability,
      weight: getCategoryWeight(categoryId),
    });
  }

  // LOS = Σ(Wi × avg_Si_per_category) / Σ(Wi)
  // Build average suitability per category across its required slots
  const catAvgSuit = new Map<number, number>();
  for (const [catId, suits] of slotSuitabilities) {
    catAvgSuit.set(catId, suits.reduce((a, b) => a + b, 0) / suits.length);
  }

  let weightedSum = 0;
  let totalWeight = 0;
  for (const [catId, avgSuit] of catAvgSuit) {
    const w = catWeightMap.get(catId) ?? 0;
    weightedSum += w * avgSuit;
    totalWeight += w;
  }

  const los = totalWeight === 0 ? 0 : Math.min(100, Math.max(0, Math.round((weightedSum / totalWeight) * 100) / 100));

  return {
    level,
    los,
    ideal_los: 100,
    success_rate: los,
    missing_equipment,
    equipment_scores,
    mission_status: "PENDING",
  };
}
