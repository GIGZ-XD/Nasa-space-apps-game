# Integration 1: Vineeth backend x Tanishka Phase 1 (mission seed) - Status: DONE

## Integrated
- `apps/api/src/data/missions.json` (her file, unmodified), `docs/missions/earth-observation-01.md`, `docs/game-design.md`.
- Loader `data/missions-loader.ts` validates with Zod at startup (fixed category list, no unknown fields, unique IDs, non-empty).
- `Mission` type extended; `mission-rules.ts` now derives feasibility rules from the seed; new `orbit-allowed` check (her rule C-05).
- 55/55 tests pass; typecheck passes.

## Her Phase 1 questions, answered
- Fields `mandatoryCategories`, `powerReserveFactor`, `allowedOrbitIds`, `lifetimeMonths`: ADOPTED.
- `computer` and `adcs` separate: kept (her seed lists both).
- Categories: the nine agreed strings; seed validates against them.

## Not integrated yet / needs a decision
1. **C-03 battery vs eclipse** and **C-04 comms contact window**: need per-orbit `eclipseMinutes`/`contactWindowMinutes` and instrument data rates. Not in the seed; Tanishka's Phase 2 data (or a decision) must define them. Not implemented.
2. **C-07 budget** (her doc: hard block or score-only?): currently NOT enforced; overspend shows only as a loss. Decision pending.
3. Her docs say "Phase 1 & 2 ... pending Vineeth confirmation"; this report is that confirmation for the fields only.
4. Seed orbit IDs `leo-500`, `sso-600` cannot be checked against the catalogue until components.json is integrated (Phase 2).
5. Evaluate returns 503 until scoring weights, suitability and finance config exist. She did not define weights (her doc leaves them to backend): team must decide.
6. Her mission doc says the mission has "six" subsystem groups while the seed lists nine categories (orbit and launcher included): consistent, just counted differently.
