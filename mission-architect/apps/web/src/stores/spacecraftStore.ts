/**
 * Spacecraft Builder State Store
 *
 * Uses Zustand for lightweight state management.
 * This store is framework-agnostic: it has no React-specific logic and
 * can be used by both React components and Phaser game scenes.
 *
 * API Payload Note:
 * The normalized payload structure produced by `buildNormalizedPayload` is
 * PROVISIONAL and awaits confirmation from Vineeth (Backend).
 * See payload field comments for confirmation requirements.
 */

import { create } from "zustand";
import type {
  SpacecraftDesign,
  SelectedComponentReference,
  NormalizedDesignPayload,
  ComponentCategory,
} from "@mission-architect/shared";
import { getCatalogueComponentById } from "../features/component-catalogue/componentData";

/**
 * Minimum category set required for a design to be considered complete.
 * PROVISIONAL: Confirm required categories with Vineeth (backend) and Tanishka (data).
 */
const REQUIRED_CATEGORIES: ComponentCategory[] = [
  "structure",
  "power",
  "communications",
  "avionics",
];

/**
 * Full store state shape.
 */
export interface SpacecraftStoreState {
  /** Current spacecraft design */
  design: SpacecraftDesign;
  /** ID of the currently selected/highlighted component instance for Phaser / detail pane */
  selectedInstanceId: string | null;
}

/**
 * Actions available in the spacecraft store.
 */
export interface SpacecraftStoreActions {
  /** Add a component from the catalogue to the design. Deduplicates same componentId by default. */
  addComponent(componentId: string): void;
  /** Remove a specific mounted instance by its instanceId. */
  removeComponent(instanceId: string): void;
  /** Set the highlighted/selected component instance for the detail panel. */
  selectComponent(instanceId: string | null): void;
  /** Reset the design to initial empty state. Preserves the design ID and name. */
  resetDesign(): void;
  /** Update the name of the spacecraft design. */
  setDesignName(name: string): void;
  /** Set the target orbit selection. Pass null to clear. */
  setOrbit(orbitId: string | null): void;
  /** Set the launch vehicle selection. Pass null to clear. */
  setLauncher(launcherId: string | null): void;
  /** Retrieve the current full design state (read-only snapshot). */
  getDesign(): SpacecraftDesign;
  /** Build a normalized, API-ready payload from the current design. */
  buildNormalizedPayload(): NormalizedDesignPayload;
}

export type SpacecraftStore = SpacecraftStoreState & SpacecraftStoreActions;

/** Generate a simple stable instance ID */
function generateInstanceId(componentId: string): string {
  return `inst-${componentId}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

/** Generate a stable design ID */
function generateDesignId(): string {
  return `design-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

/** Build the initial empty spacecraft design. */
function createEmptyDesign(): SpacecraftDesign {
  const now = Date.now();
  return {
    id: generateDesignId(),
    name: "Unnamed Spacecraft",
    selectedComponents: [],
    selectedOrbitId: null,
    selectedLauncherId: null,
    createdAt: now,
    updatedAt: now,
  };
}

/**
 * Derive summary from selected components for normalization.
 */
function deriveDesignSummary(
  selectedComponents: SelectedComponentReference[],
): NormalizedDesignPayload["summary"] {
  const categoriesPresent = Array.from(
    new Set(
      selectedComponents
        .map((ref) => getCatalogueComponentById(ref.componentId)?.category)
        .filter((c): c is ComponentCategory => c !== undefined),
    ),
  );

  const missingRequiredCategories = REQUIRED_CATEGORIES.filter(
    (required) => !categoriesPresent.includes(required),
  );

  return {
    totalComponents: selectedComponents.length,
    categoriesPresent,
    missingRequiredCategories,
  };
}

/**
 * Build the normalized API-ready payload from the given design.
 * PROVISIONAL: Field names await confirmation from Vineeth (backend API contract).
 */
function buildPayload(design: SpacecraftDesign): NormalizedDesignPayload {
  const summary = deriveDesignSummary(design.selectedComponents);

  return {
    designId: design.id,
    spacecraftName: design.name,
    componentIds: design.selectedComponents.map((ref) => ref.componentId),
    orbitId: design.selectedOrbitId,
    launcherId: design.selectedLauncherId,
    isComplete:
      summary.missingRequiredCategories.length === 0 &&
      design.selectedOrbitId !== null &&
      design.selectedLauncherId !== null,
    summary,
  };
}

/**
 * Zustand spacecraft builder store.
 *
 * Usage in React:
 *   const { addComponent, design, buildNormalizedPayload } = useSpacecraftStore();
 *
 * Usage in Phaser (game scenes):
 *   import { useSpacecraftStore } from "./spacecraftStore";
 *   const store = useSpacecraftStore.getState();
 *   store.addComponent("comp-bus-cubesat-3u");
 */
export const useSpacecraftStore = create<SpacecraftStore>()((set, get) => ({
  design: createEmptyDesign(),
  selectedInstanceId: null,

  addComponent(componentId: string): void {
    const catalogueEntry = getCatalogueComponentById(componentId);
    if (!catalogueEntry) {
      console.warn(`[spacecraftStore] Unknown componentId: ${componentId}`);
      return;
    }

    const existing = get().design.selectedComponents;

    // Prevent exact duplicate componentId — one instance per unique component unless allowed
    if (existing.some((ref) => ref.componentId === componentId)) {
      console.warn(
        `[spacecraftStore] Component ${componentId} already added. Duplicates not allowed in Phase 1.`,
      );
      return;
    }

    const now = Date.now();
    const instance: SelectedComponentReference = {
      instanceId: generateInstanceId(componentId),
      componentId,
      addedAt: now,
    };

    set((state) => ({
      design: {
        ...state.design,
        selectedComponents: [...state.design.selectedComponents, instance],
        updatedAt: now,
      },
    }));
  },

  removeComponent(instanceId: string): void {
    const existing = get().design.selectedComponents;
    const target = existing.find((ref) => ref.instanceId === instanceId);

    if (!target) {
      console.warn(`[spacecraftStore] Instance ${instanceId} not found.`);
      return;
    }

    const now = Date.now();
    set((state) => ({
      design: {
        ...state.design,
        selectedComponents: state.design.selectedComponents.filter(
          (ref) => ref.instanceId !== instanceId,
        ),
        updatedAt: now,
      },
      selectedInstanceId:
        state.selectedInstanceId === instanceId ? null : state.selectedInstanceId,
    }));
  },

  selectComponent(instanceId: string | null): void {
    if (instanceId !== null) {
      const exists = get().design.selectedComponents.some(
        (ref) => ref.instanceId === instanceId,
      );
      if (!exists) {
        console.warn(
          `[spacecraftStore] Cannot select unknown instance: ${instanceId}`,
        );
        return;
      }
    }
    set({ selectedInstanceId: instanceId });
  },

  resetDesign(): void {
    set((state) => ({
      design: {
        ...createEmptyDesign(),
        // Preserve design name and ID across reset if desired — start fresh here
      },
      selectedInstanceId: null,
    }));
  },

  setDesignName(name: string): void {
    set((state) => ({
      design: {
        ...state.design,
        name: name.trim() || "Unnamed Spacecraft",
        updatedAt: Date.now(),
      },
    }));
  },

  setOrbit(orbitId: string | null): void {
    set((state) => ({
      design: {
        ...state.design,
        selectedOrbitId: orbitId,
        updatedAt: Date.now(),
      },
    }));
  },

  setLauncher(launcherId: string | null): void {
    set((state) => ({
      design: {
        ...state.design,
        selectedLauncherId: launcherId,
        updatedAt: Date.now(),
      },
    }));
  },

  getDesign(): SpacecraftDesign {
    return { ...get().design };
  },

  buildNormalizedPayload(): NormalizedDesignPayload {
    return buildPayload(get().design);
  },
}));

/**
 * Convenience selectors for direct subscription without full store.
 *
 * Example:
 *   const isComplete = useSpacecraftStore(selectIsDesignComplete);
 */
export const selectDesign = (s: SpacecraftStore): SpacecraftDesign => s.design;

export const selectSelectedComponents = (
  s: SpacecraftStore,
): SelectedComponentReference[] => s.design.selectedComponents;

export const selectIsDesignComplete = (s: SpacecraftStore): boolean => {
  const summary = deriveDesignSummary(s.design.selectedComponents);
  return (
    summary.missingRequiredCategories.length === 0 &&
    s.design.selectedOrbitId !== null &&
    s.design.selectedLauncherId !== null
  );
};

export const selectNormalizedPayload = (
  s: SpacecraftStore,
): NormalizedDesignPayload => buildPayload(s.design);
