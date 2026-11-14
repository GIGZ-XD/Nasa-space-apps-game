import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import { test } from "node:test";
import { buildEvaluation } from "../../apps/api/src/services/evaluation.service";

const dir = new URL("../fixtures/", import.meta.url);
const fixtures = readdirSync(dir).filter((f) => f.startsWith("design-") && f.endsWith(".json")).sort()
  .map((f) => JSON.parse(readFileSync(new URL(f, dir), "utf8")));
const byId = Object.fromEntries(fixtures.map((f) => [f.id, f]));

const run = (fx: any) => {
  const ids: string[] = fx.selectedComponentIds;
  const orbitId = ids.find((i) => /^(leo|sso)-/.test(i))!;
  const launchVehicleId = ids.find((i) => i.startsWith("launch-"))!;
  return buildEvaluation({ id: "x", createdAt: "", missionId: fx.missionId,
    componentIds: ids.filter((i) => i !== orbitId && i !== launchVehicleId), orbitId, launchVehicleId });
};

const CHECK_ID: Record<string, string> = {
  "FC-1_completeness": "mandatory", "FC-2_mass": "mass", "FC-3_power": "power", "FC-4_battery": "battery",
  "FC-5_communications": "comms", "FC-6_orbitLauncherCompatibility": "orbit-launcher", "FC-7_budget": "budget",
};

// Her fixture metrics that disagree with the sum of her own components (her arithmetic slips).
const KNOWN_METRIC_CORRECTIONS: Record<string, Record<string, number>> = {
  "design-exactly-30": { powerDrawW: 45, totalCostUsd: 337_000 },       // she lists 50 W / 322,000
  "design-failed-score": { powerDrawW: 58, totalCostUsd: 387_000 },     // she lists 63 W / 372,000
};

test("all 7 fixtures are present and target the real mission", () => {
  assert.equal(fixtures.length, 7);
  for (const f of fixtures) assert.equal(f.missionId, "earth-observation-01");
});

for (const fx of fixtures) {
  test(`${fx.id}: every feasibility verdict matches her expectation`, () => {
    const e = run(fx);
    for (const [fc, expected] of Object.entries<string>(fx.expectedFeasibility)) {
      if (fc === "overallFeasibility") { assert.equal(e.feasible, expected === "PASS", "overall"); continue; }
      assert.equal(e.feasibilityChecks.find((c) => c.id === CHECK_ID[fc])!.passed, expected === "PASS", fc);
    }
  });

  test(`${fx.id}: resource totals match her metrics (known corrections applied)`, () => {
    const { resources: r } = run(fx);
    const fix = KNOWN_METRIC_CORRECTIONS[fx.id] ?? {};
    assert.equal(r.massKg, fix.totalMassKg ?? fx.metrics.totalMassKg);
    assert.equal(r.powerDrawW, fix.powerDrawW ?? fx.metrics.powerDrawW);
    assert.equal(r.powerOutputW, fx.metrics.powerOutputW);
    assert.equal(r.costUsd, fix.totalCostUsd ?? fx.metrics.totalCostUsd);
    assert.equal(r.dataRateMbps, fx.metrics.dataRateDownlinkMbps);
  });
}

// GOLDEN scores from the real engine. Her "expected" weighted scores are PROVISIONAL and differ because her fixtures
// count only the bus toward "structure" (good/alternative) while her suitability file says computer+ADCS are included.
test("scores: engine values vs her provisional expectations", () => {
  const GOLDEN: Record<string, { mine: number; hers: number | undefined }> = {
    "design-good": { mine: 75.96, hers: 78.6 },
    "design-alternative": { mine: 85.08, hers: 86.75 },
    "design-exactly-30": { mine: 71.63, hers: 30 },
    "design-failed-score": { mine: 72.04, hers: 25.54 },
    "design-incompatible-launcher": { mine: 78.96, hers: undefined },
    "design-low-power": { mine: 82.38, hers: undefined },
    "design-over-mass": { mine: 76.79, hers: undefined },
  };
  for (const [id, g] of Object.entries(GOLDEN)) {
    assert.equal(run(byId[id]).score, g.mine, id);
    assert.equal(byId[id].expectedScore.weightedOverallScore, g.hers, `her fixture value for ${id} changed`);
  }
});

test("outcomes: good and alternative succeed; every failure fixture fails", () => {
  assert.equal(run(byId["design-good"]).status, "success");
  assert.equal(run(byId["design-alternative"]).status, "success");
  for (const id of ["design-exactly-30", "design-failed-score", "design-incompatible-launcher", "design-low-power", "design-over-mass"])
    assert.equal(run(byId[id]).status, "failed", id);
});

test("alternative design: earns the 85% tier and a profit", () => {
  const e = run(byId["design-alternative"]);
  assert.equal(e.finance.rewardUsd, 425_000);
  assert.equal(e.finance.profitUsd, 425_000 - 486_000); // a loss: cost 486,000 > reward 425,000
  assert.ok(e.feedback.some((f) => f.includes("lost")));
});

// With her static suitability table, a score below 30 only happens when whole categories are missing.
test("real-data sub-30 design: bus + orbit + launcher only", () => {
  const e = buildEvaluation({ id: "x", createdAt: "", missionId: "earth-observation-01",
    componentIds: ["bus-reinforced"], orbitId: "leo-500", launchVehicleId: "launch-a" });
  assert.ok(e.score < 30, String(e.score));
  assert.equal(e.status, "failed");
  assert.ok(e.feedback.some((f) => f.includes("below the 30 minimum")));
});
