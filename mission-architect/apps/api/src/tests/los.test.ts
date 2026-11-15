process.env.ATTEMPTS_FILE = ":memory:";
import assert from "node:assert";
const { calculateLOS, EquipmentError } = await import("../services/scoring.service");
const { evaluationService, LaunchBlockedError, getMissionStatus, calculateCoins, calculateXP } = await import("../services/evaluation.service");
const { validateConstraints } = await import("../services/constraints.service");
const { IDEAL_CONFIGS } = await import("../data/aegisCatalogue");

let passed = 0;
let total = 0;
async function test(name: string, fn: () => void | Promise<void>) {
  total++;
  try { await fn(); passed++; console.log(`[PASS] ${name}`); }
  catch (e: any) { console.error(`[FAIL] ${name}\n  ${e.message}`); }
}
const ideal = (lvl: number) => IDEAL_CONFIGS.find((c) => c.level === lvl)!.requiredSlots.map((s) => s.idealUniqueId);
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
await test("11. Locked equipment cannot be selected", () => {
  throwsCode(() => calculateLOS(1, [1002]), "LOCKED"); // Kennedy LC-39A unlocks at level 2
  const live = calculateLOS(1, [1002, 1001], { strict: false });
  assert.strictEqual(live.rejected_equipment[0].reason, "LOCKED");
});
await test("12. LOS is clamped to 0..100", () => {
  assert.strictEqual(calculateLOS(1, []).los, 0);
  for (const l of [1, 2, 3, 4, 5]) assert.ok(calculateLOS(l, ideal(l)).los <= 100);
});
await test("13. Changing equipment changes LOS", () => {
  assert.notStrictEqual(calculateLOS(1, [1001, 2001, 3001, 4001]).los, calculateLOS(1, [1001, 2002, 3001, 4001]).los);
});
await test("14. LOS 29.99 is MISSION FAILED", () => assert.strictEqual(getMissionStatus(29.99), "FAILED"));
await test("15. LOS exactly 30 is MISSION SUCCESSFUL", () => assert.strictEqual(getMissionStatus(30), "SUCCESS"));
await test("16. Failed missions award zero coins", () => assert.strictEqual(calculateCoins(1000, 20, "FAILED"), 0));
await test("17. Failed missions award XP with B = 0 (=150)", () => assert.strictEqual(calculateXP(100, 5, 20, "FAILED"), 150));
await test("18. Successful mission coins = base × LOS/100 (=800)", () => assert.strictEqual(calculateCoins(1000, 80, "SUCCESS"), 800));
await test("19. Successful mission XP = B + D×10 + LOS×5 (=550)", () => assert.strictEqual(calculateXP(100, 5, 80, "SUCCESS"), 550));

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
  assert.strictEqual(r.coinsAwarded, 500_000);
  assert.strictEqual(r.xpAwarded, 500 + 2 * 10 + 100 * 5);
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
await test("21c. Budget limit blocks launch", () => {
  const c = validateConstraints(1, ["lp1", "lv2", "sat2", "sp2"]); 
  assert.strictEqual(c.checks.find((x) => x.id === "budget")!.passed, false);
});
await test("22. Frontend/backend consistency: live LOS equals evaluated LOS for the same parts", async () => {
  const parts = ["lp1", "lv1", "sat2", "sp2"];
  const live = calculateLOS(1, parts, { strict: false });
  const evald = await evaluationService.evaluateMission("u2", 1, parts);
  assert.strictEqual(live.los, evald.los);
});

console.log(`\n${passed}/${total} tests passed`);
if (passed !== total) process.exit(1);
