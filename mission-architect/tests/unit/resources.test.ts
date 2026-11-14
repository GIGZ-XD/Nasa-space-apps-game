import assert from "node:assert/strict";
import { test } from "node:test";
import { calculateResources, DesignValidationError } from "../../apps/api/src/services/resource.service";

const sample = {
  componentIds: ["bus-basic", "solar-std", "battery-std", "comms-basic", "computer-std", "adcs-basic", "inst-optical"],
  orbitId: "orbit-leo",
  launchVehicleId: "launch-a",
};

// KNOWN SAMPLE for Sriganesh/Tanishka: mass 85 kg, draw 73 W, output 120 W, battery 200 Wh, 2 Mbps, cost 330,000 USD.
test("sample design totals are reproducible", () => {
  const { totals } = calculateResources(sample);
  assert.deepEqual(totals, {
    massKg: 85, powerDrawW: 73, powerOutputW: 120, batteryWh: 200,
    dataRateMbps: 2, launcherCapacityKg: 150, costUsd: 330_000,
  });
  assert.deepEqual(calculateResources(sample), calculateResources(sample));
});

test("breakdown has one line per component", () => {
  assert.equal(calculateResources(sample).lines.length, sample.componentIds.length);
});

test("unknown IDs are rejected and all reported", () => {
  assert.throws(() => calculateResources({ ...sample, componentIds: ["nope"], orbitId: "bad" }), (e: unknown) =>
    e instanceof DesignValidationError && e.problems.length === 2);
});

test("orbit/launcher in componentIds and wrong-category IDs are rejected", () => {
  assert.throws(() => calculateResources({ ...sample, componentIds: ["orbit-leo"] }), DesignValidationError);
  assert.throws(() => calculateResources({ ...sample, orbitId: "launch-a" }), DesignValidationError);
  assert.throws(() => calculateResources({ ...sample, launchVehicleId: "orbit-leo" }), DesignValidationError);
});

test("two parts of one category rejected; several instruments allowed", () => {
  assert.throws(() => calculateResources({ ...sample, componentIds: ["bus-basic", "bus-reinforced"] }), DesignValidationError);
  assert.doesNotThrow(() => calculateResources({ ...sample, componentIds: [...sample.componentIds, "inst-multispectral"] }));
});

test("client-supplied totals are ignored", () => {
  const withFake = { ...sample, totals: { massKg: 1 }, score: 100 } as typeof sample;
  assert.equal(calculateResources(withFake).totals.massKg, 85);
});
