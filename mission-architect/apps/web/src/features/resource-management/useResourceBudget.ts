import { useMemo } from "react";
import { useSpacecraftStore } from "../../stores/spacecraftStore";
import { localCatalogueAdapter } from "../component-catalogue/componentData";
import { generateSpacecraftResourceReport } from "./resourceCalculations";
import type { SpacecraftResourceReport } from "./resource.types";
import type { Component } from "../component-catalogue/component.types";

/**
 * Retrieves a synchronous snapshot of the spacecraft resource report
 * from the current Zustand store state.
 * Works outside React components (e.g. in Phaser scenes or tests).
 */
export function getResourceReportSnapshot(): SpacecraftResourceReport {
  const design = useSpacecraftStore.getState().design;
  const components = design.selectedComponents
    .map((ref) => localCatalogueAdapter.getComponentById(ref.componentId))
    .filter((c): c is Component => c !== undefined);

  const orbit = design.selectedOrbitId
    ? localCatalogueAdapter.getOrbitById(design.selectedOrbitId) ?? null
    : null;

  const launcher = design.selectedLauncherId
    ? localCatalogueAdapter.getLauncherById(design.selectedLauncherId) ?? null
    : null;

  return generateSpacecraftResourceReport(components, launcher, orbit, design);
}

/**
 * React hook that subscribes to the Zustand spacecraft store and
 * reactively returns the current mass, power, thermal budgets,
 * engineering warnings, and overall feasibility report.
 */
export function useResourceBudget(): SpacecraftResourceReport {
  const selectedComponents = useSpacecraftStore(
    (s) => s.design.selectedComponents,
  );
  const selectedOrbitId = useSpacecraftStore((s) => s.design.selectedOrbitId);
  const selectedLauncherId = useSpacecraftStore(
    (s) => s.design.selectedLauncherId,
  );
  const design = useSpacecraftStore((s) => s.design);

  return useMemo(() => {
    const components = selectedComponents
      .map((ref) => localCatalogueAdapter.getComponentById(ref.componentId))
      .filter((c): c is Component => c !== undefined);

    const orbit = selectedOrbitId
      ? localCatalogueAdapter.getOrbitById(selectedOrbitId) ?? null
      : null;

    const launcher = selectedLauncherId
      ? localCatalogueAdapter.getLauncherById(selectedLauncherId) ?? null
      : null;

    return generateSpacecraftResourceReport(
      components,
      launcher,
      orbit,
      design,
    );
  }, [selectedComponents, selectedOrbitId, selectedLauncherId, design]);
}
