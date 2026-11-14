# API Contract (v0, Phase 1 — evaluation is a MOCK)

Base URL: `http://localhost:4000` (env `PORT`). CORS origin: env `WEB_ORIGIN`.
Types live in `packages/shared/src/types`. IDs are stable strings.

| Method | Path | Purpose |
|---|---|---|
| GET | /health | `{status:"ok"}` |
| GET | /api/missions | `{missions: Mission[]}` |
| GET | /api/missions/:id | `{mission: Mission}` |
| GET | /api/components[?category=] | `{components: Component[]}` |
| POST | /api/designs | Save design → 201 `{design: Spacecraft}` |
| POST | /api/designs/:id/evaluate | `{evaluation: Evaluation}` |
| GET | /api/results/:id | `{evaluation: Evaluation}` |

## POST /api/designs body (DesignInput)
`{ missionId, name?, componentIds: string[] (unique, ≥1), orbitId, launchVehicleId }`
Unknown fields are rejected. Never send scores/totals; the server recomputes everything.

## Errors
`{ "error": { "code", "message", "details?" } }` — codes: VALIDATION_ERROR (400), BAD_JSON (400), MISSION_NOT_FOUND / DESIGN_NOT_FOUND / RESULT_NOT_FOUND / NOT_FOUND (404), INTERNAL (500).

## Flow
1. POST /api/designs → `design.id`
2. POST /api/designs/{id}/evaluate → `evaluation` (also fetchable via /api/results/{evaluation.id})

## curl
```
curl -XPOST localhost:4000/api/designs -H 'content-type: application/json' \
 -d '{"missionId":"earth-observation-01","componentIds":["bus-basic","solar-std","inst-optical"],"orbitId":"orbit-leo","launchVehicleId":"launch-a"}'
curl -XPOST localhost:4000/api/designs/<designId>/evaluate
```
## Known limits (Phase 1)
Evaluation returns fixed placeholder values (`mock: true`, score 75). Missions/components are placeholder data. Storage is in-memory. Orbit/launcher IDs are not yet validated against the catalogue (Phase 2).

## Phase 2 additions (additive, non-breaking)
- `Evaluation.resources` is now real, server-calculated: `{massKg, powerDrawW, powerOutputW, batteryWh, dataRateMbps, launcherCapacityKg, costUsd}`. Mass/power cover spacecraft parts only; cost also includes orbit + launcher. Score/finance are still mock.
- New error `INVALID_DESIGN` (400) with `details: string[]` for: unknown component/orbit/launcher IDs, orbit or launcher listed in `componentIds`, wrong-category orbitId/launchVehicleId, or more than one part in a category (instruments may repeat). POST /api/designs now returns it.
- Launchers carry `supportedOrbitIds` (not yet enforced; Phase 3).
- Known sample totals (test fixture IDs, NOT the real catalogue): `bus-basic, solar-std, battery-std, comms-basic, computer-std, adcs-basic, inst-a` + orbit `orbit-x` + launcher `launch-x` -> mass 85 kg, draw 73 W, output 120 W, battery 200 Wh, 2 Mbps, cost 330,000 USD. Fixture lives in `tests/fixtures/catalogue.ts`. Real sample totals will be published once the real catalogue is loaded.
- Placeholder data was removed: until real data is loaded, `GET /api/missions` and `GET /api/components` return empty lists and `POST /api/designs` returns `MISSION_NOT_FOUND`.

## Phase 3 additions (evaluation is now real; finance still placeholder)
`POST /api/designs/:id/evaluate` now returns server-calculated:
- `score` (0-100, 2 decimals), `categoryScores[{category,score,weight}]` (weights sum to 100).
- `feasibilityChecks[{id,passed,message}]` — ids: `mandatory`, `mass`, `power`, `orbit-launcher`. All checks always run and are all returned.
- `feasible` = every check passed. `status` = `"success"` only if `feasible` AND score >= 30; otherwise `"failed"`.
- `feedback: string[]` — actionable text (failed checks, weak categories, threshold). No hidden answer keys.
- `finance` is still zeros and `mock: true` until Phase 4.

Rules: score < 30 fails the score threshold; exactly 30 passes it (threshold applied to the score rounded to 2 decimals). Feasibility is independent of score: a score of 30 with a failed check is `"failed"`. Per scoring category, performance = mean over its part-categories of the best suitability among selected parts (0 if none selected, so extra weaker instruments never hurt).

New error: `SCORING_NOT_CONFIGURED` (503) if the mission has no scoring config on the server. This is the case right now: the private data files are empty.

## Phase 4 additions (finance is real)
`evaluation.finance` = `{ rewardUsd, totalCostUsd, profitUsd, rewardFraction, costBreakdown:{componentsUsd, orbitUsd, launchUsd, operationsUsd} }` — whole USD.
- `totalCostUsd` = parts + orbit + launcher + fixed mission-operations cost (server config).
- `rewardUsd` = base reward x tier fraction. Illustrative tiers (UNCONFIRMED): score >=90 -> 1.0; >=70 -> 0.85; >=50 -> 0.6; >=30 -> 0.3; else 0.
- **Failed-mission policy:** `status:"failed"` (infeasible OR score < 30) earns **no reward** but all costs still apply.
- `profitUsd = rewardUsd - totalCostUsd`; negative = a loss and is valid.
- `mock` is now always `false`. New error `FINANCE_NOT_CONFIGURED` (503) if the mission has no finance config (empty until base reward / operations cost are agreed).
- `GET /api/results/:id` returns the stored evaluation (`{evaluation}`); storage is in-memory, so results are lost on server restart. Budget overrun is not enforced; it only shows as a loss.

## Phase 5 additions
- New error `PAYLOAD_TOO_LARGE` (413) for bodies over 100 kb.
- Stricter validation: IDs are trimmed, 1-64 chars; `componentIds` max 30; `name` trimmed 1-80.
- Bare `null`/string/number bodies return `BAD_JSON`.
- **Contract frozen for the demo** apart from coordinated changes. Final list of error codes: `docs/api-documentation.md`.

## Integration 1 (Tanishka Phase 1: mission seed)
- `Mission` now has 4 more fields (all from `apps/api/src/data/missions.json`, validated at startup): `mandatoryCategories: ComponentCategory[]`, `powerReserveFactor: number`, `allowedOrbitIds: string[]`, `lifetimeMonths: number`. Returned by `GET /api/missions` and `/api/missions/:id`. Real mission: `earth-observation-01` ("Eyes on Earth", 500,000 USD, reserve 1.1, orbits `leo-500`, `sso-600`).
- New feasibility check `orbit-allowed` (id) when a mission lists `allowedOrbitIds`.
- Frontend can use `mandatoryCategories` for completeness hints and `allowedOrbitIds` to filter orbits.
- Evaluate for this mission still returns 503 until components, scoring weights/suitability and finance config are integrated.
