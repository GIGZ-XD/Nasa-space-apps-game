import { describe, it, expect } from "vitest";
import {
  calculateMassBudget,
  calculatePowerBudget,
  calculateThermalBudget,
  generateEngineeringWarnings,
  calculateFeasibilityReport,
  generateSpacecraftResourceReport,
} from "./resourceCalculations";
import {
  localCatalogueAdapter,
  PROVISIONAL_COMPONENTS,
  PROVISIONAL_ORBITS,
  PROVISIONAL_LAUNCHERS,
} from "../component-catalogue/componentData";
import type { Component, LauncherTarget, OrbitTarget } from "../component-catalogue/component.types";
import type { SpacecraftDesign } from "@mission-architect/shared";

// Helper getters
const getComp = (id: string): Component => {
  const comp = localCatalogueAdapter.getComponentById(id);
  if (!comp) throw new Error(`Missing component ${id}`);
  return comp;
};

const getOrbit = (id: string): OrbitTarget => {
  const orb = localCatalogueAdapter.getOrbitById(id);
  if (!orb) throw new Error(`Missing orbit ${id}`);
  return orb;
};

const getLauncher = (id: string): LauncherTarget => {
  const lnch = localCatalogueAdapter.getLauncherById(id);
  if (!lnch) throw new Error(`Missing launcher ${id}`);
  return lnch;
};

function createMockDesign(overrides?: Partial<SpacecraftDesign>): SpacecraftDesign {
  return {
    id: "test-design",
    name: "Test Spacecraft",
    selectedComponents: [],
    selectedOrbitId: null,
    selectedLauncherId: null,
    createdAt: Date.now(),
    updatedAt: Date.now(),
    ...overrides,
  };
}

describe("Resource Calculations Engine", () => {
  const electron = getLauncher("launcher-electron"); // 300kg LEO, 0kg GTO
  const vegaC = getLauncher("launcher-vega-c");       // 2300kg LEO, 800kg GTO
  const falcon9 = getLauncher("launcher-falcon9");   // 22800kg LEO, 8300kg GTO

  const leoOrbit = getOrbit("orbit-leo-400");
  const ssoOrbit = getOrbit("orbit-sso-600");
  const geoOrbit = getOrbit("orbit-geo-35786");
  const lunarOrbit = getOrbit("orbit-lunar-polar-100");

  const bus3u = getComp("comp-bus-cubesat-3u");               // mass: 1.5, pwr: 1, thm: 1
  const busEspa = getComp("comp-bus-smallsat-espahigh");       // mass: 45, pwr: 15, thm: 10
  const solarFixed = getComp("comp-pwr-solar-fixed-3u");       // mass: 0.4, pwr: -24, thm: 2
  const solarDeploy = getComp("comp-pwr-solar-deployable-100w");// mass: 2.2, pwr: -100, thm: 4
  const battery = getComp("comp-pwr-battery-li-ion-50wh");     // mass: 0.8, pwr: 0.5, thm: 1.5, storage: 50
  const coldGas = getComp("comp-prop-cold-gas-thruster");      // mass: 3.2, pwr: 5, thm: 1
  const hallThruster = getComp("comp-prop-hall-thruster-ion"); // mass: 8.5, pwr: 140, thm: 28
  const mli = getComp("comp-thm-passive-mli");                 // mass: 0.5, pwr: 0, thm: -10
  const radiator = getComp("comp-thm-active-radiator-panel");  // mass: 3.0, pwr: 6, thm: -65, reject: 75
  const commsPatch = getComp("comp-com-patch-antenna-uhf");    // mass: 0.9, pwr: 9, thm: 3
  const xbandDish = getComp("comp-com-xband-dish");            // mass: 3.4, pwr: 38, thm: 14
  const obc = getComp("comp-avi-onboard-computer");            // mass: 0.7, pwr: 5.5, thm: 4
  const adcs = getComp("comp-avi-adcs-reaction-wheels");       // mass: 2.1, pwr: 15, thm: 6
  const sar = getComp("comp-pld-synthetic-aperture-radar");    // mass: 16.5, pwr: 130, thm: 42

  // =========================================================================
  // 1. MASS BUDGET TESTS
  // =========================================================================
  describe("calculateMassBudget", () => {
    it("returns zero mass and NO_LAUNCHER when design is empty and no launcher is selected", () => {
      const budget = calculateMassBudget([], null, null);
      expect(budget.totalMassKg).toBe(0);
      expect(budget.componentBreakdown).toHaveLength(0);
      expect(budget.status).toBe("NO_LAUNCHER");
      expect(budget.applicableCapacityKg).toBeNull();
      expect(budget.remainingCapacityKg).toBeNull();
      expect(budget.marginPercent).toBeNull();
    });

    it("correctly calculates total mass and category breakdown for multiple components", () => {
      const components = [bus3u, solarFixed, battery, commsPatch, obc];
      // Expected mass: 1.5 + 0.4 + 0.8 + 0.9 + 0.7 = 4.3 kg
      const budget = calculateMassBudget(components, electron, leoOrbit);
      expect(budget.totalMassKg).toBe(4.3);
      expect(budget.componentBreakdown).toHaveLength(5);

      // Verify category breakdown
      const structCat = budget.categoryBreakdown.find((c) => c.category === "structure");
      expect(structCat?.massKg).toBe(1.5);
      expect(structCat?.componentCount).toBe(1);

      const pwrCat = budget.categoryBreakdown.find((c) => c.category === "power");
      // solarFixed(0.4) + battery(0.8) = 1.2 kg
      expect(pwrCat?.massKg).toBe(1.2);
      expect(pwrCat?.componentCount).toBe(2);

      expect(budget.applicableCapacityKg).toBe(300); // Electron LEO
      expect(budget.remainingCapacityKg).toBe(295.7);
      expect(budget.status).toBe("NOMINAL");
      expect(budget.marginPercent).toBeGreaterThan(90);
    });

    it("uses LEO capacity for LEO and SSO orbits", () => {
      const budgetLeo = calculateMassBudget([bus3u], electron, leoOrbit);
      expect(budgetLeo.applicableCapacityKg).toBe(300);

      const budgetSso = calculateMassBudget([bus3u], electron, ssoOrbit);
      expect(budgetSso.applicableCapacityKg).toBe(300);
    });

    it("uses GTO capacity for GEO orbit", () => {
      const budgetGeoVega = calculateMassBudget([busEspa], vegaC, geoOrbit);
      expect(budgetGeoVega.applicableCapacityKg).toBe(800); // Vega-C GTO is 800 kg
      expect(budgetGeoVega.remainingCapacityKg).toBe(800 - 45);
      expect(budgetGeoVega.status).toBe("NOMINAL");
    });

    it("identifies when launcher has 0 capacity for GEO (Electron)", () => {
      const budget = calculateMassBudget([bus3u], electron, geoOrbit);
      expect(budget.applicableCapacityKg).toBe(0);
      expect(budget.status).toBe("INCAPABLE_ORBIT");
      expect(budget.remainingCapacityKg).toBe(-1.5);
      expect(budget.statusMessage).toContain("0 kg payload capacity");
    });

    it("identifies when launcher has 0 capacity for Lunar orbit (Electron)", () => {
      const budget = calculateMassBudget([bus3u], electron, lunarOrbit);
      expect(budget.applicableCapacityKg).toBe(0);
      expect(budget.status).toBe("INCAPABLE_ORBIT");
    });

    it("flags provisional orbit capacity when Falcon 9 or Vega-C is used for Lunar orbit", () => {
      const budget = calculateMassBudget([busEspa], falcon9, lunarOrbit);
      expect(budget.applicableCapacityKg).toBe(8300); // GTO proxy
      expect(budget.isProvisionalOrbitCapacity).toBe(true);
      expect(budget.status).toBe("NOMINAL");
    });

    it("flags EXCEEDED status when spacecraft mass exceeds launcher payload capacity", () => {
      // Create high mass configuration exceeding Electron's 300 kg
      const heavyComponents: Component[] = [];
      for (let i = 0; i < 8; i++) {
        heavyComponents.push({ ...busEspa, id: `espa-${i}` }); // 8 * 45 = 360 kg
      }
      const budget = calculateMassBudget(heavyComponents, electron, leoOrbit);
      expect(budget.totalMassKg).toBe(360);
      expect(budget.applicableCapacityKg).toBe(300);
      expect(budget.remainingCapacityKg).toBe(-60);
      expect(budget.status).toBe("EXCEEDED");
      expect(budget.statusMessage).toContain("exceeded by 60 kg");
    });

    it("flags WARNING when remaining mass margin is below 15%", () => {
      // 260 kg payload on Electron (300 kg limit) => 40 kg margin (13.3% margin)
      const mockComp: Component = {
        ...busEspa,
        massKg: 260,
      };
      const budget = calculateMassBudget([mockComp], electron, leoOrbit);
      expect(budget.totalMassKg).toBe(260);
      expect(budget.applicableCapacityKg).toBe(300);
      expect(budget.remainingCapacityKg).toBe(40);
      expect(budget.marginPercent).toBe(13.3);
      expect(budget.status).toBe("WARNING");
      expect(budget.statusMessage).toContain("Tight mass margin");
    });
  });

  // =========================================================================
  // 2. POWER BUDGET TESTS
  // =========================================================================
  describe("calculatePowerBudget", () => {
    it("handles empty design with zero power and surplus status", () => {
      const budget = calculatePowerBudget([]);
      expect(budget.totalGenerationWatts).toBe(0);
      expect(budget.totalConsumptionWatts).toBe(0);
      expect(budget.netPowerWatts).toBe(0);
      expect(budget.totalBatteryCapacityWh).toBe(0);
      expect(budget.hasBattery).toBe(false);
      expect(budget.status).toBe("SURPLUS");
    });

    it("correctly separates solar generation (negative powerWatts) from consumption (positive powerWatts)", () => {
      // Deployable solar generates 100W (-100W)
      // Bus (1W), OBC (5.5W), ADCS (15W), Comms (9W) = 30.5W consumption
      const components = [bus3u, solarDeploy, obc, adcs, commsPatch];
      const budget = calculatePowerBudget(components);

      expect(budget.totalGenerationWatts).toBe(100);
      expect(budget.totalConsumptionWatts).toBe(30.5);
      expect(budget.netPowerWatts).toBe(69.5);
      expect(budget.status).toBe("SURPLUS");
      expect(budget.marginPercent).toBe(69.5);
    });

    it("flags NO_GENERATION when components consume power but no generation is installed", () => {
      const components = [bus3u, obc, commsPatch];
      const budget = calculatePowerBudget(components);

      expect(budget.totalGenerationWatts).toBe(0);
      expect(budget.totalConsumptionWatts).toBe(15.5);
      expect(budget.netPowerWatts).toBe(-15.5);
      expect(budget.status).toBe("NO_GENERATION");
    });

    it("flags DEFICIT when consumption exceeds generation", () => {
      // Fixed solar (generates 24W), SAR payload (consumes 130W)
      const components = [solarFixed, sar];
      const budget = calculatePowerBudget(components);

      expect(budget.totalGenerationWatts).toBe(24);
      expect(budget.totalConsumptionWatts).toBe(130);
      expect(budget.netPowerWatts).toBe(-106);
      expect(budget.status).toBe("DEFICIT");
      expect(budget.statusMessage).toContain("Power deficit");
    });

    it("flags MARGINAL when net power margin is less than 10%", () => {
      // Fixed solar: 24W generation
      // Consumption: 22W (margin = 2 / 24 = 8.3%)
      const consumerA: Component = { ...bus3u, powerWatts: 12 };
      const consumerB: Component = { ...obc, powerWatts: 10 };
      const budget = calculatePowerBudget([solarFixed, consumerA, consumerB]);

      expect(budget.totalGenerationWatts).toBe(24);
      expect(budget.totalConsumptionWatts).toBe(22);
      expect(budget.netPowerWatts).toBe(2);
      expect(budget.status).toBe("MARGINAL");
    });

    it("strictly separates battery storage Wh from continuous generation Watts", () => {
      // Li-Ion Battery: 50 Wh storage, but consumes 0.5 W standby
      // It does NOT produce continuous Watts!
      const budget = calculatePowerBudget([battery]);
      expect(budget.totalGenerationWatts).toBe(0);
      expect(budget.totalConsumptionWatts).toBe(0.5);
      expect(budget.totalBatteryCapacityWh).toBe(50);
      expect(budget.hasBattery).toBe(true);
      expect(budget.netPowerWatts).toBe(-0.5);
    });
  });

  // =========================================================================
  // 3. THERMAL BUDGET TESTS
  // =========================================================================
  describe("calculateThermalBudget", () => {
    it("handles empty design with zero thermal load and nominal status", () => {
      const budget = calculateThermalBudget([]);
      expect(budget.totalHeatLoadWatts).toBe(0);
      expect(budget.totalHeatRejectionWatts).toBe(0);
      expect(budget.status).toBe("NOMINAL");
      expect(budget.bottlenecks).toHaveLength(0);
    });

    it("flags NO_COOLING when heat is generated but no radiators or MLI are mounted", () => {
      // bus(1W) + obc(4W) + adcs(6W) + comms(3W) = 14W heat load
      const components = [bus3u, obc, adcs, commsPatch];
      const budget = calculateThermalBudget(components);

      expect(budget.totalHeatLoadWatts).toBe(14);
      expect(budget.totalHeatRejectionWatts).toBe(0);
      expect(budget.thermalMarginWatts).toBe(-14);
      expect(budget.status).toBe("NO_COOLING");
    });

    it("correctly calculates thermal rejection with MLI blanketing (10W rejection)", () => {
      // MLI: 10W rejection
      // Bus(1W) + OBC(4W) = 5W load
      const budget = calculateThermalBudget([bus3u, obc, mli]);
      expect(budget.totalHeatLoadWatts).toBe(5);
      expect(budget.totalHeatRejectionWatts).toBe(10);
      expect(budget.thermalMarginWatts).toBe(5);
      expect(budget.status).toBe("NOMINAL");
    });

    it("correctly calculates thermal rejection with active radiator panel (75W capacity)", () => {
      // Active radiator: specs.heatRejectionWatts = 75W
      // SAR: 42W heat load, Hall thruster: 28W heat load -> 70W load
      const budget = calculateThermalBudget([sar, hallThruster, radiator]);
      expect(budget.totalHeatLoadWatts).toBe(70);
      expect(budget.totalHeatRejectionWatts).toBe(75);
      expect(budget.thermalMarginWatts).toBe(5);
      // Margin = 5 / 75 = 6.7% (< 15% => MARGINAL)
      expect(budget.status).toBe("MARGINAL");
    });

    it("flags OVERHEAT_DEFICIT when heat load exceeds total rejection capacity", () => {
      // SAR(42W) + Hall thruster(28W) + ESPA bus(10W) + Xband(14W) = 94W load
      // Radiator provides 75W capacity -> 94 - 75 = 19W deficit
      const budget = calculateThermalBudget([sar, hallThruster, busEspa, xbandDish, radiator]);
      expect(budget.totalHeatLoadWatts).toBe(94);
      expect(budget.totalHeatRejectionWatts).toBe(75);
      expect(budget.thermalMarginWatts).toBe(-19);
      expect(budget.status).toBe("OVERHEAT_DEFICIT");
    });

    it("lists major heat-dissipation drivers in bottlenecks descending", () => {
      const budget = calculateThermalBudget([bus3u, sar, hallThruster, obc, xbandDish]);
      expect(budget.bottlenecks).toHaveLength(3); // sar(42), hallThruster(28), xbandDish(14)
      expect(budget.bottlenecks[0].id).toBe("comp-pld-synthetic-aperture-radar");
      expect(budget.bottlenecks[1].id).toBe("comp-prop-hall-thruster-ion");
      expect(budget.bottlenecks[2].id).toBe("comp-com-xband-dish");
    });
  });

  // =========================================================================
  // 4. ENGINEERING WARNINGS & RECOMMENDATIONS TESTS
  // =========================================================================
  describe("generateEngineeringWarnings", () => {
    it("generates critical warnings for mass exceeded with grounded recommendation", () => {
      const heavyComps = [busEspa, busEspa, busEspa, busEspa, busEspa, busEspa, busEspa]; // 315kg
      const mass = calculateMassBudget(heavyComps, electron, leoOrbit);
      const power = calculatePowerBudget(heavyComps);
      const thermal = calculateThermalBudget(heavyComps);
      const design = createMockDesign({
        selectedLauncherId: electron.id,
        selectedOrbitId: leoOrbit.id,
      });

      const warnings = generateEngineeringWarnings(mass, power, thermal, design, heavyComps);
      const massWarn = warnings.find((w) => w.id === "warn-mass-exceeded");
      expect(massWarn).toBeDefined();
      expect(massWarn?.severity).toBe("CRITICAL");
      expect(massWarn?.recommendation).toContain("Vega-C");
    });

    it("generates critical warning when launcher cannot reach orbit (Electron for GEO)", () => {
      const mass = calculateMassBudget([bus3u], electron, geoOrbit);
      const power = calculatePowerBudget([bus3u]);
      const thermal = calculateThermalBudget([bus3u]);
      const design = createMockDesign({
        selectedLauncherId: electron.id,
        selectedOrbitId: geoOrbit.id,
      });

      const warnings = generateEngineeringWarnings(mass, power, thermal, design, [bus3u]);
      const incapableWarn = warnings.find((w) => w.id === "warn-launcher-incapable");
      expect(incapableWarn).toBeDefined();
      expect(incapableWarn?.severity).toBe("CRITICAL");
      expect(incapableWarn?.recommendation).toContain("Vega-C (800 kg GTO) or Falcon 9");
    });

    it("generates power deficit warning with solar array recommendation", () => {
      const comps = [bus3u, sar]; // SAR draws 130W, no generation
      const mass = calculateMassBudget(comps, falcon9, leoOrbit);
      const power = calculatePowerBudget(comps);
      const thermal = calculateThermalBudget(comps);
      const design = createMockDesign({
        selectedLauncherId: falcon9.id,
        selectedOrbitId: leoOrbit.id,
      });

      const warnings = generateEngineeringWarnings(mass, power, thermal, design, comps);
      const pwrWarn = warnings.find((w) => w.id === "warn-no-power-generation");
      expect(pwrWarn).toBeDefined();
      expect(pwrWarn?.severity).toBe("CRITICAL");
      expect(pwrWarn?.recommendation).toContain("Deployable Articulated Solar Array");
    });

    it("generates missing battery warning when consuming components exist without battery storage", () => {
      const comps = [bus3u, solarDeploy, obc, commsPatch]; // has power generation, but no battery
      const mass = calculateMassBudget(comps, electron, leoOrbit);
      const power = calculatePowerBudget(comps);
      const thermal = calculateThermalBudget(comps);
      const design = createMockDesign({
        selectedLauncherId: electron.id,
        selectedOrbitId: leoOrbit.id,
      });

      const warnings = generateEngineeringWarnings(mass, power, thermal, design, comps);
      const batWarn = warnings.find((w) => w.id === "warn-no-battery");
      expect(batWarn).toBeDefined();
      expect(batWarn?.severity).toBe("WARNING");
      expect(batWarn?.recommendation).toContain("Li-Ion Space Battery Pack");
    });

    it("generates info warning when orbit or launcher is unselected", () => {
      const comps = [bus3u];
      const mass = calculateMassBudget(comps, null, null);
      const power = calculatePowerBudget(comps);
      const thermal = calculateThermalBudget(comps);
      const design = createMockDesign();

      const warnings = generateEngineeringWarnings(mass, power, thermal, design, comps);
      expect(warnings.some((w) => w.id === "info-orbit-unselected")).toBe(true);
      expect(warnings.some((w) => w.id === "info-launcher-unselected")).toBe(true);
      expect(warnings.some((w) => w.id === "info-missing-subsystems")).toBe(true);
    });
  });

  // =========================================================================
  // 5. FEASIBILITY REPORT TESTS
  // =========================================================================
  describe("calculateFeasibilityReport", () => {
    it("reports INCOMPLETE when required subsystems or launcher/orbit are missing", () => {
      const comps = [bus3u]; // only structure
      const mass = calculateMassBudget(comps, null, null);
      const power = calculatePowerBudget(comps);
      const thermal = calculateThermalBudget(comps);
      const design = createMockDesign();
      const warnings = generateEngineeringWarnings(mass, power, thermal, design, comps);

      const report = calculateFeasibilityReport(mass, power, thermal, warnings, design, comps);
      expect(report.status).toBe("INCOMPLETE");
      expect(report.subsystemsComplete).toBe(false);
      expect(report.orbitSelected).toBe(false);
      expect(report.launcherSelected).toBe(false);
    });

    it("reports VIOLATION when critical engineering violation exists despite having all subsystems", () => {
      // Has all 4 required subsystems: Structure, Power, Comms, Avionics
      // BUT has SAR with no cooling and massive power deficit
      const comps = [bus3u, solarFixed, commsPatch, obc, sar];
      const mass = calculateMassBudget(comps, electron, leoOrbit);
      const power = calculatePowerBudget(comps);
      const thermal = calculateThermalBudget(comps);
      const design = createMockDesign({
        selectedOrbitId: leoOrbit.id,
        selectedLauncherId: electron.id,
      });
      const warnings = generateEngineeringWarnings(mass, power, thermal, design, comps);

      const report = calculateFeasibilityReport(mass, power, thermal, warnings, design, comps);
      expect(report.status).toBe("VIOLATION");
      expect(report.summary).toContain("fatal engineering violations");
    });

    it("reports MARGINAL when operable but running with tight margins or missing battery", () => {
      // Has all required subsystems, positive power, adequate cooling (radiator 75W), but missing battery
      const comps = [bus3u, solarDeploy, commsPatch, obc, radiator];
      const mass = calculateMassBudget(comps, electron, leoOrbit);
      const power = calculatePowerBudget(comps);
      const thermal = calculateThermalBudget(comps);
      const design = createMockDesign({
        selectedOrbitId: leoOrbit.id,
        selectedLauncherId: electron.id,
      });
      const warnings = generateEngineeringWarnings(mass, power, thermal, design, comps);

      const report = calculateFeasibilityReport(mass, power, thermal, warnings, design, comps);
      expect(report.status).toBe("MARGINAL");
      expect(report.subsystemsComplete).toBe(true);
    });

    it("reports FEASIBLE with high score for a fully integrated, healthy spacecraft", () => {
      // Bus (3U), Deployable Solar (100W), Battery (50Wh), Comms Patch, OBC, ADCS, MLI, Radiator
      const comps = [
        bus3u,
        solarDeploy,
        battery,
        commsPatch,
        obc,
        adcs,
        mli,
        radiator,
      ];
      const mass = calculateMassBudget(comps, electron, leoOrbit);
      const power = calculatePowerBudget(comps);
      const thermal = calculateThermalBudget(comps);
      const design = createMockDesign({
        selectedOrbitId: leoOrbit.id,
        selectedLauncherId: electron.id,
      });
      const warnings = generateEngineeringWarnings(mass, power, thermal, design, comps);

      const report = calculateFeasibilityReport(mass, power, thermal, warnings, design, comps);
      expect(report.status).toBe("FEASIBLE");
      expect(report.scorePercentage).toBe(100);
      expect(report.massFeasible).toBe(true);
      expect(report.powerFeasible).toBe(true);
      expect(report.thermalFeasible).toBe(true);
      expect(report.summary).toContain("fully satisfied");
    });
  });

  // =========================================================================
  // 6. UNIFIED RESOURCE REPORT GENERATION
  // =========================================================================
  describe("generateSpacecraftResourceReport", () => {
    it("generates an aggregated, coherent resource report", () => {
      const comps = [bus3u, solarDeploy, battery, commsPatch, obc, radiator];
      const design = createMockDesign({
        selectedOrbitId: leoOrbit.id,
        selectedLauncherId: electron.id,
      });

      const report = generateSpacecraftResourceReport(comps, electron, leoOrbit, design);
      expect(report.mass.totalMassKg).toBeGreaterThan(0);
      expect(report.power.totalGenerationWatts).toBe(100);
      expect(report.power.hasBattery).toBe(true);
      expect(report.thermal.totalHeatRejectionWatts).toBe(75);
      expect(report.feasibility.status).toBe("FEASIBLE");
    });
  });

  // =========================================================================
  // 7. STORE REACTIVITY & SNAPSHOT INTEGRATION
  // =========================================================================
  describe("useResourceBudget & getResourceReportSnapshot", () => {
    it("updates resource snapshot when store actions add, remove, and update parameters", async () => {
      const { useSpacecraftStore } = await import("../../stores/spacecraftStore");
      const { getResourceReportSnapshot } = await import("./useResourceBudget");

      useSpacecraftStore.getState().resetDesign();

      // Initial empty state
      let snapshot = getResourceReportSnapshot();
      expect(snapshot.mass.totalMassKg).toBe(0);
      expect(snapshot.power.totalGenerationWatts).toBe(0);
      expect(snapshot.feasibility.status).toBe("INCOMPLETE");

      // Add Bus
      useSpacecraftStore.getState().addComponent("comp-bus-cubesat-3u");
      snapshot = getResourceReportSnapshot();
      expect(snapshot.mass.totalMassKg).toBe(1.5);
      expect(snapshot.feasibility.status).toBe("INCOMPLETE");

      // Add Solar Panel
      useSpacecraftStore.getState().addComponent("comp-pwr-solar-deployable-100w");
      // Add Battery, Comms, Avionics, Radiator to complete subsystems
      useSpacecraftStore.getState().addComponent("comp-pwr-battery-li-ion-50wh");
      useSpacecraftStore.getState().addComponent("comp-com-patch-antenna-uhf");
      useSpacecraftStore.getState().addComponent("comp-avi-onboard-computer");
      useSpacecraftStore.getState().addComponent("comp-thm-active-radiator-panel");

      snapshot = getResourceReportSnapshot();
      expect(snapshot.power.totalGenerationWatts).toBe(100);
      expect(snapshot.power.hasBattery).toBe(true);

      // Still INCOMPLETE because orbit and launcher not set yet
      expect(snapshot.feasibility.status).toBe("INCOMPLETE");

      // Set Orbit & Launcher to valid pairing (LEO + Electron)
      useSpacecraftStore.getState().setOrbit("orbit-leo-400");
      useSpacecraftStore.getState().setLauncher("launcher-electron");
      snapshot = getResourceReportSnapshot();
      expect(snapshot.mass.applicableCapacityKg).toBe(300);
      expect(snapshot.feasibility.status).toBe("FEASIBLE");

      // Switch to GEO Orbit with Electron (which has 0 GTO capacity => fatal violation)
      useSpacecraftStore.getState().setOrbit("orbit-geo-35786");
      snapshot = getResourceReportSnapshot();
      expect(snapshot.mass.status).toBe("INCAPABLE_ORBIT");
      expect(snapshot.feasibility.status).toBe("VIOLATION");

      // Upgrade launcher to Falcon 9 (8300 kg GTO capacity => resolved to FEASIBLE)
      useSpacecraftStore.getState().setLauncher("launcher-falcon9");
      snapshot = getResourceReportSnapshot();
      expect(snapshot.mass.status).toBe("NOMINAL");
      expect(snapshot.mass.applicableCapacityKg).toBe(8300);
      expect(snapshot.feasibility.status).toBe("FEASIBLE");

      // Reset
      useSpacecraftStore.getState().resetDesign();
      snapshot = getResourceReportSnapshot();
      expect(snapshot.mass.totalMassKg).toBe(0);
    });
  });
});
