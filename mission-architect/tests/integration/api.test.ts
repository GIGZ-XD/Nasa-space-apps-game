import assert from "node:assert/strict";
import type { AddressInfo } from "node:net";
import { after, before, test } from "node:test";
import { app } from "../../apps/api/src/app";
import { components, missions } from "../../apps/api/src/data/mock";
import { financeConfigs } from "../../apps/api/src/data/finance-config";
import { missionRules } from "../../apps/api/src/data/mission-rules";
import { componentSuitability } from "../../apps/api/src/data/component-suitability";
import { scoringWeights } from "../../apps/api/src/data/scoring-weights";
import { fixtureComponents } from "../fixtures/catalogue";
import { fixtureFinance } from "../fixtures/finance";
import { fixtureConfig, goodDesign } from "../fixtures/scoring";

let server: ReturnType<typeof app.listen>;
let base = "";

before(() => {
  // Populate the (normally empty) server data with TEST-ONLY fixtures.
  components.push(...fixtureComponents);
  for (const id of ["test-mission", "bare-mission"])
    missions.push({ id, name: id, objective: "t", difficulty: "easy", budgetUsd: 500_000, requirements: [],
      mandatoryCategories: fixtureConfig.rules.mandatoryCategories, powerReserveFactor: 1.1, allowedOrbitIds: ["orbit-x"], lifetimeMonths: 12 });
  missionRules["test-mission"] = fixtureConfig.rules;
  scoringWeights["test-mission"] = fixtureConfig.categories;
  componentSuitability["test-mission"] = fixtureConfig.suitability;
  financeConfigs["test-mission"] = fixtureFinance;
  server = app.listen(0);
  base = `http://localhost:${(server.address() as AddressInfo).port}`;
});
after(() => server.close());

const post = (path: string, body: unknown, raw = false) =>
  fetch(base + path, { method: "POST", headers: { "content-type": "application/json" }, body: raw ? (body as string) : JSON.stringify(body) });
const valid = { missionId: "test-mission", componentIds: goodDesign.componentIds, orbitId: "orbit-x", launchVehicleId: "launch-x" };
const errCode = async (r: Response) => ((await r.json()) as any).error.code;

test("health", async () => {
  const r = await fetch(base + "/health");
  assert.equal(r.status, 200);
  assert.equal(r.headers.get("x-powered-by"), null);
});

test("public endpoints never leak private scoring/finance data", async () => {
  const text = (await (await fetch(base + "/api/missions")).text()) + (await (await fetch(base + "/api/components")).text())
    + (await (await fetch(base + "/api/missions/test-mission")).text());
  for (const secret of ["suitability", "memberCategories", "baseRewardUsd", "operationsCostUsd"])
    assert.ok(!text.includes(secret), secret);
});

test("components category filter", async () => {
  const j: any = await (await fetch(base + "/api/components?category=launcher")).json();
  assert.ok(j.components.length > 0 && j.components.every((c: any) => c.category === "launcher"));
});

test("full flow: save -> evaluate -> fetch result", async () => {
  const saved = await post("/api/designs", valid);
  assert.equal(saved.status, 201);
  const design = ((await saved.json()) as any).design;
  const evr = await post(`/api/designs/${design.id}/evaluate`, {});
  assert.equal(evr.status, 200);
  const e = ((await evr.json()) as any).evaluation;
  assert.equal(e.score, 100);
  assert.equal(e.status, "success");
  assert.equal(e.finance.profitUsd, 150_000);
  assert.equal(e.mock, false);
  const got: any = await (await fetch(`${base}/api/results/${e.id}`)).json();
  assert.deepEqual(got.evaluation, e);
});

test("evaluating twice is deterministic with distinct result IDs", async () => {
  const d = ((await (await post("/api/designs", valid)).json()) as any).design;
  const a = ((await (await post(`/api/designs/${d.id}/evaluate`, {})).json()) as any).evaluation;
  const b = ((await (await post(`/api/designs/${d.id}/evaluate`, {})).json()) as any).evaluation;
  assert.notEqual(a.id, b.id);
  assert.deepEqual({ ...a, id: "" }, { ...b, id: "" });
});

test("incomplete design is accepted and evaluates as failed with reasons", async () => {
  const d = ((await (await post("/api/designs", { ...valid, componentIds: ["bus-basic"] })).json()) as any).design;
  const e = ((await (await post(`/api/designs/${d.id}/evaluate`, {})).json()) as any).evaluation;
  assert.equal(e.status, "failed");
  assert.equal(e.feasibilityChecks.find((c: any) => c.id === "mandatory").passed, false);
  assert.equal(e.finance.rewardUsd, 0);
});

test("malformed JSON -> 400 BAD_JSON", async () => {
  const r = await post("/api/designs", "{bad", true);
  assert.equal(r.status, 400);
  assert.equal(await errCode(r), "BAD_JSON");
});

test("missing / empty / duplicate / wrong-type / extra fields -> 400 VALIDATION_ERROR", async () => {
  const bad: unknown[] = [
    {}, null, [], "text", 42,
    { ...valid, componentIds: [] },
    { ...valid, componentIds: ["bus-basic", "bus-basic"] },
    { ...valid, componentIds: "bus-basic" },
    { ...valid, componentIds: [123] },
    { ...valid, orbitId: undefined },
    { ...valid, launchVehicleId: "   " },
    { ...valid, name: "" },
    { ...valid, totals: { massKg: 1 }, score: 100 },   // client-calculated values rejected
    { ...valid, componentIds: Array.from({ length: 31 }, (_, i) => `c${i}`) },
    { ...valid, missionId: "x".repeat(65) },
  ];
  for (const b of bad) {
    const r = await post("/api/designs", b);
    assert.equal(r.status, 400, JSON.stringify(b)?.slice(0, 60));
    // Bare null/string/number bodies are rejected by the strict JSON parser before validation.
    assert.ok(["VALIDATION_ERROR", "BAD_JSON"].includes(await errCode(r)));
  }
});

test("non-JSON content type -> 400 VALIDATION_ERROR", async () => {
  const r = await fetch(base + "/api/designs", { method: "POST", headers: { "content-type": "text/plain" }, body: "hi" });
  assert.equal(r.status, 400);
});

test("oversized body -> 413", async () => {
  const r = await post("/api/designs", { ...valid, name: "x".repeat(200_000) });
  assert.equal(r.status, 413);
  assert.equal(await errCode(r), "PAYLOAD_TOO_LARGE");
});

test("unknown IDs and bad selections -> 400 INVALID_DESIGN", async () => {
  const cases = [
    { ...valid, componentIds: ["ghost"] },
    { ...valid, orbitId: "ghost" },
    { ...valid, componentIds: ["orbit-x"] },
    { ...valid, orbitId: "launch-x" },
    { ...valid, componentIds: ["bus-basic", "bus-reinforced"] },
  ];
  for (const c of cases) {
    const r = await post("/api/designs", c);
    assert.equal(r.status, 400);
    assert.equal(await errCode(r), "INVALID_DESIGN");
  }
});

test("unknown mission (incl. prototype-ish IDs) -> 404 MISSION_NOT_FOUND", async () => {
  for (const missionId of ["nope", "__proto__", "constructor"]) {
    const r = await post("/api/designs", { ...valid, missionId });
    assert.equal(r.status, 404, missionId);
    assert.equal(await errCode(r), "MISSION_NOT_FOUND");
  }
  assert.equal((await fetch(base + "/api/missions/__proto__")).status, 404);
});

test("404s for unknown design, result and route", async () => {
  assert.equal(await errCode(await post("/api/designs/nope/evaluate", {})), "DESIGN_NOT_FOUND");
  assert.equal(await errCode(await fetch(base + "/api/results/nope")), "RESULT_NOT_FOUND");
  assert.equal(await errCode(await fetch(base + "/api/nothing")), "NOT_FOUND");
});

test("mission without server config -> 503 SCORING_NOT_CONFIGURED", async () => {
  const d = ((await (await post("/api/designs", { ...valid, missionId: "bare-mission" })).json()) as any).design;
  const r = await post(`/api/designs/${d.id}/evaluate`, {});
  assert.equal(r.status, 503);
  assert.equal(await errCode(r), "SCORING_NOT_CONFIGURED");
});

test("Tanishka's real mission is served with all agreed fields", async () => {
  const j: any = await (await fetch(base + "/api/missions/earth-observation-01")).json();
  assert.equal(j.mission.name, "Eyes on Earth");
  assert.equal(j.mission.budgetUsd, 500_000);
  assert.deepEqual(j.mission.allowedOrbitIds, ["leo-500", "sso-600"]);
  assert.equal(j.mission.powerReserveFactor, 1.1);
  assert.equal(j.mission.mandatoryCategories.length, 9);
});

test("real mission: saving a design with unknown parts is INVALID_DESIGN (not MISSION_NOT_FOUND)", async () => {
  const r = await post("/api/designs", { ...valid, missionId: "earth-observation-01", componentIds: ["ghost"] });
  assert.equal(r.status, 400);
  assert.equal(await errCode(r), "INVALID_DESIGN");
});
