export type ComponentCategory =
  | "structure"
  | "power"
  | "battery"
  | "communications"
  | "computer"
  | "adcs"
  | "instrument"
  | "orbit"
  | "launcher";

/** Public catalogue entry. Units: kg, W, Wh, USD, Mbps. */
export interface Component {
  id: string;
  category: ComponentCategory;
  name: string;
  description: string;
  massKg?: number;
  powerDrawW?: number;
  powerOutputW?: number;
  capacityWh?: number;
  dataRateMbps?: number;
  payloadCapacityKg?: number;
  costUsd: number;
}
