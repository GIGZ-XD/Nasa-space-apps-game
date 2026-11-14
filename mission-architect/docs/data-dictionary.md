# Data Dictionary — Mission Architect: Beyond Earth

**Document Owner:** Tanishka (Person 5 — Mission Data, QA, Educational Content & Demo)
**Last updated:** 2026-11-14 (Phase 2 update)
**Status:** Phase 2 complete — pending Vineeth confirmation of PROVISIONAL items

> This document defines every field, ID, unit and category used in the data files `apps/api/src/data/missions.json` and `apps/api/src/data/components.json`. Read this before writing any code that consumes those files.

---

## Table of Contents

1. [Canonical Category Names](#1-canonical-category-names)
2. [missions.json — Field Reference](#2-missionsjson--field-reference)
3. [components.json — Field Reference](#3-componentsjson--field-reference)
4. [All Component IDs](#4-all-component-ids)
5. [Units Reference](#5-units-reference)
6. [dataRateMbps Convention](#6-dataratembps-convention)
7. [Feasibility Rule Summary](#7-feasibility-rule-summary)
8. [Reference Viable Design (Hand-Verified)](#8-reference-viable-design-hand-verified)
9. [Private Scoring Data — component-suitability.json](#9-private-scoring-data--component-suitabilityjson)
10. [Handoff Notes](#10-handoff-notes)

---

## 1. Canonical Category Names

These are the **only** permitted values for the `category` field in `components.json` and for entries in `mandatoryCategories` in `missions.json`. They are **fixed, lowercase strings**. Do not alter spelling, case, or introduce new values without updating this document and informing all team members.

| Category string | What it represents |
|---|---|
| `structure` | Spacecraft bus / structural frame |
| `power` | Solar panels / power generation system |
| `battery` | On-board energy storage |
| `communications` | Antenna and radio transceiver |
| `computer` | On-board data processor and command handler |
| `adcs` | Attitude Determination and Control System |
| `instrument` | Scientific payload (camera, sensor, imager, etc.) |
| `orbit` | Orbital regime selection (not a physical part) |
| `launcher` | Launch vehicle selection (not a physical part) |

> **Why `computer` and `adcs` are separate:** These represent distinct physical units with separate mass, power draw and cost budgets. Combining them would require changes to the backend evaluation logic and the UI catalogue display. Keep them separate.

---

## 2. missions.json — Field Reference

Each entry in `missions.json` is a **mission object**.

| Field | Type | Required | Description |
|---|---|---|---|
| `id` | `string` | ✅ | Unique mission identifier. Lowercase kebab-case. The first mission uses the fixed ID `earth-observation-01`. Do not change without telling Vineeth. |
| `name` | `string` | ✅ | Human-readable mission name displayed in the UI. |
| `objective` | `string` | ✅ | Player-facing description of what they must achieve. Displayed on the Mission Brief page. |
| `difficulty` | `"easy"` \| `"medium"` \| `"hard"` | ✅ | Difficulty level displayed on the mission select screen. |
| `budgetUsd` | `number` | ✅ | Total mission budget in US dollars. Numbers only — no `$` symbol or text. |
| `requirements` | `string[]` | ✅ | Array of plain-language constraint descriptions shown to the player on the Mission Brief page. |
| `mandatoryCategories` | `string[]` | ⚠️ Proposed | List of category strings that must each have at least one component selected for the design to pass the completeness check. **Vineeth: add to the shared `Mission` type after confirming with Pannaga.** |
| `powerReserveFactor` | `number` | ⚠️ Proposed | Safety multiplier for power feasibility check. The solar panel output must be ≥ (total draw × powerReserveFactor). Value `1.1` means 10% headroom is required. **Vineeth: add to shared type.** |
| `allowedOrbitIds` | `string[]` | ⚠️ Proposed | IDs of orbits the player may select for this mission. All IDs must exist in `components.json`. **Vineeth: add to shared type.** |
| `lifetimeMonths` | `number` | ⚠️ Proposed | Intended mission lifetime in months. May be used in future scoring or battery degradation calculations. Not used in MVP feasibility checks. **Vineeth: add to shared type.** |

> Fields marked ⚠️ Proposed are present in the JSON now. Vineeth must add them to `packages/shared/src/types/mission.ts` before the backend can read them without TypeScript errors.

---

## 3. components.json — Field Reference

Each entry in `components.json` is a **component object**. Orbits and launchers are also component objects in this same array — distinguished only by their `category` value.

### 3.1 Fields Required on Every Component

| Field | Type | Description |
|---|---|---|
| `id` | `string` | Unique component identifier. Lowercase kebab-case. Never reused across the entire file. |
| `category` | `string` | One of the nine canonical category strings from Section 1. |
| `name` | `string` | Human-readable component name shown in the Workshop UI. |
| `description` | `string` | Beginner-friendly explanation of what the component does. Shown as a tooltip or detail panel in the Workshop. |
| `costUsd` | `number` | Cost in US dollars. Use `0` for orbits (they have no direct cost — the launch vehicle cost covers access). |

### 3.2 Optional Fields (Present When Applicable)

| Field | Type | Unit | Applies to | Description |
|---|---|---|---|---|
| `massKg` | `number` | kg | All spacecraft parts (`structure`, `power`, `battery`, `communications`, `computer`, `adcs`, `instrument`). Also present as `0` on `launcher` entries. | Component mass. Summed across all selected parts to get total spacecraft mass. **Orbits have no mass entry.** |
| `powerDrawW` | `number` | W (watts) | `communications`, `computer`, `adcs`, `instrument` | Electrical power consumed by this component when active. Used in power balance check. |
| `powerOutputW` | `number` | W (watts) | `power` | Electrical power generated by solar panels in full sunlight. |
| `capacityWh` | `number` | Wh (watt-hours) | `battery` | Maximum energy the battery can store. Used in eclipse endurance check. |
| `dataRateMbps` | `number` | Mbps | `communications`, `instrument` | For communications: maximum downlink data rate. For instruments: data rate produced per orbit pass. Used in communication feasibility check. |
| `payloadCapacityKg` | `number` | kg | `launcher` | Maximum spacecraft mass this launcher can deliver to any of its supported orbits. |
| `supportedOrbitIds` | `string[]` | — | `launcher` | List of orbit IDs this launcher can reach. All listed IDs must exist as entries in `components.json` with `category: "orbit"`. |

### 3.3 Which Fields Appear on Which Categories

| Category | massKg | powerDrawW | powerOutputW | capacityWh | dataRateMbps | payloadCapacityKg | supportedOrbitIds |
|---|---|---|---|---|---|---|---|
| `structure` | ✅ | — | — | — | — | — | — |
| `power` | ✅ | — | ✅ | — | — | — | — |
| `battery` | ✅ | — | — | ✅ | — | — | — |
| `communications` | ✅ | ✅ | — | — | ✅ | — | — |
| `computer` | ✅ | ✅ | — | — | — | — | — |
| `adcs` | ✅ | ✅ | — | — | — | — | — |
| `instrument` | ✅ | ✅ | — | — | ✅ | — | — |
| `orbit` | — | — | — | — | — | — | — |
| `launcher` | ✅ (= 0) | — | — | — | — | ✅ | ✅ |

> **Phase 2 addition:** Orbit entries now carry two additional fields — `eclipseMinutes` and `contactWindowMinutesPerOrbit`. See Section 6 for the `dataRateMbps` convention that depends on these values.

---

## 4. All Component IDs

A complete list of every ID currently defined in `components.json`. All IDs are unique.

| ID | Category | Name |
|---|---|---|
| `bus-small` | structure | Small Satellite Bus |
| `bus-medium` | structure | Medium Satellite Bus |
| `bus-reinforced` | structure | Reinforced Satellite Bus |
| `solar-std` | power | Standard Solar Array |
| `solar-heff` | power | High-Efficiency Solar Array |
| `battery-std` | battery | Standard Li-Ion Battery |
| `battery-high` | battery | High-Capacity Battery Pack |
| `uhf-patch` | communications | UHF Patch Antenna |
| `xband-hga` | communications | X-Band High-Gain Antenna |
| `obc-std` | computer | Standard On-Board Computer |
| `obc-adv` | computer | Advanced On-Board Computer |
| `adcs-std` | adcs | Standard ADCS |
| `adcs-prec` | adcs | Precision ADCS |
| `camera-optical` | instrument | Optical Imaging Camera |
| `camera-multispectral` | instrument | Multispectral Imager |
| `camera-ir` | instrument | Thermal Infrared Imager |
| `leo-500` | orbit | Low Earth Orbit — 500 km |
| `sso-600` | orbit | Sun-Synchronous Orbit — 600 km |
| `launch-a` | launcher | Launcher Alpha |
| `launch-b` | launcher | Launcher Beta |

**Total: 20 components** (15 spacecraft parts + 2 orbits + 2 launchers + 1 bus added in Phase 2: `bus-reinforced`)

---

## 5. Units Reference

All numeric values in the JSON files use these units. No unit text appears inside numeric values.

| Unit | Symbol | Used for |
|---|---|---|
| Kilograms | `kg` | Mass — field `massKg`, `payloadCapacityKg` |
| Watts | `W` | Power — fields `powerDrawW`, `powerOutputW` |
| Watt-hours | `Wh` | Energy storage — field `capacityWh` |
| Megabits per second | `Mbps` | Data rate — field `dataRateMbps` |
| US Dollars | `USD` | Cost — fields `costUsd`, `budgetUsd` |

---

## 6. dataRateMbps Convention

> **Phase 2 decision — must be agreed with Vineeth before FC-5 is implemented.**

The field `dataRateMbps` appears on both `communications` and `instrument` components, but it means different things on each:

| Category | Meaning of `dataRateMbps` |
|---|---|
| `communications` | Maximum downlink data rate this antenna can sustain during a ground-contact window (Mbps) |
| `instrument` | The **minimum** downlink data rate the communications system must provide to clear this instrument's data buffer within a contact window (Mbps) |

**Why this convention?**

An instrument does not generate data at a fixed Mbps rate that is directly comparable to antenna throughput. Instead, over an orbit pass the instrument accumulates a buffer of data. During the short contact window, the antenna must be fast enough to downlink all buffered data. The `dataRateMbps` on an instrument represents the minimum antenna throughput required to achieve this.

**FC-5 check using this convention:**

```
communications.dataRateMbps  >=  sum(instrument.dataRateMbps  for all selected instruments)
```

**Practical consequences with current catalogue:**

| Comms option | Instrument(s) | FC-5 result |
|---|---|---|
| `uhf-patch` (0.5 Mbps) | Any instrument (min 1.2 Mbps) | ❌ FAIL — by design |
| `xband-hga` (8 Mbps) | `camera-optical` (1.2 Mbps) | ✅ PASS |
| `xband-hga` (8 Mbps) | `camera-optical` + `camera-multispectral` (4.7 Mbps) | ✅ PASS |
| `xband-hga` (8 Mbps) | All three instruments (7.5 Mbps) | ✅ PASS |

> The `uhf-patch` failing FC-5 against all instruments **is intentional game design**, not a data error. It creates a meaningful penalty for a mismatched configuration. Vineeth: confirm whether this is a hard FC-5 failure or only a scoring deduction.

> Orbit timing fields (`eclipseMinutes`, `contactWindowMinutesPerOrbit`) used in FC-4 and FC-5 calculations are now embedded in each orbit entry in `components.json` **and** in `component-suitability.json` Section `orbitProperties`. The backend should use the values in `component-suitability.json` as the authoritative source (they are PROVISIONAL until Vineeth confirms).

---

## 7. Feasibility Rule Summary

These are the logical rules the backend must enforce. Vineeth implements these; this table is for reference.

| Check ID | Rule | Fields Used |
|---|---|---|
| FC-1 | All `mandatoryCategories` must have at least one selected component | `mandatoryCategories` (mission) |
| FC-2 | Sum of `massKg` across all selected spacecraft parts ≤ `payloadCapacityKg` of selected launcher | `massKg`, `payloadCapacityKg` |
| FC-3 | `powerOutputW` of selected power component ≥ sum of `powerDrawW` × `powerReserveFactor` | `powerOutputW`, `powerDrawW`, `powerReserveFactor` (mission) |
| FC-4 | `capacityWh` of selected battery ≥ power draw through eclipse period (backend calculates eclipse from orbit properties) | `capacityWh`, `powerDrawW`, orbit eclipse duration |
| FC-5 | Communications `dataRateMbps` ≥ sum of instrument `dataRateMbps` (backend calculates available contact window from orbit) | `dataRateMbps` (comms), `dataRateMbps` (instrument) |
| FC-6 | Selected launcher's `supportedOrbitIds` must include the selected orbit's `id` | `supportedOrbitIds`, orbit `id` |
| FC-7 | Sum of all `costUsd` values ≤ `budgetUsd` (mission) | `costUsd`, `budgetUsd` |

> **FC-7 (budget) clarification needed from Vineeth:** Is budget overrun a hard feasibility block (like FC-1 to FC-6) or does it only reduce the finance score? Mark the resolution in `docs/game-design.md` when decided.

---

## 7. Reference Viable Design (Hand-Verified)

This design is confirmed to pass all feasibility checks for mission `earth-observation-01`. Use it to verify your backend implementation.

| Component | ID | massKg | powerDrawW | powerOutputW | costUsd |
|---|---|---|---|---|---|
| Small Satellite Bus | `bus-small` | 8 | — | — | 25,000 |
| Standard Solar Array | `solar-std` | 7 | — | 80 | 18,000 |
| Standard Li-Ion Battery | `battery-std` | 4 | — | — | 12,000 |
| UHF Patch Antenna | `uhf-patch` | 2 | 8 | — | 15,000 |
| Standard On-Board Computer | `obc-std` | 1.5 | 12 | — | 20,000 |
| Standard ADCS | `adcs-std` | 2 | 10 | — | 22,000 |
| Optical Imaging Camera | `camera-optical` | 3 | 15 | — | 40,000 |
| Low Earth Orbit — 500 km | `leo-500` | — | — | — | 0 |
| Launcher Alpha | `launch-a` | — | — | — | 120,000 |
| **TOTALS** | | **27.5 kg** | **45 W** | **80 W** | **272,000** |

### Feasibility Check Results for This Design

| Check | Rule | Value | Limit | Result |
|---|---|---|---|---|
| FC-1 Completeness | All 9 mandatory categories present | ✅ All 9 filled | — | ✅ PASS |
| FC-2 Mass | 27.5 kg ≤ Launcher Alpha capacity | 27.5 kg | 50 kg | ✅ PASS |
| FC-3 Power | 80 W ≥ 45 W × 1.1 = 49.5 W | 80 W | 49.5 W | ✅ PASS |
| FC-4 Battery | 180 Wh must cover eclipse (backend calculates) | 180 Wh | ~22.5 Wh* | ✅ PASS |
| FC-5 Comms | 0.5 Mbps ≥ 1.2 Mbps instrument output? | 0.5 Mbps | 1.2 Mbps | ⚠️ See note |
| FC-6 Orbit/Launcher | `launch-a` supports `leo-500` | ✅ | — | ✅ PASS |
| FC-7 Budget | \$272,000 ≤ \$500,000 | \$272,000 | \$500,000 | ✅ PASS |

> **FC-4 note:** Approximate calculation: 45 W × 0.5 hr eclipse ≈ 22.5 Wh. The 180 Wh battery easily covers this. Exact eclipse duration for `leo-500` should be confirmed by Vineeth in backend configuration.

> **FC-5 note (⚠️ important):** The UHF Patch antenna produces 0.5 Mbps downlink, but the Optical Camera generates 1.2 Mbps of data. Whether FC-5 passes depends on how the backend computes the available contact window. If the contact window is ≥ 2.4× the orbit period, the antenna can catch up. Vineeth should confirm the contact window calculation. **Recommendation for the reference design:** swap to `xband-hga` (8 Mbps) for unambiguous FC-5 compliance — that design still passes all other checks (mass = 30.5 kg, power draw = 62 W, cost = \$305,000).

---

## 9. Private Scoring Data — component-suitability.json

**File:** `apps/api/src/data/component-suitability.json`
**Access:** Server-side only. Never serve this file via a public API route. Never import it into any file under `apps/web/`.

This file is the backend-private companion to `components.json`. It contains:

| Section | Contents |
|---|---|
| `categoryWeights` | Proposed scoring weights per category (sum = 100). PROVISIONAL — Vineeth to confirm. |
| `rewardTiers` | Score-to-reward mapping (Gold/Silver/Bronze/Partial/Fail). PROVISIONAL. |
| `orbitProperties` | Eclipse duration, contact window and orbit period per orbit ID. PROVISIONAL. |
| `componentSuitability` | Per-component suitability scores (0–100) and scoring approach notes per category. PROVISIONAL. |
| `referenceViableDesigns` | Three hand-verified spacecraft configurations with full feasibility check results. |

### Why this file exists separately

Suitability scores and scoring weights are **backend-private** and must not be discoverable by players. If they were in `components.json` or served via the components API, players could read the source to find the optimal build rather than experimenting. This file is only read by `scoring.service.ts` and `evaluation.service.ts`.

### What Vineeth must do with this file

1. Review all sections marked `PROVISIONAL`.
2. Confirm or adjust `categoryWeights` (must still sum to 100).
3. Confirm or adjust `rewardTiers`.
4. Confirm `orbitProperties` values (eclipse minutes, contact window minutes).
5. Decide the `componentSuitability` scoring approach (lookup table as proposed, or formula-based).
6. Decide the `_combinationBonus` for instrument combinations.
7. Confirm the `dataRateMbps` FC-5 convention (Section 6 above).
8. Implement in `scoring.service.ts` and `feasibility.service.ts`.

---

## 10. Handoff Notes

### For Vineeth (Backend Developer)

1. **Data files are at:** `apps/api/src/data/missions.json` and `apps/api/src/data/components.json`
2. **Four new fields in missions.json** are marked `⚠️ Proposed` in Section 2. Add them to `packages/shared/src/types/mission.ts` before reading them in TypeScript services.
3. **Feasibility rules** are summarised in Section 6. The orbit eclipse duration (needed for FC-4 and FC-5) is not in the JSON — you will need to either add it to orbit entries or hardcode it in `feasibility.service.ts`. Recommended: add an `eclipseMinutes` field to orbit component objects (let Tanishka know so the JSON can be updated).
4. **FC-5 (comms check)** depends on a contact window calculation that is not yet in the data. Agree the approach (contact window per orbit for each orbit type) and let Tanishka know so it can be documented here.
5. **FC-7 (budget)** — confirm whether this is a hard feasibility block or a score-only factor. Update `docs/game-design.md` with the decision.
6. **Scoring weights** are in `docs/scoring-system.md` as illustrative proposals. Confirm and hard-code in `scoring.service.ts`.
7. **Launcher `massKg` is set to 0** for both launchers — this is intentional. The launcher's own mass is not part of the spacecraft payload budget.

### For Sriganesh (UI / Frontend Developer)

1. **Component catalogue data** lives in `apps/api/src/data/components.json`. The Workshop UI should fetch this via the `/api/components` route.
2. **Category strings** (Section 1) are what you filter and group by in the Workshop. Use them exactly as listed.
3. **Fields to display per component in the Workshop:**
   - Always: `name`, `description`, `costUsd`
   - When present: `massKg`, `powerOutputW` or `powerDrawW`, `capacityWh`, `dataRateMbps`, `payloadCapacityKg`
4. **Running totals** the UI should track: total mass, total power draw, total power output, total cost.
5. **Orbits and launchers** are in the same `components.json` array — filter by `category === "orbit"` and `category === "launcher"` to populate orbit/launcher selection panels.
6. **Multiple instruments** are allowed: the player may select more than one `instrument` category component.
7. **One component per category for all other categories** — the UI should enforce single-selection for `structure`, `power`, `battery`, `communications`, `computer`, `adcs`, `orbit`, and `launcher`.

### For Pannaga (Mission Brief Page)

1. **Mission story and objectives** for `earth-observation-01` are in `docs/missions/earth-observation-01.md` — Section 1 (story) and Section 2 (objectives).
2. **Educational tooltips** content is in `docs/missions/earth-observation-01.md` — Section 8. Each subsystem has a beginner-friendly explanation you can use as tooltip text.
3. **Player-facing requirements** are in `missions.json` under the `requirements` array — these can be displayed directly on the Mission Brief page as a checklist.
4. The fictional agency name is **Orbital Vanguard** (pending full team confirmation — see `docs/game-design.md`).

---

*Document prepared by Tanishka (Person 5 — Mission Data, QA, Educational Content & Demo)*
*Last updated: 2026-11-14*
