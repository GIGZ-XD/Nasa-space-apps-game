import type { ComponentCategory } from "./component";

/**
 * A selected instance of a component mounted on the spacecraft.
 * Uses instanceId to distinguish multiple units of the same component type.
 */
export interface SelectedComponentReference {
  /** Unique identifier for this installed instance (e.g., "inst-bus-cubesat-3u-1") */
  instanceId: string;

  /** References Component.id in the component catalogue */
  componentId: string;

  /** Optional physical/graphical mounting slot on the spacecraft bus */
  slot?: string;

  /** Timestamp (epoch ms) when component was added to design */
  addedAt: number;
}

/**
 * Complete spacecraft design configuration state.
 */
export interface SpacecraftDesign {
  /** Stable unique design identifier */
  id: string;

  /** User-defined name for this spacecraft */
  name: string;

  /** List of mounted component references */
  selectedComponents: SelectedComponentReference[];

  /** Currently selected target orbit ID, or null if unselected */
  selectedOrbitId: string | null;

  /** Currently selected launch vehicle ID, or null if unselected */
  selectedLauncherId: string | null;

  /** Timestamp (epoch ms) when design was initialized */
  createdAt: number;

  /** Timestamp (epoch ms) of last modification */
  updatedAt: number;
}

/**
 * Normalized, serializable payload ready for backend API consumption (evaluation, simulation, persistence).
 */
export interface NormalizedDesignPayload {
  /** Spacecraft design configuration ID */
  designId: string;

  /** Spacecraft design display name */
  spacecraftName: string;

  /** Array of stable component IDs selected in this design */
  componentIds: string[];

  /** Selected target orbit ID or null */
  orbitId: string | null;

  /** Selected launch vehicle ID or null */
  launcherId: string | null;

  /** Whether the design meets minimum architectural completeness requirements */
  isComplete: boolean;

  /** Validation metadata summary */
  summary: {
    totalComponents: number;
    categoriesPresent: ComponentCategory[];
    missingRequiredCategories: ComponentCategory[];
  };
}
