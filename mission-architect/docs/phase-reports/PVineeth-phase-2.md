# PVineeth-Phase-2: Mission data and resource calculations - Owner: Vineeth - Status: PARTIAL (placeholder data) - Branch: features/vineeth

## Completed
Mission/component repositories (swap point for real data), mission/component/resource services, ID + category validation, deterministic totals and per-line breakdown, INVALID_DESIGN error, 6 unit tests, `shared/types/resources.ts`.

## Not completed / deviations
- Still on placeholder data in `apps/api/src/data/mock.ts` (13 components, 2 orbits, 2 launchers). Replace with Tanishka's mission seed, components and orbit/launcher data; field names/units may differ.
- Prisma not used. Commits: none made (user handles git manually).
- Rule "one part per category except instruments" is my assumption; confirm with Tanishka.

## Checks
`npm run typecheck --workspace apps/api` pass; `npm test --workspace apps/api` 6/6 pass; curl smoke test of INVALID_DESIGN and real resources pass.

## Handoff
Sriganesh/Tanishka: known sample + expected totals in docs/api-contract.md. Pannaga: additive contract changes listed there.
