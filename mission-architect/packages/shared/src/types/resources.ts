/** Server-calculated totals. Units: kg, W, Wh, Mbps, USD. */
export interface ResourceTotals {
  massKg: number;
  powerDrawW: number;
  powerOutputW: number;
  batteryWh: number;
  dataRateMbps: number;
  /** Selected launcher's payload capacity (0 if none). */
  launcherCapacityKg: number;
  costUsd: number;
}

export interface ResourceLine {
  componentId: string;
  category: string;
  massKg: number;
  powerDrawW: number;
  powerOutputW: number;
  costUsd: number;
}

export interface ResourceBreakdown {
  totals: ResourceTotals;
  lines: ResourceLine[];
}
