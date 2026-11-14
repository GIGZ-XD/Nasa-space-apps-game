# Integration 3: Vineeth backend x Tanishka Phase 3 (fixtures, test matrix, feedback) - Status: DONE

## Integrated
- 7 fixtures copied unmodified to `tests/fixtures/design-*.json`; `docs/qa/evaluation-test-matrix.md` and `docs/educational-feedback.md` copied in.
- `tests/unit/fixture-matrix.test.ts` runs every fixture through the real engine (real mission, real catalogue, real scoring data).
- 94/94 tests pass (typecheck clean). No backend code changed in this step.

## Result: what matches
- **Feasibility: all 7 fixtures match her expected verdicts on every check** (completeness, mass, power, battery, comms, orbit/launcher, budget, overall).
- Good and alternative designs succeed; the five failure fixtures fail, each for the reason she designed.
- Resource totals match her metrics for 5 of 7 fixtures.

## Where her fixtures are wrong or disagree (needs her correction)
| Fixture | Field | Her value | Engine / sum of her components |
|---|---|---|---|
| design-exactly-30 | powerDrawW / totalCostUsd | 50 / 322,000 | 45 / 337,000 |
| design-failed-score | powerDrawW / totalCostUsd | 63 / 372,000 | 58 / 387,000 |
| design-good | weightedOverallScore | 78.6 | 75.96 |
| design-alternative | weightedOverallScore | 86.75 | 85.08 |
| design-exactly-30 | weightedOverallScore | 30 | 71.63 |
| design-failed-score | weightedOverallScore | 25.54 | 72.04 |

Why the scores differ: (1) her good/alternative scores count only the bus as "structure", but her suitability file says computer and ADCS are included, and her own failed-score fixture uses the group mean (48.3). The engine uses the group mean consistently. (2) Her exactly-30 and failed-score numbers rely on zeroing the orbit, launcher and instrument scores, which her suitability data does not specify (e.g. camera-ir is 85 in her table, not 20). Her expected scores were marked "provisional pending Vineeth" and are NOT reproducible from her own data.

## Findings that need a team decision
1. **Exactly 30 and below-30 cannot be reached by realistic designs.** With the static suitability table, a design that has every category filled scores about 55 or more. A below-30 score only happens when whole categories are missing (e.g. bus + orbit + launcher only). The 30 boundary is tested with fixture configs (`tests/unit/scoring.test.ts`: 29.99, 30, 30-but-infeasible), not with real data. Her blocker note says the same.
2. **Possible fix if you want realistic low scores:** zero the launcher score when it cannot reach the orbit, zero comms when the antenna is too slow, and/or use her ratio formulas. Not implemented (not decided).
3. **Balance issue:** the alternative design (her "verified viable", 486,000 USD) earns the 85% tier = 425,000 USD, so it LOSES 61,000 USD. This comes from my provisional base reward = budget (500,000 USD). With a bigger base reward it would profit. Decide the real base reward.
4. Her educational-feedback modules (10 scenarios) are copy for the results page and were not wired into the API messages. The API returns its own concise feedback.

## Next
Her Phase 4 (end-to-end QA: `tests/e2e/mission-flow.spec.ts`, bug tracker, smoke checklist) and Phase 5 (demo docs) need the frontend; they come after Pannaga's integration.
