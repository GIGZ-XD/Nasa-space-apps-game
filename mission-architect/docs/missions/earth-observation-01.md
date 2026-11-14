# Mission Specification — Eyes on Earth

**Mission ID:** `earth-observation-01`
**Mission Name:** Eyes on Earth
**Mission Category:** Earth Observation
**Document Owner:** Tanishka (Person 5 — Mission Data, QA, Educational Content & Demo)
**Phase:** 1 & 2 — Mission Brief, Acceptance Criteria and Data Catalogue
**Status:** Data files delivered — Pending Vineeth confirmation of proposed fields

---

## Table of Contents

1. [Mission Briefing](#1-mission-briefing)
2. [Mission Objectives](#2-mission-objectives)
3. [Mission Scope](#3-mission-scope)
4. [Mandatory Spacecraft Subsystems](#4-mandatory-spacecraft-subsystems)
5. [Mission Constraints](#5-mission-constraints)
6. [Acceptance Criteria](#6-acceptance-criteria)
7. [Scoring Rules](#7-scoring-rules)
8. [Educational Explanations](#8-educational-explanations)
9. [Challenge Brief vs Project Decisions](#9-challenge-brief-vs-project-decisions)
10. [Pending Decisions](#10-pending-decisions)

---

## 1. Mission Briefing

> *The following is in-game fictional content written from the perspective of Orbital Vanguard, the fictional space agency in Mission Architect — Beyond Earth.*

---

**ORBITAL VANGUARD — MISSION OPERATIONS CENTRE**
**MISSION BRIEF — CLASSIFIED: LEVEL 2**

Agent, our planet is changing faster than scientists can measure.

Glaciers are retreating. Forest fires are growing. Coastal cities face rising seas. Farmers watch their harvests shrink under unpredictable weather. Humanitarian agencies need data to respond to disasters before they worsen. And policy-makers need evidence before they can act.

Right now, there is a blind spot in our satellite coverage over key equatorial and polar regions. We are flying blind over some of the most vulnerable parts of Earth.

**Your mission, should you choose to accept it:** Design a spacecraft capable of observing Earth from orbit. Configure its subsystems, choose an appropriate orbit, select a launch vehicle, and ensure the whole package works within budget and physical constraints.

This is not a war mission. This is a mission to give humanity a pair of eyes — high above the clouds — and a chance to understand what is happening to the world below.

The data you collect will be used by climate scientists, disaster response teams, agricultural planners and urban developers across the globe.

Good luck, Agent. The planet is counting on you.

---

## 2. Mission Objectives

### Primary Objective

Design and configure a viable Earth-observing satellite that can capture and transmit scientifically useful imagery or data about Earth's surface, atmosphere, or environment from orbit.

### Secondary Objectives

1. **Continuous power operation:** The spacecraft must maintain electrical power throughout its orbit, including periods when it passes through Earth's shadow (eclipse).
2. **Data relay:** Captured scientific data must be transmitted back to a ground station within a reasonable time window.
3. **Orbital stability:** The chosen orbit must keep the satellite positioned to observe the intended region of Earth effectively throughout the mission.
4. **Resource efficiency:** The spacecraft design must stay within the mass capacity of the selected launch vehicle and within the mission budget.
5. **Subsystem completeness:** All mandatory spacecraft subsystems must be present and compatible with each other.

---

## 3. Mission Scope

| Item | Description |
|---|---|
| **Mission type** | Earth Observation (EO) |
| **Player role** | Spacecraft design engineer at Orbital Vanguard |
| **Target** | Earth's surface, atmosphere, or environment |
| **Data product** | Imagery or sensor readings downlinked to ground station |
| **Orbit class** | Player-selected (orbit compatibility is evaluated) |
| **Launch vehicle** | Player-selected (launcher compatibility is evaluated) |
| **Budget** | Player-managed (total expenditure evaluated against mission budget) |
| **Win condition** | Feasibility checks pass AND overall score meets threshold |

---

## 4. Mandatory Spacecraft Subsystems

> **Project design decision — requires team approval.**
> The following list of mandatory subsystems is a game-design rule proposed by the documentation team (Person 5). It has not yet been confirmed as a final rule by all team members. See [Section 10 — Pending Decisions](#10-pending-decisions).

The game enforces that a valid spacecraft configuration for mission `earth-observation-01` must include at least one component from each of the following subsystem categories.

---

### 4.1 Structure / Bus

**What it is:**
The structural frame and chassis of the spacecraft — the physical body that holds everything else together.

**Why it matters:**
Without a structure, the spacecraft is just a pile of loose components. The bus provides mechanical strength to survive launch vibrations and the harsh environment of space. It also defines the overall size and form factor of the satellite.

**In the game:**
Players must select a structure component. The structure determines the base mass and volume of the spacecraft and may affect which other components can be attached.

---

### 4.2 Power System (Solar Panels)

**What it is:**
Arrays of photovoltaic (solar) cells that convert sunlight into electrical power.

**Why it matters:**
Satellites in orbit receive continuous sunlight (except during eclipse). Solar panels are the primary source of electrical power for the spacecraft's instruments and systems. Without power, nothing works.

**In the game:**
Players must include a power system component. The power system determines how much electrical power is generated while the spacecraft is in sunlight. This must be enough to run all other components.

---

### 4.3 Battery

**What it is:**
An on-board rechargeable energy storage unit.

**Why it matters:**
When the satellite passes through Earth's shadow (eclipse), solar panels produce no power. The battery stores energy collected during the sunlit part of the orbit and releases it during eclipse so that the spacecraft can keep operating without interruption.

**In the game:**
Players must include a battery. The battery capacity must be large enough to power the spacecraft through the eclipse period. The game evaluates whether the battery can sustain the spacecraft's power load during the full eclipse duration.

---

### 4.4 Communication System

**What it is:**
An antenna and radio transceiver system that sends and receives data between the spacecraft and a ground station on Earth.

**Why it matters:**
An Earth-observation satellite that cannot transmit its data is useless. The communication system beams scientific measurements, images, and telemetry down to Earth. It also receives commands from mission operators.

**In the game:**
Players must include a communication system. The communication system must have sufficient data-rate capacity to downlink the volume of scientific data produced by the selected instrument within the available ground-contact windows.

---

### 4.5 Computer / ADCS (Attitude Determination and Control System)

**What it is:**
The on-board computer manages all spacecraft operations. The ADCS senses the spacecraft's orientation in space and fires small thrusters or reaction wheels to point the satellite in the right direction.

**Why it matters:**
An Earth-observation satellite must keep its camera or sensor pointed at Earth at all times. Without attitude control, the satellite would tumble randomly and produce unusable data. The on-board computer also processes commands and handles data storage.

**In the game:**
Players must include a computer/ADCS component. This subsystem may affect pointing accuracy, which can in turn affect the scientific score category.

---

### 4.6 Scientific Instrument (At Least One Required)

**What it is:**
The payload — the sensor, camera, or detector that actually collects data about Earth.

**Why it matters:**
This is the whole reason the mission exists. Without a scientific instrument, the spacecraft is just an expensive piece of metal in orbit. For Earth observation, typical instruments include multispectral cameras, thermal infrared imagers, synthetic aperture radars (SAR), and atmospheric sounders.

**In the game:**
Players must include at least one scientific instrument appropriate for the Earth Observation mission category. The instrument determines the type and volume of scientific data collected, which feeds into the mission performance score.

> **Note:** The specific list of available instrument options (names, properties, compatibility rules) is to be defined by the backend developer. See [Section 10 — Pending Decisions](#10-pending-decisions).

---

## 5. Mission Constraints

The constraints below are derived from real spacecraft engineering principles. **Specific numerical limits are now defined in `apps/api/src/data/missions.json` and `apps/api/src/data/components.json`.** This section states the rules; the data files provide the numbers.

### C-01 — Mass Compliance

Total spacecraft mass (sum of all selected component `massKg` values) must not exceed the selected launcher's `payloadCapacityKg`.

> **Values in data:** Launcher Alpha (`launch-a`) capacity = **50 kg**. Launcher Beta (`launch-b`) capacity = **150 kg**.

---

### C-02 — Power Balance

Solar panel `powerOutputW` must be ≥ sum of all active components' `powerDrawW` × mission `powerReserveFactor`.

> **Values in data:** `powerReserveFactor` = **1.1** (10% headroom required). Power output/draw values are per component in `components.json`.

---

### C-03 — Battery Capacity

Battery `capacityWh` must be sufficient to power the spacecraft through the eclipse period of the selected orbit. Eclipse duration is an orbit property to be provided by Vineeth (backend).

> **Values in data:** Battery options in `components.json` — 180 Wh (standard) and 320 Wh (high-capacity). Eclipse duration per orbit: **pending Vineeth confirmation**.

---

### C-04 — Communication Capability

Communications `dataRateMbps` × available contact window ≥ sum of instrument `dataRateMbps` per orbit pass. Contact window duration is an orbit property to be provided by Vineeth.

> **Values in data:** Antenna options — UHF Patch (0.5 Mbps) and X-Band HGA (8 Mbps). Instrument data rates in `components.json`. Contact window per orbit: **pending Vineeth confirmation**.

---

### C-05 — Orbit Compatibility

Selected orbit must be in the mission's `allowedOrbitIds` list.

> **Values in data:** `allowedOrbitIds` = `["leo-500", "sso-600"]`. Both orbit entries exist in `components.json`.

---

### C-06 — Launcher Compatibility

Selected launcher's `supportedOrbitIds` must include the selected orbit's `id`.

> **Values in data:** Launcher Alpha (`launch-a`) supports `leo-500` only. Launcher Beta (`launch-b`) supports both `leo-500` and `sso-600`.

---

### C-07 — Budget

Sum of all selected component `costUsd` values must not exceed mission `budgetUsd`.

> **Values in data:** `budgetUsd` = **\$500,000**. Component costs are in `components.json`. Whether this is a hard feasibility block or score-only is pending Vineeth confirmation.

---

## 6. Acceptance Criteria

The following criteria define what a successful spacecraft configuration looks like for mission `earth-observation-01`. These are the conditions the game evaluates when the player submits their design.

### AC-01 — Complete Spacecraft Configuration

**Criterion:** The spacecraft configuration includes at least one component from each mandatory subsystem category defined in Section 4.

**Pass condition:** All six mandatory subsystem categories are represented.
**Fail condition:** Any mandatory subsystem category is missing.
**Evaluation type:** Feasibility check (binary pass/fail — separate from overall score).

---

### AC-02 — Mass Compliance

**Criterion:** Total spacecraft mass ≤ launch vehicle payload capacity to the selected orbit.

**Pass condition:** Spacecraft mass does not exceed the payload capacity.
**Fail condition:** Spacecraft mass exceeds the payload capacity.
**Evaluation type:** Feasibility check (binary pass/fail).

> Exact mass limits are backend-defined values.

---

### AC-03 — Power Compliance

**Criterion:** Power generated by the solar panels ≥ total power draw of all active components during the sunlit phase.

**Pass condition:** Power generation meets or exceeds total consumption.
**Fail condition:** Power generation is insufficient.
**Evaluation type:** Feasibility check (binary pass/fail).

> Exact power values are backend-defined.

---

### AC-04 — Battery Availability

**Criterion:** Battery capacity ≥ energy required to sustain all components through the eclipse period of the selected orbit.

**Pass condition:** Battery can sustain the spacecraft through full eclipse.
**Fail condition:** Battery is insufficient for the eclipse duration.
**Evaluation type:** Feasibility check (binary pass/fail).

> Eclipse duration and energy requirements are orbit-dependent, defined by backend.

---

### AC-05 — Communication Capability

**Criterion:** Communication system data rate × available contact window time ≥ scientific data volume produced per orbit.

**Pass condition:** Communication system can downlink all data within available windows.
**Fail condition:** Data volume exceeds communication throughput.
**Evaluation type:** Feasibility check (binary pass/fail).

> Data rate, contact window, and data volume figures are backend-defined.

---

### AC-06 — Orbit and Launcher Compatibility

**Criterion:** The selected launch vehicle supports the selected orbit, and the selected orbit is compatible with the Earth Observation mission requirements.

**Pass condition:** Both orbit and launcher are compatible.
**Fail condition:** Incompatible orbit or launcher selected.
**Evaluation type:** Feasibility check (binary pass/fail).

---

### AC-07 — Budget Compliance

**Criterion:** Total mission expenditure (sum of all component costs + launch cost) ≤ mission budget.

**Pass condition:** Total cost is within budget.
**Fail condition:** Total cost exceeds budget.
**Evaluation type:** Contributes to the Finance/Budget score category AND may be treated as a feasibility flag (team decision pending — see Section 10).

> Budget values are backend-defined.

---

### AC-08 — Mission Performance Score

**Criterion:** The player's overall weighted score meets the passing threshold.

**Pass condition:** Overall weighted score ≥ 30.
**Fail condition:** Overall weighted score < 30.
**Evaluation type:** Score-based threshold (separate from individual feasibility checks).

> See [Section 7 — Scoring Rules](#7-scoring-rules) for the full scoring structure.

---

## 7. Scoring Rules

> **Source:** These rules are agreed team-roadmap decisions carried forward into this document. They are recorded here for traceability. The authoritative implementation lives in the backend (`scoring.service.ts`) and is managed by Vineeth/Sriganesh.

### 7.1 Category Scores

Each evaluation category produces a score between **0 and 100** (inclusive).

### 7.2 Overall Score

The overall score is a **weighted average** of the category scores.

$$\text{Overall Score} = \sum_{i} w_i \times \text{CategoryScore}_i$$

Where each $w_i$ is the weight assigned to category $i$, and all weights sum to 100.

> **Category weights are not defined in this document.** Weights are a backend configuration decision (Vineeth/Sriganesh). They must not be invented or hardcoded in documentation.

### 7.3 Pass/Fail Threshold

| Condition | Result |
|---|---|
| Overall score **< 30** | ❌ Fails the score threshold |
| Overall score **= 30** | ✅ Passes the score threshold (minimum pass) |
| Overall score **> 30** | ✅ Passes the score threshold |

> A score of exactly 30 constitutes a passing grade on its own.

### 7.4 Feasibility Checks Are Separate

Passing the score threshold does **not** automatically mean the mission is feasible. Feasibility checks (AC-01 through AC-06) are evaluated independently of the overall score.

A mission result can be:
- **Score: pass, Feasibility: pass** → Full mission success
- **Score: pass, Feasibility: fail** → Design is well-conceived but physically impossible as configured
- **Score: fail, Feasibility: pass** → Design is physically viable but underperforms
- **Score: fail, Feasibility: fail** → Design is both underperforming and physically impossible

> How these combinations map to in-game outcomes (medals, ranks, story outcomes) is a pending team decision. See [Section 10](#10-pending-decisions).

---

## 8. Educational Explanations

> This section provides beginner-friendly explanations of the science and engineering concepts behind this mission. These can be used in the game's tutorial, help panels, and educational sidebar content.

---

### 🌍 What is Earth Observation?

Earth observation means using cameras and sensors on satellites to watch and measure our planet from space. Because satellites orbit hundreds of kilometres above Earth, they can see huge areas at once — far more than any plane or ground station could.

Scientists use Earth observation data to track changes in forests, monitor hurricanes, measure how fast ice sheets are shrinking, watch how cities grow, and respond to disasters like floods and wildfires. It is one of the most important tools we have for understanding our changing planet.

---

### ☀️ Why Do Satellites Use Solar Panels?

In space, there is no wind, no water, and no power grid. The only reliable, free, and long-lasting energy source available to a satellite is sunlight.

Solar panels are made of special materials that convert light directly into electricity. As long as the satellite is in sunlight, the panels generate power to run the instruments, computer, radio, and everything else on board.

Solar panels are lightweight, produce no moving parts that could break, and require no fuel — which is why they are used on almost every satellite ever built.

---

### 🔋 Why Are Batteries Required?

Satellites do not stay in sunlight all the time. As a satellite orbits Earth, it regularly passes through Earth's shadow — a period called **eclipse**. During eclipse, the solar panels stop producing power.

Batteries solve this problem by storing energy during the sunlit part of the orbit, and then releasing that stored energy during eclipse so that the spacecraft can keep operating.

Without a battery, the satellite would completely shut down every time it passed through shadow — losing data, losing contact with the ground, and potentially causing permanent damage.

---

### 📡 Why Are Communication Antennas Important?

A satellite that cannot talk to the ground is as useful as a camera with no way to share the photos. The communication antenna is the radio link between the spacecraft and the team on Earth.

The antenna transmits (sends) science data and status updates down to ground stations. It also receives commands from the operations team — telling the spacecraft where to point, when to take measurements, and what to do next.

The bigger and more powerful the antenna, the more data can be sent in a given time window. If the antenna is too weak for the amount of data being collected, images and measurements will pile up on board and may never reach the scientists who need them.

---

### 🔭 What Do Scientific Instruments Do?

The scientific instrument is the heart of the mission — it is the reason the satellite was built in the first place. The instrument is the sensor that actually collects data about Earth.

Different instruments detect different things:
- **Cameras** take visible-light photographs of Earth's surface.
- **Infrared imagers** measure temperature, detecting heat from wildfires or ocean warm spots.
- **Radar instruments (SAR)** can see through clouds and darkness, mapping terrain and monitoring floods.
- **Atmospheric sensors** measure gases in the air, tracking pollution or the health of the ozone layer.

Choosing the right instrument for the mission is one of the most important design decisions a spacecraft engineer makes.

---

### 🛸 Why Does Orbit Selection Matter?

Orbit is the path the satellite follows as it travels around Earth. Different orbits have very different properties:

- **Height** affects how large an area the satellite can see at once, and how often it passes over the same location.
- **Inclination** (the angle of the orbit relative to Earth's equator) determines which parts of the planet the satellite can observe. A polar orbit, for example, allows the satellite to eventually cover every part of Earth.
- **Sun-Synchronous Orbit (SSO)** keeps the satellite always crossing the equator at the same local time each day — which means consistent lighting conditions for photography.

Choosing the wrong orbit could mean the satellite never passes over the region it is supposed to observe, or that it cannot reach certain latitudes at all. That is why orbit selection is a critical mission design choice — not just an afterthought.

---

### ⚖️ Why Do Spacecraft Mass and Launcher Capacity Matter?

Every kilogram you send to space costs money and rocket fuel. Launch vehicles have a maximum weight they can carry to orbit — this is called the **payload capacity**. If your spacecraft is too heavy for your chosen rocket, the mission cannot launch.

This creates a constant design challenge: engineers want to include powerful instruments and large solar panels and big batteries, but each addition increases mass. Every component added must be carefully weighed against its benefit. This trade-off between capability and mass is one of the defining challenges of spacecraft engineering.

---

### 💰 Why Do Budget and Resource Trade-Offs Matter?

Space missions are extremely expensive. Even small satellites can cost millions. Budget is a real constraint that shapes every decision a spacecraft designer makes.

Choosing a bigger solar panel generates more power — but costs more. Choosing a more sensitive instrument captures better data — but costs more. Choosing a larger rocket reaches higher orbits — but costs more.

Engineers must balance performance, mass, power and cost all at the same time. There is rarely a perfect solution — only the best trade-off available within the constraints. Learning to make good trade-offs is the central skill Mission Architect teaches.

---

## 9. Challenge Brief vs Project Decisions

This section clearly distinguishes between requirements that come from the NASA Space Apps Challenge brief and design decisions the team has made for the MVP of Mission Architect — Beyond Earth.

> **Why this distinction matters:** Our team's implementation choices are not mandatory requirements of the challenge. Future hackathon participants or contributors should understand what is externally imposed and what we chose ourselves.

---

### 9.1 Requirements Derived from the Hackathon Challenge

The NASA Space Apps Challenge asks participants to build a space mission design experience that is:

- **Educational:** Players should learn about real space mission concepts through gameplay.
- **Interactive:** Players should actively make decisions (not just read information).
- **Accessible:** The experience should be approachable for people who are not space experts.
- **Scientifically grounded:** Concepts used in the game should be based on real spacecraft engineering principles, not invented science fiction.

No specific subsystem list, scoring weights, orbit types, or budget limits are prescribed by the challenge brief. These are all our team's design choices.

---

### 9.2 Decisions Made by Our Team for the MVP

The following are **our team's choices** for the Mission Architect MVP:

| Decision | Description | Owner |
|---|---|---|
| Retro/pixel-art visual style | Art direction chosen by the team | Pannaga (Person 3) |
| Phaser.js game engine | Technology choice for the browser game layer | Sriganesh (Person 1) |
| Six mandatory subsystem categories | Rule defining what a valid spacecraft must include | Proposed by Tanishka (Person 5) — pending approval |
| Score range 0–100 per category | Agreed scoring scale | Team roadmap |
| Weighted overall score | Agreed scoring method | Team roadmap |
| Pass threshold at 30 | Agreed minimum passing score | Team roadmap |
| Feasibility checks separate from score | Agreed architecture | Team roadmap |
| `earth-observation-01` as the first mission | First mission chosen for MVP | Team |
| Orbital Vanguard as the fictional agency name | In-game fiction | Tanishka (Person 5) |
| SQLite database for MVP | Backend storage choice | Sriganesh (Person 1) |
| Monorepo structure (`apps/api`, `apps/web`) | Architecture | Sriganesh (Person 1) |

---

### 9.3 Proposed Rules Requiring Team Approval

The following items have been proposed but have **not yet been confirmed** by all team members:

- The exact list of mandatory subsystem categories (Section 4).
- Whether budget overrun is treated as a feasibility check failure (hard block) or only as a score deduction.
- How the combination of score result + feasibility result maps to in-game outcomes.
- Whether the fictional agency name "Orbital Vanguard" is final.

See [Section 10 — Pending Decisions](#10-pending-decisions) for a full list.

---

## 10. Pending Decisions

The items below require input or approval from one or more team members before the game can be fully implemented.

| ID | Pending Item | Needs Input From | Notes |
|---|---|---|---|
| PD-01 | Add four new proposed fields to `packages/shared/src/types/mission.ts` | Vineeth | Fields: `mandatoryCategories`, `powerReserveFactor`, `allowedOrbitIds`, `lifetimeMonths` |
| PD-02 | Confirm scoring category weights | Vineeth | See `docs/scoring-system.md` §3 for proposal |
| PD-03 | Add `eclipseMinutes` to orbit entries in `components.json` (or hardcode in backend) | Vineeth | Required for FC-4 and FC-5 battery/comms checks |
| PD-04 | Confirm contact window calculation method | Vineeth | Required for FC-5 comms feasibility check |
| PD-05 | Confirm FC-7: is budget overrun a hard feasibility block or score deduction only? | Vineeth | Affects `feasibility.service.ts` vs `finance.service.ts` |
| PD-06 | Confirm reward tier boundaries and percentages | Vineeth | See `docs/scoring-system.md` §4 for proposal |
| PD-07 | Confirm how combined score + feasibility outcomes map to in-game results | All team members | Medals, ranks, story outcomes |
| PD-08 | Confirm fictional agency name "Orbital Vanguard" | All team members | Used in mission briefing text |
| PD-09 | Define art assets needed per component category | Pannaga | Workshop UI needs sprite per category or per component |
| PD-10 | Define tutorial or onboarding flow for new players | All team members | Help text, first-time tooltips |

---

*Document prepared by Tanishka (Person 5 — Mission Data, QA, Educational Content & Demo)*
*Phase 1 — Mission Brief and Acceptance Criteria*
*Last updated: 2026-11-14*
