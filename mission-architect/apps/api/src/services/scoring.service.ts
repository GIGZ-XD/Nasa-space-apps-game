import {
  getCategoryName,
  getCategoryWeight,
  getEquipmentByUniqueId,
  getIdealConfig,
  getUniqueId,
  type EquipmentItem,
} from "../data/aegisCatalogue";
import { ALL_MARKET_PARTS } from "../../../web/src/data/marketData";

export class EquipmentError extends Error {
  constructor(
    public code: "INVALID_ID" | "LOCKED" | "INVALID_LEVEL",
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
  reason: "INVALID_ID" | "LOCKED";
  message: string;
}

/** What the player picked and how the evaluator interpreted each choice. */
export interface SelectedEquipmentReport {
  partId: string;
  playerName: string; // name of the part as the player sees it in the market
  uniqueId: number | null;
  equipmentName: string | null; // catalogue item it was resolved to
  status: "USED" | "UNUSED" | "LOCKED" | "INVALID";
  slotLabel: string | null;
  suitability: number | null;
  message: string;
}

export interface LOSResult {
  level: number;
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
  const config = getIdealConfig(level);
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
    if (item.unlockLevel > level) {
      const err = new EquipmentError(
        "LOCKED",
        `${item.name} is locked until mission level ${item.unlockLevel}`,
      );
      if (strict) throw err;
      rejected.push({ partId, reason: "LOCKED", message: err.message });
      report.push({ partId, playerName: playerNameOf(partId), uniqueId: item.uniqueId, equipmentName: item.name, status: "LOCKED", slotLabel: null, suitability: null, message: `Locked until mission level ${item.unlockLevel}` });
      continue;
    }
    if (seen.has(item.uniqueId)) continue; // same item twice never counts twice
    seen.add(item.uniqueId);
    selected.push({ partId, item });
  }

  // 2. Fill each required slot with its best matching selected item.
  const used = new Set<number>();
  const scores: EquipmentScore[] = [];
  const missing: string[] = [];

  for (const slot of config.requiredSlots) {
    let best: { partId: string; item: EquipmentItem; suitability: number } | null = null;
    for (const opt of slot.options) {
      const hit = selected.find((s) => s.item.uniqueId === opt.uniqueId && !used.has(s.item.uniqueId));
      if (hit && (!best || opt.suitability > best.suitability)) {
        best = { ...hit, suitability: opt.suitability };
      }
    }
    if (best) used.add(best.item.uniqueId);
    else missing.push(slot.label);

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
        ? { partId, playerName: playerNameOf(partId), uniqueId: item.uniqueId, equipmentName: item.name, status: "USED", slotLabel: sc.label, suitability: sc.suitability, message: `Counted in the ${sc.label} slot (${sc.suitability}% suitability)` }
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
