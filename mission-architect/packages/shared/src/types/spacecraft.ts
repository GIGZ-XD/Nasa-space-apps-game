import type { SpacecraftDesign } from "./design";

export interface Spacecraft {
  id: string;
  name: string;
  design?: SpacecraftDesign;
}
