# Game Design — Mission Architect: Beyond Earth

**Document Owner:** Tanishka (Person 5 — Mission Data, QA, Educational Content & Demo)
**Phase:** 1 & 2 — Mission Brief, Acceptance Criteria and Data Catalogue
**Status:** Data files delivered — Pending Vineeth confirmation of proposed fields

> **Scope of this document:** This document records the general game-design principles, player journey, mission design approach, MVP scope, educational goals, and scoring rules for Mission Architect — Beyond Earth. It is a companion to the per-mission specification files in `docs/missions/`. It does **not** duplicate content already in those files.

---

## Table of Contents

1. [Game Overview](#1-game-overview)
2. [Player Journey](#2-player-journey)
3. [Mission Design Principles](#3-mission-design-principles)
4. [MVP Scope](#4-mvp-scope)
5. [Educational Goals](#5-educational-goals)
6. [Scoring System Overview](#6-scoring-system-overview)
7. [Challenge Requirements vs Team Decisions](#7-challenge-requirements-vs-team-decisions)
8. [Pending Decisions](#8-pending-decisions)

---

## 1. Game Overview

**Mission Architect — Beyond Earth** is a retro/pixel-art, browser-based space mission design game built for the NASA Space Apps Challenge hackathon.

Players take on the role of a spacecraft design engineer at a fictional space agency. They are presented with mission briefings, choose spacecraft components from a catalogue, assemble a spacecraft configuration, and then submit it for evaluation. The game scores their design and tells them whether their spacecraft could survive in the real conditions of the mission.

The game is intended to be:

- **Educational:** Players learn real spacecraft engineering concepts through the experience of making design decisions and seeing the consequences.
- **Interactive:** Every choice the player makes changes the outcome.
- **Accessible:** No prior knowledge of space engineering is required. The game explains every concept in plain language.
- **Scientifically grounded:** All constraints and scoring rules are based on real principles — mass limits, power budgets, orbital mechanics, communication windows.

---

## 2. Player Journey

The player moves through the following flow for each mission:

```
Mission Select
     │
     ▼
Mission Brief          ← Player reads the mission story and objectives
     │
     ▼
Spacecraft Workshop    ← Player selects components from the catalogue
     │
     ▼
Mission Control        ← Player reviews their assembled design
     │
     ▼
Launch                 ← Player submits the design; animation plays
     │
     ▼
Results                ← Player sees score, feasibility results, and feedback
```

> **Implementation note:** These pages are already scaffolded in `apps/web/src/pages/`. The routes, page components, and navigation logic are managed by the frontend developer (Pannaga, Person 3). Do not modify those files.

### Stage Descriptions

| Stage | Player Action | Game Feedback |
|---|---|---|
| **Mission Select** | Choose a mission to attempt | Mission card with brief description |
| **Mission Brief** | Read mission story, objectives and constraints | Educational context and clear goal |
| **Spacecraft Workshop** | Browse component catalogue and select components | Real-time display of running totals (mass, power, cost) |
| **Mission Control** | Review the assembled spacecraft | Summary of configuration; option to go back and revise |
| **Launch** | Submit the final design | Animated launch sequence (Phaser.js) |
| **Results** | View evaluation outcomes | Score breakdown, feasibility check results, educational feedback |

---

## 3. Mission Design Principles

Each mission in Mission Architect is designed around the following principles:

### 3.1 Real Constraints, Fictional Story

The engineering constraints (mass limits, power budgets, communication windows, orbit properties) are based on real spacecraft engineering principles. The story, agency names, and dialogue are fictional and are there to make the game engaging.

### 3.2 One Mission, Multiple Valid Solutions

A well-designed mission should have more than one correct answer. Players who choose different component combinations should be able to pass the mission through different valid trade-offs — not just one "right" build.

> **Note:** Whether this is achievable in the MVP depends on the component catalogue diversity (backend decision).

### 3.3 Failure Is Educational

When a player fails a feasibility check or scores low, the game must explain clearly *why* — using plain language. A failed mass check should tell the player "Your spacecraft is X kg over the launcher's capacity. Try removing a heavier component or choosing a larger rocket." The goal is to teach, not just to judge.

### 3.4 Constraints Are Not Arbitrary

No constraint should exist in the game without an explanation. Every limit — mass, power, battery, communication, orbit, budget — corresponds to a real engineering principle. The game should always be able to explain why the constraint exists.

### 3.5 Subsystem Completeness First

A spacecraft with a missing mandatory subsystem is not a spacecraft — it is an incomplete design. Feasibility checks for completeness (AC-01) are the most fundamental gate. A design that passes completeness but fails on power balance is a better design than one with no power system at all, and the game should communicate this distinction.

---

## 4. MVP Scope

The MVP (Minimum Viable Product) for the hackathon demo includes:

### In Scope

| Feature | Status |
|---|---|
| One playable mission: `earth-observation-01` (Eyes on Earth) | Planned |
| Component catalogue with components for all mandatory subsystems | Planned |
| Spacecraft assembly UI (Workshop) | Planned |
| Feasibility evaluation (mass, power, battery, comms, orbit, launcher) | Planned |
| Score calculation and weighted overall score | Planned |
| Results screen with score breakdown and feedback | Planned |
| Educational content in mission brief and results | Planned |
| Phaser.js launch animation | Planned |
| Pixel-art visual style | Planned |

### Out of Scope for MVP

| Feature | Reason |
|---|---|
| Multiple missions | Time constraint; first mission is the demo |
| User accounts and save data | Complexity; not needed for hackathon demo |
| Multiplayer | Out of scope for MVP |
| Real satellite data integration | Out of scope for MVP |
| Mobile native app | Browser-only for MVP |

---

## 5. Educational Goals

Mission Architect aims to teach the following concepts through gameplay:

| Concept | Taught Through |
|---|---|
| What Earth observation satellites do | Mission briefing story; results feedback |
| How solar panels power a spacecraft | Power constraint feedback; workshop tooltips |
| Why batteries are needed for eclipse | Battery constraint feedback; mission brief educational section |
| How communication antennas work | Communication constraint feedback; workshop tooltips |
| What scientific instruments do | Instrument selection; results performance section |
| Why orbit choice matters | Orbit selection UI; feasibility check explanation |
| Mass budget and launcher capacity | Mass constraint feedback; workshop running total |
| Budget and resource trade-offs | Cost display; budget feasibility check; results feedback |

> For the full beginner-friendly explanation of each concept, see [`docs/missions/earth-observation-01.md` — Section 8](./missions/earth-observation-01.md#8-educational-explanations).

---

## 6. Scoring System Overview

> **Full scoring rules are in this document for visibility. The authoritative implementation is in `apps/api/src/services/scoring.service.ts`, managed by Vineeth/Sriganesh.**

### 6.1 Category Scores

Each evaluation dimension produces a **category score between 0 and 100**.

The evaluation service (`evaluation.service.ts`) runs all checks after the player submits a design. It is not expected that all categories are equally important for every mission type.

### 6.2 Overall Score

The overall score is a weighted average across all scoring categories. The weights must sum to 100.

> **Category weights have not been assigned in this document.** Assigning specific weights is a backend/team decision (Vineeth, Sriganesh). Weights should not be invented here and should not appear in frontend/public files.

### 6.3 Pass/Fail Threshold

- An overall score **below 30** fails the threshold.
- An overall score **of exactly 30 or higher** passes the threshold.
- A score of exactly 30 is a valid passing grade.

### 6.4 Feasibility Checks Are Independent

Feasibility checks (subsystem completeness, mass compliance, power balance, battery, communication, orbit/launcher compatibility) are evaluated as **binary pass/fail checks**, separate from the overall score.

A design can pass the score threshold but still fail a feasibility check. How the game communicates these combined outcomes to the player is a pending team decision (see [Section 8](#8-pending-decisions)).

### 6.5 Scoring Services Overview

The backend includes the following services relevant to scoring:

| Service File | Purpose |
|---|---|
| `scoring.service.ts` | Calculates category and overall scores |
| `evaluation.service.ts` | Runs the full evaluation pipeline |
| `feasibility.service.ts` | Checks binary pass/fail constraints |
| `resource.service.ts` | Calculates mass, power, battery budgets |
| `compatibility.service.ts` | Checks orbit/launcher compatibility |
| `finance.service.ts` | Calculates total cost vs budget |

> These are scaffolded stubs owned by Sriganesh (Person 1 — Backend). Do not modify them.

---

## 7. Challenge Requirements vs Team Decisions

This section distinguishes what the NASA Space Apps Challenge requires from what our team has decided to build.

### 7.1 What the Challenge Requires

The NASA Space Apps Challenge requires that the project:

- Addresses a space or Earth-science challenge in an innovative way.
- Is educational or informative to the public.
- Is demonstrated as a working prototype or MVP.

The challenge does **not** prescribe:
- Specific subsystem names or lists
- Scoring formulas or weights
- Budget or mass limits
- Visual art style
- Technology stack

### 7.2 What Our Team Has Decided

| Decision | Rationale | Status |
|---|---|---|
| Retro/pixel-art visual style | Differentiates the product and appeals to nostalgic audience | Agreed |
| Phaser.js for game engine | Mature browser-based 2D game framework | Agreed |
| React + TypeScript for UI | Standard modern web stack; team familiarity | Agreed |
| Node.js + Express API | Lightweight, works with TypeScript | Agreed |
| SQLite for MVP database | Zero-configuration; sufficient for demo | Agreed |
| Monorepo (Turborepo) structure | Keeps API, web app and shared types in sync | Agreed |
| `earth-observation-01` as first mission | Earth observation is relatable and visually engaging | Agreed |
| Score range 0–100 per category | Simple, intuitive scale | Agreed |
| Weighted overall score | Reflects that not all categories are equally important | Agreed |
| Pass threshold at score 30 | Low enough to allow partial credit; avoids frustrating new players | Agreed |
| Feasibility checks separate from score | Reflects real engineering distinction: viable vs well-optimised | Agreed |
| Six mandatory subsystem categories | Minimum viable spacecraft for Earth observation | **Proposed — pending approval** |
| Orbital Vanguard as fictional agency | In-game fiction for immersion | **Proposed — pending approval** |

### 7.3 Proposed Rules Requiring Team Approval

The following items are marked as **proposed** and must not be presented as final until confirmed by relevant team members:

- The exact list of mandatory subsystem categories.
- Whether budget overrun is a hard feasibility block or a score deduction.
- How combined score + feasibility outcomes map to game endings.
- Whether "Orbital Vanguard" is the final agency name.

---

## 8. Pending Decisions

| ID | Pending Item | Needs Input From |
|---|---|---|
| PD-01 | Add four new proposed fields to `packages/shared/src/types/mission.ts` | Vineeth |
| PD-02 | Confirm scoring category weights | Vineeth |
| PD-03 | Confirm `eclipseMinutes` / contact window approach for orbit entries | Vineeth |
| PD-04 | Confirm FC-7: budget overrun = hard block or score deduction? | Vineeth |
| PD-05 | Confirm reward tier boundaries and percentages | Vineeth |
| PD-06 | Confirm how combined score + feasibility outcomes map to game results | All team members |
| PD-07 | Confirm fictional agency name "Orbital Vanguard" | All team members |
| PD-08 | Define art assets needed per scene and per component category | Pannaga |
| PD-09 | Define tutorial or onboarding flow for new players | All team members |

---

*Document prepared by Tanishka (Person 5 — Mission Data, QA, Educational Content & Demo)*
*Phase 1 — Mission Brief and Acceptance Criteria*
*Last updated: 2026-11-14*
