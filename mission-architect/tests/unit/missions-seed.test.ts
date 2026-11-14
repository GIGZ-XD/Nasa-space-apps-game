import assert from "node:assert/strict";
import { test } from "node:test";
import { CATEGORIES, loadMissions, parseMissions } from "../../apps/api/src/data/missions-loader";
import { missionRules } from "../../apps/api/src/data/mission-rules";

const real = loadMissions();
const eo = real.find((m) => m.id === "earth-observation-01")!;

test("real mission seed loads and validates", () => {
  assert.ok(eo);
  assert.equal(eo.name, "Eyes on Earth");
  assert.equal(eo.budgetUsd, 500_000);
  assert.equal(eo.powerReserveFactor, 1.1);
  assert.equal(eo.lifetimeMonths, 24);
});

test("mandatory categories are all valid and include orbit and launcher", () => {
  for (const c of eo.mandatoryCategories) assert.ok((CATEGORIES as readonly string[]).includes(c), c);
  assert.ok(eo.mandatoryCategories.includes("orbit") && eo.mandatoryCategories.includes("launcher"));
});

test("server-side rules are derived from the mission seed", () => {
  assert.deepEqual(missionRules["earth-observation-01"], {
    mandatoryCategories: eo.mandatoryCategories, powerReserveFactor: 1.1, allowedOrbitIds: ["leo-500", "sso-600"], budgetUsd: 500_000,
  });
});

test("bad seeds fail loudly", () => {
  const ok = JSON.parse(JSON.stringify(eo));
  assert.throws(() => parseMissions([{ ...ok, mandatoryCategories: ["avionics"] }]));   // not a fixed category
  assert.throws(() => parseMissions([{ ...ok, difficulty: "insane" }]));
  assert.throws(() => parseMissions([{ ...ok, extra: 1 }]));                              // unknown field
  assert.throws(() => parseMissions([ok, ok]), /Duplicate/);
  assert.throws(() => parseMissions([]));
});
