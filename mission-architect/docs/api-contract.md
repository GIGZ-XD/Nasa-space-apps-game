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
