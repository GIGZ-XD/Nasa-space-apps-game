# Integration 2: Vineeth backend x Tanishka Phase 2 (catalogue + scoring data) - Status: DONE

## Integrated
- `components.json` (20 parts) and `component-suitability.json` (private) copied unmodified into `apps/api/src/data/`; her `docs/data-dictionary.md` and `docs/scoring-system.md` copied in.
- Loaders validate at startup (`components-loader.ts`, `scoring-data-loader.ts`): fixed categories, unique IDs, launcher orbits exist, mission allowed orbits exist, every component has a score and no orphan scores, weights sum to 100. Bad data stops the server.
- Engine: new checks `battery`, `comms`, `budget`; ADCS-vs-IR cap; combination bonus; finance config derived from missions.
- 73/73 tests pass (typecheck clean). Real end-to-end HTTP test with her `minimal-leo` design: score 75.96, success, profit 120,000 USD.

## Decisions I made (her files said "Vineeth to confirm"; all changeable)
| Item | Decision |
|---|---|
| Category weights | Accepted as given (20/25/15/10/15/15) |
| Reward tiers | Accepted (90/70/50/30 -> 100/85/60/30%, below 30 -> 0) |
| Budget overrun | HARD feasibility check |
| uhf-patch vs instruments | Hard fail via the `comms` check (rate rule from her convention) |
| Suitability approach | Static per-component lookup table (not the ratio formulas in her `_scoringApproach` notes) |
| ADCS penalty | Implemented (adcs-std capped at 20 with camera-ir) |
| Combination bonus | Implemented, capped at 100 |
| Orbit timing source | `eclipseMinutes` from components.json (identical to her orbitProperties; contact window not used by her FC-5 formula) |
| Base reward / operations cost | NOT in her data: provisional base reward = budget (500,000), operations = 0. UNCONFIRMED |

## Errors found in her docs (data in JSON is fine; the example totals are wrong)
Her `referenceViableDesigns` totals for two designs do not match her own components:
| Design | Field | Her value | Sum of her components |
|---|---|---|---|
| balanced-sso | massKg / powerDrawW / totalCostUsd | 44 / 85 / 502,000 | 48 / 77 / 534,000 |
| high-performance-sso | massKg / powerDrawW / totalCostUsd | 49.5 / 99 / 562,000 | 50.5 / 91 / 582,000 |
- Her tip "swap bus-medium for bus-small -> 472,000 clean pass" is wrong: it gives 504,000 (still over 500,000).
- Both designs still fail the budget check, so her conclusions about them hold; minimal-leo is exactly right. A budget-friendly SSO design that works: minimal-leo parts with `sso-600` + `launch-b` = 415,000.
- Tanishka should correct `docs/data-dictionary.md` section 7 and `component-suitability.json` referenceViableDesigns totals.

## Bug fixed on my side
`resources.dataRateMbps` summed instrument rates into antenna capacity (invisible with my fixtures). Now communications parts only.

## Not implemented
- Ratio-based suitability formulas (power headroom, battery coverage, comms ratio, bus mass fit, launcher utilisation). Static lookup is used, so a design with a weak power margin scores the same as a comfortable one if the parts are the same.
- `contactWindowMinutesPerOrbit` (stored, unused). Launcher score is not zeroed when it cannot reach the orbit (the `orbit-launcher` check fails the mission anyway).
- Her `tests/fixtures/design-*.json` and QA docs belong to her Phase 3-4 (next integration step).
