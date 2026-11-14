import type { SpacecraftStore } from "../../stores/spacecraftStore";
import type { ComponentCategory, Component } from "../component-catalogue/component.types";
import { getCatalogueComponentById } from "../component-catalogue/componentData";
import { REQUIRED_CATEGORIES } from "./ReadinessSummary";

export interface AssembledComponentEntry {
  instanceId: string;
  componentId: string;
  component: Component;
  addedAt: number;
}

export interface AssemblyReadinessSnapshot {
  componentCount: number;
  satisfiedCategories: ComponentCategory[];
  missingCategories: ComponentCategory[];
  orbitSelected: boolean;
  launcherSelected: boolean;
  isAssemblyComplete: boolean;
}

/**
 * Selector that returns all currently installed components, resolving their
 * catalogue definitions. Filters out any references whose component ID is not found.
 */
export function selectAssembledComponents(state: SpacecraftStore): AssembledComponentEntry[] {
  return state.design.selectedComponents
    .map((ref) => {
      const comp = getCatalogueComponentById(ref.componentId);
      if (!comp) return null;
      return {
        instanceId: ref.instanceId,
        componentId: ref.componentId,
        component: comp,
        addedAt: ref.addedAt,
      };
    })
    .filter((entry): entry is AssembledComponentEntry => entry !== null);
}

/**
 * Selector that returns the list of missing required categories.
 */
export function selectMissingRequiredCategories(state: SpacecraftStore): ComponentCategory[] {
  const present = new Set(
    state.design.selectedComponents
      .map((ref) => getCatalogueComponentById(ref.componentId)?.category)
      .filter((c): c is ComponentCategory => c !== undefined),
  );

  return REQUIRED_CATEGORIES.filter((cat) => !present.has(cat));
}

/**
 * Selector that returns the list of satisfied required categories.
 */
export function selectSatisfiedRequiredCategories(state: SpacecraftStore): ComponentCategory[] {
  const present = new Set(
    state.design.selectedComponents
      .map((ref) => getCatalogueComponentById(ref.componentId)?.category)
      .filter((c): c is ComponentCategory => c !== undefined),
  );

  return REQUIRED_CATEGORIES.filter((cat) => present.has(cat));
}

/**
 * Selector that returns whether all required architectural categories,
 * the target orbit, and the launch vehicle have been chosen.
 */
export function selectAssemblyCompleteness(state: SpacecraftStore): boolean {
  const missing = selectMissingRequiredCategories(state);
  return (
    missing.length === 0 &&
    state.design.selectedOrbitId !== null &&
    state.design.selectedLauncherId !== null
  );
}

/**
 * Selector that returns an aggregated readiness snapshot.
 */
export function selectReadinessSummary(state: SpacecraftStore): AssemblyReadinessSnapshot {
  const satisfiedCategories = selectSatisfiedRequiredCategories(state);
  const missingCategories = selectMissingRequiredCategories(state);
  const orbitSelected = state.design.selectedOrbitId !== null;
  const launcherSelected = state.design.selectedLauncherId !== null;

  return {
    componentCount: state.design.selectedComponents.length,
    satisfiedCategories,
    missingCategories,
    orbitSelected,
    launcherSelected,
    isAssemblyComplete:
      missingCategories.length === 0 && orbitSelected && launcherSelected,
  };
}
