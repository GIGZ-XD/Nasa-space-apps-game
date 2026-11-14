import assert from "node:assert/strict";
import { test } from "node:test";
import { assertValidConfig } from "../../apps/api/src/services/compatibility.service";
import { buildEvaluation } from "../../apps/api/src/services/evaluation.service";
import { scoreDesign } from "../../apps/api/src/services/scoring.service";
import { fixtureCatalogue as cat, fixtureComponents, withOverrides } from "../fixtures/catalogue";
import { fixtureFinance } from "../fixtures/finance";
import { fixtureConfig, goodDesign, withConfig } from "../fixtures/scoring";

const ev = (over: Partial<typeof goodDesign> = {}, config = fixtureConfig, catalogue = cat) =>
  buildEvaluation({ ...goodDesign, ...over }, { config, catalogue, finance: fixtureFinance });

const oneCategory = (suit: number) => withConfig({ "bus-basic": suit },
  [{ id: "only", label: "Only", weight: 100, memberCategories: ["structure"] }]);

test("ideal design scores 100 and succeeds", () => {
  const e = ev();
  assert.equal(e.score, 100);
  assert.equal(e.feasible, true);
  assert.equal(e.status, "success");
});

test("valid alternative (not exact ideal) still scores well", () => {
  const e = ev({ componentIds: ["bus-reinforced", ...goodDesign.componentIds.slice(1)] });
  assert.equal(e.score, 99.5); // subsystems (90+100+100+100)/4 = 97.5 -> 19.5 of 20
  assert.equal(e.status, "success");
});

test("weights apply: missing instrument loses its 25 points", () => {
  const e = ev({ componentIds: goodDesign.componentIds.filter((id) => id !== "inst-a") });
  assert.equal(e.score, 75);
  assert.equal(e.categoryScores.find((c) => c.category === "instruments")!.score, 0);
});

test("best instrument counts; a weaker extra does not lower the score", () => {
  assert.equal(ev({ componentIds: [...goodDesign.componentIds, "inst-b"] }).score, 100);
});

test("unlisted component has suitability 0", () => {
  const e = ev({}, withConfig({}, fixtureConfig.categories), cat);
  assert.equal(scoreDesign({ ...fixtureConfig, suitability: {} }, fixtureComponents).score, 0);
  assert.equal(e.score, 100);
});

test("boundary: 29.99 fails the score threshold", () => {
  const e = ev({ componentIds: ["bus-basic"] }, oneCategory(29.99));
  assert.equal(e.score, 29.99);
  assert.equal(e.status, "failed");
  assert.ok(e.feedback.some((f) => f.includes("below")));
});

test("boundary: exactly 30 passes the score threshold alone", () => {
  const cfg = { ...oneCategory(30), rules: { ...fixtureConfig.rules, mandatoryCategories: [] } };
  const e = ev({ componentIds: ["bus-basic"] }, cfg);
  assert.equal(e.score, 30);
  assert.equal(e.status, "success");
});

test("exactly 30 but infeasible still fails (feasibility is separate)", () => {
  const e = ev({ componentIds: ["bus-basic"] }, oneCategory(30)); // mandatory subsystems missing
  assert.equal(e.score, 30);
  assert.equal(e.feasible, false);
  assert.equal(e.status, "failed");
});

test("config with weights not summing to 100 is rejected", () => {
  assert.throws(() => assertValidConfig({ ...fixtureConfig, categories: fixtureConfig.categories.slice(1) }), /sum to/);
  assert.throws(() => assertValidConfig(withConfig({ "bus-basic": 101 })), /0\.\.100/);
});

test("evaluation is deterministic", () => {
  const a = ev(), b = ev();
  assert.deepEqual({ ...a, id: "" }, { ...b, id: "" });
});

test("response never exposes private scoring data", () => {
  const json = JSON.stringify(ev());
  assert.ok(!json.includes("suitability") && !json.includes("memberCategories"));
});

test("no scoring config -> SCORING_NOT_CONFIGURED (503)", () => {
  assert.throws(() => buildEvaluation({ ...goodDesign, missionId: "none" }, { catalogue: cat, finance: fixtureFinance }),
    (e: any) => e.status === 503 && e.code === "SCORING_NOT_CONFIGURED");
});

test("feasibility: mass over launcher capacity", () => {
  const e = ev({}, fixtureConfig, withOverrides({ "launch-x": { payloadCapacityKg: 80 } }));
  assert.equal(e.feasibilityChecks.find((c) => c.id === "mass")!.passed, false);
  assert.equal(e.status, "failed");
});

test("feasibility: not enough power (reserve counts)", () => {
  const low = ev({}, fixtureConfig, withOverrides({ "solar-std": { powerOutputW: 50 } }));
  assert.equal(low.feasibilityChecks.find((c) => c.id === "power")!.passed, false);
  // draw 73 W: 80 W is below 73*1.1=80.3, 81 W passes
  assert.equal(ev({}, fixtureConfig, withOverrides({ "solar-std": { powerOutputW: 80 } })).feasible, false);
  assert.equal(ev({}, fixtureConfig, withOverrides({ "solar-std": { powerOutputW: 81 } })).feasible, true);
});

test("feasibility: missing mandatory subsystem", () => {
  const e = ev({ componentIds: goodDesign.componentIds.filter((id) => id !== "adcs-basic") });
  const c = e.feasibilityChecks.find((x) => x.id === "mandatory")!;
  assert.equal(c.passed, false);
  assert.match(c.message, /adcs/);
});

test("feasibility: launcher cannot reach orbit", () => {
  const e = ev({ orbitId: "orbit-y" });
  assert.equal(e.feasibilityChecks.find((c) => c.id === "orbit-launcher")!.passed, false);
  assert.equal(e.status, "failed");
});

test("all feasibility problems are reported together", () => {
  const e = ev({ orbitId: "orbit-y", componentIds: ["bus-basic"] });
  // mandatory + orbit-launcher fail; power passes (0 W draw needs 0 W output)
  assert.deepEqual(e.feasibilityChecks.filter((c) => !c.passed).map((c) => c.id), ["mandatory", "orbit-launcher"]);
  assert.ok(e.feedback.length >= 2);
});

test("feasibility: orbit not allowed for the mission (when rules list allowed orbits)", () => {
  const cfg = { ...fixtureConfig, rules: { ...fixtureConfig.rules, allowedOrbitIds: ["orbit-y"] } };
  const e = ev({}, cfg);
  const c = e.feasibilityChecks.find((x) => x.id === "orbit-allowed")!;
  assert.equal(c.passed, false);
  assert.equal(e.status, "failed");
  assert.equal(ev({}, { ...fixtureConfig, rules: { ...fixtureConfig.rules, allowedOrbitIds: ["orbit-x"] } }).feasible, true);
  assert.equal(ev().feasibilityChecks.some((x) => x.id === "orbit-allowed"), false); // omitted when not configured
});

test("feasibility: battery must cover the orbit's eclipse (only when the orbit defines eclipseMinutes)", () => {
  // draw 73 W x 5 h = 365 Wh needed, battery is 200 Wh
  const long = ev({}, fixtureConfig, withOverrides({ "orbit-x": { eclipseMinutes: 300 } }));
  assert.equal(long.feasibilityChecks.find((c) => c.id === "battery")!.passed, false);
  // 73 W x 2 h = 146 Wh <= 200 Wh
  const short = ev({}, fixtureConfig, withOverrides({ "orbit-x": { eclipseMinutes: 120 } }));
  assert.equal(short.feasibilityChecks.find((c) => c.id === "battery")!.passed, true);
  assert.equal(ev().feasibilityChecks.some((c) => c.id === "battery"), false);
});

test("feasibility: comms must clear instrument data; budget is a hard check when configured", () => {
  const needy = ev({}, fixtureConfig, withOverrides({ "inst-a": { dataRateMbps: 5 } })); // antenna is 2 Mbps
  assert.equal(needy.feasibilityChecks.find((c) => c.id === "comms")!.passed, false);
  const cfg = { ...fixtureConfig, rules: { ...fixtureConfig.rules, budgetUsd: 300_000 } };
  const over = ev({}, cfg); // total cost 330,000
  assert.equal(over.feasibilityChecks.find((c) => c.id === "budget")!.passed, false);
  assert.equal(over.status, "failed");
  assert.equal(ev({}, { ...fixtureConfig, rules: { ...fixtureConfig.rules, budgetUsd: 330_000 } }).feasible, true);
});
