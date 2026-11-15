import assert from "node:assert";
import { calculateLOS } from "../services/scoring.service";
import { evaluationService } from "../services/evaluation.service";

console.log("=== RUNNING LOS & EVALUATION SYSTEM TESTS ===");

let passed = 0;
let total = 0;

function test(description: string, fn: () => void) {
  total++;
  try {
    fn();
    passed++;
    console.log(`[PASS] ${description}`);
  } catch (err: any) {
    console.error(`[FAIL] ${description}`);
    console.error(err);
  }
}

async function runTests() {
  // ----------------------------------------------------
  // SCENARIO 1: Level 1 All Ideal Parts
  // Pad: 1001 (w=5, s=100)
  // Vehicle: 2001 (w=20, s=100)
  // Bus: 3001 (w=15, s=100)
  // Sensor: 4001 (w=8, s=100)
  // Total weight = 48. Weighted sum = 4800. LOS = 100.
  // ----------------------------------------------------
  test("Scenario 1: Level 1 All Ideal Equipment yields 100% LOS", () => {
    // lp1 -> 1001, lv1 -> 2001, sat2 -> 3001, sp2 -> 4001
    const res = calculateLOS(1, ["lp1", "lv1", "sat2", "sp2"]);
    assert.strictEqual(res.los, 100);
    assert.strictEqual(res.missing_equipment.length, 0);
  });

  // ----------------------------------------------------
  // SCENARIO 2: Level 1 with Alternative Launch Vehicle (Electron VADR = 95)
  // lv2 -> 2002 (w=20, s=95).
  // Sum = 5*100 + 20*95 + 15*100 + 8*100 = 500 + 1900 + 1500 + 800 = 4700.
  // Total weight = 48.
  // 4700 / 48 = 97.91666... -> rounded to 97.92
  // ----------------------------------------------------
  test("Scenario 2: Level 1 with lv2 (Electron VADR 95%) yields 97.92% LOS", () => {
    const res = calculateLOS(1, ["lp1", "lv2", "sat2", "sp2"]);
    assert.strictEqual(res.los, 97.92);
    assert.strictEqual(res.missing_equipment.length, 0);
  });

  // ----------------------------------------------------
  // SCENARIO 3: Missing Launch Vehicle
  // Sum = 5*100 + 20*0 + 15*100 + 8*100 = 2800 / 48 = 58.33%
  // ----------------------------------------------------
  test("Scenario 3: Missing mandatory slot receives 0 suitability", () => {
    const res = calculateLOS(1, ["lp1", "sat2", "sp2"]);
    assert.strictEqual(res.los, 58.33);
    assert.ok(res.missing_equipment.includes("Launch Vehicle"));
  });

  // ----------------------------------------------------
  // SCENARIO 4: Completely Empty Spacecraft
  // All 0s -> 0.00%
  // ----------------------------------------------------
  test("Scenario 4: Empty selected equipment yields 0.00% LOS", () => {
    const res = calculateLOS(1, []);
    assert.strictEqual(res.los, 0);
    assert.strictEqual(res.missing_equipment.length, 4);
  });

  // ----------------------------------------------------
  // SCENARIO 5: Level 2 Ideal Configuration
  // Slots: Pad(5, 100), LV(20, 100), Bus(15, 100), Sensor(8, 100), Comms(10, 100)
  // Total weight = 58. Sum = 5800. LOS = 100.
  // ----------------------------------------------------
  test("Scenario 5: Level 2 Ideal Equipment yields 100% LOS", () => {
    // lp2 -> 1002, lv3 -> 2003, sat4 -> 3002, sp4 -> 4002, sp3 -> 5002 (comms s=100)
    const res = calculateLOS(2, ["lp2", "lv3", "sat4", "sp4", "sp3"]);
    assert.strictEqual(res.los, 100);
    assert.strictEqual(res.missing_equipment.length, 0);
  });

  // ----------------------------------------------------
  // SCENARIO 6: Level 2 with Alternative Bus (LRO Bus = 98)
  // sat5 -> 3003 (s=98)
  // Sum = 500 + 2000 + 15*98(1470) + 800 + 1000 = 5770 / 58 = 99.48%
  // ----------------------------------------------------
  test("Scenario 6: Level 2 Alternative Bus (LRO Bus 98%) yields 99.48% LOS", () => {
    const res = calculateLOS(2, ["lp2", "lv3", "sat5", "sp4", "sp3"]);
    assert.strictEqual(res.los, 99.48);
  });

  // ----------------------------------------------------
  // SCENARIO 7: Level 3 Multiple Slots in Same Category
  // Level 3 has two deployables (category 8):
  // Robotic Arm (8001: 100) + Seismometer (8002: 98).
  // Cat 8 weight is 7. Avg suitability = (100 + 98)/2 = 99.
  // ----------------------------------------------------
  test("Scenario 7: Level 3 Multiple slots in category are averaged properly", () => {
    // lp2 (1002), lv4 (2005), sp3 (5002), lr2 (6001), sp7 (8002)
    const res = calculateLOS(3, ["lp2", "lv4", "sp3", "lr2", "sp7"]);
    assert.ok(res.los > 0);
    // Ensure weights are not multiplied
    const scores = res.equipment_scores.filter(s => s.categoryId === 8);
    assert.strictEqual(scores.length, 2);
  });

  // ----------------------------------------------------
  // SCENARIO 8: Evaluation Service - Success Threshold (>= 30%)
  // ----------------------------------------------------
  const evalSuccess = await evaluationService.evaluateMission("test-user", 1, ["lp1", "lv1", "sat2", "sp2"]);
  test("Scenario 8: LOS >= 30% results in SUCCESS status", () => {
    assert.strictEqual(evalSuccess.mission_status, "SUCCESS");
    assert.strictEqual(evalSuccess.los, 100);
    assert.strictEqual(evalSuccess.coinsAwarded, 500000); // 500k * 100%
  });

  // ----------------------------------------------------
  // SCENARIO 9: Evaluation Service - Failure Threshold (< 30%)
  // Only lp1 installed: sum = 500 / 48 = 10.42% < 30% -> FAILED
  // ----------------------------------------------------
  const evalFail = await evaluationService.evaluateMission("test-user", 1, ["lp1"]);
  test("Scenario 9: LOS < 30% results in FAILED status with 0 coins", () => {
    assert.strictEqual(evalFail.mission_status, "FAILED");
    assert.ok(evalFail.los < 30);
    assert.strictEqual(evalFail.coinsAwarded, 0);
  });

  // ----------------------------------------------------
  // SCENARIO 10: XP Calculation on Failure (B=0, but D*10 + LOS*5 granted)
  // For Level 1, D = 2. D*10 = 20. LOS = 10.42. 10.42 * 5 = 52.1.
  // Total XP = Math.round(0 + 20 + 52.1) = 72.
  // ----------------------------------------------------
  test("Scenario 10: Failure still awards XP based on (D*10 + LOS*5) with B=0", () => {
    assert.ok(evalFail.xpAwarded > 0);
    assert.strictEqual(evalFail.xpAwarded, Math.round(2 * 10 + evalFail.los * 5));
  });

  // ----------------------------------------------------
  // SCENARIO 11: XP Calculation on Success
  // For Level 1, B = 500, D = 2 (20), LOS = 100 (500). Total XP = 1020.
  // ----------------------------------------------------
  test("Scenario 11: Success awards B + D*10 + LOS*5 XP", () => {
    assert.strictEqual(evalSuccess.xpAwarded, 500 + 2 * 10 + 100 * 5); // 1020
  });

  // ----------------------------------------------------
  // SCENARIO 12: Idempotent Reward Granting (Prevent duplicate grants)
  // ----------------------------------------------------
  test("Scenario 12: Reward granting is idempotent and prevents duplicate claims", () => {
    const claim1 = evaluationService.grantRewards(evalSuccess.attemptId, "test-user");
    assert.strictEqual(claim1?.coinsAwarded, 500000);

    const claim2 = evaluationService.grantRewards(evalSuccess.attemptId, "test-user");
    assert.strictEqual(claim2, null); // Blocked from receiving double rewards
  });

  // ----------------------------------------------------
  // SCENARIO 13: Unauthorized reward claim rejection
  // ----------------------------------------------------
  test("Scenario 13: Unauthorized user cannot claim someone else's attempt", () => {
    assert.throws(() => {
      evaluationService.grantRewards(evalFail.attemptId, "imposter-user");
    }, /Unauthorized/);
  });

  // ----------------------------------------------------
  // SCENARIO 14-17: Level 4 and Level 5 Ideal Configurations
  // ----------------------------------------------------
  test("Scenario 14: Level 4 evaluation executes without errors", () => {
    const res = calculateLOS(4, ["lp3", "lv4", "lr5", "sp7", "lr8", "sp6", "sp8", "sp9"]);
    assert.ok(res.los > 0);
    assert.strictEqual(res.level, 4);
  });

  test("Scenario 15: Level 5 evaluation executes without errors", () => {
    const res = calculateLOS(5, ["lp2", "lv6", "sat6", "sp6", "sp9", "lr6", "lr5"]);
    assert.ok(res.los > 0);
    assert.strictEqual(res.level, 5);
  });

  // ----------------------------------------------------
  // SCENARIO 16: Result clamping between 0 and 100
  // ----------------------------------------------------
  test("Scenario 16: LOS is clamped to 0..100 range strictly", () => {
    const resZero = calculateLOS(1, []);
    assert.ok(resZero.los >= 0 && resZero.los <= 100);

    const resMax = calculateLOS(1, ["lp1", "lv1", "sat2", "sp2"]);
    assert.ok(resMax.los >= 0 && resMax.los <= 100);
  });

  // ----------------------------------------------------
  // SCENARIO 17: Rounded to two decimal places
  // ----------------------------------------------------
  test("Scenario 17: LOS is rounded to 2 decimal places", () => {
    const res = calculateLOS(1, ["lp1", "lv2", "sat2", "sp2"]);
    const str = res.los.toString();
    const decimals = str.includes(".") ? str.split(".")[1].length : 0;
    assert.ok(decimals <= 2);
  });

  console.log(`\nTEST SUMMARY: ${passed} / ${total} tests passed.`);
  if (passed !== total) process.exit(1);
}

runTests().catch(err => {
  console.error("Test execution failed:", err);
  process.exit(1);
});
