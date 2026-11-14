# Smoke Test Checklist — Mission Architect: Beyond Earth

**Document Owner:** Tanishka (Person 5 — Mission Data, QA, Educational Content & Demo)  
**Date:** 2026-11-14  
**Phase:** 4 — End-to-End QA and Bug Triage  
**Status:** Executed Smoke Test Baseline  

---

## Smoke Test Execution Summary

- **Total Checklist Items:** 17
- **PASS:** 0 (Full runtime execution blocked by unmounted UI/API)
- **FAIL:** 0 (No runtime crash observed; failure is due to unimplemented stubs)
- **BLOCKED:** 17 (Blocked by BUG-001 [frontend stubs] and BUG-002 [backend stubs])
- **NOT TESTED (Interactive):** 17 (Interactive browser testing deferred until teammate integration)

---

## Detailed Checklist

| Item # | Inspection Target | Status | Explanation & Technical Evidence |
|---|---|---|---|
| **ST-01** | **Application Startup** | **BLOCKED** | Vite web dev server can boot, but root route loads `HomePage.tsx` which renders `<section>Home</section>` without branding, styling, or navigation links (BUG-001). |
| **ST-02** | **Mission Selection** | **BLOCKED** | `MissionSelectPage.tsx` renders `<section>MissionSelect</section>`. Does not query `/api/missions` or display the "Eyes on Earth" mission card (BUG-001). |
| **ST-03** | **Mission Briefing** | **BLOCKED** | `MissionBriefPage.tsx` renders `<section>MissionBrief</section>`. Mission story, objectives, and requirements from `earth-observation-01.md` are not rendered (BUG-001). |
| **ST-04** | **Component Selection** | **BLOCKED** | `WorkshopPage.tsx` renders `<section>Workshop</section>`. Category selection tabs and component cards from `components.json` are not mounted (BUG-001). |
| **ST-05** | **Orbit Selection** | **BLOCKED** | Orbit selection controls (`leo-500`, `sso-600`) are not rendered in the workshop UI (BUG-001). |
| **ST-06** | **Launcher Selection** | **BLOCKED** | Launcher selection controls (`launch-a`, `launch-b`) are not rendered in the workshop UI (BUG-001). |
| **ST-07** | **Resource Preview** | **BLOCKED** | `spacecraftStore.ts` is an empty object. Real-time mass, power, battery, and cost tally meters are unimplemented (BUG-003, BUG-005). |
| **ST-08** | **Readiness Review** | **BLOCKED** | `MissionControlPage.tsx` renders `<section>MissionControl</section>`. Configuration review summary is not mounted (BUG-001). |
| **ST-09** | **Launch Scene** | **BLOCKED** | `LaunchPage.tsx` renders `<section>Launch</section>`. Phaser launch animation (`LaunchScene.ts`) is not triggered or embedded (BUG-001). |
| **ST-10** | **Evaluation Submission** | **BLOCKED** | `apiClient.ts` is an empty stub. `evaluation.routes.ts` has no POST listener. Design submission payload cannot be dispatched or received (BUG-002). |
| **ST-11** | **Results Rendering** | **BLOCKED** | `ResultsPage.tsx` renders `<section>Results</section>`. Results dashboard is not mounted (BUG-001). |
| **ST-12** | **Score Display** | **BLOCKED** | `scoring.service.ts` is an empty stub. Score breakdown and overall score percentages cannot be calculated or rendered (BUG-002). |
| **ST-13** | **Feasibility Display** | **BLOCKED** | `feasibility.service.ts` is an empty stub. Feasibility check badges (FC-1 to FC-7) cannot be evaluated or rendered (BUG-002). |
| **ST-14** | **Financial Result Display** | **BLOCKED** | `finance.service.ts` is an empty stub. Total expenditure and contract costs are not calculated or rendered (BUG-002). |
| **ST-15** | **Negative Profit Display** | **BLOCKED** | Financial balance computation ($Reward - Cost < 0$) is unmounted. Negative profit display cannot be tested in the UI (BUG-002). |
| **ST-16** | **Educational Feedback** | **BLOCKED** | Educational feedback strings from `docs/educational-feedback.md` are not connected to results evaluation outcomes (BUG-001, BUG-002). |
| **ST-17** | **Navigation & Retry Behavior** | **BLOCKED** | `router.tsx` is an empty object. Navigation between workshop, mission control, and retry flow is not wired up (BUG-001). |

---

## Static QA Verification (Off-Line Math & Data Integrity)

While live browser smoke tests are blocked by teammate stubs, the underlying data, formulas, and fixtures were verified independently:
- **Data Catalogue Integrity:** PASS (All 20 components valid and unique).
- **Mandatory Subsystem Rules:** PASS (All 9 categories defined and verified).
- **Feasibility Logic:** PASS (Verified via PowerShell automated math checks across all 7 fixtures).
- **Educational Feedback Coverage:** PASS (All 10 game outcomes covered in documentation).
