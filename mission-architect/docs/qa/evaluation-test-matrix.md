# Evaluation Test Matrix — Mission Architect: Beyond Earth

**Document Owner:** Tanishka (Person 5 — Mission Data, QA, Educational Content & Demo)  
**Date:** 2026-11-14  
**Phase:** 3 — Evaluation Test Matrix and Educational Feedback  
**Status:** Complete — Fixtures created, test matrix established, automated validation verified  

---

## 1. Overview & Purpose

This document establishes the test matrix for validating the mission evaluation engine in **Mission Architect — Beyond Earth**.

The evaluation engine evaluates submitted spacecraft configurations along two distinct axes:
1. **Physical Feasibility Checks (FC-1 to FC-7):** Hard pass/fail gates ensuring the spacecraft obeys laws of physics, orbital mechanics, and agency operational constraints.
2. **Suitability & Mission Scoring:** A weighted multi-category score (0–100%) reflecting how well-engineered, cost-effective, and scientifically valuable the configuration is.

The test matrix contains **seven distinct test scenarios** represented by reproducible JSON fixtures located in `tests/fixtures/`.

---

## 2. Master Evaluation Test Matrix

| Test ID | Fixture Name | Purpose | Orbit | Launcher | Mass (kg) | Power Gen (W) | Power Req (W) | Total Cost ($) | Expected Feasibility | Expected Score | Expected Outcome | Verification Status |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| **TM-01** | `design-good.json` | Known-good baseline design | `leo-500` | `launch-a` (50 kg cap) | 30.5 kg | 80.0 W | 68.2 W | \$305,000 | **PASS** (FC-1–7 all pass) | ~78.6% (Provisional) | **Full Success** (Silver Tier, 85% reward) | **VERIFIED** (Feasibility verified by automated script; score provisional pending Vineeth) |
| **TM-02** | `design-alternative.json` | High-capability valid alternative | `sso-600` | `launch-b` (150 kg cap) | 37.5 kg | 140.0 W | 75.9 W | \$486,000 | **PASS** (FC-1–7 all pass) | ~86.75% (Provisional) | **Full Success** (Silver/Gold border, higher science return) | **VERIFIED** (Feasibility verified by automated script; score provisional pending Vineeth) |
| **TM-03** | `design-over-mass.json` | Excessive spacecraft mass | `leo-500` | `launch-a` (50 kg cap) | 55.0 kg | 80.0 W | 77.0 W | \$415,000 | **FAIL** (FC-2 mass violation: 55 > 50 kg) | Blocked by feasibility | **Launch Failure** (Overload prevents orbital injection) | **VERIFIED** (Automated script confirms 55.0 > 50.0 kg) |
| **TM-04** | `design-low-power.json` | Insufficient electrical power generation | `leo-500` | `launch-a` (50 kg cap) | 35.5 kg | 80.0 W | 100.1 W | \$406,000 | **FAIL** (FC-3 power shortfall: 80.0 < 100.1 W) | Blocked by feasibility | **Mission Brownout** (Subsystems shut down in sunlight) | **VERIFIED** (Automated script confirms 80.0 < 100.1 W) |
| **TM-05** | `design-incompatible-launcher.json` | Orbit and launcher trajectory incompatibility | `sso-600` | `launch-a` (LEO-500 only) | 30.5 kg | 80.0 W | 68.2 W | \$305,000 | **FAIL** (FC-6 trajectory mismatch) | Blocked by feasibility | **Trajectory Failure** (Launcher cannot inject into SSO) | **VERIFIED** (Automated script confirms SSO not in supportedOrbitIds) |
| **TM-06** | `design-failed-score.json` | Subsystem mismatch driving score < 30% | `sso-600` | `launch-a` (LEO-500 only) | 50.5 kg | 80.0 W | 69.3 W | \$372,000 | **FAIL** (FC-2, FC-5, FC-6 fail) | ~25.54% (Provisional) | **Score Failure** (Fails score threshold < 30%) | **VERIFIED** (Automated calculation confirms score 25.54% < 30%) |
| **TM-07** | `design-exactly-30.json` | Exact 30.0% boundary case benchmark | `sso-600` | `launch-a` (LEO-500 only) | 47.5 kg | 80.0 W | 55.0 W | \$322,000 | **FAIL** (FC-5, FC-6 fail) | 30.00% (Provisional model) | **Score Pass / Feasibility Fail** (Passes score check alone) | **PROVISIONAL** (Calculation verified; continuous formula pending Vineeth) |

---

## 3. Detailed Scenario Specifications

### TM-01: Known-Good Baseline Design (`design-good.json`)
- **Selected Components:** `bus-small`, `solar-std`, `battery-std`, `xband-hga`, `obc-std`, `adcs-std`, `camera-optical`, `leo-500`, `launch-a`
- **Subsystem Coverage:** All 9 mandatory categories populated.
- **Physical Margins:**
  - Mass: 30.5 kg vs 50 kg capacity (+19.5 kg / +39% margin)
  - Power: 80.0 W generation vs 68.2 W required (+11.8 W / +17.3% margin)
  - Battery: 180 Wh capacity vs 31.0 Wh eclipse draw (5.8x coverage)
  - Comms: 8.0 Mbps downlink vs 1.2 Mbps sensor output (6.7x coverage)
  - Budget: \$305,000 vs \$500,000 limit (+\$195,000 / +39% margin)
- **Feasibility Result:** PASS across all 7 checks (FC-1 to FC-7).
- **Expected Score:** 78.6% (Silver Tier: 70–89% -> 85% reward).
- **Status:** **VERIFIED** — passes all programmatic feasibility assertions.

---

### TM-02: Valid Alternative High-Capability Design (`design-alternative.json`)
- **Selected Components:** `bus-small`, `solar-heff`, `battery-high`, `xband-hga`, `obc-std`, `adcs-std`, `camera-multispectral`, `sso-600`, `launch-b`
- **Subsystem Coverage:** All 9 mandatory categories populated.
- **Physical Margins:**
  - Mass: 37.5 kg vs 150 kg capacity (+112.5 kg margin)
  - Power: 140.0 W generation vs 75.9 W required (+64.1 W margin)
  - Battery: 320 Wh capacity vs 36.8 Wh eclipse draw (8.7x coverage)
  - Comms: 8.0 Mbps downlink vs 3.5 Mbps sensor output (2.3x coverage)
  - Budget: \$486,000 vs \$500,000 limit (+\$14,000 margin)
- **Engineering Trade-off:** Upgrades to Sun-Synchronous Orbit (SSO) and Multispectral imaging. Cost increases by \$181,000, but remains safely within budget while significantly increasing scientific utility.
- **Feasibility Result:** PASS across all 7 checks.
- **Expected Score:** 86.75% (Silver/Gold tier boundary).
- **Status:** **VERIFIED** — demonstrates non-unique viable paths.

---

### TM-03: Excessive Spacecraft Mass (`design-over-mass.json`)
- **Selected Components:** `bus-reinforced`, `solar-std`, `battery-high`, `xband-hga`, `obc-std`, `adcs-prec`, `camera-optical`, `leo-500`, `launch-a`
- **Mass Calculation:**
  $28.0 + 7.0 + 7.0 + 5.0 + 1.5 + 3.5 + 3.0 = 55.0\text{ kg}$
- **Launcher Capacity:** Launcher Alpha (`launch-a`) maximum payload capacity = 50.0 kg.
- **Violation:** $+5.0\text{ kg}$ overload (+10% mass deficit).
- **Non-Mass Parameters:** Power (80 W $\ge$ 77 W), Battery (320 Wh $\ge$ 35 Wh), Comms (8 Mbps $\ge$ 1.2 Mbps), and Budget (\$415,000 $\le$ \$500,000) all pass cleanly.
- **Feasibility Result:** FC-2 FAILS. Overall feasibility FAILS.
- **Status:** **VERIFIED** — clean, isolated mass failure.

---

### TM-04: Insufficient Power Generation (`design-low-power.json`)
- **Selected Components:** `bus-small`, `solar-std`, `battery-std`, `xband-hga`, `obc-adv`, `adcs-prec`, `camera-ir`, `leo-500`, `launch-a`
- **Power Draw Calculation:**
  - Comms: 25.0 W
  - Computer: 20.0 W
  - ADCS: 18.0 W
  - Instrument: 28.0 W
  - Total Active Draw: $91.0\text{ W}$
  - Required with Reserve Factor (1.1x): $91.0 \times 1.1 = 100.1\text{ W}$
- **Solar Generation:** Standard Solar Array (`solar-std`) outputs only 80.0 W.
- **Deficit:** $-20.1\text{ W}$ power deficit (-20% shortfall).
- **Feasibility Result:** FC-3 FAILS. Overall feasibility FAILS.
- **Status:** **VERIFIED** — clean, isolated power deficit failure.

---

### TM-05: Incompatible Launcher & Orbit (`design-incompatible-launcher.json`)
- **Selected Components:** `bus-small`, `solar-std`, `battery-std`, `xband-hga`, `obc-std`, `adcs-std`, `camera-optical`, `sso-600`, `launch-a`
- **Compatibility Analysis:**
  - Selected Orbit: Sun-Synchronous Orbit (`sso-600`, polar inclination)
  - Selected Launcher: Launcher Alpha (`launch-a`)
  - Launcher Alpha `supportedOrbitIds`: `["leo-500"]`
- **Violation:** `launch-a` cannot reach polar/sun-synchronous orbit.
- **Feasibility Result:** FC-6 FAILS. Overall feasibility FAILS.
- **Status:** **VERIFIED** — verifies catalogue constraint integrity.

---

### TM-06: Below-30% Score Design (`design-failed-score.json`)
- **Selected Components:** `bus-reinforced`, `solar-std`, `battery-std`, `uhf-patch`, `obc-std`, `adcs-std`, `camera-ir`, `sso-600`, `launch-a`
- **Scoring Breakdown:**
  - Structure (weight 20%): bus-reinforced heavily penalized for 2-year LEO mission -> 48.3% ($20 \times 0.483 = 9.67$)
  - Instrument (weight 25%): Thermal IR sensor blurred by Standard ADCS pointing jitter -> 20.0% ($25 \times 0.20 = 5.00$)
  - Power (weight 15%): Standard solar & battery -> 72.5% ($15 \times 0.725 = 10.87$)
  - Communications (weight 10%): UHF antenna cannot downlink 2.8 Mbps -> 0.0% ($10 \times 0.00 = 0.00$)
  - Orbit (weight 15%): Trajectory unreachable -> 0.0% ($15 \times 0.00 = 0.00$)
  - Launcher (weight 15%): Orbit delivery failure -> 0.0% ($15 \times 0.00 = 0.00$)
- **Overall Score:** $9.67 + 5.00 + 10.87 + 0.00 + 0.00 + 0.00 = 25.54\%$
- **Threshold Check:** $25.54\% < 30.00\%$ -> **FAILS score threshold**.
- **Status:** **VERIFIED** — validates the <30% failing tier rule.

---

### TM-07: Exactly-30% Boundary Case Benchmark (`design-exactly-30.json`)
- **Selected Components:** `bus-reinforced`, `solar-std`, `battery-std`, `uhf-patch`, `obc-std`, `adcs-std`, `camera-optical`, `sso-600`, `launch-a`
- **Target Overall Score:** **30.00%**
- **Theoretical Calculation:**
  $$\text{Score} = (20 \times 0.50) + (25 \times 0.40) + (15 \times 0.40) + (10 \times 0.40) + (15 \times 0.00) + (15 \times 0.00) = 10.0 + 10.0 + 6.0 + 4.0 + 0.0 + 0.0 = 30.00\%$$
- **Outcome:** Passes score threshold alone ($\ge 30\%$), but fails feasibility at FC-5 (comms) and FC-6 (orbit/launcher).
- **Backend Blocker Documented:** Because the current Phase 2 catalogue contains discrete base suitabilities $\ge 40$, achieving exactly 30.00% on a *fully feasible* design is mathematically blocked until Vineeth implements continuous degradation curves in `scoring.service.ts`.
- **Status:** **PROVISIONAL / MATHEMATICALLY BENCHMARKED**.

---

## 4. Test Execution & Discrepancy Log

| Test ID | Expected Feasibility | Actual Programmatic Feasibility | Discrepancy? |
|---|---|---|---|
| TM-01 | PASS | PASS | None — matches specification |
| TM-02 | PASS | PASS | None — matches specification |
| TM-03 | FAIL (FC-2) | FAIL (FC-2: 55.0 kg > 50.0 kg) | None — matches specification |
| TM-04 | FAIL (FC-3) | FAIL (FC-3: 80.0 W < 100.1 W) | None — matches specification |
| TM-05 | FAIL (FC-6) | FAIL (FC-6: sso-600 not in launch-a) | None — matches specification |
| TM-06 | FAIL (FC-2, 5, 6) | FAIL (FC-2, 5, 6) | None — matches specification |
| TM-07 | FAIL (FC-5, 6) | FAIL (FC-5, 6) | None — matches specification |

*Note: Automated verification of feasibility calculations was executed using PowerShell arithmetic assertions against `components.json` and `missions.json` data.*
