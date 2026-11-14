import assert from "node:assert/strict";
import { test } from "node:test";
import { buildEvaluation, evaluateDesign, getResult } from "../../apps/api/src/services/evaluation.service";
import { calculateFinance, rewardFractionFor } from "../../apps/api/src/services/finance.service";
import { fixtureCatalogue as cat, fixtureComponents, withOverrides } from "../fixtures/catalogue";
import { fixtureFinance } from "../fixtures/finance";
import { fixtureConfig, goodDesign, withConfig } from "../fixtures/scoring";

const ev = (over = {}, config = fixtureConfig, catalogue = cat, finance = fixtureFinance) =>
  buildEvaluation({ ...goodDesign, ...over }, { config, catalogue, finance });

test("reward tiers at and around boundaries", () => {
  for (const [score, f] of [[100, 1], [90, 1], [89.99, 0.85], [70, 0.85], [69.99, 0.6], [50, 0.6], [49.99, 0.3], [30, 0.3], [29.99, 0]] as const)
    assert.equal(rewardFractionFor(score), f, `score ${score}`);
});

test("positive outcome: reward - cost", () => {
  // components 330,000 - 150,000 launcher - 0 orbit = 180,000; + launch 150,000 + ops 20,000 = 350,000
  const f = ev().finance;
  assert.deepEqual(f.costBreakdown, { componentsUsd: 180_000, orbitUsd: 0, launchUsd: 150_000, operationsUsd: 20_000 });
  assert.equal(f.totalCostUsd, 350_000);
  assert.equal(f.rewardUsd, 500_000);
  assert.equal(f.profitUsd, 150_000);
  assert.equal(f.rewardFraction, 1);
});

test("infeasible design earns no reward despite a 75 score", () => {
  const e = ev({ componentIds: goodDesign.componentIds.filter((id) => id !== "inst-a") }, withConfig({}, fixtureConfig.categories),
    cat, { ...fixtureFinance }); // missing instrument -> score 75, but also infeasible (mandatory)
  assert.equal(e.score, 75);
  assert.equal(e.status, "failed"); // mandatory missing
  assert.equal(e.finance.rewardUsd, 0);
});

test("feasible 75-score design earns the 85% tier", () => {
  const cfg = { ...fixtureConfig, rules: { ...fixtureConfig.rules, mandatoryCategories: [] as never[] } };
  const e = ev({ componentIds: goodDesign.componentIds.filter((id) => id !== "inst-a") }, cfg);
  assert.equal(e.score, 75);
  assert.equal(e.status, "success");
  assert.equal(e.finance.rewardFraction, 0.85);
  assert.equal(e.finance.rewardUsd, 425_000);
});

test("negative profit (loss) is retained", () => {
  const e = ev({}, fixtureConfig, cat, { ...fixtureFinance, baseRewardUsd: 100_000 });
  assert.equal(e.status, "success");
  assert.equal(e.finance.profitUsd, 100_000 - 350_000);
  assert.ok(e.feedback.some((f) => f.includes("lost")));
});

test("failed mission: no reward but costs still incurred", () => {
  const e = ev({}, fixtureConfig, withOverrides({ "launch-x": { payloadCapacityKg: 80 } }));
  assert.equal(e.status, "failed");
  assert.equal(e.finance.rewardUsd, 0);
  assert.equal(e.finance.rewardFraction, 0);
  assert.equal(e.finance.profitUsd, -350_000);
});

test("failed on score below 30 earns nothing even if feasible", () => {
  const cfg = { ...withConfig({ "bus-basic": 29.99 }, [{ id: "only", label: "Only", weight: 100, memberCategories: ["structure"] }]),
    rules: { ...fixtureConfig.rules, mandatoryCategories: [] as never[] } };
  const e = ev({ componentIds: ["bus-basic"] }, cfg);
  assert.equal(e.status, "failed");
  assert.equal(e.finance.rewardUsd, 0);
  assert.equal(e.finance.profitUsd, -(30_000 + 150_000 + 20_000));
});

test("custom tiers override defaults; values are whole dollars", () => {
  const f = calculateFinance({ ...fixtureFinance, baseRewardUsd: 1000.4, tiers: [{ minScore: 0, fraction: 0.333 }] }, true, 10,
    [fixtureComponents[0]], fixtureComponents.find((c) => c.id === "orbit-x")!, fixtureComponents.find((c) => c.id === "launch-x")!);
  assert.equal(f.rewardUsd, 333);
  assert.ok(Number.isInteger(f.profitUsd));
});

test("no finance config -> FINANCE_NOT_CONFIGURED (503)", () => {
  assert.throws(() => buildEvaluation(goodDesign, { config: fixtureConfig, catalogue: cat }),
    (e: any) => e.status === 503 && e.code === "FINANCE_NOT_CONFIGURED");
});

test("persisted result can be retrieved by id", () => {
  const e = evaluateDesign(goodDesign, { config: fixtureConfig, catalogue: cat, finance: fixtureFinance });
  assert.deepEqual(getResult(e.id), e);
  assert.equal(getResult("missing"), undefined);
});
