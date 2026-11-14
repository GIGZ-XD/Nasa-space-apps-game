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
