import type {
  Component,
  ComponentCategory,
  LauncherTarget,
  OrbitTarget,
} from "../component-catalogue/component.types";
import type { SpacecraftDesign } from "@mission-architect/shared";
import type {
  MassBudget,
  CategoryMassBreakdown,
  PowerBudget,
  CategoryPowerBreakdown,
  ThermalBudget,
  ThermalBottleneckItem,
  EngineeringWarning,
  FeasibilityReport,
  SpacecraftResourceReport,
} from "./resource.types";

export const ALL_SUBSYSTEM_CATEGORIES: ComponentCategory[] = [
  "structure",
  "power",
  "propulsion",
  "thermal",
  "communications",
  "avionics",
  "payload",
];

export const REQUIRED_SUBSYSTEM_CATEGORIES: ComponentCategory[] = [
  "structure",
  "power",
  "communications",
  "avionics",
];

/**
 * Calculates the complete spacecraft mass budget.
 */
export function calculateMassBudget(
  components: Component[],
  launcher: LauncherTarget | null,
  orbit: OrbitTarget | null,
): MassBudget {
  const totalMassKg = Number(
    components.reduce((sum, c) => sum + (c.massKg || 0), 0).toFixed(2),
  );

  const componentBreakdown = components.map((c) => ({
    id: c.id,
    name: c.name,
    category: c.category,
    massKg: c.massKg,
  }));

  const categoryBreakdown: CategoryMassBreakdown[] = ALL_SUBSYSTEM_CATEGORIES.map(
    (cat) => {
      const catComps = components.filter((c) => c.category === cat);
      const massKg = Number(
        catComps.reduce((sum, c) => sum + (c.massKg || 0), 0).toFixed(2),
      );
      const percentage =
        totalMassKg > 0
          ? Number(((massKg / totalMassKg) * 100).toFixed(1))
          : 0;
      return {
        category: cat,
        massKg,
        percentage,
        componentCount: catComps.length,
      };
    },
  );

  // If no launcher is selected
  if (!launcher) {
    return {
      totalMassKg,
      componentBreakdown,
      categoryBreakdown,
      launcher: null,
      orbit,
      applicableCapacityKg: null,
      remainingCapacityKg: null,
      marginPercent: null,
      status: "NO_LAUNCHER",
      statusMessage:
        "No launch vehicle selected. Select a launcher to assess mass feasibility.",
      isProvisionalOrbitCapacity: false,
    };
  }

  // Determine applicable capacity based on orbit regime
  let applicableCapacityKg: number = launcher.payloadCapacityLeoKg;
  let isProvisionalOrbitCapacity = false;

  if (orbit) {
    if (orbit.type === "LEO" || orbit.type === "SSO") {
      applicableCapacityKg = launcher.payloadCapacityLeoKg;
      isProvisionalOrbitCapacity = false;
    } else if (orbit.type === "GEO") {
      applicableCapacityKg = launcher.payloadCapacityGtoKg;
      isProvisionalOrbitCapacity = false;
    } else if (orbit.type === "LUNAR") {
      // In dataset: Electron has 0 GTO capacity, cannot inject to Moon
      if (launcher.payloadCapacityGtoKg === 0) {
        applicableCapacityKg = 0;
        isProvisionalOrbitCapacity = false;
      } else {
        // Dataset lacks explicit lunar payload rating for Vega-C and Falcon 9.
        // GTO capacity is used as a provisional upper bound with explicit flagging.
        applicableCapacityKg = launcher.payloadCapacityGtoKg;
        isProvisionalOrbitCapacity = true;
      }
    } else {
      // MEO, INTERPLANETARY or other high-energy regimes
      applicableCapacityKg = launcher.payloadCapacityGtoKg;
      isProvisionalOrbitCapacity = true;
    }
  }

  // Evaluate launcher capacity vs total mass
  if (applicableCapacityKg === 0) {
    return {
      totalMassKg,
      componentBreakdown,
      categoryBreakdown,
      launcher,
      orbit,
      applicableCapacityKg: 0,
      remainingCapacityKg: -totalMassKg,
      marginPercent: -100,
      status: "INCAPABLE_ORBIT",
      statusMessage: `${launcher.name} has 0 kg payload capacity for ${orbit ? orbit.name : "the selected orbit"}.`,
      isProvisionalOrbitCapacity,
    };
  }

  const remainingCapacityKg = Number(
    (applicableCapacityKg - totalMassKg).toFixed(2),
  );
  const marginPercent = Number(
    ((remainingCapacityKg / applicableCapacityKg) * 100).toFixed(1),
  );

  if (remainingCapacityKg < 0) {
    return {
      totalMassKg,
      componentBreakdown,
      categoryBreakdown,
      launcher,
      orbit,
      applicableCapacityKg,
      remainingCapacityKg,
      marginPercent,
      status: "EXCEEDED",
      statusMessage: `Payload capacity exceeded by ${Math.abs(remainingCapacityKg)} kg (${Math.abs(marginPercent)}% overweight).`,
      isProvisionalOrbitCapacity,
    };
  }

  if (marginPercent < 15) {
    return {
      totalMassKg,
      componentBreakdown,
      categoryBreakdown,
      launcher,
      orbit,
      applicableCapacityKg,
      remainingCapacityKg,
      marginPercent,
      status: "WARNING",
      statusMessage: `Tight mass margin (${marginPercent}% remaining, ${remainingCapacityKg} kg buffer). Consider lightweight components.`,
      isProvisionalOrbitCapacity,
    };
  }

  return {
    totalMassKg,
    componentBreakdown,
    categoryBreakdown,
    launcher,
    orbit,
    applicableCapacityKg,
    remainingCapacityKg,
    marginPercent,
    status: "NOMINAL",
    statusMessage: `Mass budget healthy: ${remainingCapacityKg} kg remaining (${marginPercent}% margin).`,
    isProvisionalOrbitCapacity,
  };
}

/**
 * Calculates the complete spacecraft power budget.
 *
 * NOTE: Negative powerWatts represents generation (e.g. solar panels).
 * Positive powerWatts represents consumption.
 * Battery capacity in Wh represents energy storage for eclipse periods and is
 * strictly distinguished from continuous generation Watts.
 */
export function calculatePowerBudget(components: Component[]): PowerBudget {
  const totalGenerationWatts = Number(
    components
      .filter((c) => c.powerWatts < 0)
      .reduce((sum, c) => sum + Math.abs(c.powerWatts), 0)
      .toFixed(2),
  );

  const totalConsumptionWatts = Number(
    components
      .filter((c) => c.powerWatts > 0)
      .reduce((sum, c) => sum + c.powerWatts, 0)
      .toFixed(2),
  );

  const netPowerWatts = Number(
    (totalGenerationWatts - totalConsumptionWatts).toFixed(2),
  );

  const totalBatteryCapacityWh = Number(
    components
      .reduce((sum, c) => sum + (c.specs?.energyStorageWh ?? 0), 0)
      .toFixed(2),
  );

  const hasBattery = totalBatteryCapacityWh > 0;

  const categoryBreakdown: CategoryPowerBreakdown[] = ALL_SUBSYSTEM_CATEGORIES.map(
    (cat) => {
      const catComps = components.filter((c) => c.category === cat);
      const generationWatts = Number(
        catComps
          .filter((c) => c.powerWatts < 0)
          .reduce((sum, c) => sum + Math.abs(c.powerWatts), 0)
          .toFixed(2),
      );
      const consumptionWatts = Number(
        catComps
          .filter((c) => c.powerWatts > 0)
          .reduce((sum, c) => sum + c.powerWatts, 0)
          .toFixed(2),
      );
      const netWatts = Number(
        (generationWatts - consumptionWatts).toFixed(2),
      );
      return {
        category: cat,
        generationWatts,
        consumptionWatts,
        netWatts,
      };
    },
  );

  // Status determination
  if (totalGenerationWatts === 0 && totalConsumptionWatts > 0) {
    return {
      totalGenerationWatts: 0,
      totalConsumptionWatts,
      netPowerWatts,
      totalBatteryCapacityWh,
      hasBattery,
      categoryBreakdown,
      status: "NO_GENERATION",
      statusMessage:
        "Critical: No power generation systems installed. Spacecraft cannot operate continuously.",
      marginPercent: -100,
    };
  }

  if (totalGenerationWatts === 0 && totalConsumptionWatts === 0) {
    return {
      totalGenerationWatts: 0,
      totalConsumptionWatts: 0,
      netPowerWatts: 0,
      totalBatteryCapacityWh,
      hasBattery,
      categoryBreakdown,
      status: "SURPLUS",
      statusMessage: "No electrical components installed.",
      marginPercent: 0,
    };
  }

  const marginPercent = Number(
    ((netPowerWatts / totalGenerationWatts) * 100).toFixed(1),
  );

  if (netPowerWatts < 0) {
    return {
      totalGenerationWatts,
      totalConsumptionWatts,
      netPowerWatts,
      totalBatteryCapacityWh,
      hasBattery,
      categoryBreakdown,
      status: "DEFICIT",
      statusMessage: `Power deficit: Peak consumption exceeds daylight generation by ${Math.abs(netPowerWatts)} W.`,
      marginPercent,
    };
  }

  if (marginPercent < 10) {
    return {
      totalGenerationWatts,
      totalConsumptionWatts,
      netPowerWatts,
      totalBatteryCapacityWh,
      hasBattery,
      categoryBreakdown,
      status: "MARGINAL",
      statusMessage: `Power margin is tight (+${netPowerWatts} W surplus, ${marginPercent}% margin). High load during payload operations.`,
      marginPercent,
    };
  }

  return {
    totalGenerationWatts,
    totalConsumptionWatts,
    netPowerWatts,
    totalBatteryCapacityWh,
    hasBattery,
    categoryBreakdown,
    status: "SURPLUS",
    statusMessage: `Continuous power surplus: +${netPowerWatts} W net (${marginPercent}% margin).`,
    marginPercent,
  };
}

/**
 * Calculates the complete spacecraft thermal budget.
 *
 * NOTE: Positive thermalWatts represents heat dissipation into the spacecraft interior (heat load).
 * Negative thermalWatts and specs.heatRejectionWatts represent heat rejection capability (cooling).
 */
export function calculateThermalBudget(components: Component[]): ThermalBudget {
  const totalHeatLoadWatts = Number(
    components
      .filter((c) => c.thermalWatts > 0)
      .reduce((sum, c) => sum + c.thermalWatts, 0)
      .toFixed(2),
  );

  // Passive / baseline rejection from components with negative thermalWatts (e.g. MLI, passive radiation)
  const passiveOrBaselineRejection = components
    .filter((c) => c.thermalWatts < 0)
    .reduce((sum, c) => sum + Math.abs(c.thermalWatts), 0);

  // Active heat rejection capacity from specs (e.g. active radiator panel: 75W)
  const activeHeatRejectionCapacityWatts = Number(
    components
      .reduce((sum, c) => sum + (c.specs?.heatRejectionWatts ?? 0), 0)
      .toFixed(2),
  );

  // Total available heat rejection capability:
  // For each thermal management component, we take its rated capacity (e.g., active radiator has specs.heatRejectionWatts = 75,
  // or MLI has thermalWatts = -10).
  const totalHeatRejectionWatts = Number(
    components
      .filter((c) => c.thermalWatts < 0 || (c.specs?.heatRejectionWatts ?? 0) > 0)
      .reduce((sum, c) => {
        const rated = Math.max(
          Math.abs(c.thermalWatts < 0 ? c.thermalWatts : 0),
          c.specs?.heatRejectionWatts ?? 0,
        );
        return sum + rated;
      }, 0)
      .toFixed(2),
  );

  const thermalMarginWatts = Number(
    (totalHeatRejectionWatts - totalHeatLoadWatts).toFixed(2),
  );

  // Identify heat drivers (bottlenecks)
  const bottlenecks: ThermalBottleneckItem[] = components
    .filter((c) => c.thermalWatts >= 5)
    .sort((a, b) => b.thermalWatts - a.thermalWatts)
    .map((c) => ({
      id: c.id,
      name: c.name,
      category: c.category,
      thermalWatts: c.thermalWatts,
    }));

  if (totalHeatLoadWatts === 0) {
    return {
      totalHeatLoadWatts: 0,
      totalHeatRejectionWatts,
      activeHeatRejectionCapacityWatts,
      thermalMarginWatts,
      status: "NOMINAL",
      statusMessage: "No thermal dissipation load detected.",
      marginPercent: 100,
      bottlenecks,
    };
  }

  if (totalHeatRejectionWatts === 0) {
    return {
      totalHeatLoadWatts,
      totalHeatRejectionWatts: 0,
      activeHeatRejectionCapacityWatts: 0,
      thermalMarginWatts: -totalHeatLoadWatts,
      status: "NO_COOLING",
      statusMessage: `Critical: No thermal protection or radiators installed. ${totalHeatLoadWatts} W internal heat trapped.`,
      marginPercent: -100,
      bottlenecks,
    };
  }

  const marginPercent = Number(
    ((thermalMarginWatts / totalHeatRejectionWatts) * 100).toFixed(1),
  );

  if (thermalMarginWatts < 0) {
    return {
      totalHeatLoadWatts,
      totalHeatRejectionWatts,
      activeHeatRejectionCapacityWatts,
      thermalMarginWatts,
      status: "OVERHEAT_DEFICIT",
      statusMessage: `Thermal overload: Internal heat load exceeds rejection capacity by ${Math.abs(thermalMarginWatts)} W.`,
      marginPercent,
      bottlenecks,
    };
  }

  if (marginPercent < 15) {
    return {
      totalHeatLoadWatts,
      totalHeatRejectionWatts,
      activeHeatRejectionCapacityWatts,
      thermalMarginWatts,
      status: "MARGINAL",
      statusMessage: `Thermal margin is tight (+${thermalMarginWatts} W buffer, ${marginPercent}% margin). Radiators operating near maximum rating.`,
      marginPercent,
      bottlenecks,
    };
  }

  return {
    totalHeatLoadWatts,
    totalHeatRejectionWatts,
    activeHeatRejectionCapacityWatts,
    thermalMarginWatts,
    status: "NOMINAL",
    statusMessage: `Thermal control systems nominal (+${thermalMarginWatts} W rejection margin, ${marginPercent}% buffer).`,
    marginPercent,
    bottlenecks,
  };
}

/**
 * Generates engineering warnings, limits, and grounded recommendations.
 */
export function generateEngineeringWarnings(
  mass: MassBudget,
  power: PowerBudget,
  thermal: ThermalBudget,
  design: SpacecraftDesign,
  components: Component[],
): EngineeringWarning[] {
  const warnings: EngineeringWarning[] = [];

  // ==========================================
  // 1. CRITICAL VIOLATIONS
  // ==========================================

  // Mass Exceeded
  if (mass.status === "EXCEEDED" && mass.launcher) {
    warnings.push({
      id: "warn-mass-exceeded",
      severity: "CRITICAL",
      category: "MASS",
      title: "Launch Vehicle Mass Limit Exceeded",
      message: `Spacecraft mass (${mass.totalMassKg} kg) exceeds ${mass.launcher.name} payload capacity of ${mass.applicableCapacityKg} kg by ${Math.abs(mass.remainingCapacityKg ?? 0)} kg.`,
      recommendation:
        mass.totalMassKg <= 2300
          ? "Upgrade to Vega-C (2,300 kg LEO capacity) or Falcon 9 (22,800 kg LEO capacity), or swap heavy subsystems for lighter alternatives."
          : "Upgrade to Falcon 9 (22,800 kg LEO capacity) or remove redundant payloads.",
    });
  }

  // Incapable Launcher-Orbit Pairing
  if (mass.status === "INCAPABLE_ORBIT" && mass.launcher && mass.orbit) {
    warnings.push({
      id: "warn-launcher-incapable",
      severity: "CRITICAL",
      category: "LAUNCHER",
      title: "Incapable Launch Vehicle for Target Orbit",
      message: `${mass.launcher.name} has 0 kg capacity for ${mass.orbit.name}. It lacks upper-stage performance or delta-V to reach this orbit regime.`,
      recommendation:
        mass.orbit.type === "GEO"
          ? "Switch launcher to Vega-C (800 kg GTO) or Falcon 9 (8,300 kg GTO), or lower target orbit to LEO/SSO."
          : "Switch launcher to Falcon 9 or Vega-C for high-energy orbital trajectories.",
    });
  }

  // No Power Generation
  if (power.status === "NO_GENERATION") {
    warnings.push({
      id: "warn-no-power-generation",
      severity: "CRITICAL",
      category: "POWER",
      title: "No Power Generation Subsystems Installed",
      message: `The spacecraft requires ${power.totalConsumptionWatts} W of electrical power but has zero power generation installed.`,
      recommendation:
        "Install 'Deployable Articulated Solar Array (100W)' (generates 100 W) or '3U Body-Mounted Solar Panels' (generates 24 W).",
    });
  }

  // Power Deficit
  if (power.status === "DEFICIT") {
    warnings.push({
      id: "warn-power-deficit",
      severity: "CRITICAL",
      category: "POWER",
      title: "Electrical Power Deficit",
      message: `Total consumption (${power.totalConsumptionWatts} W) exceeds continuous generation (${power.totalGenerationWatts} W) by ${Math.abs(power.netPowerWatts)} W.`,
      recommendation:
        "Add an additional Deployable Articulated Solar Array (100W) or reduce payload power consumption.",
    });
  }

  // No Thermal Cooling
  if (thermal.status === "NO_COOLING") {
    warnings.push({
      id: "warn-no-thermal-cooling",
      severity: "CRITICAL",
      category: "THERMAL",
      title: "No Thermal Control System Installed",
      message: `Internal avionics and payloads generate ${thermal.totalHeatLoadWatts} W of heat, but no radiators or MLI insulation are mounted. Electronics will overheat.`,
      recommendation:
        thermal.totalHeatLoadWatts > 15
          ? "Install 'Active Heat Pipe Radiator Panel' (75 W rejection capacity) to actively dissipate internal heat."
          : "Install 'Multi-Layer Insulation Blanketing (MLI)' (10 W rejection) or 'Active Heat Pipe Radiator Panel'.",
    });
  }

  // Thermal Overheat Deficit
  if (thermal.status === "OVERHEAT_DEFICIT") {
    warnings.push({
      id: "warn-thermal-overheat",
      severity: "CRITICAL",
      category: "THERMAL",
      title: "Thermal Dissipation Deficit (Overheat Risk)",
      message: `Total heat load (${thermal.totalHeatLoadWatts} W) exceeds available heat rejection (${thermal.totalHeatRejectionWatts} W) by ${Math.abs(thermal.thermalMarginWatts)} W.`,
      recommendation:
        "Add an 'Active Heat Pipe Radiator Panel' (75 W capacity) or reduce high-thermal-dissipation instruments like Synthetic Aperture Radar (SAR).",
    });
  }

  // ==========================================
  // 2. WARNINGS (APPROACHING LIMITS / MARGINS)
  // ==========================================

  // Tight Mass Margin
  if (mass.status === "WARNING") {
    warnings.push({
      id: "warn-mass-tight",
      severity: "WARNING",
      category: "MASS",
      title: "Tight Launch Mass Margin",
      message: `Mass margin is only ${mass.marginPercent}% (${mass.remainingCapacityKg} kg remaining). Standard aerospace guidelines recommend at least 15-20% margin for design growth.`,
      recommendation:
        "Optimize subsystem components or upgrade launch vehicle to ensure adequate flight reserve margin.",
    });
  }

  // Tight Power Margin
  if (power.status === "MARGINAL") {
    warnings.push({
      id: "warn-power-tight",
      severity: "WARNING",
      category: "POWER",
      title: "Marginal Daylight Power Reserve",
      message: `Power surplus is only ${power.netPowerWatts} W (${power.marginPercent}% margin). Simultaneous payload and communication operations may cause bus voltage drops.`,
      recommendation:
        "Consider adding another solar panel or duty-cycling high-draw instruments during orbit operations.",
    });
  }

  // Tight Thermal Margin
  if (thermal.status === "MARGINAL") {
    warnings.push({
      id: "warn-thermal-tight",
      severity: "WARNING",
      category: "THERMAL",
      title: "Marginal Thermal Rejection Buffer",
      message: `Thermal margin is only ${thermal.thermalMarginWatts} W (${thermal.marginPercent}% buffer). Instruments may run near maximum operating temperature limits.`,
      recommendation:
        "Consider supplemental MLI blanketing or a secondary radiator to prevent component thermal degradation.",
    });
  }

  // Missing Battery Storage
  if (!power.hasBattery && power.totalConsumptionWatts > 0) {
    warnings.push({
      id: "warn-no-battery",
      severity: "WARNING",
      category: "POWER",
      title: "No Battery Storage Installed for Eclipse Passes",
      message:
        "Spacecraft has no energy storage installed. During orbital eclipse (Earth/Moon shadow), all power generation stops and the bus will completely brown out.",
      recommendation:
        "Install 'Li-Ion Space Battery Pack (50Wh)' to sustain critical bus avionics and communications during shadow passes.",
    });
  }

  // Provisional / Unverified Orbit Capacity (e.g. Lunar with Vega-C / Falcon 9)
  if (mass.isProvisionalOrbitCapacity && mass.orbit) {
    warnings.push({
      id: "warn-provisional-orbit-capacity",
      severity: "WARNING",
      category: "ORBIT",
      title: `Unverified ${mass.orbit.type} Trajectory Rating`,
      message: `The launcher catalog provides LEO and GTO capacity ratings, but does not state a verified translunar payload rating for ${mass.launcher?.name ?? "the launcher"}. GTO capacity (${mass.applicableCapacityKg} kg) is used as a provisional upper bound.`,
      recommendation:
        "Coordinate with trajectory flight dynamics to confirm dedicated translunar insertion (TLI) performance.",
    });
  }

  // High Heat Source Flag
  const sarComponent = components.find((c) => c.id === "comp-pld-synthetic-aperture-radar");
  const hasActiveRadiator = components.some((c) => c.id === "comp-thm-active-radiator-panel");
  if (sarComponent && !hasActiveRadiator) {
    warnings.push({
      id: "warn-sar-high-thermal",
      severity: "WARNING",
      category: "THERMAL",
      title: "High-Power SAR Installed Without Active Radiator",
      message:
        "The Compact Synthetic Aperture Radar (SAR) produces 42 W of continuous thermal dissipation and draws 130 W of power. Passive MLI is insufficient for sustained radar operation.",
      recommendation:
        "Mount 'Active Heat Pipe Radiator Panel' to reliably dissipate the SAR's localized thermal spikes.",
    });
  }

  // ==========================================
  // 3. INFORMATIONAL / CONFIGURATION CHECKS
  // ==========================================

  if (!design.selectedOrbitId) {
    warnings.push({
      id: "info-orbit-unselected",
      severity: "INFO",
      category: "ORBIT",
      title: "Target Orbit Not Configured",
      message: "No target orbit selected. Orbit environment defines eclipse duration, delta-V, and launcher capacity.",
      recommendation: "Select an orbit in the Mission Parameters panel.",
    });
  }

  if (!design.selectedLauncherId) {
    warnings.push({
      id: "info-launcher-unselected",
      severity: "INFO",
      category: "LAUNCHER",
      title: "Launch Vehicle Not Configured",
      message: "No launch vehicle selected. Launcher capacity determines maximum allowable spacecraft wet mass.",
      recommendation: "Select a launch vehicle in the Mission Parameters panel.",
    });
  }

  const presentCategories = new Set(components.map((c) => c.category));
  const missingRequired = REQUIRED_SUBSYSTEM_CATEGORIES.filter(
    (c) => !presentCategories.has(c),
  );

  if (missingRequired.length > 0) {
    warnings.push({
      id: "info-missing-subsystems",
      severity: "INFO",
      category: "SYSTEM",
      title: "Incomplete Subsystems",
      message: `Core architectural subsystems missing: ${missingRequired.map((c) => c.toUpperCase()).join(", ")}.`,
      recommendation: `Add components for ${missingRequired.join(", ")} to achieve architectural completeness.`,
    });
  }

  return warnings;
}

/**
 * Calculates the overall mission feasibility report.
 * Strictly separates UI completeness from physics/engineering feasibility.
 */
export function calculateFeasibilityReport(
  mass: MassBudget,
  power: PowerBudget,
  thermal: ThermalBudget,
  warnings: EngineeringWarning[],
  design: SpacecraftDesign,
  components: Component[],
): FeasibilityReport {
  const orbitSelected = design.selectedOrbitId !== null;
  const launcherSelected = design.selectedLauncherId !== null;

  const presentCategories = new Set(components.map((c) => c.category));
  const missingRequired = REQUIRED_SUBSYSTEM_CATEGORIES.filter(
    (c) => !presentCategories.has(c),
  );
  const subsystemsComplete = missingRequired.length === 0;

  const massFeasible = mass.status === "NOMINAL" || mass.status === "WARNING";
  const powerFeasible = power.status === "SURPLUS" || power.status === "MARGINAL";
  const thermalFeasible = thermal.status === "NOMINAL" || thermal.status === "MARGINAL";

  const hasCriticalViolations = warnings.some((w) => w.severity === "CRITICAL");
  const hasWarningMargins = warnings.some((w) => w.severity === "WARNING");

  let status: FeasibilityReport["status"];
  let summary: string;

  if (!subsystemsComplete || !orbitSelected || !launcherSelected) {
    status = "INCOMPLETE";
    const missing: string[] = [];
    if (!subsystemsComplete) missing.push(`${missingRequired.length} core subsystem(s)`);
    if (!orbitSelected) missing.push("target orbit");
    if (!launcherSelected) missing.push("launch vehicle");
    summary = `Design is incomplete: missing ${missing.join(", ")}.`;
  } else if (hasCriticalViolations) {
    status = "VIOLATION";
    const criticalTitles = warnings
      .filter((w) => w.severity === "CRITICAL")
      .map((w) => w.title)
      .join(", ");
    summary = `Design has fatal engineering violations: ${criticalTitles}. Spacecraft will fail mission requirements.`;
  } else if (hasWarningMargins) {
    status = "MARGINAL";
    summary =
      "Design is technically functional but operates with narrow margins or unaddressed operational risks (tight mass/power margins or missing eclipse battery).";
  } else {
    status = "FEASIBLE";
    summary =
      "All engineering budgets and mission requirements are fully satisfied with healthy aerospace margins.";
  }

  // Calculate composite score (0 - 100%)
  let score = 0;
  if (subsystemsComplete) score += 25;
  if (orbitSelected && launcherSelected) score += 15;
  if (massFeasible && mass.status !== "NO_LAUNCHER") score += 20;
  if (powerFeasible && power.hasBattery) score += 20;
  else if (powerFeasible) score += 12;
  if (thermalFeasible && thermal.status !== "NO_COOLING") score += 20;
  else if (thermalFeasible) score += 10;

  if (hasCriticalViolations) {
    score = Math.min(score, 45); // Capped if critical violations exist
  } else if (hasWarningMargins) {
    score = Math.min(score, 85); // Capped at 85 if marginal
  }

  return {
    status,
    subsystemsComplete,
    orbitSelected,
    launcherSelected,
    massFeasible,
    powerFeasible,
    thermalFeasible,
    scorePercentage: Math.max(0, Math.min(100, score)),
    summary,
  };
}

/**
 * Computes the unified resource report for a given spacecraft design.
 */
export function generateSpacecraftResourceReport(
  components: Component[],
  launcher: LauncherTarget | null,
  orbit: OrbitTarget | null,
  design: SpacecraftDesign,
): SpacecraftResourceReport {
  const mass = calculateMassBudget(components, launcher, orbit);
  const power = calculatePowerBudget(components);
  const thermal = calculateThermalBudget(components);
  const warnings = generateEngineeringWarnings(mass, power, thermal, design, components);
  const feasibility = calculateFeasibilityReport(
    mass,
    power,
    thermal,
    warnings,
    design,
    components,
  );

  return {
    mass,
    power,
    thermal,
    warnings,
    feasibility,
  };
}
