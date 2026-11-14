/**
 * Spacecraft Builder Store — Unit Tests
 *
 * Tests cover:
 * - addComponent (happy path)
 * - addComponent (duplicate prevention)
 * - addComponent (unknown component id)
 * - removeComponent (happy path)
 * - removeComponent (unknown instanceId)
 * - selectComponent (happy path)
 * - selectComponent (clears on null)
 * - selectComponent (unknown instanceId rejected)
 * - resetDesign
 * - setOrbit / setLauncher
 * - buildNormalizedPayload (complete design)
 * - buildNormalizedPayload (incomplete design)
 * - buildNormalizedPayload (empty design)
 */

import { describe, it, expect, beforeEach } from "vitest";
import { useSpacecraftStore } from "./spacecraftStore";

// Reset the store before each test to avoid state leakage
function resetStore() {
  useSpacecraftStore.getState().resetDesign();
}

describe("spacecraftStore", () => {
  beforeEach(() => {
    resetStore();
  });

  // ---------------------------------------------------------------------------
  // addComponent
  // ---------------------------------------------------------------------------
  describe("addComponent", () => {
    it("adds a valid catalogue component and creates an instance reference", () => {
      useSpacecraftStore.getState().addComponent("comp-bus-cubesat-3u");
      const { selectedComponents } = useSpacecraftStore.getState().design;
      expect(selectedComponents).toHaveLength(1);
      expect(selectedComponents[0].componentId).toBe("comp-bus-cubesat-3u");
      expect(selectedComponents[0].instanceId).toMatch(/^inst-comp-bus-cubesat-3u-/);
    });

    it("sets addedAt to a recent timestamp", () => {
      const before = Date.now();
      useSpacecraftStore.getState().addComponent("comp-pwr-battery-li-ion-50wh");
      const after = Date.now();
      const { selectedComponents } = useSpacecraftStore.getState().design;
      expect(selectedComponents[0].addedAt).toBeGreaterThanOrEqual(before);
      expect(selectedComponents[0].addedAt).toBeLessThanOrEqual(after);
    });

    it("does NOT add a duplicate componentId (same component added twice)", () => {
      useSpacecraftStore.getState().addComponent("comp-bus-cubesat-3u");
      useSpacecraftStore.getState().addComponent("comp-bus-cubesat-3u");
      const { selectedComponents } = useSpacecraftStore.getState().design;
      expect(selectedComponents).toHaveLength(1);
    });

    it("adds multiple distinct components", () => {
      useSpacecraftStore.getState().addComponent("comp-bus-cubesat-3u");
      useSpacecraftStore.getState().addComponent("comp-pwr-solar-fixed-3u");
      useSpacecraftStore.getState().addComponent("comp-com-patch-antenna-uhf");
      const { selectedComponents } = useSpacecraftStore.getState().design;
      expect(selectedComponents).toHaveLength(3);
    });

    it("does not add a component for an unknown componentId", () => {
      useSpacecraftStore.getState().addComponent("non-existent-component");
      const { selectedComponents } = useSpacecraftStore.getState().design;
      expect(selectedComponents).toHaveLength(0);
    });
  });

  // ---------------------------------------------------------------------------
  // removeComponent
  // ---------------------------------------------------------------------------
  describe("removeComponent", () => {
    it("removes a component by instanceId", () => {
      useSpacecraftStore.getState().addComponent("comp-bus-cubesat-3u");
      useSpacecraftStore.getState().addComponent("comp-pwr-solar-fixed-3u");
      const { selectedComponents } = useSpacecraftStore.getState().design;
      const instanceIdToRemove = selectedComponents[0].instanceId;

      useSpacecraftStore.getState().removeComponent(instanceIdToRemove);

      const updated = useSpacecraftStore.getState().design.selectedComponents;
      expect(updated).toHaveLength(1);
      expect(updated.find((r) => r.instanceId === instanceIdToRemove)).toBeUndefined();
    });

    it("does not error if instanceId is unknown", () => {
      useSpacecraftStore.getState().addComponent("comp-bus-cubesat-3u");
      expect(() => {
        useSpacecraftStore.getState().removeComponent("not-an-instance-id");
      }).not.toThrow();
      expect(useSpacecraftStore.getState().design.selectedComponents).toHaveLength(1);
    });

    it("clears selectedInstanceId when the selected instance is removed", () => {
      useSpacecraftStore.getState().addComponent("comp-bus-cubesat-3u");
      const { selectedComponents } = useSpacecraftStore.getState().design;
      const instanceId = selectedComponents[0].instanceId;
      useSpacecraftStore.getState().selectComponent(instanceId);
      expect(useSpacecraftStore.getState().selectedInstanceId).toBe(instanceId);

      useSpacecraftStore.getState().removeComponent(instanceId);
      expect(useSpacecraftStore.getState().selectedInstanceId).toBeNull();
    });

    it("retains selectedInstanceId when a different instance is removed", () => {
      useSpacecraftStore.getState().addComponent("comp-bus-cubesat-3u");
      useSpacecraftStore.getState().addComponent("comp-pwr-solar-fixed-3u");
      const components = useSpacecraftStore.getState().design.selectedComponents;
      const keepId = components[0].instanceId;
      const removeId = components[1].instanceId;

      useSpacecraftStore.getState().selectComponent(keepId);
      useSpacecraftStore.getState().removeComponent(removeId);
      expect(useSpacecraftStore.getState().selectedInstanceId).toBe(keepId);
    });
  });

  // ---------------------------------------------------------------------------
  // selectComponent
  // ---------------------------------------------------------------------------
  describe("selectComponent", () => {
    it("selects a valid instance", () => {
      useSpacecraftStore.getState().addComponent("comp-bus-cubesat-3u");
      const instanceId = useSpacecraftStore.getState().design.selectedComponents[0].instanceId;
      useSpacecraftStore.getState().selectComponent(instanceId);
      expect(useSpacecraftStore.getState().selectedInstanceId).toBe(instanceId);
    });

    it("clears selection when passed null", () => {
      useSpacecraftStore.getState().addComponent("comp-bus-cubesat-3u");
      const instanceId = useSpacecraftStore.getState().design.selectedComponents[0].instanceId;
      useSpacecraftStore.getState().selectComponent(instanceId);
      useSpacecraftStore.getState().selectComponent(null);
      expect(useSpacecraftStore.getState().selectedInstanceId).toBeNull();
    });

    it("does not select an unknown instance and leaves previous selection unchanged", () => {
      useSpacecraftStore.getState().addComponent("comp-bus-cubesat-3u");
      const instanceId = useSpacecraftStore.getState().design.selectedComponents[0].instanceId;
      useSpacecraftStore.getState().selectComponent(instanceId);
      useSpacecraftStore.getState().selectComponent("non-existent-instance-id");
      expect(useSpacecraftStore.getState().selectedInstanceId).toBe(instanceId);
    });
  });

  // ---------------------------------------------------------------------------
  // resetDesign
  // ---------------------------------------------------------------------------
  describe("resetDesign", () => {
    it("clears all selected components", () => {
      useSpacecraftStore.getState().addComponent("comp-bus-cubesat-3u");
      useSpacecraftStore.getState().addComponent("comp-pwr-solar-fixed-3u");
      useSpacecraftStore.getState().resetDesign();
      expect(useSpacecraftStore.getState().design.selectedComponents).toHaveLength(0);
    });

    it("clears orbit and launcher selections", () => {
      useSpacecraftStore.getState().setOrbit("orbit-leo-400");
      useSpacecraftStore.getState().setLauncher("launcher-falcon9");
      useSpacecraftStore.getState().resetDesign();
      const { design } = useSpacecraftStore.getState();
      expect(design.selectedOrbitId).toBeNull();
      expect(design.selectedLauncherId).toBeNull();
    });

    it("clears selectedInstanceId", () => {
      useSpacecraftStore.getState().addComponent("comp-bus-cubesat-3u");
      const instanceId = useSpacecraftStore.getState().design.selectedComponents[0].instanceId;
      useSpacecraftStore.getState().selectComponent(instanceId);
      useSpacecraftStore.getState().resetDesign();
      expect(useSpacecraftStore.getState().selectedInstanceId).toBeNull();
    });

    it("creates a fresh design with a new id after reset", () => {
      const originalId = useSpacecraftStore.getState().design.id;
      useSpacecraftStore.getState().resetDesign();
      const newId = useSpacecraftStore.getState().design.id;
      expect(newId).not.toBe(originalId);
    });
  });

  // ---------------------------------------------------------------------------
  // setOrbit / setLauncher
  // ---------------------------------------------------------------------------
  describe("setOrbit", () => {
    it("sets the orbit ID", () => {
      useSpacecraftStore.getState().setOrbit("orbit-leo-400");
      expect(useSpacecraftStore.getState().design.selectedOrbitId).toBe("orbit-leo-400");
    });

    it("clears the orbit when passed null", () => {
      useSpacecraftStore.getState().setOrbit("orbit-geo-35786");
      useSpacecraftStore.getState().setOrbit(null);
      expect(useSpacecraftStore.getState().design.selectedOrbitId).toBeNull();
    });

    it("overwrites a previous orbit selection", () => {
      useSpacecraftStore.getState().setOrbit("orbit-leo-400");
      useSpacecraftStore.getState().setOrbit("orbit-sso-600");
      expect(useSpacecraftStore.getState().design.selectedOrbitId).toBe("orbit-sso-600");
    });
  });

  describe("setLauncher", () => {
    it("sets the launcher ID", () => {
      useSpacecraftStore.getState().setLauncher("launcher-electron");
      expect(useSpacecraftStore.getState().design.selectedLauncherId).toBe("launcher-electron");
    });

    it("clears the launcher when passed null", () => {
      useSpacecraftStore.getState().setLauncher("launcher-falcon9");
      useSpacecraftStore.getState().setLauncher(null);
      expect(useSpacecraftStore.getState().design.selectedLauncherId).toBeNull();
    });

    it("overwrites a previous launcher selection", () => {
      useSpacecraftStore.getState().setLauncher("launcher-electron");
      useSpacecraftStore.getState().setLauncher("launcher-vega-c");
      expect(useSpacecraftStore.getState().design.selectedLauncherId).toBe("launcher-vega-c");
    });
  });

  // ---------------------------------------------------------------------------
  // buildNormalizedPayload
  // ---------------------------------------------------------------------------
  describe("buildNormalizedPayload", () => {
    it("produces an isComplete=false payload for an empty design", () => {
      const payload = useSpacecraftStore.getState().buildNormalizedPayload();
      expect(payload.isComplete).toBe(false);
      expect(payload.componentIds).toHaveLength(0);
      expect(payload.orbitId).toBeNull();
      expect(payload.launcherId).toBeNull();
      expect(payload.summary.totalComponents).toBe(0);
      expect(payload.summary.categoriesPresent).toHaveLength(0);
      expect(payload.summary.missingRequiredCategories.length).toBeGreaterThan(0);
    });

    it("populates componentIds from selected components", () => {
      useSpacecraftStore.getState().addComponent("comp-bus-cubesat-3u");
      useSpacecraftStore.getState().addComponent("comp-pwr-solar-fixed-3u");
      const payload = useSpacecraftStore.getState().buildNormalizedPayload();
      expect(payload.componentIds).toContain("comp-bus-cubesat-3u");
      expect(payload.componentIds).toContain("comp-pwr-solar-fixed-3u");
      expect(payload.componentIds).toHaveLength(2);
    });

    it("reflects orbit and launcher selections in payload", () => {
      useSpacecraftStore.getState().setOrbit("orbit-leo-400");
      useSpacecraftStore.getState().setLauncher("launcher-electron");
      const payload = useSpacecraftStore.getState().buildNormalizedPayload();
      expect(payload.orbitId).toBe("orbit-leo-400");
      expect(payload.launcherId).toBe("launcher-electron");
    });

    it("produces isComplete=true when all required categories are present plus orbit and launcher", () => {
      useSpacecraftStore.getState().addComponent("comp-bus-cubesat-3u");       // structure
      useSpacecraftStore.getState().addComponent("comp-pwr-solar-fixed-3u");   // power
      useSpacecraftStore.getState().addComponent("comp-com-patch-antenna-uhf"); // communications
      useSpacecraftStore.getState().addComponent("comp-avi-onboard-computer");  // avionics
      useSpacecraftStore.getState().setOrbit("orbit-leo-400");
      useSpacecraftStore.getState().setLauncher("launcher-electron");

      const payload = useSpacecraftStore.getState().buildNormalizedPayload();
      expect(payload.isComplete).toBe(true);
      expect(payload.summary.missingRequiredCategories).toHaveLength(0);
    });

    it("isComplete=false when orbit is missing even if all required components are selected", () => {
      useSpacecraftStore.getState().addComponent("comp-bus-cubesat-3u");
      useSpacecraftStore.getState().addComponent("comp-pwr-solar-fixed-3u");
      useSpacecraftStore.getState().addComponent("comp-com-patch-antenna-uhf");
      useSpacecraftStore.getState().addComponent("comp-avi-onboard-computer");
      useSpacecraftStore.getState().setLauncher("launcher-electron");
      // No orbit set
      const payload = useSpacecraftStore.getState().buildNormalizedPayload();
      expect(payload.isComplete).toBe(false);
    });

    it("isComplete=false when launcher is missing even if all required components are selected", () => {
      useSpacecraftStore.getState().addComponent("comp-bus-cubesat-3u");
      useSpacecraftStore.getState().addComponent("comp-pwr-solar-fixed-3u");
      useSpacecraftStore.getState().addComponent("comp-com-patch-antenna-uhf");
      useSpacecraftStore.getState().addComponent("comp-avi-onboard-computer");
      useSpacecraftStore.getState().setOrbit("orbit-leo-400");
      // No launcher set
      const payload = useSpacecraftStore.getState().buildNormalizedPayload();
      expect(payload.isComplete).toBe(false);
    });

    it("summary.categoriesPresent lists correctly derived categories", () => {
      useSpacecraftStore.getState().addComponent("comp-bus-cubesat-3u");       // structure
      useSpacecraftStore.getState().addComponent("comp-pld-multispectral-imager"); // payload
      const payload = useSpacecraftStore.getState().buildNormalizedPayload();
      expect(payload.summary.categoriesPresent).toContain("structure");
      expect(payload.summary.categoriesPresent).toContain("payload");
      expect(payload.summary.categoriesPresent).not.toContain("propulsion");
    });

    it("designId in payload matches the design id in state", () => {
      const { id } = useSpacecraftStore.getState().design;
      const payload = useSpacecraftStore.getState().buildNormalizedPayload();
      expect(payload.designId).toBe(id);
    });
  });

  // ---------------------------------------------------------------------------
  // getDesign
  // ---------------------------------------------------------------------------
  describe("getDesign", () => {
    it("returns a snapshot of the current design", () => {
      useSpacecraftStore.getState().addComponent("comp-bus-cubesat-3u");
      const snap = useSpacecraftStore.getState().getDesign();
      expect(snap.selectedComponents).toHaveLength(1);
    });
  });
});
