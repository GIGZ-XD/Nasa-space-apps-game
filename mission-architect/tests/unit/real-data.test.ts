import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { components } from "../../apps/api/src/data/mock";
import { parseComponents } from "../../apps/api/src/data/components-loader";
import { parseScoringData } from "../../apps/api/src/data/scoring-data-loader";
import { buildEvaluation } from "../../apps/api/src/services/evaluation.service";
import { calculateResources } from "../../apps/api/src/services/resource.service";

const raw = JSON.parse(readFileSync(new URL("../../apps/api/src/data/component-suitability.json", import.meta.url), "utf8"));
const refs = raw.referenceViableDesigns as Record<string, any>;
const FC = { "FC-1_completeness": "mandatory", "FC-2_mass": "mass", "FC-3_power": "power", "FC-4_battery": "battery",
  "FC-5_comms": "comms", "FC-6_orbit": "orbit-launcher", "FC-7_budget": "budget" } as const;

const toDesign = (r: any) => {
  const c = r.components;
  const ids = ["structure", "power", "battery", "communications", "computer", "adcs"].map((k) => c[k]).concat(c.instrument);
  const launcher = c.launcher ?? (c.orbit === "leo-500" ? "launch-a" : "launch-b");
  return { id: "d", createdAt: "", missionId: "earth-observation-01", componentIds: ids, orbitId: c.orbit, launchVehicleId: launcher };
};

for (const [name, ref] of Object.entries(refs).filter(([k]) => !k.startsWith("_"))) {
  test(`reference design "${name}": totals match Tanishka's hand-verified values`, () => {
    const { totals } = calculateResources(toDesign(ref));
    // Her docs list 44 and 49.5 kg for these two; summing her own component masses gives 48 and 50.5.
    const KNOWN_MASS_CORRECTIONS: Record<string, number> = { "balanced-sso": 48, "high-performance-sso": 50.5 };
    assert.equal(totals.massKg, KNOWN_MASS_CORRECTIONS[name] ?? ref.totals.massKg);
    // Likewise her powerDrawW for these two (85, 99) is 8 W too high; her own components sum to 77 and 91.
    const KNOWN_DRAW_CORRECTIONS: Record<string, number> = { "balanced-sso": 77, "high-performance-sso": 91 };
    assert.equal(totals.powerDrawW, KNOWN_DRAW_CORRECTIONS[name] ?? ref.totals.powerDrawW);
    assert.equal(totals.powerOutputW, ref.totals.powerOutputW);
    assert.equal(totals.batteryWh, ref.totals.capacityWh);
    // Her totalCostUsd for these two (502,000 / 562,000) is also wrong: her components sum to 534,000 / 582,000.
    const KNOWN_COST_CORRECTIONS: Record<string, number> = { "balanced-sso": 534_000, "high-performance-sso": 582_000 };
    assert.equal(totals.costUsd, KNOWN_COST_CORRECTIONS[name] ?? ref.totals.totalCostUsd);
  });

  test(`reference design "${name}": feasibility checks match her expectations`, () => {
    const e = buildEvaluation(toDesign(ref));
    for (const [fc, id] of Object.entries(FC)) {
      const expected = String(ref.feasibilityChecks[fc]).startsWith("PASS"); // MARGINAL (over budget) counts as a fail
      assert.equal(e.feasibilityChecks.find((c) => c.id === id)!.passed, expected, `${name} ${fc}`);
    }
  });
}

test("minimal-leo: feasible, scores 75.96, earns the 85% tier and a 120,000 USD profit", () => {
  const e = buildEvaluation(toDesign(refs["minimal-leo"]));
  assert.equal(e.feasible, true);
  assert.equal(e.score, 75.96);
  assert.equal(e.status, "success");
  assert.equal(e.finance.rewardUsd, 425_000);
  assert.equal(e.finance.totalCostUsd, 305_000);
  assert.equal(e.finance.profitUsd, 120_000);
});

test("over-budget reference designs fail (budget is a hard check) and lose money", () => {
  for (const n of ["balanced-sso", "high-performance-sso"]) {
    const e = buildEvaluation(toDesign(refs[n]));
    assert.equal(e.status, "failed", n);
    assert.equal(e.finance.rewardUsd, 0);
    assert.ok(e.finance.profitUsd < 0);
    assert.ok(e.feedback.some((f) => f.includes("exceeds the 500000 USD budget")));
  }
});

const base = toDesign(refs["minimal-leo"]);
const ev = (over: object) => buildEvaluation({ ...base, ...over });

test("uhf-patch cannot clear any instrument's data: comms check fails", () => {
  const e = ev({ componentIds: base.componentIds.map((i: string) => (i === "xband-hga" ? "uhf-patch" : i)) });
  assert.equal(e.feasibilityChecks.find((c) => c.id === "comms")!.passed, false);
  assert.equal(e.status, "failed");
});

test("adcs-std with the IR imager is capped at 20 (precision pointing needed)", () => {
  const withStd = ev({ componentIds: base.componentIds.map((i: string) => (i === "camera-optical" ? "camera-ir" : i)) });
  const withPrec = ev({ componentIds: base.componentIds.map((i: string) => (i === "camera-optical" ? "camera-ir" : i === "adcs-std" ? "adcs-prec" : i)) });
  const sub = (e: any) => e.categoryScores.find((c: any) => c.category === "structure").score;
  assert.equal(sub(withStd), Math.round(((85 + 75 + 20) / 3) * 100) / 100);
  assert.equal(sub(withPrec), Math.round(((85 + 75 + 95) / 3) * 100) / 100);
});

test("instrument combination bonus applies and is capped at 100", () => {
  const ins = (e: any) => e.categoryScores.find((c: any) => c.category === "instruments").score;
  const two = ev({ componentIds: [...base.componentIds, "camera-multispectral"] });
  assert.equal(ins(two), 100); // best 90 + 10 (optical+multispectral)
  const opt = ev({});
  assert.equal(ins(opt), 70);
  const all3 = ev({ componentIds: [...base.componentIds, "camera-multispectral", "camera-ir"] });
  assert.equal(ins(all3), 100); // 90 + 15 capped
});

test("launch-a cannot reach sso-600 -> infeasible", () => {
  const e = ev({ orbitId: "sso-600" });
  assert.equal(e.feasibilityChecks.find((c) => c.id === "orbit-launcher")!.passed, false);
});

test("scoring data integrity: weights sum to 100, every component scored", () => {
  const d = parseScoringData(raw, components);
  assert.equal(d.categories.reduce((a, c) => a + c.weight, 0), 100);
  assert.equal(Object.keys(d.suitability).length, components.length);
});

test("bad catalogue / scoring data fail loudly", () => {
  const ok = JSON.parse(JSON.stringify(components));
  assert.throws(() => parseComponents([...ok, ok[0]]), /Duplicate/);
  assert.throws(() => parseComponents(ok.map((c: any) => (c.id === "launch-a" ? { ...c, supportedOrbitIds: ["nowhere"] } : c))), /unknown orbit/);
  assert.throws(() => parseComponents(ok.map((c: any, i: number) => (i === 0 ? { ...c, category: "avionics" } : c))));
  assert.throws(() => parseComponents(ok.map((c: any, i: number) => (i === 0 ? { ...c, hidden: 1 } : c))));
  assert.throws(() => parseScoringData(raw, components.slice(1)), /unknown components/);
  assert.throws(() => parseScoringData({ ...raw, categoryWeights: { ...raw.categoryWeights, power: 99 } }, components), /sum to/);
});

test("a budget-friendly SSO design passes everything (415,000 USD)", () => {
  const e = ev({ orbitId: "sso-600", launchVehicleId: "launch-b" });
  assert.equal(e.resources.costUsd, 415_000);
  assert.equal(e.feasible, true);
  assert.equal(e.status, "success");
  // Her tip "swap bus-medium for bus-small => 472,000 (clean pass)" is wrong: balanced-sso with bus-small is 504,000, still over budget.
  const tip = buildEvaluation({ ...toDesign(refs["balanced-sso"]), componentIds: toDesign(refs["balanced-sso"]).componentIds.map((i: string) => (i === "bus-medium" ? "bus-small" : i)) });
  assert.equal(tip.resources.costUsd, 504_000);
  assert.equal(tip.feasibilityChecks.find((c) => c.id === "budget")!.passed, false);
});
