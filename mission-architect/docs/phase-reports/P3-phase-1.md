# P3 — Phase 1: Builder Types, Catalogue and State

- **Owner:** Sriganesh
- **Role:** Spacecraft Builder and Resource UI Engineer
- **Phase:** 1
- **Timebox:** 0:30–1:45
- **Status:** DONE
- **Branch:** `feature/sriganesh-spacecraft-builder`
- **Base branch:** `sriganesh` → `main` (no `develop` branch existed; branched from `sriganesh` which tracks `main`)

---

## 1. Objective

Phase 1 creates the typed, testable foundation for the spacecraft builder workstream. Specifically:

- Define all relevant TypeScript types for components, categories, designs, orbits, and launchers.
- Create a local catalogue adapter that provides provisional component, orbit and launcher data to the builder without coupling to a backend API.
- Implement the Zustand-based spacecraft builder store that manages the entire interactive selection state.
- Support adding, removing, selecting and resetting components, plus orbit and launcher selection.
- Normalize the current selected design into a serializable, API-ready payload.
- Cover all store behaviors with 31 unit tests.

---

## 2. Work Completed

| Task | Status |
|---|---|
| A — TypeScript types (component, design, orbit, launcher) | ✅ Done |
| B — Local catalogue adapter with provisional mock data | ✅ Done |
| C — Zustand spacecraft builder store with all required actions | ✅ Done |
| D — API-ready design normalization (`buildNormalizedPayload`) | ✅ Done |
| Unit tests for all store behaviors (31 tests, 31 pass) | ✅ Done |
| TypeScript type checking (shared + web) | ✅ Passes clean |
| Phase 1 documentation report | ✅ This file |

---

## 3. Work Not Completed

- Phase 2 UI work (component catalogue UI, cards, resource meters, Phaser visual preview) — out of scope for Phase 1.
- API-backed catalogue adapter (will replace local adapter in Phase 2 or 3 once Vineeth's endpoints are available).
- Scoring and feasibility evaluation — explicitly out of scope.
- E2E / integration tests — none existed in the repository; only unit tests were added.

---

## 4. Files Created or Modified

| File | Action | Description |
|---|---|---|
| `packages/shared/src/types/component.ts` | Modified | Expanded from stub to full `Component`, `ComponentCategory`, `OrbitTarget`, `LauncherTarget` interfaces with documented units |
| `packages/shared/src/types/design.ts` | Created | `SelectedComponentReference`, `SpacecraftDesign`, `NormalizedDesignPayload` interfaces |
| `packages/shared/src/types/spacecraft.ts` | Modified | Updated to reference `SpacecraftDesign` from design types |
| `packages/shared/src/index.ts` | Modified | Added export for new `design.ts` |
| `packages/shared/package.json` | Modified | Added `version`, `main`, `types`, `exports` fields for workspace resolution |
| `packages/shared/tsconfig.json` | Created | TypeScript config extending `tsconfig.base.json` for the shared package |
| `apps/web/src/features/component-catalogue/component.types.ts` | Created | Feature-scoped re-exports and `ComponentCatalogueFilter` type |
| `apps/web/src/features/spacecraft-builder/design.types.ts` | Created | Feature-scoped re-exports and `BuilderSelectionState` type |
| `apps/web/src/features/component-catalogue/componentData.ts` | Created | `ComponentCatalogueSource` interface, `LocalComponentCatalogueAdapter` class, 15 provisional components, 4 orbits, 3 launchers |
| `apps/web/src/stores/spacecraftStore.ts` | Modified (replaced stub) | Full Zustand store with all actions, selectors, and payload normalization |
| `apps/web/src/stores/spacecraftStore.test.ts` | Created | 31 unit tests covering all store behaviors |
| `apps/web/tsconfig.json` | Created | TypeScript config for the web app with path aliases for `@mission-architect/shared` |
| `apps/web/package.json` | Modified | Added `zustand ^5.1.0`, `vitest ^2.1.9`, `@mission-architect/shared: *`, and `test` / improved `build` scripts |
| `package.json` (root) | Modified | Added `test` and `typecheck` scripts |
| `package-lock.json` | Created | npm lock file from workspace `npm install` |
| `docs/phase-reports/P3-phase-1.md` | Created | This report |

---

## 5. Architecture and Implementation Details

### Type Definitions (`packages/shared/src/types/`)

**`component.ts`** defines:

- `ComponentCategory` — union type: `"structure" | "power" | "propulsion" | "thermal" | "communications" | "avionics" | "payload"`.
- `Component` — full catalogue entry with `id`, `name`, `category`, `description`, `massKg` (kg), `powerWatts` (W, positive=consumption, negative=generation), `costCredits` (credits), `thermalWatts` (W), and an optional `specs` bag for subsystem-specific values.
- `OrbitTarget` — `id`, `name`, `type` (orbit regime), `altitudeKm` (km), `inclinationDeg` (°), `deltaVRequiredMps` (m/s), `description`.
- `LauncherTarget` — `id`, `name`, capacities to LEO/GTO in kg, `costCredits`, fairing dimensions in meters, `reliabilityPercent`, `description`.

**`design.ts`** defines:

- `SelectedComponentReference` — an installed component slot: `instanceId` (unique per instance), `componentId` (references `Component.id`), optional `slot`, `addedAt` timestamp (epoch ms).
- `SpacecraftDesign` — full design state: `id`, `name`, `selectedComponents[]`, `selectedOrbitId`, `selectedLauncherId`, `createdAt`, `updatedAt`.
- `NormalizedDesignPayload` — serializable API-ready payload: `designId`, `spacecraftName`, `componentIds[]`, `orbitId`, `launcherId`, `isComplete`, and `summary` (totals, categoriesPresent, missingRequiredCategories).

### Catalogue Adapter (`apps/web/src/features/component-catalogue/componentData.ts`)

The file defines:

1. **`ComponentCatalogueSource` interface** — the abstraction contract with `getComponents`, `getComponentById`, `getComponentsByCategory`, `getOrbits`, `getOrbitById`, `getLaunchers`, `getLauncherById`. All return synchronous values or Promises, making API-backed adapters drop-in replacements.

2. **`PROVISIONAL_COMPONENTS`** — 15 provisional components across all 7 categories with realistic mass/power/cost/thermal values and subsystem specs.

3. **`PROVISIONAL_ORBITS`** — 4 target orbits (LEO-400, SSO-600, GEO, Lunar polar).

4. **`PROVISIONAL_LAUNCHERS`** — 3 vehicles (Electron, Vega-C, Falcon 9).

5. **`LocalComponentCatalogueAdapter`** — a class implementing `ComponentCatalogueSource` from local arrays. Singleton instance `localCatalogueAdapter` exported for immediate use.

6. **Convenience helpers** — `getCatalogueComponentById`, `getCatalogueComponentsByCategory`, `getCatalogueOrbitById`, `getCatalogueLauncherById`.

> **PROVISIONAL DATA NOTICE:** All IDs, values and categories are provisional. Tanishka must review and confirm or replace them. See §8 for details.

### Store Structure (`apps/web/src/stores/spacecraftStore.ts`)

Built with **Zustand** (already the most suitable lightweight store for a Vite + React project; no context providers required; accessible from both React and Phaser).

**State shape:**

```ts
{
  design: SpacecraftDesign;
  selectedInstanceId: string | null;
}
```

**Actions:**

| Action | Signature | Behavior |
|---|---|---|
| `addComponent` | `(componentId: string) => void` | Validates against catalogue; rejects unknowns and exact duplicate `componentId`s |
| `removeComponent` | `(instanceId: string) => void` | Removes by instanceId; clears `selectedInstanceId` if that instance was selected |
| `selectComponent` | `(instanceId: string | null) => void` | Validates instance exists or accepts null; does not silently select unknown IDs |
| `resetDesign` | `() => void` | Clears all state; creates a fresh design ID and name |
| `setDesignName` | `(name: string) => void` | Trims and sets spacecraft display name |
| `setOrbit` | `(orbitId: string | null) => void` | Sets or clears the orbit selection |
| `setLauncher` | `(launcherId: string | null) => void` | Sets or clears the launcher selection |
| `getDesign` | `() => SpacecraftDesign` | Returns a snapshot of the current design |
| `buildNormalizedPayload` | `() => NormalizedDesignPayload` | Returns the API-ready payload |

**Selectors** (for optimized Zustand subscriptions):

- `selectDesign` — full design object
- `selectSelectedComponents` — selected component references list
- `selectIsDesignComplete` — boolean completeness check
- `selectNormalizedPayload` — derived API payload

### Payload Normalization

```ts
buildNormalizedPayload(): NormalizedDesignPayload
```

Returns a clean, flat payload. Example of a complete design:

```json
{
  "designId": "design-1731694200000-abc123",
  "spacecraftName": "My LEO Observer",
  "componentIds": [
    "comp-bus-cubesat-3u",
    "comp-pwr-solar-fixed-3u",
    "comp-com-patch-antenna-uhf",
    "comp-avi-onboard-computer"
  ],
  "orbitId": "orbit-leo-400",
  "launcherId": "launcher-electron",
  "isComplete": true,
  "summary": {
    "totalComponents": 4,
    "categoriesPresent": ["structure", "power", "communications", "avionics"],
    "missingRequiredCategories": []
  }
}
```

**Required categories for `isComplete = true` (provisional):**
`structure`, `power`, `communications`, `avionics` — plus non-null `orbitId` and `launcherId`.

> ⚠️ **PROVISIONAL:** These required categories and all field names await confirmation from Vineeth (backend contract) and Tanishka (data).

---

## 6. Git Commit History

| Commit hash | Commit message | What changed |
|---|---|---|
| `d08b520` | `feat(builder): define spacecraft and component types` | All shared types, feature re-exports, tsconfigs, package.json updates |
| `ce4e73e` | `feat(catalogue): add local component catalogue adapter` | Full local catalogue adapter with 15 components, 4 orbits, 3 launchers |
| `9b00ff5` | `feat(builder): implement spacecraft selection store` | Zustand store with all actions, selectors, and payload normalization |
| `974c642` | `test(builder): cover add remove select and reset` | 31 unit tests covering all store behaviors |
| *(this commit)* | `docs(phase): document P3 phase 1 implementation and handoff` | This report |

---

## 7. Tests and Validation

| Command | Result | Notes |
|---|---|---|
| `tsc -p packages/shared` | ✅ PASS (0 errors) | All shared types valid |
| `tsc -p apps/web` | ✅ PASS (0 errors) | Web app types valid including store and catalogue |
| `npm run typecheck` (root) | ✅ PASS | Runs both tsconfigs sequentially |
| `npx vitest run src/stores/spacecraftStore.test.ts` | ✅ PASS — 31/31 tests | All store behaviors covered |
| `npm run build` (before tsconfig setup) | ❌ FAIL — `tsconfig.json` missing | Pre-existing; fixed by creating `apps/web/tsconfig.json` |

---

## 8. API and Data Changes

### Component IDs (provisional, requires Tanishka confirmation)

| ID | Category | Mass (kg) | Power (W) |
|---|---|---|---|
| `comp-bus-cubesat-3u` | structure | 1.5 | +1.0 |
| `comp-bus-smallsat-espahigh` | structure | 45.0 | +15.0 |
| `comp-pwr-solar-fixed-3u` | power | 0.4 | -24.0 (gen) |
| `comp-pwr-solar-deployable-100w` | power | 2.2 | -100.0 (gen) |
| `comp-pwr-battery-li-ion-50wh` | power | 0.8 | +0.5 |
| `comp-prop-cold-gas-thruster` | propulsion | 3.2 | +5.0 |
| `comp-prop-biprop-engine` | propulsion | 7.0 | +12.0 |
| `comp-prop-hall-thruster-ion` | propulsion | 8.5 | +140.0 |
| `comp-thm-passive-mli` | thermal | 0.5 | 0.0 |
| `comp-thm-active-radiator-panel` | thermal | 3.0 | +6.0 |
| `comp-com-patch-antenna-uhf` | communications | 0.9 | +9.0 |
| `comp-com-xband-dish` | communications | 3.4 | +38.0 |
| `comp-avi-onboard-computer` | avionics | 0.7 | +5.5 |
| `comp-avi-adcs-reaction-wheels` | avionics | 2.1 | +15.0 |
| `comp-pld-multispectral-imager` | payload | 4.8 | +26.0 |
| `comp-pld-space-weather-mag` | payload | 1.1 | +3.5 |
| `comp-pld-synthetic-aperture-radar` | payload | 16.5 | +130.0 |

### Orbit IDs (provisional)

| ID | Type | Alt (km) | ΔV (m/s) |
|---|---|---|---|
| `orbit-leo-400` | LEO | 400 | 9400 |
| `orbit-sso-600` | SSO | 600 | 9650 |
| `orbit-geo-35786` | GEO | 35786 | 13850 |
| `orbit-lunar-polar-100` | LUNAR | 100 | 15200 |

### Launcher IDs (provisional)

| ID | LEO cap (kg) | GTO cap (kg) | Cost |
|---|---|---|---|
| `launcher-electron` | 300 | 0 | 75000 |
| `launcher-vega-c` | 2300 | 800 | 140000 |
| `launcher-falcon9` | 22800 | 8300 | 260000 |

### API Payload Contract (provisional — requires Vineeth confirmation)

```ts
interface NormalizedDesignPayload {
  designId: string;
  spacecraftName: string;
  componentIds: string[];
  orbitId: string | null;
  launcherId: string | null;
  isComplete: boolean;
  summary: {
    totalComponents: number;
    categoriesPresent: ComponentCategory[];
    missingRequiredCategories: ComponentCategory[];
  };
}
```

---

## 9. How to Run and Verify

```bash
# From repository root (Nasa-space-apps-game/)
cd mission-architect

# Install dependencies (already done)
npm install

# TypeScript check
npm run typecheck

# Run unit tests
npm run test

# Manual verification in browser (Vite dev server)
npm run dev
```

**Manual store verification in browser console (after `npm run dev`):**

```ts
import { useSpacecraftStore } from "./src/stores/spacecraftStore";
const store = useSpacecraftStore.getState();
store.addComponent("comp-bus-cubesat-3u");
store.addComponent("comp-pwr-solar-fixed-3u");
store.addComponent("comp-com-patch-antenna-uhf");
store.addComponent("comp-avi-onboard-computer");
store.setOrbit("orbit-leo-400");
store.setLauncher("launcher-electron");
console.log(store.buildNormalizedPayload());
// → isComplete: true
```

**From Phaser game scenes (direct state access):**

```ts
import { useSpacecraftStore } from "@/stores/spacecraftStore";
const { design, addComponent } = useSpacecraftStore.getState();
```

---

## 10. Known Issues and Limitations

| Issue | Severity | Notes |
|---|---|---|
| All component, orbit, and launcher data is provisional mock data | Medium | Awaiting Tanishka's official dataset |
| Required category set for `isComplete` is provisional | Medium | Awaiting Vineeth's API contract |
| `npm run build` was broken pre-Phase 1 (`tsconfig.json` missing) | Fixed | Added `apps/web/tsconfig.json` |
| `vite build` (`tsc -b`) full composite build not configured | Low | Currently uses `tsc --noEmit` check; a full composite build requires `tsconfig.app.json` and `tsconfig.node.json` split, which is a future hardening task |
| npm audit reports 2 existing vulnerabilities (vite) | Low | Pre-existing; not introduced in Phase 1 |
| No duplicate component enforcement beyond "one per componentId" | Low | Phase 2 may need to allow multiple units of the same component (e.g., redundant avionics) — requires design decision |

---

## 11. Team Dependencies and Handoff

### For Pannaga — Frontend & Integration Owner

**Store usage:**

```ts
import { useSpacecraftStore } from "@/stores/spacecraftStore";

// React component
const { addComponent, removeComponent, design } = useSpacecraftStore();

// Or via selector (avoids re-renders when unrelated state changes)
const components = useSpacecraftStore(selectSelectedComponents);
const payload = useSpacecraftStore(selectNormalizedPayload);
```

**Available actions:** `addComponent`, `removeComponent`, `selectComponent`, `resetDesign`, `setDesignName`, `setOrbit`, `setLauncher`, `getDesign`, `buildNormalizedPayload`.

**API-ready payload:** call `buildNormalizedPayload()` or use the `selectNormalizedPayload` selector. See §8 for shape.

**Needs confirmation:** field names in `NormalizedDesignPayload` with Vineeth before wiring API calls.

---

### For Sonakshi — Phaser Visuals

**Component categories** available for visual slot mapping:
`"structure"`, `"power"`, `"propulsion"`, `"thermal"`, `"communications"`, `"avionics"`, `"payload"`.

**Stable component IDs** for visual asset mapping: see the full list in §8.

**Reading design state from a Phaser scene** (no React dependency):

```ts
import { useSpacecraftStore } from "@/stores/spacecraftStore";
const { design } = useSpacecraftStore.getState();
// design.selectedComponents[n].componentId → map to visual sprite / slot
```

**Selected instance ID** (`selectedInstanceId` in store state) can be used to highlight the active component slot in the Phaser canvas.

---

### For Vineeth — Backend

**Payload sent to backend:**

```json
{
  "designId": "design-<timestamp>-<rand>",
  "spacecraftName": "string",
  "componentIds": ["comp-bus-cubesat-3u", "..."],
  "orbitId": "orbit-leo-400",
  "launcherId": "launcher-electron",
  "isComplete": true,
  "summary": { ... }
}
```

**Needs confirmation from you:**
1. Final field names and envelope format for the design submission endpoint.
2. Whether `summary` should be omitted from the request (computed server-side).
3. Required component category rules for `isComplete` — currently `structure + power + communications + avionics`.
4. Any component IDs that differ from the provisional IDs in §8.

---

### For Tanishka — Mission Data

**Provisional data** in `apps/web/src/features/component-catalogue/componentData.ts`:

- 15 provisional components (all marked `// PROVISIONAL` in source header).
- 4 provisional orbit targets.
- 3 provisional launch vehicles.

**Replacement point:** Replace `PROVISIONAL_COMPONENTS`, `PROVISIONAL_ORBITS`, and `PROVISIONAL_LAUNCHERS` in `componentData.ts` or implement the `ComponentCatalogueSource` interface backed by the API.

**Needs confirmation from you:**
1. Accurate component IDs to use (current IDs are provisional slugs).
2. Official mass, power, cost, thermal values for each component.
3. Category assignments — are all 7 current categories (`structure`, `power`, `propulsion`, `thermal`, `communications`, `avionics`, `payload`) correct?
4. Any missing component types not represented in the current 15.
5. Orbit target parameters (altitude, inclination, deltaV values).

---

## 12. Next Phase Starting Point

Phase 2 (UI) is ready to begin. The following is now available:

- Fully typed component catalogue data via `localCatalogueAdapter`.
- Store with all needed actions and selectors.
- Serializable design state and normalized API payload.

**Phase 2 start point:**
1. Build the component catalogue UI (category tabs, component cards) using `localCatalogueAdapter.getComponents()` and `getCatalogueComponentsByCategory()`.
2. Connect store actions (`addComponent`, `removeComponent`, `selectComponent`) to UI events.
3. Build resource meter calculations (derive from `selectedComponents` + `Component.massKg`, `powerWatts`, etc.).
4. Build orbit and launcher selector UI connected to `setOrbit` / `setLauncher`.
5. Wire `buildNormalizedPayload()` output to the API submission endpoint (pending Vineeth's confirmation).
6. Replace `LocalComponentCatalogueAdapter` with an API-backed implementation once backend is ready.
