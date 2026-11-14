# PVineeth-Phase-3: Suitability scoring and feasibility - Owner: Vineeth - Status: DONE (engine); real data pending - Branch: features/vineeth

## Completed
- Server-only types `apps/api/src/types/scoring.ts`; private data files `data/{scoring-weights,component-suitability,mission-rules}.ts` (empty, never served); `scoring-config.repository.ts`.
- `compatibility.service.ts` (suitability lookup, config validation: weights = 100, suitability 0..100), `scoring.service.ts` (weighted score), `feasibility.service.ts` (mandatory, mass, power with reserve, orbit/launcher), `evaluation.service.ts` (`buildEvaluation` composes response + feedback).
- Alternatives are scored by suitability, not exact ID match.
- 30% rule: <30 fails, exactly 30 passes the score check; feasibility is independent.
- 24 unit tests pass (`npm test --workspace apps/api`); typecheck passes. Tests use fixtures only (`tests/fixtures/`).

## Not completed / deviations
- No real weights, suitability, mandatory categories or power reserve: data files are empty, so evaluate returns 503 `SCORING_NOT_CONFIGURED` until they are supplied (Tanishka/team).
- Roadmap's `ideal-configurations.ts` not created: the ideal choice is encoded as suitability 100. `evaluation.controller.ts` not created (routes call services directly).
- Unlisted component = suitability 0 and instruments use "best selected" are my assumptions (UNCONFIRMED).
- Finance still placeholder (Phase 4). No git commits made by Claude.

## Handoff
- Tanishka: provide weights, per-component suitability, mandatory categories, power reserve; fixtures in tests/fixtures can be replaced with her good/alternative/failing designs.
- Pannaga: new evaluation fields and 503 error in docs/api-contract.md.
