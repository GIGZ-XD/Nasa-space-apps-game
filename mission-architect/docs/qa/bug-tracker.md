# QA Bug Tracker — Mission Architect: Beyond Earth

**Document Owner:** Tanishka (Person 5 — Mission Data, QA, Educational Content & Demo)  
**Date:** 2026-11-14  
**Phase:** 4 — End-to-End QA and Bug Triage  
**Status:** Active Defect Log  

---

## Severity Definitions

- **P0 — Critical:** Application cannot run or the core mission journey is completely blocked. Must be resolved before any demo.
- **P1 — High:** Major functionality is broken, authoritative calculations mismatch frontend previews, or mission evaluation cannot proceed.
- **P2 — Medium:** Feature works incorrectly with a viable workaround, non-blocking scoring mismatch, or significant educational feedback gap.

---

## Defect Inventory

| Bug ID | Title | Severity | Affected Module | Assigned Owner | Status |
|---|---|---|---|---|---|
| **BUG-001** | Core Web Pages and Router Unimplemented (Stub Placeholders) | **P0** | `apps/web/src/pages/`, `router.tsx` | Pannaga (Person 3) | **OPEN / BLOCKER** |
| **BUG-002** | Backend Evaluation and Resource Services Unimplemented (Empty Exports) | **P0** | `apps/api/src/services/`, `server.ts` | Vineeth (Person 2) & Sriganesh (Person 1) | **OPEN / BLOCKER** |
| **BUG-003** | Spacecraft Builder Workshop Store Unimplemented | **P1** | `apps/web/src/stores/spacecraftStore.ts` | Sriganesh (Person 1) | **OPEN / BLOCKER** |
| **BUG-004** | Shared Mission Interface Missing Phase 2 Contract Fields | **P1** | `packages/shared/src/types/mission.ts` | Vineeth (Person 2) | **OPEN** |
| **BUG-005** | Risk of Power Reserve Factor Desync (Frontend Preview vs Backend Evaluator) | **P1** | `apps/web/src/features/spacecraft-builder/` | Sriganesh (P1) & Vineeth (P2) | **OPEN** |
| **BUG-006** | Shared Component Interface Missing Orbit Timing Properties | **P2** | `packages/shared/src/types/component.ts` | Vineeth (Person 2) | **OPEN** |
| **BUG-007** | Absence of Continuous Scoring Degradation Curves in Evaluator | **P2** | `apps/api/src/services/scoring.service.ts` | Vineeth (Person 2) | **OPEN** |

---

## Detailed Bug Reports

### BUG-001: Core Web Pages and Router Unimplemented (Stub Placeholders)
- **Severity:** P0 — Critical
- **Affected Module:** `apps/web/src/pages/` (`HomePage.tsx`, `MissionSelectPage.tsx`, `MissionBriefPage.tsx`, `WorkshopPage.tsx`, `MissionControlPage.tsx`, `LaunchPage.tsx`, `ResultsPage.tsx`), `apps/web/src/app/router.tsx`
- **Assigned Owner:** Pannaga (Person 3 — Frontend / Pages)
- **Description:** Every page component in the frontend application contains only an empty skeleton JSX element (e.g. `<section>Home</section>`, `<section>Workshop</section>`). The router is defined as an empty object (`export const router = {};`). The browser application has no interactive buttons, forms, component lists, or navigation controls.
- **Reproduction Steps:**
  1. Inspect `apps/web/src/pages/*.tsx`.
  2. Inspect `apps/web/src/app/router.tsx`.
  3. Run `npm run build --workspace apps/web`.
- **Expected Result:** Application renders interactive navigation routes allowing the user to select missions, view briefings, assemble satellites, launch, and view evaluation results.
- **Actual Result:** Only static stub text is returned. Full player journey cannot be executed in the browser.
- **Evidence:** `HomePage.tsx` contains only `export function HomePage() { return <section>Home</section>; }`.
- **Status:** **OPEN / BLOCKER**

---

### BUG-002: Backend Evaluation and Resource Services Unimplemented (Empty Exports)
- **Severity:** P0 — Critical
- **Affected Module:** `apps/api/src/services/` (`feasibility.service.ts`, `evaluation.service.ts`, `resource.service.ts`, `scoring.service.ts`, `finance.service.ts`), `apps/api/src/routes/`, `apps/api/src/server.ts`
- **Assigned Owner:** Vineeth (Person 2 — Backend Services) & Sriganesh (Person 1 — Server Infrastructure)
- **Description:** All backend service and route files are 14-byte stubs containing only `export {};`. The Express HTTP server is unmounted. There is no active API listener to accept design payloads, compute feasibility, or calculate mission scores.
- **Reproduction Steps:**
  1. Inspect all TypeScript files in `apps/api/src/services/`.
  2. Inspect `apps/api/src/server.ts`.
- **Expected Result:** API server listens on designated port (e.g. 3001), exposes `/api/components`, `/api/missions`, and `/api/evaluation`, and executes authoritative feasibility checks.
- **Actual Result:** All services are empty stubs. Automated HTTP requests fail with connection refused / unhandled endpoint.
- **Evidence:** All service files have length 14 bytes (`export {};\n`).
- **Status:** **OPEN / BLOCKER**

---

### BUG-003: Spacecraft Builder Workshop Store Unimplemented
- **Severity:** P1 — High
- **Affected Module:** `apps/web/src/stores/spacecraftStore.ts`, `apps/web/src/features/spacecraft-builder/`
- **Assigned Owner:** Sriganesh (Person 1 — Spacecraft Builder / State)
- **Description:** `spacecraftStore.ts` contains only `export const spacecraftStore = {};`. The Zustand/React state management for storing selected component IDs, tracking active subsystem categories, and calculating real-time preview totals (mass, power, cost) is not implemented.
- **Reproduction Steps:**
  1. Inspect `apps/web/src/stores/spacecraftStore.ts`.
- **Expected Result:** Store provides reactive methods (`selectComponent`, `deselectComponent`, `setOrbit`, `setLauncher`, `resetConfiguration`) and calculates live resource summaries.
- **Actual Result:** Store is an empty object.
- **Status:** **OPEN / BLOCKER**

---

### BUG-004: Shared Mission Interface Missing Phase 2 Contract Fields
- **Severity:** P1 — High
- **Affected Module:** `packages/shared/src/types/mission.ts`
- **Assigned Owner:** Vineeth (Person 2 — Shared Types / Backend)
- **Description:** The shared `Mission` interface only defines `id: string` and `name: string`. The canonical mission definition in `apps/api/src/data/missions.json` includes `objective`, `difficulty`, `budgetUsd`, `requirements`, `mandatoryCategories`, `powerReserveFactor`, `allowedOrbitIds`, and `lifetimeMonths`. Consuming these properties produces TypeScript compiler errors.
- **Reproduction Steps:**
  1. Inspect `packages/shared/src/types/mission.ts`.
  2. Attempt to read `mission.budgetUsd` or `mission.mandatoryCategories` in a typed file.
- **Expected Result:** `Mission` interface includes all fields defined in `docs/data-dictionary.md` Section 2.
- **Actual Result:** TypeScript error: Property 'budgetUsd' does not exist on type 'Mission'.
- **Status:** **OPEN**

---

### BUG-005: Risk of Power Reserve Factor Desync (Frontend Preview vs Backend Evaluator)
- **Severity:** P1 — High
- **Affected Module:** `apps/web/src/features/spacecraft-builder/` vs `apps/api/src/services/feasibility.service.ts`
- **Assigned Owner:** Sriganesh (Person 1 — UI Preview) & Vineeth (Person 2 — Backend Evaluator)
- **Description:** `missions.json` specifies `powerReserveFactor: 1.1` (10% safety margin). If the frontend workshop preview compares raw generation against raw draw ($\text{Output} \ge \text{Draw}$) while the backend evaluator enforces $\text{Output} \ge \text{Draw} \times 1.1$, players will see a green "Power OK" indicator in the workshop, but receive a mission failure (FC-3 FAIL) on the Results screen.
- **Reproduction Steps:**
  1. Configure spacecraft with 80 W solar panels and 75 W total subsystem power draw.
  2. Observe frontend preview: $80 \ge 75$ -> shows green.
  3. Submit to backend: requires $75 \times 1.1 = 82.5\text{ W}$, $80 < 82.5$ -> evaluates to FAIL.
- **Expected Result:** Frontend preview must incorporate `powerReserveFactor` directly from mission metadata so preview matches backend evaluation exactly.
- **Actual Result:** Calculation logic not yet implemented in frontend store.
- **Status:** **OPEN**

---

### BUG-006: Shared Component Interface Missing Orbit Timing Properties
- **Severity:** P2 — Medium
- **Affected Module:** `packages/shared/src/types/component.ts`
- **Assigned Owner:** Vineeth (Person 2 — Shared Types)
- **Description:** `Component` interface only defines `id: string` and `name: string`. Phase 2 added `eclipseMinutes` and `contactWindowMinutesPerOrbit` to orbit entries in `components.json`. Without typing these fields in the shared package, backend battery (FC-4) and comms (FC-5) services cannot access them in a type-safe manner.
- **Reproduction Steps:**
  1. Inspect `packages/shared/src/types/component.ts`.
- **Expected Result:** `Component` interface includes optional fields: `massKg?`, `powerDrawW?`, `powerOutputW?`, `capacityWh?`, `dataRateMbps?`, `costUsd?`, `eclipseMinutes?`, `contactWindowMinutesPerOrbit?`, `payloadCapacityKg?`, `supportedOrbitIds?`.
- **Actual Result:** Minimal stub.
- **Status:** **OPEN**

---

### BUG-007: Absence of Continuous Scoring Degradation Curves in Evaluator
- **Severity:** P2 — Medium
- **Affected Module:** `apps/api/src/services/scoring.service.ts`
- **Assigned Owner:** Vineeth (Person 2 — Scoring Service)
- **Description:** The current proposal in `component-suitability.json` relies on discrete component suitability ratings (ranging between 40 and 95). Every fully feasible spacecraft mathematically scores $\ge 68.75\%$. Continuous degradation curves are required to generate fractional scores across the full 0–100 spectrum and to enable an exact 30.0% boundary test on a feasible design.
- **Reproduction Steps:**
  1. Calculate score for minimal feasible design: yields 78.6%.
  2. Attempt to construct a feasible design scoring exactly 30%: blocked by discrete values.
- **Expected Result:** Backend scoring service provides continuous mathematical scaling curves based on resource margins (mass margin ratio, power margin ratio, telemetry buffer ratio).
- **Actual Result:** Backend scoring service is an empty stub.
- **Status:** **OPEN**

---

## Backend Resolution Log (added by Vineeth during integration; Tanishka's entries above are unchanged)

| Bug | Backend status | Evidence |
|---|---|---|
| BUG-002 | **FIXED (backend)**. API built and tested: all 6 endpoints, resource, feasibility, scoring, finance services. Real URL is `POST /api/designs` then `POST /api/designs/:id/evaluate` (not `/api/evaluation`); default port 4000, not 3001. | `tests/integration/mission-flow.test.ts`, 99 passing tests |
| BUG-004 | **FIXED**. `Mission` now has all Phase 2 fields. | `packages/shared/src/types/mission.ts` |
| BUG-005 | **Backend ready, UI still open (Sriganesh)**. `powerReserveFactor` (1.1) is served in `GET /api/missions/:id`; the preview must use it. | integration test asserts `powerReserveFactor === 1.1` |
| BUG-006 | **FIXED**. `Component` has `eclipseMinutes`, `contactWindowMinutesPerOrbit` and all optional fields. | `packages/shared/src/types/component.ts` |
| BUG-007 | **OPEN, needs a team decision**. Static suitability keeps filled designs at about 55 or higher; a score below 30 only occurs when categories are missing. Options in `docs/phase-reports/PVineeth-integration-3.md`. | `tests/unit/fixture-matrix.test.ts` |
| BUG-001, BUG-003 | Not backend (Pannaga, Sriganesh). Still open. | |

New finding (P2, Tanishka): several of her example totals disagree with her own component data (see `docs/phase-reports/PVineeth-integration-2.md` and `-3.md`), and her expected scores (78.6, 86.75) differ from the engine (75.96, 85.08).
