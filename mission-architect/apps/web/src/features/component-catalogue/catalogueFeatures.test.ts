import { describe, it, expect } from "vitest";
import { localCatalogueAdapter, PROVISIONAL_COMPONENTS, PROVISIONAL_ORBITS, PROVISIONAL_LAUNCHERS } from "./componentData";
import type { ComponentCategory, Component } from "./component.types";

describe("Catalogue Features & Search/Sort Logic", () => {
  const allComponents = localCatalogueAdapter.getComponents();

  // -------------------------------------------------------------------------
  // 1. Data Integrity & Categories
  // -------------------------------------------------------------------------
  it("provides components covering all 7 standard aerospace categories", () => {
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
      const inCat = localCatalogueAdapter.getComponentsByCategory(cat);
      expect(inCat.length).toBeGreaterThanOrEqual(2);
    }
  });

  // -------------------------------------------------------------------------
  // 2. Search Filter Logic
  // -------------------------------------------------------------------------
  describe("search filtering", () => {
    function filterComponents(query: string, category: "all" | ComponentCategory = "all"): Component[] {
      let result = allComponents;
      if (category !== "all") {
        result = result.filter((c) => c.category === category);
      }
      if (query.trim()) {
        const q = query.toLowerCase().trim();
        result = result.filter((c) => {
          const inName = c.name.toLowerCase().includes(q);
          const inDesc = c.description.toLowerCase().includes(q);
          const inCat = c.category.toLowerCase().includes(q);
          const inForm = c.specs?.formFactor?.toLowerCase().includes(q);
          return inName || inDesc || inCat || inForm;
        });
      }
      return result;
    }

    it("returns all components when search query is empty", () => {
      const results = filterComponents("");
      expect(results.length).toBe(allComponents.length);
    });

    it("filters components by name case-insensitively", () => {
      const results = filterComponents("solar");
      expect(results.length).toBeGreaterThanOrEqual(2);
      expect(results.every((c) => c.name.toLowerCase().includes("solar") || c.description.toLowerCase().includes("solar"))).toBe(true);
    });

    it("filters components by category keywords", () => {
      const results = filterComponents("propulsion");
      expect(results.length).toBe(3);
      expect(results.every((c) => c.category === "propulsion")).toBe(true);
    });

    it("filters components by formFactor spec", () => {
      const results = filterComponents("ESPA");
      expect(results.some((c) => c.id === "comp-bus-smallsat-espahigh")).toBe(true);
    });

    it("returns empty array when query does not match any component", () => {
      const results = filterComponents("warp-drive-antimatter-core");
      expect(results.length).toBe(0);
    });

    it("respects category filter combined with search query", () => {
      const results = filterComponents("imager", "payload");
      expect(results.length).toBe(1);
      expect(results[0].id).toBe("comp-pld-multispectral-imager");
    });
  });

  // -------------------------------------------------------------------------
  // 3. Sorting Logic
  // -------------------------------------------------------------------------
  describe("sorting logic", () => {
    it("sorts by mass ascending (lowest mass first)", () => {
      const sorted = [...allComponents].sort((a, b) => a.massKg - b.massKg);
      expect(sorted[0].massKg).toBeLessThanOrEqual(sorted[1].massKg);
      expect(sorted[0].massKg).toBeLessThanOrEqual(sorted[sorted.length - 1].massKg);
      expect(sorted[0].id).toBe("comp-pwr-solar-fixed-3u"); // 0.4 kg
    });

    it("sorts by mass descending (heaviest first)", () => {
      const sorted = [...allComponents].sort((a, b) => b.massKg - a.massKg);
      expect(sorted[0].massKg).toBeGreaterThanOrEqual(sorted[1].massKg);
      expect(sorted[0].id).toBe("comp-bus-smallsat-espahigh"); // 45 kg
    });

    it("sorts by cost ascending (cheapest first)", () => {
      const sorted = [...allComponents].sort((a, b) => a.costCredits - b.costCredits);
      expect(sorted[0].costCredits).toBeLessThanOrEqual(sorted[1].costCredits);
      expect(sorted[0].id).toBe("comp-thm-passive-mli"); // 3500 credits
    });

    it("sorts by power generation (highest generating first)", () => {
      const sorted = [...allComponents].sort((a, b) => a.powerWatts - b.powerWatts);
      expect(sorted[0].powerWatts).toBe(-100); // Deployable solar array
      expect(sorted[1].powerWatts).toBe(-24);  // Fixed solar panels
    });
  });

  // -------------------------------------------------------------------------
  // 4. Comparison Differential Calculations
  // -------------------------------------------------------------------------
  describe("comparison differential calculations", () => {
    it("accurately identifies extremes among propulsion components", () => {
      const propulsionComps = localCatalogueAdapter.getComponentsByCategory("propulsion");
      expect(propulsionComps.length).toBe(3);

      const minMass = Math.min(...propulsionComps.map((c) => c.massKg));
      const minCost = Math.min(...propulsionComps.map((c) => c.costCredits));
      const maxThrust = Math.max(...propulsionComps.map((c) => c.specs?.thrustN ?? 0));
      const maxIsp = Math.max(...propulsionComps.map((c) => c.specs?.ispSeconds ?? 0));

      expect(minMass).toBe(3.2);       // Cold gas
      expect(minCost).toBe(22000);     // Cold gas
      expect(maxThrust).toBe(20.0);    // Monopropellant Hydrazine
      expect(maxIsp).toBe(1650);       // Hall-effect Ion Thruster
    });

    it("accurately computes differential delta values", () => {
      const comps = localCatalogueAdapter.getComponentsByCategory("structure");
      const cubesat = comps.find((c) => c.id === "comp-bus-cubesat-3u")!;
      const espahigh = comps.find((c) => c.id === "comp-bus-smallsat-espahigh")!;

      const massDelta = espahigh.massKg - cubesat.massKg;
      const costDelta = espahigh.costCredits - cubesat.costCredits;

      expect(massDelta).toBe(43.5);
      expect(costDelta).toBe(75000);
    });

    it("accurately contrasts communication data rates", () => {
      const patch = localCatalogueAdapter.getComponentById("comp-com-patch-antenna-uhf")!;
      const dish = localCatalogueAdapter.getComponentById("comp-com-xband-dish")!;

      const bandwidthRatio = (dish.specs?.dataRateKbps ?? 0) / (patch.specs?.dataRateKbps ?? 1);
      expect(bandwidthRatio).toBe(62.5); // 8000 kbps vs 128 kbps
    });
  });

  // -------------------------------------------------------------------------
  // 5. Readiness & Completeness Calculation
  // -------------------------------------------------------------------------
  describe("subsystem readiness criteria calculation", () => {
    const REQUIRED_CATEGORIES: ComponentCategory[] = [
      "structure",
      "power",
      "communications",
      "avionics",
    ];

    function calculateReadiness(
      selectedComponentCategories: ComponentCategory[],
      selectedOrbitId: string | null,
      selectedLauncherId: string | null,
    ) {
      const present = new Set(selectedComponentCategories);
      const subMet = REQUIRED_CATEGORIES.filter((c) => present.has(c)).length;
      const orbMet = selectedOrbitId !== null ? 1 : 0;
      const lnchMet = selectedLauncherId !== null ? 1 : 0;
      const totalMet = subMet + orbMet + lnchMet;
      const totalRequired = REQUIRED_CATEGORIES.length + 2; // 6
      return {
        ratio: totalMet / totalRequired,
        percentage: Math.round((totalMet / totalRequired) * 100),
        isFlightReady: totalMet === totalRequired,
      };
    }

    it("reports 0% readiness when nothing is selected", () => {
      const r = calculateReadiness([], null, null);
      expect(r.percentage).toBe(0);
      expect(r.isFlightReady).toBe(false);
    });

    it("reports partial readiness when components are selected without orbit or launcher", () => {
      const r = calculateReadiness(["structure", "power"], null, null);
      expect(r.percentage).toBe(33); // 2 of 6 = 33%
      expect(r.isFlightReady).toBe(false);
    });

    it("reports 67% readiness when all 4 required subsystems are selected but orbit & launcher are missing", () => {
      const r = calculateReadiness(["structure", "power", "communications", "avionics"], null, null);
      expect(r.percentage).toBe(67); // 4 of 6 = 67%
      expect(r.isFlightReady).toBe(false);
    });

    it("reports 100% readiness and flight ready when all 4 subsystems, orbit, and launcher are selected", () => {
      const r = calculateReadiness(
        ["structure", "power", "communications", "avionics"],
        "orbit-leo-400",
        "launcher-electron",
      );
      expect(r.percentage).toBe(100);
      expect(r.isFlightReady).toBe(true);
    });
  });
});
