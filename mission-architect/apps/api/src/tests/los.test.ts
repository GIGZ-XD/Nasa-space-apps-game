process.env.ATTEMPTS_FILE = ":memory:";
import assert from "node:assert";
const { calculateLOS, EquipmentError } = await import("../services/scoring.service");
const { evaluationService, LaunchBlockedError, getMissionStatus, calculateCoins, calculateXP } = await import("../services/evaluation.service");
const { validateConstraints } = await import("../services/constraints.service");
const { IDEAL_CONFIGS } = await import("../data/aegisCatalogue");
const { getVariants } = await import("../data/aegisCatalogue");

let passed = 0;
let total = 0;
async function test(name: string, fn: () => void | Promise<void>) {
  total++;
  try { await fn(); passed++; console.log(`[PASS] ${name}`); }
  catch (e: any) { console.error(`[FAIL] ${name}\n  ${e.message}`); }
}
const ideal = (lvl: number, variant?: string) => IDEAL_CONFIGS.find((c) => c.level === lvl && (!variant || c.variant === variant))!.requiredSlots.map((s) => s.idealUniqueId);
const throwsCode = (fn: () => unknown, code: string) => {
  try { fn(); } catch (e: any) { assert.ok(e instanceof EquipmentError); assert.strictEqual(e.code, code); return; }
  assert.fail("expected EquipmentError " + code);
};

console.log("=== LOS, MISSION RESULT, REWARD & CONSTRAINT TESTS ===");

for (const lvl of [1, 2, 3, 4, 5]) {
  await test(`1-5. Perfect level ${lvl} configuration returns LOS 100`, () => {
    const r = calculateLOS(lvl, ideal(lvl));
    assert.strictEqual(r.los, 100);
    assert.strictEqual(r.missing_equipment.length, 0);
    assert.strictEqual(r.required_completed, r.required_total);
  });
}

await test("6. Lower-suitability alternative reduces LOS (Electron 95 on L1)", () => {
  // (5*100 + 20*95 + 15*100 + 8*100) / 48 = 97.92
  assert.strictEqual(calculateLOS(1, [1001, 2002, 3001, 4001]).los, 97.92);
});
await test("6b. Alternatives resolve through market part ids (lv2 -> Electron)", () => {
  assert.strictEqual(calculateLOS(1, ["lp1", "lv2", "sat2", "sp2"]).los, 97.92);
});
await test("7. Missing mandatory equipment scores zero", () => {
  const r = calculateLOS(1, [1001, 2001, 3001]); // no sensor
  assert.strictEqual(r.los, Math.round((5 * 100 + 20 * 100 + 15 * 100) / 48 * 100) / 100);
  assert.deepStrictEqual(r.missing_equipment, ["Sensor"]);
});
await test("8. Several required slots in a category are averaged, not multiplied (L3 deployables)", () => {
  // Seismometer slot missing -> category 8 avg = 50 -> weight 7 counted once.
  const withoutSeis = calculateLOS(3, [1002, 2005, 5002, 6001, 7001, 8001]);
  // weights: 5+20+10+15+10+7 = 67 ; sum = 5*100+20*100+10*100+15*100+10*100+7*50
  assert.strictEqual(withoutSeis.los, Math.round(((5 + 20 + 10 + 15 + 10) * 100 + 7 * 50) / 67 * 100) / 100);
});
await test("8b. Drill is an accepted 98 alternative for the seismometer slot", () => {
  const r = calculateLOS(3, [1002, 2005, 5002, 6001, 7001, 8001, 8003]);
  assert.ok(r.los < 100 && r.los > 99);
});
await test("9. Optional equipment does not raise LOS", () => {
  const base = calculateLOS(3, ideal(3)).los;
  const extra = calculateLOS(3, [...ideal(3), 5001, 4002]).los; // unused extras (IRIS, LROC)
  assert.strictEqual(extra, base);
  const weaker = calculateLOS(3, [1002, 2005, 5002, 6003, 7001, 8001, 8002, 6001]).los; // best of lander options, not a sum
  assert.ok(weaker <= 100);
});
await test("10. Invalid unique ids are rejected", () => {
  throwsCode(() => calculateLOS(1, [9999]), "INVALID_ID");
  throwsCode(() => calculateLOS(1, ["nope"]), "INVALID_ID");
});
await test("11. Parts that are not the ideal ones are still read (off-spec, 60%)", () => {
  // Falcon 9 (2003) on Level 1: not Pegasus/Electron, same category -> counted at 100 x 0.6 = 60
  const r = calculateLOS(1, [1001, 2003, 3001, 4001]);
  const veh = r.equipment_scores.find((s) => s.slotId === "vehicle")!;
  assert.strictEqual(veh.suitability, 60);
  assert.strictEqual(r.missing_equipment.length, 0);
  assert.strictEqual(r.selected_equipment.find((e) => e.uniqueId === 2003)!.status, "OFF_SPEC");
  assert.ok(r.los < 100 && r.los > 0);
});
await test("11b. Ideal parts are never displaced by off-spec parts", () => {
  const r = calculateLOS(1, [1001, 2003, 2001, 3001, 4001]); // Falcon 9 + Pegasus
  assert.strictEqual(r.equipment_scores.find((s) => s.slotId === "vehicle")!.suitability, 100);
});
await test("11d. A different sensor type (comms radio) still fills an empty Sensor slot at a lower score", () => {
  const r = calculateLOS(1, [1001, 2001, 3001, 5001]); // IRIS comms, no camera
  const sensor = r.equipment_scores.find((s) => s.slotId === "sensor")!;
  assert.strictEqual(sensor.suitability, 30); // 100 x 0.6 x 0.5
  assert.strictEqual(r.missing_equipment.length, 0);
});
await test("11c. A part from an unrelated category stays unused", () => {
  const r = calculateLOS(1, [1001, 2001, 3001, 4001, 9001]); // rover on an Earth-observation mission
  assert.strictEqual(r.selected_equipment.find((e) => e.uniqueId === 9001)!.status, "UNUSED");
  assert.strictEqual(r.los, 100);
});
await test("12. LOS is clamped to 0..100", () => {
  assert.strictEqual(calculateLOS(1, []).los, 0);
  for (const l of [1, 2, 3, 4, 5]) assert.ok(calculateLOS(l, ideal(l)).los <= 100);
});
await test("13. Changing equipment changes LOS", () => {
  assert.notStrictEqual(calculateLOS(1, [1001, 2001, 3001, 4001]).los, calculateLOS(1, [1001, 2002, 3001, 4001]).los);
});
await test("14. LOS 59.99 is MISSION FAILED", () => assert.strictEqual(getMissionStatus(59.99), "FAILED"));
await test("15. LOS exactly 60 is MISSION SUCCESSFUL", () => assert.strictEqual(getMissionStatus(60), "SUCCESS"));
await test("16. Failed missions award zero coins", () => assert.strictEqual(calculateCoins(1000, 20, "FAILED"), 0));
await test("17. Failed missions award no XP", () => assert.strictEqual(calculateXP(200, "FAILED"), 0));
await test("18. Successful mission coins = base × LOS/100 (=800)", () => assert.strictEqual(calculateCoins(1000, 80, "SUCCESS"), 800));
await test("19. Successful mission XP = the mission's XP prize, regardless of score (=200)", () => assert.strictEqual(calculateXP(200, "SUCCESS"), 200));

await test("20. Duplicate reward requests pay only once", async () => {
  const a = await evaluationService.evaluateMission("u1", 1, [1001, 2001, 3001, 4001], "att-dup");
  const b = await evaluationService.evaluateMission("u1", 1, [1001, 2001, 3001, 4001], "att-dup");
  assert.strictEqual(a.rewarded, true);
  assert.strictEqual(b.rewarded, false);
  assert.strictEqual(a.coinsAwarded, b.coinsAwarded);
  assert.strictEqual(a.mission_status, "SUCCESS");
  assert.strictEqual(a.next_level_unlocked, true);
});
await test("20b. Reward amounts come from backend config, not the client", async () => {
  const r = await evaluationService.evaluateMission("u1", 1, [1001, 2001, 3001, 4001]);
  assert.strictEqual(r.coinsAwarded, 3_000_000);
  assert.strictEqual(r.xpAwarded, 200);
});
await test("21. Failed hard constraints block launch (LOS alone cannot override)", async () => {
  // Level 1 with a launch vehicle too weak for the mission Δv/payload (Electron works; use none)
  const c = validateConstraints(1, [1001, 3001, 4001]); // no launch vehicle
  assert.strictEqual(c.launch_allowed, false);
  await assert.rejects(() => evaluationService.evaluateMission("u1", 1, [1001, 3001, 4001]), (e: any) => e instanceof LaunchBlockedError);
  // power: Level 2 without the CAPSTONE bus's generation
  const p = validateConstraints(2, [1002, 2003, 3003, 4002, 5001]);
  assert.ok(p.checks.find((x) => x.id === "power")!.passed);
});
await test("21b. Perfect configs pass every hard constraint", () => {
  for (const l of [1, 2, 3, 4, 5]) {
    const c = validateConstraints(l, ideal(l));
    assert.ok(c.launch_allowed, `level ${l}: ${c.blockers.join(",")}`);
    assert.strictEqual(c.mission_readiness_score, 100);
  }
});
await test("21d. Power check limit is the per-mission value (L1 = 25 W)", () => {
  const ok = validateConstraints(1, [1001, 2001, 3001, 4001]);
  assert.strictEqual(ok.checks.find((x) => x.id === "power")!.limit, 25);
  assert.ok(ok.checks.find((x) => x.id === "power")!.passed); // 40 - 15 = 25 W
  const low = validateConstraints(1, [1001, 2001, 3001, 4001, 4003]); // + Neutron Spectrometer (-20 W)
  assert.strictEqual(low.checks.find((x) => x.id === "power")!.passed, false);
  assert.strictEqual(validateConstraints(5, ideal(5, "msr"), "msr").checks.find((x) => x.id === "power")!.limit, 3_320);
});
await test("21c. Budget limit (20M) blocks launch when total cost exceeds it", async () => {
  const { ALL_MARKET_PARTS } = await import("../../../web/src/data/marketData");
  const all = ALL_MARKET_PARTS.map((p) => p.id); // far more than 20M of hardware
  const c = validateConstraints(1, all);
  assert.strictEqual(c.checks.find((x) => x.id === "budget")!.limit, 20_000_000);
  assert.strictEqual(c.checks.find((x) => x.id === "budget")!.passed, false);
  assert.strictEqual(c.launch_allowed, false);
  assert.ok(validateConstraints(1, ["lp1", "lv2", "sat2", "sp2"]).checks.find((x) => x.id === "budget")!.passed);
});
await test("22. Frontend/backend consistency: live LOS equals evaluated LOS for the same parts", async () => {
  const parts = ["lp1", "lv1", "sat2", "sp2"];
  const live = calculateLOS(1, parts, { strict: false });
  const evald = await evaluationService.evaluateMission("u2", 1, parts);
  assert.strictEqual(live.los, evald.los);
});

for (const v of ["bennu", "msr"]) {
  await test(`L5 ${v}: perfect ideal build = LOS 100 and passes constraints`, () => {
    assert.strictEqual(calculateLOS(5, ideal(5, v), { variant: v }).los, 100);
    assert.ok(validateConstraints(5, ideal(5, v), v).launch_allowed);
  });
}
await test("L5 has two variants (Bennu, Mars Sample Return)", () => assert.deepStrictEqual(getVariants(5).map((x) => x.variant), ["bennu", "msr"]));
await test("L5 Bennu: market parts score vs ideal (Atlas V, OSIRIS bus, DRACO, manipulator arm; no capsule on sale)", () => {
  const r = calculateLOS(5, ["lp2", "lv4", "sat6", "sp6", "lr9"], { variant: "bennu" });
  // (5+20+15+10)*100 + 10*95 over weights 5+20+15+10+10+8 = 68
  assert.strictEqual(r.los, Math.round(((5 + 20 + 15 + 10) * 100 + 10 * 95) / 68 * 100) / 100);
  assert.deepStrictEqual(r.missing_equipment, ["Earth Return Capsule"]);
});
await test("L5 MSR: market parts score vs ideal (SLS, MSR bus, lander+MAV, cache rover; no EEV on sale)", () => {
  const r = calculateLOS(5, ["lp2", "lv6", "sat6", "lr6", "lr9"], { variant: "msr" });
  assert.strictEqual(r.los, Math.round(((5 + 20 + 15 + 12 + 10) * 100) / 70 * 100) / 100); // weights 5+20+15+12+10+8 = 70
  assert.deepStrictEqual(r.missing_equipment, ["Earth Return Capsule (EEV)"]);
});
await test("L5 variants are scored against their own ideal", () => {
  const parts = ["lp2", "lv6", "sat6", "lr6", "lr9"];
  assert.notStrictEqual(calculateLOS(5, parts, { variant: "bennu" }).los, calculateLOS(5, parts, { variant: "msr" }).los);
});

console.log(`\n${passed}/${total} tests passed`);
if (passed !== total) process.exit(1);
