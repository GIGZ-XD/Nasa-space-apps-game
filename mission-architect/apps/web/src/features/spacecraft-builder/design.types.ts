import type {
  SelectedComponentReference,
  SpacecraftDesign,
  NormalizedDesignPayload,
} from "@mission-architect/shared";

export type {
  SelectedComponentReference,
  SpacecraftDesign,
  NormalizedDesignPayload,
};

/**
 * UI selection state inside the spacecraft builder.
 */
export interface BuilderSelectionState {
  /** Currently selected/highlighted component instance ID for detail inspector / Phaser slot */
  selectedInstanceId: string | null;
  /** Active filter/category view */
  activeCategory: string;
}
