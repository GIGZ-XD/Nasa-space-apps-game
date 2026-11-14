# PVineeth-Phase-2: Mission data and resource calculations - Owner: Vineeth - Status: DONE (backend logic); real data pending - Branch: features/vineeth

## Completed
- Repositories (`mission.repository.ts`, `component.repository.ts`) as the single data-source swap point.
- Services: mission, component, resource. `calculateResources` / `resolveDesign` take an injectable `ComponentLookup` (defaults to the real repository).
- Validation: unknown IDs, orbit/launcher in componentIds, wrong-category orbitId/launchVehicleId, two parts in one category (instruments exempt). `INVALID_DESIGN` (400) with all problems listed.
- Deterministic totals + per-line breakdown; `evaluation.resources` is real. Client totals ignored.
- `shared/types/resources.ts`; `supportedOrbitIds` on launchers.
- 7 unit tests (`npm test --workspace apps/api`), using test-only fixture data in `tests/fixtures/catalogue.ts`.

## Not completed / deviations
- `apps/api/src/data/mock.ts` is intentionally EMPTY. No real mission/component data is loaded; the API returns empty lists until teammates' data is integrated.
- Prisma not used. No git commits made by Claude (user handles git).
- "One part per category except instruments" is an implementation assumption, not team-agreed.

## Checks
typecheck pass; 7/7 unit tests pass.

## Assumptions to confirm later
Nine category names, one-per-category rule, two-step save-then-evaluate flow, which categories are mandatory (Phase 3).

## Handoff
Integration of real data is deferred: load missions.json / components.json in the repositories, publish real sample totals, update `docs/api-contract.md`.
