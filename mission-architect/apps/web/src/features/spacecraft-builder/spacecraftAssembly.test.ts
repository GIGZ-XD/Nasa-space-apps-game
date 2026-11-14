import { describe, it, expect, beforeEach } from "vitest";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import {
  SpacecraftPreview,
  ReadinessSummary,
  BuilderWorkspace,
  CATEGORY_SLOT_REGISTRY,
  mapComponentToVisualSlot,
  mapSelectedComponentsToVisualSlots,
  getInstalledCategories,
  selectAssembledComponents,
  selectMissingRequiredCategories,
  selectSatisfiedRequiredCategories,
  selectAssemblyCompleteness,
  selectReadinessSummary,
  buildNormalizedAssemblyPayload,
  serializeAssemblyPayload,
  validateAssemblyPayload,
} from "./index";
import { localCatalogueAdapter } from "../component-catalogue/componentData";
import { useSpacecraftStore } from "../../stores/spacecraftStore";
import type { Component, ComponentCategory } from "../component-catalogue/component.types";
import type { SpacecraftDesign } from "@mission-architect/shared";

const getComp = (id: string): Component => {
  const c = localCatalogueAdapter.getComponentById(id);
  if (!c) throw new Error(`Component not found: ${id}`);
  return c;
};

describe("Phase 4 – Spacecraft Visual Assembly & Selectors", () => {
  const bus3u = getComp("comp-bus-cubesat-3u");
  const busEspa = getComp("comp-bus-smallsat-espahigh");
  const solarDeploy = getComp("comp-pwr-solar-deployable-100w");
  const solarFixed = getComp("comp-pwr-solar-fixed-3u");
  const battery = getComp("comp-pwr-battery-li-ion-50wh");
  const coldGas = getComp("comp-prop-cold-gas-thruster");
  const biprop = getComp("comp-prop-biprop-engine");
  const ion = getComp("comp-prop-hall-thruster-ion");
  const mli = getComp("comp-thm-passive-mli");
  const radiator = getComp("comp-thm-active-radiator-panel");
  const commsPatch = getComp("comp-com-patch-antenna-uhf");
  const commsDish = getComp("comp-com-xband-dish");
  const obc = getComp("comp-avi-onboard-computer");
  const adcs = getComp("comp-avi-adcs-reaction-wheels");
  const imager = getComp("comp-pld-multispectral-imager");
  const sar = getComp("comp-pld-synthetic-aperture-radar");
  const mag = getComp("comp-pld-space-weather-mag");

  beforeEach(() => {
    useSpacecraftStore.getState().resetDesign();
  });

  // =========================================================================
  // 1. VISUAL SLOT MAPPING TESTS
  // =========================================================================
  describe("slotMapping", () => {
    it("maps all 7 standard catalogue categories to expected slot definitions", () => {
      const categories: ComponentCategory[] = [
        "structure",
        "power",
        "propulsion",
        "thermal",
        "communications",
        "avionics",
        "payload",
      ];

      for (const cat of categories) {
        expect(CATEGORY_SLOT_REGISTRY[cat]).toBeDefined();
        expect(CATEGORY_SLOT_REGISTRY[cat].category).toBe(cat);
        expect(typeof CATEGORY_SLOT_REGISTRY[cat].zIndex).toBe("number");
      }
    });

    it("distinguishes CubeSat and ESPA structural bus subtypes", () => {
      const slot3u = mapComponentToVisualSlot(bus3u, "inst-1");
      expect(slot3u.slotId).toBe("bus-structure");
      expect(slot3u.subtype).toBe("cubesat-3u");

      const slotEspa = mapComponentToVisualSlot(busEspa, "inst-2");
      expect(slotEspa.slotId).toBe("bus-structure");
      expect(slotEspa.subtype).toBe("espahigh");
    });

    it("distinguishes solar deployable wings, fixed body panels, and battery module", () => {
      const slotDeploy = mapComponentToVisualSlot(solarDeploy, "inst-p1");
      expect(slotDeploy.slotId).toBe("solar-wings");

      const slotFixed = mapComponentToVisualSlot(solarFixed, "inst-p2");
      expect(slotFixed.slotId).toBe("solar-body");

      const slotBattery = mapComponentToVisualSlot(battery, "inst-p3");
      expect(slotBattery.slotId).toBe("battery-module");
    });

    it("distinguishes ion thruster, chemical biprop, and cold-gas propulsion", () => {
      const slotIon = mapComponentToVisualSlot(ion, "inst-pr1");
      expect(slotIon.slotId).toBe("propulsion-engine");
      expect(slotIon.subtype).toBe("ion-engine");

      const slotChem = mapComponentToVisualSlot(biprop, "inst-pr2");
      expect(slotChem.slotId).toBe("propulsion-engine");
      expect(slotChem.subtype).toBe("chemical-engine");

      const slotCold = mapComponentToVisualSlot(coldGas, "inst-pr3");
      expect(slotCold.slotId).toBe("propulsion-rcs");
      expect(slotCold.subtype).toBe("cold-gas");
    });

    it("distinguishes MLI blanket and active radiator panels", () => {
      const slotMli = mapComponentToVisualSlot(mli, "inst-t1");
      expect(slotMli.slotId).toBe("mli-insulation");

      const slotRad = mapComponentToVisualSlot(radiator, "inst-t2");
      expect(slotRad.slotId).toBe("radiator-panels");
    });

    it("distinguishes parabolic dish and patch communications antenna", () => {
      const slotDish = mapComponentToVisualSlot(commsDish, "inst-c1");
      expect(slotDish.slotId).toBe("antenna-dish");

      const slotPatch = mapComponentToVisualSlot(commsPatch, "inst-c2");
      expect(slotPatch.slotId).toBe("antenna-patch");
    });

    it("distinguishes optical camera, SAR radar, and magnetometer boom payloads", () => {
      const slotCam = mapComponentToVisualSlot(imager, "inst-pl1");
      expect(slotCam.slotId).toBe("payload-camera");

      const slotSar = mapComponentToVisualSlot(sar, "inst-pl2");
      expect(slotSar.slotId).toBe("payload-radar");

      const slotMag = mapComponentToVisualSlot(mag, "inst-pl3");
      expect(slotMag.slotId).toBe("payload-boom");
    });

    it("degrades gracefully for unknown or unmapped categories without crashing", () => {
      const mockUnknown = {
        id: "comp-experimental-gravity-shield",
        name: "Experimental Gravity Shield",
        category: "quantum-warp" as unknown as ComponentCategory,
        description: "Future exotic propulsion",
        massKg: 10,
        powerWatts: 100,
        costCredits: 99999,
        thermalWatts: 50,
      };

      const slot = mapComponentToVisualSlot(mockUnknown, "inst-x");
      expect(slot.slotId).toBe("aux-attachment");
      expect(slot.name).toBe("Experimental Gravity Shield");
      expect(slot.subtype).toBe("aux-component");
    });

    it("sorts multiple components by z-index for proper visual depth layering", () => {
      const installed = [
        { component: commsDish, instanceId: "inst-dish" },     // zIndex: 25
        { component: ion, instanceId: "inst-ion" },             // zIndex: 5
        { component: bus3u, instanceId: "inst-bus" },           // zIndex: 10
        { component: solarDeploy, instanceId: "inst-solar" },   // zIndex: 15
        { component: radiator, instanceId: "inst-rad" },        // zIndex: 20
      ];

      const sortedSlots = mapSelectedComponentsToVisualSlots(installed);
      expect(sortedSlots[0].slotId).toBe("propulsion-engine"); // zIndex 5
      expect(sortedSlots[1].slotId).toBe("bus-structure");     // zIndex 10
      expect(sortedSlots[2].slotId).toBe("solar-wings");       // zIndex 15
      expect(sortedSlots[3].slotId).toBe("radiator-panels");   // zIndex 20
      expect(sortedSlots[4].slotId).toBe("antenna-dish");      // zIndex 25
    });

    it("returns correct set of installed categories", () => {
      const installed = [
        { component: bus3u, instanceId: "1" },
        { component: solarDeploy, instanceId: "2" },
      ];
      const slots = mapSelectedComponentsToVisualSlots(installed);
      const cats = getInstalledCategories(slots);
      expect(cats.has("structure")).toBe(true);
      expect(cats.has("power")).toBe(true);
      expect(cats.has("propulsion")).toBe(false);
    });
  });

  // =========================================================================
  // 2. SPACECRAFT PREVIEW COMPONENT TESTS
  // =========================================================================
  describe("SpacecraftPreview", () => {
    it("renders empty state safely with assembly cradle placeholder when no components installed", () => {
      const html = renderToStaticMarkup(
        React.createElement(SpacecraftPreview, {
          installedComponents: [],
          selectedInstanceId: null,
        }),
      );

      expect(html).toContain("Spacecraft Visual Assembly Preview");
      expect(html).toContain("Spacecraft Assembly Cradle Empty");
      expect(html).toContain("AWAITING BUS CHASSIS");
      expect(html).toContain("0 Mounted Components");
    });

    it("renders central bus structure and updates component count", () => {
      const html = renderToStaticMarkup(
        React.createElement(SpacecraftPreview, {
          installedComponents: [{ component: bus3u, instanceId: "inst-bus" }],
          selectedInstanceId: null,
        }),
      );

      expect(html).toContain("1 Mounted Components");
      expect(html).toContain('id="structure-layer"');
      expect(html).not.toContain("AWAITING BUS CHASSIS");
    });

    it("renders deployable solar wings, engine plume, and antenna dish in preview", () => {
      const installed = [
        { component: bus3u, instanceId: "inst-bus" },
        { component: solarDeploy, instanceId: "inst-solar" },
        { component: ion, instanceId: "inst-ion" },
        { component: commsDish, instanceId: "inst-dish" },
      ];

      const html = renderToStaticMarkup(
        React.createElement(SpacecraftPreview, {
          installedComponents: installed,
          selectedInstanceId: null,
        }),
      );

      expect(html).toContain('id="solar-wings-layer"');
      expect(html).toContain('id="propulsion-layer"');
      expect(html).toContain('id="comms-dish-layer"');
      expect(html).toContain("url(#ion-plasma)");
    });

    it("highlights selected slot when selectedInstanceId matches", () => {
      const installed = [
        { component: bus3u, instanceId: "inst-bus" },
        { component: solarDeploy, instanceId: "inst-solar" },
      ];

      const html = renderToStaticMarkup(
        React.createElement(SpacecraftPreview, {
          installedComponents: installed,
          selectedInstanceId: "inst-solar",
        }),
      );

      // Tooltip HUD for selected component should be visible
      expect(html).toContain("Deployable Articulated Solar Array (100W)");
      expect(html).toContain("power");
    });
  });

  // =========================================================================
  // 3. READINESS SUMMARY COMPONENT TESTS
  // =========================================================================
  describe("ReadinessSummary", () => {
    it("reports INCOMPLETE when required categories, orbit, or launcher are missing", () => {
      const html = renderToStaticMarkup(
        React.createElement(ReadinessSummary, {
          selectedComponentCount: 1,
          presentCategories: new Set<ComponentCategory>(["structure"]),
          orbitSelected: false,
          launcherSelected: false,
        }),
      );

      expect(html).toContain("Assembly Incomplete");
      expect(html).toContain("Assembly In Progress");
      expect(html).toContain("Install missing core subsystems");
    });

    it("reports READY_FOR_REVIEW when all required categories are present but engineering has violations", () => {
      const html = renderToStaticMarkup(
        React.createElement(ReadinessSummary, {
          selectedComponentCount: 5,
          presentCategories: new Set<ComponentCategory>(["structure", "power", "communications", "avionics"]),
          orbitSelected: true,
          launcherSelected: true,
          engineeringFeasible: false,
          hasCriticalViolations: true,
        }),
      );

      expect(html).toContain("Ready for Review");
      expect(html).toContain("Violations Detected");
      expect(html).toContain("Hardware mounted, but critical engineering violations detected");
    });

    it("reports READY_FOR_SUBMISSION when all hardware is present and physics budgets pass", () => {
      const html = renderToStaticMarkup(
        React.createElement(ReadinessSummary, {
          selectedComponentCount: 6,
          presentCategories: new Set<ComponentCategory>(["structure", "power", "communications", "avionics"]),
          orbitSelected: true,
          launcherSelected: true,
          engineeringFeasible: true,
          hasCriticalViolations: false,
        }),
      );

      expect(html).toContain("Ready for Submission");
      expect(html).toContain("Budgets Nominal");
      expect(html).toContain("Ready for mission flight qualification!");
    });
  });

  // =========================================================================
  // 4. STABLE SELECTORS TESTS
  // =========================================================================
  describe("stableSelectors", () => {
    it("selectAssembledComponents returns resolved components matching store instances", () => {
      useSpacecraftStore.getState().addComponent("comp-bus-cubesat-3u");
      useSpacecraftStore.getState().addComponent("comp-pwr-solar-deployable-100w");

      const assembled = selectAssembledComponents(useSpacecraftStore.getState());
      expect(assembled).toHaveLength(2);
      expect(assembled[0].component.name).toBe("3U CubeSat Bus Structure");
      expect(assembled[1].component.name).toBe("Deployable Articulated Solar Array (100W)");
    });

    it("selectMissingRequiredCategories identifies missing categories accurately", () => {
      useSpacecraftStore.getState().addComponent("comp-bus-cubesat-3u"); // structure
      useSpacecraftStore.getState().addComponent("comp-pwr-solar-deployable-100w"); // power

      const missing = selectMissingRequiredCategories(useSpacecraftStore.getState());
      expect(missing).toContain("communications");
      expect(missing).toContain("avionics");
      expect(missing).not.toContain("structure");
      expect(missing).not.toContain("power");
    });

    it("selectSatisfiedRequiredCategories identifies satisfied categories accurately", () => {
      useSpacecraftStore.getState().addComponent("comp-bus-cubesat-3u");
      useSpacecraftStore.getState().addComponent("comp-com-patch-antenna-uhf");

      const satisfied = selectSatisfiedRequiredCategories(useSpacecraftStore.getState());
      expect(satisfied).toContain("structure");
      expect(satisfied).toContain("communications");
      expect(satisfied).not.toContain("power");
    });

    it("selectAssemblyCompleteness returns true only when all 4 subsystems + orbit + launcher are set", () => {
      expect(selectAssemblyCompleteness(useSpacecraftStore.getState())).toBe(false);

      useSpacecraftStore.getState().addComponent("comp-bus-cubesat-3u");
      useSpacecraftStore.getState().addComponent("comp-pwr-solar-deployable-100w");
      useSpacecraftStore.getState().addComponent("comp-com-patch-antenna-uhf");
      useSpacecraftStore.getState().addComponent("comp-avi-onboard-computer");
      expect(selectAssemblyCompleteness(useSpacecraftStore.getState())).toBe(false); // missing orbit & launcher

      useSpacecraftStore.getState().setOrbit("orbit-leo-400");
      useSpacecraftStore.getState().setLauncher("launcher-electron");
      expect(selectAssemblyCompleteness(useSpacecraftStore.getState())).toBe(true);
    });

    it("selectReadinessSummary returns aggregated snapshot", () => {
      useSpacecraftStore.getState().addComponent("comp-bus-cubesat-3u");
      useSpacecraftStore.getState().setOrbit("orbit-leo-400");

      const summary = selectReadinessSummary(useSpacecraftStore.getState());
      expect(summary.componentCount).toBe(1);
      expect(summary.satisfiedCategories).toEqual(["structure"]);
      expect(summary.missingCategories).toHaveLength(3);
      expect(summary.orbitSelected).toBe(true);
      expect(summary.launcherSelected).toBe(false);
      expect(summary.isAssemblyComplete).toBe(false);
    });
  });

  // =========================================================================
  // 5. NORMALIZED DESIGN PAYLOAD TESTS
  // =========================================================================
  describe("normalizedDesignPayload", () => {
    it("builds a deterministic, sorted payload independently of mounting order", () => {
      const designA: SpacecraftDesign = {
        id: "design-1",
        name: "Test Spacecraft",
        selectedComponents: [
          { instanceId: "inst-comms", componentId: "comp-com-patch-antenna-uhf", addedAt: 100 },
          { instanceId: "inst-bus", componentId: "comp-bus-cubesat-3u", addedAt: 200 },
          { instanceId: "inst-solar", componentId: "comp-pwr-solar-deployable-100w", addedAt: 300 },
        ],
        selectedOrbitId: "orbit-leo-400",
        selectedLauncherId: "launcher-electron",
        createdAt: 1000,
        updatedAt: 2000,
      };

      const designB: SpacecraftDesign = {
        ...designA,
        selectedComponents: [
          { instanceId: "inst-solar", componentId: "comp-pwr-solar-deployable-100w", addedAt: 300 },
          { instanceId: "inst-bus", componentId: "comp-bus-cubesat-3u", addedAt: 200 },
          { instanceId: "inst-comms", componentId: "comp-com-patch-antenna-uhf", addedAt: 100 },
        ],
      };

      const payloadA = buildNormalizedAssemblyPayload(designA);
      const payloadB = buildNormalizedAssemblyPayload(designB);

      expect(payloadA.componentIds).toEqual(payloadB.componentIds);
      expect(payloadA.components.map((c) => c.componentId)).toEqual(
        payloadB.components.map((c) => c.componentId),
      );
    });

    it("does NOT mutate the input design object", () => {
      const originalComponents = [
        { instanceId: "inst-1", componentId: "comp-bus-cubesat-3u", addedAt: 100 },
      ];
      const design: SpacecraftDesign = {
        id: "design-immutability",
        name: "Immutability Test",
        selectedComponents: [...originalComponents],
        selectedOrbitId: null,
        selectedLauncherId: null,
        createdAt: 100,
        updatedAt: 100,
      };

      const payload = buildNormalizedAssemblyPayload(design);
      expect(payload.components).toHaveLength(1);
      expect(design.selectedComponents).toEqual(originalComponents);
    });

    it("produces a 100% JSON serializable payload", () => {
      useSpacecraftStore.getState().addComponent("comp-bus-cubesat-3u");
      useSpacecraftStore.getState().addComponent("comp-pwr-solar-deployable-100w");
      useSpacecraftStore.getState().setOrbit("orbit-leo-400");
      useSpacecraftStore.getState().setLauncher("launcher-electron");

      const payload = buildNormalizedAssemblyPayload(useSpacecraftStore.getState());
      const json = serializeAssemblyPayload(payload);

      expect(typeof json).toBe("string");
      const parsed = JSON.parse(json);
      expect(parsed.schemaVersion).toBe("1.0.0");
      expect(parsed.componentIds).toContain("comp-bus-cubesat-3u");
      expect(validateAssemblyPayload(parsed)).toBe(true);
    });

    it("validateAssemblyPayload detects invalid or corrupted payloads", () => {
      expect(validateAssemblyPayload(null)).toBe(false);
      expect(validateAssemblyPayload({})).toBe(false);
      expect(validateAssemblyPayload({ schemaVersion: "2.0.0" })).toBe(false);
      expect(validateAssemblyPayload({ schemaVersion: "1.0.0", designId: 123 })).toBe(false);
    });
  });

  // =========================================================================
  // 6. BUILDER WORKSPACE INTEGRATION TESTS
  // =========================================================================
  describe("BuilderWorkspace", () => {
    it("renders unified workspace with preview, readiness summary, and catalogue", () => {
      useSpacecraftStore.getState().addComponent("comp-bus-cubesat-3u");

      const html = renderToStaticMarkup(
        React.createElement(BuilderWorkspace, {
          onSwitchToResources: () => {},
        }),
      );

      expect(html).toContain("Spacecraft Assembly Bay");
      expect(html).toContain("Visual Assembly Preview");
      expect(html).toContain("Assembly Readiness Summary");
      expect(html).toContain("Spacecraft Component Catalogue");
      expect(html).toContain("Resource &amp; Physics Dashboard →");
    });
  });
});
