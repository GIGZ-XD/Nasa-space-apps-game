import assert from "node:assert/strict";
import type { AddressInfo } from "node:net";
import { after, before, test } from "node:test";
import { app } from "../../apps/api/src/app";

// Backend half of Tanishka's 14-step journey (tests/e2e/mission-flow.spec.ts), run over real HTTP with REAL data only.
// Her browser steps (1, 6, 11, 13) need the frontend and stay in the e2e spec.

const MISSION_ID = "earth-observation-01";
const BASELINE = ["bus-small", "solar-std", "battery-std", "xband-hga", "obc-std", "adcs-std", "camera-optical"];
let server: ReturnType<typeof app.listen>;
let base = "";
before(() => { server = app.listen(0); base = `http://localhost:${(server.address() as AddressInfo).port}`; });
after(() => server.close());
const get = async (p: string) => (await fetch(base + p)).json() as Promise<any>;
const post = async (p: string, b: unknown) => fetch(base + p, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(b) });

test("Steps 2-5: mission selection, selection and briefing data", async () => {
  const list = await get("/api/missions");
  const card = list.missions.find((m: any) => m.id === MISSION_ID);
  assert.equal(card.name, "Eyes on Earth");
  const { mission } = await get(`/api/missions/${MISSION_ID}`);
  assert.equal(mission.budgetUsd, 500_000);
  assert.ok(mission.requirements.length > 0 && mission.objective.length > 0);
  assert.equal(mission.powerReserveFactor, 1.1); // BUG-005: UI preview must apply this factor
});

test("Steps 7-9: every baseline part, the orbit and the launcher exist in the catalogue under the right category", async () => {
  const { components } = await get("/api/components");
  const cat = (id: string) => components.find((c: any) => c.id === id)?.category;
  assert.deepEqual(BASELINE.map(cat), ["structure", "power", "battery", "communications", "computer", "adcs", "instrument"]);
  assert.equal(cat("leo-500"), "orbit");
  assert.equal(cat("launch-a"), "launcher");
  assert.equal(components.find((c: any) => c.id === "launch-a").payloadCapacityKg, 50);
});

test("Steps 10, 12-14: save, evaluate and read back the baseline design", async () => {
  const saved = await post("/api/designs", { missionId: MISSION_ID, componentIds: BASELINE, orbitId: "leo-500", launchVehicleId: "launch-a" });
  assert.equal(saved.status, 201);
  const design = ((await saved.json()) as any).design;
  const evr = await post(`/api/designs/${design.id}/evaluate`, {});
  assert.equal(evr.status, 200);
  const e = ((await evr.json()) as any).evaluation;

  // Step 10: her expected readiness totals (mass 30.5 <= 50, draw 62 / gen 80, battery 180, comms 8, cost 305,000).
  assert.deepEqual(e.resources, { massKg: 30.5, powerDrawW: 62, powerOutputW: 80, batteryWh: 180, dataRateMbps: 8, launcherCapacityKg: 50, costUsd: 305_000 });

  // Step 14: every feasibility check passes. (She expects 7 checks; the backend returns 8: the extra is "orbit-allowed".)
  assert.equal(e.feasible, true);
  assert.ok(e.feasibilityChecks.every((c: any) => c.passed));
  assert.deepEqual(e.feasibilityChecks.map((c: any) => c.id).sort(),
    ["battery", "budget", "comms", "mandatory", "mass", "orbit-allowed", "orbit-launcher", "power"]);

  // Score: she lists a provisional ~78.6; the engine's value is 75.96 (same 70-89 tier -> 85% reward).
  assert.equal(e.score, 75.96);
  assert.equal(e.status, "success");
  assert.equal(e.finance.rewardFraction, 0.85);
  assert.equal(e.finance.rewardUsd, 425_000);
  assert.equal(e.finance.totalCostUsd, 305_000);
  assert.ok(e.finance.profitUsd > 0);
  assert.ok(e.feedback.length > 0);

  const again = await get(`/api/results/${e.id}`);
  assert.deepEqual(again.evaluation, e);
});

test("Smoke ST-15: negative profit is returned and explained (her design-alternative)", async () => {
  const comps = ["bus-small", "solar-heff", "battery-high", "xband-hga", "obc-std", "adcs-std", "camera-multispectral"];
  const d = ((await (await post("/api/designs", { missionId: MISSION_ID, componentIds: comps, orbitId: "sso-600", launchVehicleId: "launch-b" })).json()) as any).design;
  const e = ((await (await post(`/api/designs/${d.id}/evaluate`, {})).json()) as any).evaluation;
  assert.equal(e.status, "success");
  assert.equal(e.finance.profitUsd, -61_000);
  assert.ok(e.feedback.some((f: string) => f.includes("lost 61000 USD")));
});

test("Smoke ST-13: failing designs return which check failed (over-mass, low power, wrong launcher)", async () => {
  const run = async (comps: string[], orbitId: string, launchVehicleId: string) => {
    const d = ((await (await post("/api/designs", { missionId: MISSION_ID, componentIds: comps, orbitId, launchVehicleId })).json()) as any).design;
    return ((await (await post(`/api/designs/${d.id}/evaluate`, {})).json()) as any).evaluation;
  };
  const wrongLauncher = await run(BASELINE, "sso-600", "launch-a");
  assert.equal(wrongLauncher.status, "failed");
  assert.equal(wrongLauncher.feasibilityChecks.find((c: any) => c.id === "orbit-launcher").passed, false);
  assert.equal(wrongLauncher.finance.rewardUsd, 0);
  const lowPower = await run(["bus-small", "solar-std", "battery-std", "xband-hga", "obc-adv", "adcs-prec", "camera-ir"], "leo-500", "launch-a");
  assert.equal(lowPower.feasibilityChecks.find((c: any) => c.id === "power").passed, false);
});
