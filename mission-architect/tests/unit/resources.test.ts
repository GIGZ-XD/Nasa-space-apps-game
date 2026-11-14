import assert from "node:assert/strict";
import { test } from "node:test";
import { calculateResources, DesignValidationError } from "../../apps/api/src/services/resource.service";
import { fixtureCatalogue as cat } from "../fixtures/catalogue";

const sample = {
  componentIds: ["bus-basic", "solar-std", "battery-std", "comms-basic", "computer-std", "adcs-basic", "inst-a"],
  orbitId: "orbit-x",
  launchVehicleId: "launch-x",
};
const calc = (d: typeof sample) => calculateResources(d, cat);

test("sample design totals are reproducible", () => {
  assert.deepEqual(calc(sample).totals, {
    massKg: 85, powerDrawW: 73, powerOutputW: 120, batteryWh: 200,
    dataRateMbps: 2, launcherCapacityKg: 150, costUsd: 330_000,
  });
  assert.deepEqual(calc(sample), calc(sample));
});

test("breakdown has one line per component", () => {
  assert.equal(calc(sample).lines.length, sample.componentIds.length);
});

test("unknown IDs are rejected and all reported", () => {
  assert.throws(() => calc({ ...sample, componentIds: ["nope"], orbitId: "bad" }), (e: unknown) =>
    e instanceof DesignValidationError && e.problems.length === 2);
});

test("orbit/launcher in componentIds and wrong-category IDs are rejected", () => {
  assert.throws(() => calc({ ...sample, componentIds: ["orbit-x"] }), DesignValidationError);
  assert.throws(() => calc({ ...sample, orbitId: "launch-x" }), DesignValidationError);
  assert.throws(() => calc({ ...sample, launchVehicleId: "orbit-x" }), DesignValidationError);
});

test("two parts of one category rejected; several instruments allowed", () => {
  assert.throws(() => calc({ ...sample, componentIds: ["bus-basic", "bus-reinforced"] }), DesignValidationError);
  const two = calc({ ...sample, componentIds: [...sample.componentIds, "inst-b"] });
  assert.equal(two.totals.massKg, 107);
});

test("client-supplied totals are ignored", () => {
  const withFake = { ...sample, totals: { massKg: 1 }, score: 100 } as typeof sample;
  assert.equal(calc(withFake).totals.massKg, 85);
});

test("design with missing categories still totals (completeness is a Phase 3 feasibility check)", () => {
  const t = calc({ ...sample, componentIds: ["bus-basic"] }).totals;
  assert.equal(t.massKg, 40);
  assert.equal(t.powerOutputW, 0);
});
