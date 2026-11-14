# API Documentation (backend)

Express + TypeScript, one modular app (`apps/api`). Shared types: `packages/shared/src/types`. Request/response details and examples: `docs/api-contract.md`.

## Setup
```
npm install                       # from repo root (single lockfile)
cp .env.example .env              # optional; defaults work locally
npm run dev   --workspace apps/api   # watch mode, http://localhost:4000
npm start     --workspace apps/api   # run once
npm run typecheck --workspace apps/api
npm test      --workspace apps/api   # unit + HTTP integration tests
```

## Environment variables
| Name | Default | Purpose |
|---|---|---|
| `PORT` | 4000 | listen port |
| `WEB_ORIGIN` | any origin | CORS origin of the web app in production |
| `DATABASE_URL` | unused | reserved; no database is used yet |
No secrets are committed. `.env.example` has placeholders only.

## Endpoints
`GET /health`, `GET /api/missions`, `GET /api/missions/:id`, `GET /api/components[?category=]`, `POST /api/designs`, `POST /api/designs/:id/evaluate`, `GET /api/results/:id`.

## How evaluation works (server-authoritative)
1. Client sends IDs only (`missionId, componentIds, orbitId, launchVehicleId`). Any extra field (totals, score) is rejected.
2. IDs are checked against the server catalogue; resources (mass, power, battery, data, cost) are recomputed.
3. Feasibility checks run (mandatory subsystems, mass vs launcher, power with reserve, orbit/launcher).
4. Weighted suitability score; `status` is `success` only if feasible AND score >= 30 (exactly 30 passes the score check).
5. Finance: reward tier x base reward, minus total cost. Failed missions earn no reward but pay costs; negative profit is valid.
6. The evaluation is stored in memory and returned by `GET /api/results/:id`.

## Private server data (never served; currently EMPTY)
`apps/api/src/data/`: `mock.ts` (public missions + components), `scoring-weights.ts`, `component-suitability.ts`, `mission-rules.ts`, `finance-config.ts`. Until a mission has entries in all of these, `evaluate` returns 503 (`SCORING_NOT_CONFIGURED` / `FINANCE_NOT_CONFIGURED`). Integration tests inject fixtures from `tests/fixtures/`.

## Error codes
| HTTP | code | Meaning |
|---|---|---|
| 400 | VALIDATION_ERROR | wrong shape, missing/extra field, empty/duplicate/oversized lists, blank IDs |
| 400 | BAD_JSON | malformed JSON (also bare null/string/number bodies) |
| 400 | INVALID_DESIGN | unknown IDs, wrong category, orbit/launcher in componentIds, 2 parts in one category |
| 404 | MISSION_NOT_FOUND / DESIGN_NOT_FOUND / RESULT_NOT_FOUND / NOT_FOUND | unknown resource or route |
| 413 | PAYLOAD_TOO_LARGE | body over 100 kb |
| 503 | SCORING_NOT_CONFIGURED / FINANCE_NOT_CONFIGURED | mission has no server scoring/finance config |
| 500 | INTERNAL | unexpected error (details are logged, not returned) |
Shape: `{ "error": { "code", "message", "details?" } }`.

## Deployment (Render)
Build: `npm install`. Start: `npm start --workspace apps/api`. Set `PORT` (Render sets it) and `WEB_ORIGIN` to the deployed web URL. `tsx` is a runtime dependency, so no build step. Storage is in-memory: designs/results reset on every restart/deploy.

## Known limitations
In-memory storage (no Prisma/PostgreSQL), no authentication or ownership checks, no budget enforcement, no rate limiting, real mission/scoring/finance data pending.
