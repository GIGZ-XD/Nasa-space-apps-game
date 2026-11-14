import type {
  Component,
  ComponentCategory,
  OrbitType,
  OrbitTarget,
  LauncherTarget,
} from "@mission-architect/shared";

export type {
  Component,
  ComponentCategory,
  OrbitType,
  OrbitTarget,
  LauncherTarget,
};

/**
 * Filter criteria for browsing catalogue components.
 */
export interface ComponentCatalogueFilter {
  category?: ComponentCategory | "all";
  searchQuery?: string;
  maxCostCredits?: number;
  maxMassKg?: number;
}
