import type {
  ComponentCategory,
  LauncherTarget,
  OrbitTarget,
} from "../component-catalogue/component.types";

/**
 * Breakdown of spacecraft mass by subsystem category.
 */
export interface CategoryMassBreakdown {
  category: ComponentCategory;
  massKg: number;
  percentage: number;
  componentCount: number;
}

/**
 * Individual component mass summary.
 */
export interface ComponentMassItem {
  id: string;
  instanceId?: string;
  name: string;
  category: ComponentCategory;
  massKg: number;
}

export type MassBudgetStatus =
  | "NOMINAL"
  | "WARNING"
  | "EXCEEDED"
  | "NO_LAUNCHER"
  | "INCAPABLE_ORBIT";

/**
 * Complete spacecraft mass budget.
 */
export interface MassBudget {
  /** Total wet/dry spacecraft mass in kilograms (kg) */
  totalMassKg: number;
  /** Component-by-component mass breakdown */
  componentBreakdown: ComponentMassItem[];
  /** Subsystem category mass breakdown */
  categoryBreakdown: CategoryMassBreakdown[];
  /** Selected launch vehicle or null */
  launcher: LauncherTarget | null;
  /** Selected target orbit or null */
  orbit: OrbitTarget | null;
  /** Applicable payload capacity in kg for the chosen orbit */
  applicableCapacityKg: number | null;
  /** Remaining mass capacity in kg (applicableCapacityKg - totalMassKg) */
  remainingCapacityKg: number | null;
  /** Mass margin percentage (remainingCapacityKg / applicableCapacityKg * 100) */
  marginPercent: number | null;
  /** High-level mass status */
  status: MassBudgetStatus;
  /** Descriptive status explanation */
  statusMessage: string;
  /** Whether the capacity is derived from an unverified or provisional rating (e.g., lunar) */
  isProvisionalOrbitCapacity: boolean;
}

/**
 * Subsystem category power breakdown.
 */
export interface CategoryPowerBreakdown {
  category: ComponentCategory;
  generationWatts: number;
  consumptionWatts: number;
  netWatts: number;
}

export type PowerBudgetStatus =
  | "SURPLUS"
  | "MARGINAL"
  | "DEFICIT"
  | "NO_GENERATION";

/**
 * Complete spacecraft power budget.
 */
export interface PowerBudget {
  /** Total continuous power generation in daylight (Watts) */
  totalGenerationWatts: number;
  /** Total peak power consumption of installed components (Watts) */
  totalConsumptionWatts: number;
  /** Net continuous power balance: generation - consumption (Watts) */
  netPowerWatts: number;
  /** Total energy storage capacity in Watt-hours (Wh) from batteries */
  totalBatteryCapacityWh: number;
  /** Whether at least one battery storage unit is installed */
  hasBattery: boolean;
  /** Category-by-category power breakdown */
  categoryBreakdown: CategoryPowerBreakdown[];
  /** High-level power status */
  status: PowerBudgetStatus;
  /** Descriptive status explanation */
  statusMessage: string;
  /** Margin percentage (netPower / generation * 100 when generation > 0) */
  marginPercent: number | null;
}

export type ThermalBudgetStatus =
  | "NOMINAL"
  | "MARGINAL"
  | "OVERHEAT_DEFICIT"
  | "NO_COOLING";

/**
 * High dissipation heat driver component.
 */
export interface ThermalBottleneckItem {
  id: string;
  name: string;
  category: ComponentCategory;
  thermalWatts: number;
}

/**
 * Complete spacecraft thermal budget.
 */
export interface ThermalBudget {
  /** Total internal heat dissipation load from active electronics (Watts) */
  totalHeatLoadWatts: number;
  /** Total heat rejection capacity from passive/active thermal systems (Watts) */
  totalHeatRejectionWatts: number;
  /** Active heat rejection capacity from dedicated active heat pipes/radiators (Watts) */
  activeHeatRejectionCapacityWatts: number;
  /** Net thermal margin: totalHeatRejectionWatts - totalHeatLoadWatts (Watts) */
  thermalMarginWatts: number;
  /** High-level thermal status */
  status: ThermalBudgetStatus;
  /** Descriptive status explanation */
  statusMessage: string;
  /** Margin percentage: (thermalMargin / rejection * 100) */
  marginPercent: number | null;
  /** Major heat-dissipation drivers */
  bottlenecks: ThermalBottleneckItem[];
}

export type EngineeringWarningSeverity = "CRITICAL" | "WARNING" | "INFO";

export type EngineeringWarningCategory =
  | "MASS"
  | "POWER"
  | "THERMAL"
  | "LAUNCHER"
  | "ORBIT"
  | "SYSTEM";

/**
 * Engineering advisory, warning, or violation.
 */
export interface EngineeringWarning {
  id: string;
  severity: EngineeringWarningSeverity;
  category: EngineeringWarningCategory;
  title: string;
  message: string;
  recommendation?: string;
}

export type FeasibilityStatus =
  | "FEASIBLE"
  | "MARGINAL"
  | "VIOLATION"
  | "INCOMPLETE";

/**
 * Overall mission feasibility assessment.
 */
export interface FeasibilityReport {
  status: FeasibilityStatus;
  subsystemsComplete: boolean;
  orbitSelected: boolean;
  launcherSelected: boolean;
  massFeasible: boolean;
  powerFeasible: boolean;
  thermalFeasible: boolean;
  scorePercentage: number;
  summary: string;
}

/**
 * Combined resource report for the entire spacecraft.
 */
export interface SpacecraftResourceReport {
  mass: MassBudget;
  power: PowerBudget;
  thermal: ThermalBudget;
  warnings: EngineeringWarning[];
  feasibility: FeasibilityReport;
}
