import { describe, it, expect } from "vitest";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { MassBudgetPanel } from "./MassBudgetPanel";
import { PowerBudgetPanel } from "./PowerBudgetPanel";
import { ThermalBudgetPanel } from "./ThermalBudgetPanel";
import { EngineeringWarningsPanel } from "./EngineeringWarningsPanel";
import { ResourceDashboard } from "./ResourceDashboard";
import {
  calculateMassBudget,
  calculatePowerBudget,
  calculateThermalBudget,
  generateEngineeringWarnings,
  calculateFeasibilityReport,
  generateSpacecraftResourceReport,
} from "./resourceCalculations";
import { localCatalogueAdapter } from "../component-catalogue/componentData";
import { useSpacecraftStore } from "../../stores/spacecraftStore";

describe("Resource Management UI Panels (Static Markup Tests)", () => {
  const electron = localCatalogueAdapter.getLauncherById("launcher-electron")!;
  const falcon9 = localCatalogueAdapter.getLauncherById("launcher-falcon9")!;
  const leoOrbit = localCatalogueAdapter.getOrbitById("orbit-leo-400")!;
  const geoOrbit = localCatalogueAdapter.getOrbitById("orbit-geo-35786")!;
  const lunarOrbit = localCatalogueAdapter.getOrbitById("orbit-lunar-polar-100")!;

  const bus3u = localCatalogueAdapter.getComponentById("comp-bus-cubesat-3u")!;
  const solarFixed = localCatalogueAdapter.getComponentById("comp-pwr-solar-fixed-3u")!;
  const solarDeploy = localCatalogueAdapter.getComponentById("comp-pwr-solar-deployable-100w")!;
  const battery = localCatalogueAdapter.getComponentById("comp-pwr-battery-li-ion-50wh")!;
  const commsPatch = localCatalogueAdapter.getComponentById("comp-com-patch-antenna-uhf")!;
  const obc = localCatalogueAdapter.getComponentById("comp-avi-onboard-computer")!;
  const radiator = localCatalogueAdapter.getComponentById("comp-thm-active-radiator-panel")!;
  const sar = localCatalogueAdapter.getComponentById("comp-pld-synthetic-aperture-radar")!;

  // ---------------------------------------------------------------------------
  // 1. MassBudgetPanel
  // ---------------------------------------------------------------------------
  describe("MassBudgetPanel", () => {
    it("renders nominal mass budget with capacity and margin", () => {
      const mass = calculateMassBudget([bus3u, solarDeploy, battery], electron, leoOrbit);
      const html = renderToStaticMarkup(React.createElement(MassBudgetPanel, { mass }));

      expect(html).toContain("Mass Budget");
      expect(html).toContain("4.5"); // total mass: 1.5 + 2.2 + 0.8 = 4.5 kg
      expect(html).toContain("300"); // electron capacity
      expect(html).toContain("295.5"); // remaining
      expect(html).toContain("Structure");
      expect(html).toContain("Power");
      expect(html).toContain("Nominal");
    });

    it("renders warning when launcher has 0 capacity for GEO (Electron)", () => {
      const mass = calculateMassBudget([bus3u], electron, geoOrbit);
      const html = renderToStaticMarkup(React.createElement(MassBudgetPanel, { mass }));

      expect(html).toContain("0kg Capacity");
      expect(html).toContain("Trajectory Incompatible");
    });

    it("renders provisional lunar rating callout when lunar orbit selected with Falcon 9", () => {
      const mass = calculateMassBudget([bus3u], falcon9, lunarOrbit);
      const html = renderToStaticMarkup(React.createElement(MassBudgetPanel, { mass }));

      expect(html).toContain("Provisional Lunar Rating");
      expect(html).toContain("8,300");
    });

    it("renders callout when no launcher is selected", () => {
      const mass = calculateMassBudget([bus3u], null, leoOrbit);
      const html = renderToStaticMarkup(React.createElement(MassBudgetPanel, { mass }));

      expect(html).toContain("No Launcher Selected");
      expect(html).toContain("Launcher Unset");
    });
  });

  // ---------------------------------------------------------------------------
  // 2. PowerBudgetPanel
  // ---------------------------------------------------------------------------
  describe("PowerBudgetPanel", () => {
    it("renders positive power surplus and battery storage", () => {
      const power = calculatePowerBudget([bus3u, solarDeploy, battery, obc, commsPatch]);
      const html = renderToStaticMarkup(React.createElement(PowerBudgetPanel, { power }));

      expect(html).toContain("Power Budget");
      expect(html).toContain("+100.0"); // generation
      expect(html).toContain("50"); // 50 Wh battery
      expect(html).toContain("Positive Balance");
      expect(html).toContain("Battery Storage Clarification");
    });

    it("renders power deficit callout when consumers exceed generation", () => {
      const power = calculatePowerBudget([solarFixed, sar]); // 24W solar gen, 130W SAR consumption => 106W deficit
      const html = renderToStaticMarkup(React.createElement(PowerBudgetPanel, { power }));

      expect(html).toContain("Power Deficit");
      expect(html).toContain("Peak consumption exceeds daylight generation");
    });

    it("renders eclipse storage warning when battery is missing", () => {
      const power = calculatePowerBudget([bus3u, solarDeploy, obc]); // has solar, no battery
      const html = renderToStaticMarkup(React.createElement(PowerBudgetPanel, { power }));

      expect(html).toContain("No Eclipse Energy Storage");
    });
  });

  // ---------------------------------------------------------------------------
  // 3. ThermalBudgetPanel
  // ---------------------------------------------------------------------------
  describe("ThermalBudgetPanel", () => {
    it("renders balanced thermal budget with radiator capacity and bottlenecks", () => {
      const thermal = calculateThermalBudget([bus3u, sar, radiator]);
      const html = renderToStaticMarkup(React.createElement(ThermalBudgetPanel, { thermal }));

      expect(html).toContain("Thermal Budget");
      expect(html).toContain("43.0"); // 1W bus + 42W SAR = 43W load
      expect(html).toContain("75.0"); // 75W radiator capacity
      expect(html).toContain("Compact Synthetic Aperture Radar (SAR)");
      expect(html).toContain("Balanced");
    });

    it("renders no cooling danger callout when thermal management is absent", () => {
      const thermal = calculateThermalBudget([bus3u, sar]);
      const html = renderToStaticMarkup(React.createElement(ThermalBudgetPanel, { thermal }));

      expect(html).toContain("No Thermal Protection Installed");
      expect(html).toContain("No Cooling");
    });
  });

  // ---------------------------------------------------------------------------
  // 4. EngineeringWarningsPanel
  // ---------------------------------------------------------------------------
  describe("EngineeringWarningsPanel", () => {
    it("renders critical violations with grounded component recommendations", () => {
      const mass = calculateMassBudget([bus3u], electron, geoOrbit);
      const power = calculatePowerBudget([bus3u, sar]);
      const thermal = calculateThermalBudget([bus3u, sar]);
      const design = {
        id: "d1",
        name: "Test",
        selectedComponents: [],
        selectedOrbitId: geoOrbit.id,
        selectedLauncherId: electron.id,
        createdAt: 0,
        updatedAt: 0,
      };

      const warnings = generateEngineeringWarnings(mass, power, thermal, design, [bus3u, sar]);
      const html = renderToStaticMarkup(React.createElement(EngineeringWarningsPanel, { warnings }));

      expect(html).toContain("Fatal Engineering Violations");
      expect(html).toContain("Incapable Launch Vehicle for Target Orbit");
      expect(html).toContain("No Power Generation Subsystems Installed");
      expect(html).toContain("No Thermal Control System Installed");
      expect(html).toContain("Deployable Articulated Solar Array");
      expect(html).toContain("Active Heat Pipe Radiator Panel");
    });

    it("renders all-systems-nominal banner when 0 warnings exist", () => {
      const html = renderToStaticMarkup(React.createElement(EngineeringWarningsPanel, { warnings: [] }));

      expect(html).toContain("All Systems Nominal");
      expect(html).toContain("0 Violations");
    });
  });

  // ---------------------------------------------------------------------------
  // 5. ResourceDashboard
  // ---------------------------------------------------------------------------
  describe("ResourceDashboard", () => {
    it("renders full dashboard with feasibility index and quick metrics strip", () => {
      const comps = [bus3u, solarDeploy, battery, commsPatch, obc, radiator];
      const design = {
        id: "d-test",
        name: "Odyssey Probe",
        selectedComponents: comps.map((c) => ({
          instanceId: `inst-${c.id}`,
          componentId: c.id,
          addedAt: Date.now(),
        })),
        selectedOrbitId: "orbit-leo-400",
        selectedLauncherId: "launcher-electron",
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };
      const report = generateSpacecraftResourceReport(comps, electron, leoOrbit, design);

      const html = renderToStaticMarkup(
        React.createElement(ResourceDashboard, {
          onSwitchToCatalogue: () => {},
          report,
        }),
      );

      expect(html).toContain("Resource Management &amp; Engineering Budgets");
      expect(html).toContain("MISSION FEASIBLE");
      expect(html).toContain("100%");
      expect(html).toContain("Return to Component Catalogue");
      expect(html).toContain("Mass Budget");
      expect(html).toContain("Power Budget");
      expect(html).toContain("Thermal Budget");
      expect(html).toContain("Engineering Assessment &amp; Advisories");
    });
  });
});
