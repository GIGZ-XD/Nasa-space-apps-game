/**
 * Phase 4 – Spacecraft Visual Assembly Public Interface
 */

// UI Components
export { SpacecraftPreview } from "./SpacecraftPreview";
export type { SpacecraftPreviewProps } from "./SpacecraftPreview";

export { BuilderWorkspace } from "./BuilderWorkspace";
export type { BuilderWorkspaceProps } from "./BuilderWorkspace";

export { ReadinessSummary, REQUIRED_CATEGORIES } from "./ReadinessSummary";
export type {
  ReadinessSummaryProps,
  AssemblyReadinessStatus,
} from "./ReadinessSummary";

// Visual Slot Mapping
export {
  CATEGORY_SLOT_REGISTRY,
  mapComponentToVisualSlot,
  mapSelectedComponentsToVisualSlots,
  getInstalledCategories,
} from "./slotMapping";
export type {
  VisualSlotId,
  VisualSlotItem,
  CategorySlotDefinition,
} from "./slotMapping";

// Stable Selectors
export {
  selectAssembledComponents,
  selectMissingRequiredCategories,
  selectSatisfiedRequiredCategories,
  selectAssemblyCompleteness,
  selectReadinessSummary,
} from "./selectors";
export type {
  AssembledComponentEntry,
  AssemblyReadinessSnapshot,
} from "./selectors";

// Normalized Design Payload
export {
  buildNormalizedAssemblyPayload,
  serializeAssemblyPayload,
  validateAssemblyPayload,
} from "./designPayload";
export type {
  NormalizedSpacecraftAssemblyPayload,
  NormalizedAssemblyComponent,
} from "./designPayload";
