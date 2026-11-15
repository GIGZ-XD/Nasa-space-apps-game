import {
  getCategoryName,
  getCategoryWeight,
  getEquipmentByUniqueId,
  getIdealConfig,
  getUniqueId,
  type EquipmentItem,
} from "../data/aegisCatalogue";
import { CROSS_TYPE_SUITABILITY_FACTOR, EQUIPMENT_FAMILIES, OFF_SPEC_SUITABILITY_FACTOR } from "../config/missionConfig";
import { ALL_MARKET_PARTS } from "../../../web/src/data/marketData";

export class EquipmentError extends Error {
  constructor(
    public code: "INVALID_ID" | "INVALID_LEVEL",
    message: string,
  ) {
    super(message);
    this.name = "EquipmentError";
  }
}

export interface EquipmentScore {
  slotId: string;
  categoryId: number;
  categoryName: string;
  label: string;
  selectedPartId: string | null;
  selectedUniqueId: number | null;
  selectedName: string;
  idealUniqueId: number;
  idealName: string;
  idealSuitability: number;
  suitability: number;
  difference: number; // idealSuitability - suitability
  weight: number; // category weight
  contribution: number; // weighted points this slot adds to LOS
  maxContribution: number;
}

export interface RejectedEquipment {
  partId: string;
  reason: "INVALID_ID";
  message: string;
}

/** What the player picked and how the evaluator interpreted each choice. */
export interface SelectedEquipmentReport {
  partId: string;
  playerName: string; // name of the part as the player sees it in the market
  uniqueId: number | null;
  equipmentName: string | null; // catalogue item it was resolved to
  status: "USED" | "OFF_SPEC" | "UNUSED" | "INVALID";
  slotLabel: string | null;
  suitability: number | null;
  message: string;
}

export interface LOSResult {
  level: number;
  variant: string | null;
  variant_name: string;
  los: number;
  ideal_los: number;
  success_rate: number;
  required_total: number;
  required_completed: number;
  missing_equipment: string[];
  equipment_scores: EquipmentScore[];
  rejected_equipment: RejectedEquipment[];
  selected_equipment: SelectedEquipmentReport[];
  mission_status: "PENDING" | "SUCCESS" | "FAILED";
}

export interface CalculateOptions {
  /** Mission variant (Level 5: "bennu" | "msr"). Defaults to the level's first variant. */
  variant?: string;
  /** strict (default): throw EquipmentError for invalid or locked equipment. */
  strict?: boolean;
}

const playerNameOf = (partId: string) => ALL_MARKET_PARTS.find((p) => p.id === partId)?.name ?? partId;

const round2 = (n: number) => Math.round(n * 100) / 100;

/**
 * calculateLOS — backend-authoritative LOS.
 *   LOS = Σ(Wi × Si) / Σ(Wi)
 * Wi is the category weight; for categories with several required slots the
 * slot suitabilities are averaged first, so the weight is never multiplied by
 * the slot count. Suitability always comes from the backend catalogue.
 */
export function calculateLOS(
  level: number,
  selectedParts: Array<string | number>,
  options: CalculateOptions = {},
): LOSResult {
  const strict = options.strict ?? true;
  const config = getIdealConfig(level, options.variant);
  if (!config) throw new EquipmentError("INVALID_LEVEL", `No ideal configuration found for level ${level}`);

  // 1. Resolve + validate the selected equipment.
  const selected: { partId: string; item: EquipmentItem }[] = [];
  const rejected: RejectedEquipment[] = [];
  const report: SelectedEquipmentReport[] = [];
  const seen = new Set<number>();
  for (const raw of selectedParts) {
    const partId = String(raw);
    const uniqueId = getUniqueId(partId);
    const item = uniqueId === undefined ? undefined : getEquipmentByUniqueId(uniqueId);
    if (!item) {
      const err = new EquipmentError("INVALID_ID", `Unknown equipment "${partId}"`);
      if (strict) throw err;
      rejected.push({ partId, reason: "INVALID_ID", message: err.message });
      report.push({ partId, playerName: playerNameOf(partId), uniqueId: null, equipmentName: null, status: "INVALID", slotLabel: null, suitability: null, message: "Not recognised by the mission catalogue" });
      continue;
    }
    if (seen.has(item.uniqueId)) continue; // same item twice never counts twice
    seen.add(item.uniqueId);
    selected.push({ partId, item });
  }

  // 2. Fill each required slot. Pass 1: ideal / listed alternatives.
  //    Pass 2: any other part of the same category counts at a reduced
  //    (off-spec) suitability, so every part the player picked is read.
  const used = new Set<number>();
  const offSpec = new Set<number>();
  const slotPick = new Map<string, { partId: string; item: EquipmentItem; suitability: number }>();

  for (const slot of config.requiredSlots) {
    let best: { partId: string; item: EquipmentItem; suitability: number } | null = null;
    for (const opt of slot.options) {
      const hit = selected.find((s) => s.item.uniqueId === opt.uniqueId && !used.has(s.item.uniqueId));
      if (hit && (!best || opt.suitability > best.suitability)) best = { ...hit, suitability: opt.suitability };
    }
    if (best) {
      used.add(best.item.uniqueId);
      slotPick.set(slot.slotId, best);
    }
  }
  for (const slot of config.requiredSlots) {
    if (slotPick.has(slot.slotId)) continue;
    let best: { partId: string; item: EquipmentItem; suitability: number } | null = null;
    for (const s of selected) {
      if (used.has(s.item.uniqueId) || s.item.categoryId !== slot.categoryId) continue;
      const suit = Math.round(s.item.suitability * OFF_SPEC_SUITABILITY_FACTOR);
      if (!best || suit > best.suitability) best = { ...s, suitability: suit };
    }
    if (best) {
      used.add(best.item.uniqueId);
      offSpec.add(best.item.uniqueId);
      slotPick.set(slot.slotId, best);
    }
  }

  // Pass 3: a different type of sensor/hardware from the same family still counts.
  const crossType = new Set<number>();
  const sameFamily = (a: number, b: number) => EQUIPMENT_FAMILIES.some((f) => f.includes(a) && f.includes(b));
  for (const slot of config.requiredSlots) {
    if (slotPick.has(slot.slotId)) continue;
    let best: { partId: string; item: EquipmentItem; suitability: number } | null = null;
    for (const s of selected) {
      if (used.has(s.item.uniqueId) || !sameFamily(s.item.categoryId, slot.categoryId)) continue;
      const suit = Math.round(s.item.suitability * OFF_SPEC_SUITABILITY_FACTOR * CROSS_TYPE_SUITABILITY_FACTOR);
      if (!best || suit > best.suitability) best = { ...s, suitability: suit };
    }
    if (best) {
      used.add(best.item.uniqueId);
      offSpec.add(best.item.uniqueId);
      crossType.add(best.item.uniqueId);
      slotPick.set(slot.slotId, best);
    }
  }

  const scores: EquipmentScore[] = [];
  const missing: string[] = [];
  for (const slot of config.requiredSlots) {
    const best = slotPick.get(slot.slotId) ?? null;
    if (!best) missing.push(slot.label);
    const idealItem = getEquipmentByUniqueId(slot.idealUniqueId);
    const idealSuitability = slot.options[0]?.suitability ?? 100;
    const suitability = best?.suitability ?? 0;
    scores.push({
      slotId: slot.slotId,
      categoryId: slot.categoryId,
      categoryName: getCategoryName(slot.categoryId),
      label: slot.label,
      selectedPartId: best?.partId ?? null,
      selectedUniqueId: best?.item.uniqueId ?? null,
      selectedName: best ? playerNameOf(best.partId) : "— not installed —",
      idealUniqueId: slot.idealUniqueId,
      idealName: idealItem?.name ?? "Unknown",
      idealSuitability,
      suitability,
      difference: idealSuitability - suitability,
      weight: getCategoryWeight(slot.categoryId),
      contribution: 0,
      maxContribution: 0,
    });
  }

  for (const { partId, item } of selected) {
    const sc = scores.find((x) => x.selectedUniqueId === item.uniqueId);
    report.push(
      sc
        ? offSpec.has(item.uniqueId)
          ? { partId, playerName: playerNameOf(partId), uniqueId: item.uniqueId, equipmentName: item.name, status: "OFF_SPEC", slotLabel: sc.label, suitability: sc.suitability, message: crossType.has(item.uniqueId) ? `Different type of equipment — counted in ${sc.label} at ${sc.suitability}% (vs ${sc.idealSuitability}%)` : `Not the ideal part — counted in ${sc.label} at ${sc.suitability}% (vs ${sc.idealSuitability}%)` }
          : { partId, playerName: playerNameOf(partId), uniqueId: item.uniqueId, equipmentName: item.name, status: "USED", slotLabel: sc.label, suitability: sc.suitability, message: `Counted in the ${sc.label} slot (${sc.suitability}% suitability)` }
        : { partId, playerName: playerNameOf(partId), uniqueId: item.uniqueId, equipmentName: item.name, status: "UNUSED", slotLabel: null, suitability: null, message: "Not needed for this mission — does not affect LOS" },
    );
  }

  // 3. Average per category, then weight.
  const byCategory = new Map<number, EquipmentScore[]>();
  for (const s of scores) byCategory.set(s.categoryId, [...(byCategory.get(s.categoryId) ?? []), s]);

  let weightedSum = 0;
  let totalWeight = 0;
  for (const [catId, slots] of byCategory) {
    const w = getCategoryWeight(catId);
    const avg = slots.reduce((a, s) => a + s.suitability, 0) / slots.length;
    weightedSum += w * avg;
    totalWeight += w;
  }
  for (const s of scores) {
    const slotsInCat = byCategory.get(s.categoryId)!.length;
    s.contribution = totalWeight ? round2(((s.weight / slotsInCat) * s.suitability) / totalWeight) : 0;
    s.maxContribution = totalWeight ? round2(((s.weight / slotsInCat) * s.idealSuitability) / totalWeight) : 0;
  }

  const raw = totalWeight === 0 ? 0 : weightedSum / totalWeight;
  const los = round2(Math.min(100, Math.max(0, raw)));
  const idealRaw =
    totalWeight === 0
      ? 0
      : [...byCategory].reduce(
          (a, [catId, slots]) =>
            a + getCategoryWeight(catId) * (slots.reduce((x, s) => x + s.idealSuitability, 0) / slots.length),
          0,
        ) / totalWeight;

  return {
    level,
    variant: config.variant ?? null,
    variant_name: config.name,
    los,
    ideal_los: round2(Math.min(100, idealRaw)),
    success_rate: los,
    required_total: config.requiredSlots.length,
    required_completed: config.requiredSlots.length - missing.length,
    missing_equipment: missing,
    equipment_scores: scores,
    rejected_equipment: rejected,
    selected_equipment: report,
    mission_status: "PENDING",
  };
}
