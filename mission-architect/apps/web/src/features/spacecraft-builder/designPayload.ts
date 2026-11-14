import type { SpacecraftDesign, ComponentCategory } from "@mission-architect/shared";
import type { SpacecraftStore } from "../../stores/spacecraftStore";
import { getCatalogueComponentById } from "../component-catalogue/componentData";
import { REQUIRED_CATEGORIES } from "./ReadinessSummary";

/**
 * Normalized component item inside the serializable assembly payload.
 */
export interface NormalizedAssemblyComponent {
  componentId: string;
  category: ComponentCategory;
  instanceId: string;
  addedAt: number;
}

/**
 * Stable, normalized spacecraft assembly payload for downstream consumption
 * by main mission evaluation, flight simulation, and persistence engines.
 */
export interface NormalizedSpacecraftAssemblyPayload {
  /** Contract schema version */
  schemaVersion: "1.0.0";
  /** Design UUID */
  designId: string;
  /** Spacecraft display name */
  spacecraftName: string;
  /** Deterministically sorted list of stable component IDs */
  componentIds: string[];
  /** Detailed component entries sorted deterministically by category and ID */
  components: NormalizedAssemblyComponent[];
  /** Mission target orbit and launch vehicle references */
  missionParameters: {
    orbitId: string | null;
    launcherId: string | null;
  };
  /** Architectural assembly completeness status */
  assemblyStatus: {
    isComplete: boolean;
    totalComponents: number;
    categoriesPresent: ComponentCategory[];
    missingRequiredCategories: ComponentCategory[];
  };
  /** Creation epoch timestamp */
  createdAt: number;
  /** Last updated epoch timestamp */
  updatedAt: number;
  /** Payload generation epoch timestamp */
  exportedAt: number;
}

/**
 * Deterministically constructs a normalized, serializable design payload
 * from a SpacecraftDesign object or a SpacecraftStore instance.
 *
 * Guaranteed Properties:
 * 1. Non-mutating (does not alter input state).
 * 2. Deterministic (sorted independently of mounting order).
 * 3. 100% JSON-serializable (no undefined values, circular refs, or methods).
 * 4. Stable identifiers only (no fragile display names as keys).
 */
export function buildNormalizedAssemblyPayload(
  source: SpacecraftDesign | SpacecraftStore,
): NormalizedSpacecraftAssemblyPayload {
  const design: SpacecraftDesign = "design" in source ? source.design : source;

  // Resolve and normalize components
  const normalizedComponents: NormalizedAssemblyComponent[] = design.selectedComponents
    .map((ref) => {
      const comp = getCatalogueComponentById(ref.componentId);
      return {
        componentId: ref.componentId,
        category: comp ? comp.category : ("structure" as ComponentCategory),
        instanceId: ref.instanceId,
        addedAt: ref.addedAt,
      };
    })
    // Deterministic sorting: by category first, then by componentId
    .sort((a, b) => {
      const catCompare = a.category.localeCompare(b.category);
      if (catCompare !== 0) return catCompare;
      return a.componentId.localeCompare(b.componentId);
    });

  // Extract unique sorted component IDs
  const componentIds = Array.from(new Set(normalizedComponents.map((c) => c.componentId))).sort();

  // Categories present (unique and sorted)
  const categoriesPresent = Array.from(new Set(normalizedComponents.map((c) => c.category))).sort();

  // Missing required categories
  const missingRequiredCategories = REQUIRED_CATEGORIES.filter(
    (req) => !categoriesPresent.includes(req),
  ).sort();

  const isComplete =
    missingRequiredCategories.length === 0 &&
    design.selectedOrbitId !== null &&
    design.selectedLauncherId !== null;

  return {
    schemaVersion: "1.0.0",
    designId: design.id,
    spacecraftName: design.name,
    componentIds,
    components: normalizedComponents,
    missionParameters: {
      orbitId: design.selectedOrbitId,
      launcherId: design.selectedLauncherId,
    },
    assemblyStatus: {
      isComplete,
      totalComponents: normalizedComponents.length,
      categoriesPresent,
      missingRequiredCategories,
    },
    createdAt: design.createdAt,
    updatedAt: design.updatedAt,
    exportedAt: Date.now(),
  };
}

/**
 * Serializes the normalized payload to an indented JSON string.
 */
export function serializeAssemblyPayload(payload: NormalizedSpacecraftAssemblyPayload): string {
  return JSON.stringify(payload, null, 2);
}

/**
 * Validates whether an unknown object conforms to the NormalizedSpacecraftAssemblyPayload contract.
 */
export function validateAssemblyPayload(obj: unknown): obj is NormalizedSpacecraftAssemblyPayload {
  if (typeof obj !== "object" || obj === null) return false;
  const p = obj as Record<string, unknown>;

  return (
    p.schemaVersion === "1.0.0" &&
    typeof p.designId === "string" &&
    typeof p.spacecraftName === "string" &&
    Array.isArray(p.componentIds) &&
    Array.isArray(p.components) &&
    typeof p.missionParameters === "object" &&
    p.missionParameters !== null &&
    typeof p.assemblyStatus === "object" &&
    p.assemblyStatus !== null
  );
}
