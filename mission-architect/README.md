# 🚀 Mission Architect

> **NASA Space Apps Challenge** — An educational space-mission design, spacecraft engineering, budget management, and orbital physics simulation game.

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](../../LICENSE)
[![React](https://img.shields.io/badge/React-18.3-61DAFB?logo=react&logoColor=black)](https://react.dev/)
[![Phaser](https://img.shields.io/badge/Phaser-3.90-red?logo=phaser&logoColor=white)](https://phaser.io/)
[![Vite](https://img.shields.io/badge/Vite-5.4-646C9F?logo=vite&logoColor=white)](https://vitejs.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.5-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Express](https://img.shields.io/badge/Express-4.19-000000?logo=express&logoColor=white)](https://expressjs.com/)
[![Node.js](https://img.shields.io/badge/Node.js-%E2%89%A518-339933?logo=node.js&logoColor=white)](https://nodejs.org/)

---

## 📖 Table of Contents

- [Overview](#-overview)
- [Core Gameplay Loop](#-core-gameplay-loop)
- [Key Features](#-key-features)
- [Missions Catalog](#-missions-catalog)
- [Architecture & Tech Stack](#-architecture--tech-stack)
- [Repository Structure](#-repository-structure)
- [Getting Started](#-getting-started)
  - [Prerequisites](#prerequisites)
  - [Installation](#installation)
  - [Running Development Servers](#running-development-servers)
  - [Building for Production](#building-for-production)
- [API Reference](#-api-reference)
- [Game Mechanics & Engineering Details](#-game-mechanics--engineering-details)
- [Contributing & Team](#-contributing--team)
- [License](#-license)

---

## 🌌 Overview

**Mission Architect** puts players in the commander's seat of an aerospace space agency. Guided by the AI companion **STELLA**, cadets design, finance, construct, and launch authentic spacecraft to achieve real-world spaceflight objectives. 

From launching a geostationary telecommunications satellite from Wallops Flight Facility, to navigating trans-lunar injection, executing powered descent on the far side of the Moon, or orchestrating complex Entry, Descent, and Landing (EDL) for a Mars rover, **Mission Architect** blends real aerospace engineering constraints (payload mass, power budgets, Line-of-Sight communications, orbital mechanics) with rich 2D/2.5D visual simulation.

---

## 🔁 Core Gameplay Loop

```mermaid
flowchart LR
    A["Select Mission\n& Review Briefing"] --> B["Procure Hardware\n& Intel Dossiers"]
    B --> C["Assemble Spacecraft\nin Workshop Bay"]
    C --> D["Launch & Visual\nPhaser Simulation"]
    D --> E["Telemetry & Line of Sight\n(LOS) Validation"]
    E --> F["Mission Debrief,\nXP & Rewards"]
    F --> A
```

1. **Mission Briefing**: Study target orbital parameters, payload criteria, budget, and environmental hazards.
2. **Aerospace Market & Intel**: Purchase real-world launchpads, rockets, satellite buses, scientific sensors, landers, and classified planetary intelligence dossiers.
3. **Spacecraft Workshop**: Assemble modules inside the assembly bay while balancing cost, mass, power, and mission constraints.
4. **Launch & Simulation**: Experience a multi-phase animated ascent rendered in Phaser 3—countdown, ignition, liftoff, gantry clearing, stage separation, orbital insertion, and planetary landing.
5. **Telemetry & LOS**: Track communication windows with ground stations and avoid communication blackouts.
6. **Debriefing & Progression**: Receive detailed mission scoring, earn XP and credits, level up your commander rank, and unlock higher-tier interplanetary expeditions.

---

## ✨ Key Features

### 🛠️ Spacecraft Workshop & Modular Assembly
- **Modular Bays**: Install compatible Launchpads, Launch Vehicles, Satellite Buses, Payloads/Sensors, and Landers/Rovers.
- **Feasibility Verification**: Live checks against budget limitations, payload capacity, power distribution, and objective compatibility.
- **Interactive Assembly Canvas**: Real-time visual feedback of your custom spacecraft build before rollout to the pad.

### 🎮 Hybrid React + Phaser 3 Simulation Engine
- **Decoupled Architecture**: React/Zustand acts as the authoritative state machine for scores and mission evaluation; Phaser 3 provides high-fidelity hardware-accelerated 2D/2.5D visual effects.
- **Dynamic Flight Scenes**:
  - `BootScene` & `PreloadScene`: Asset initialization, audio preloading, and responsive canvas sizing.
  - `WorkshopScene`: Orbital spacecraft design lab with real-time assembly visuals.
  - `LaunchScene`: Cape Canaveral / Wallops launchpad with cryogenic smoke vents, T-3 countdown, fiery plume particle emitters, gantry clearance, and fairing jettison.
  - `OrbitScene`: Planetary orbit simulation with multi-layer parallax starfields, realistic Earth atmosphere glow, antenna downlinks, and failure decay trajectories.
  - `LandingScene`: Atmospheric entry, supersonic parachute deployment, sky crane descent, and touchdown dust plumes.
  - `DriftScene`: Deep-space interplanetary cruise.

### 🛰️ Line-of-Sight (LOS) & Telemetry Tracker
- **Ground Station Links**: Calculates geometric visibility between orbiting spacecraft and Earth ground stations.
- **Radio Blackout Handling**: Simulates atmospheric plasma blackout corridors and planetary occlusion (e.g., lunar far side).

### 🛒 Aerospace Market & Classified Intel
- **Authentic Aerospace Catalog**: Procure parts modeled after real missions—Falcon 9, Falcon Heavy, Atlas V, SLS, CAPSTONE, Lunar Reconnaissance Orbiter (LRO), InSight, Perseverance, VIPER, and more.
- **Intelligence Dossiers**: Purchase classified science dossiers revealing lunar water-ice deposits at Shackleton crater, Mars EDL atmospheric corridors, and asteroid orbital ephemerides.

### 🎓 Educational Companion & Space Facts
- **STELLA AI Guide**: Step-by-step interactive tutorial walking new cadets through their very first orbital mission.
- **NASA Space Facts**: Real-world trivia and physics principles delivered during each phase of gameplay.

### 🔐 Space Command Registry & Leaderboard
- **Cadet Authentication**: Secure registration and login using PBKDF2 with unique salts, session management, and rate-limited endpoints.
- **Leaderboards**: Track top commanders globally across All-Time, Monthly, and Weekly timeframes.

### 🔊 Procedural Audio & SFX
- Built-in Web Audio synthesis engine (`sfx.ts`) generating custom sound effects for countdown beeps, engine roar, stage staging clanks, thruster bursts, telemetry pings, and victory fanfare.

---

## 🪐 Missions Catalog

| ID | Mission Name | Destination | Unlock Level | Budget | Objectives |
|:--:|:---|:---|:---:|:---:|:---|
| **1** | **Geo-Satellite Mission** | Earth GEO (35,786 km) | Lvl 1 | 3M | Clear launch tower, achieve stable LEO, perform transfer burn to geostationary orbit. |
| **2** | **Lunar Satellite** | Moon Polar Orbit | Lvl 2 | 5M | Translunar injection, lunar orbit capture, multispectral surface mapping. |
| **3** | **Lunar Lander (Dark Side)** | Moon Far Side | Lvl 3 | 7M | Lunar transfer, powered descent, soft touchdown in radio shadow with deployed instrumentation. |
| **4** | **Mars Rover** | Mars Surface (Jezero Crater) | Lvl 4 | 9M | Interplanetary trajectory, atmospheric entry & sky-crane landing, surface exploration & sample caching. |
| **5** | **Deep-Space Mission** | Outer Solar System | Lvl 5 | 10M | Heavy-lift launch, multi-year interplanetary cruise, flyby science collection at target celestial body. |

---

## 🏗️ Architecture & Tech Stack

```
nasa-space-apps-game/
├── mission-architect/
│   ├── apps/
│   │   ├── api/          # Express REST API (Auth, Leaderboards, Missions)
│   │   └── web/          # React 18 + Vite + Phaser 3 Client
│   ├── packages/
│   │   └── shared/       # Cross-cutting TypeScript types & schemas
│   └── docs/             # Technical specifications & phase reports
```

### Frontend (`apps/web`)
- **Framework**: [React 18](https://react.dev/) + [Vite 5](https://vitejs.dev/)
- **Game Engine**: [Phaser 3.90](https://phaser.io/)
- **State Management**: [Zustand 5](https://github.com/pmndrs/zustand) (with `localStorage` persistence)
- **Styling**: Tailwind CSS & custom sci-fi HUD theme variables
- **Language**: TypeScript 5.5

### Backend (`apps/api`)
- **Runtime**: Node.js with `tsx` (TypeScript execute)
- **Web Framework**: [Express 4](https://expressjs.com/)
- **Validation**: [Zod 4](https://zod.dev/)
- **Security**: PBKDF2 password hashing (crypto), `express-rate-limit`, CORS
- **Database/Persistence**: In-memory repository with seed data; Prisma ORM schema ready for SQLite/PostgreSQL

### Shared Package (`packages/shared`)
- Reusable TypeScript types, schemas, and physics constants shared across frontend and backend.

---

## 📁 Repository Structure

```
.
├── apps/
│   ├── api/                   # Backend API service
│   │   ├── package.json
│   │   └── src/
│   │       ├── app.ts         # Express application configuration
│   │       ├── server.ts      # Server entrypoint (Port 4000)
│   │       ├── middleware/    # Error handler & rate limiters
│   │       ├── routes/        # Auth, mission, and leaderboard routes
│   │       ├── services/      # Business logic & auth service
│   │       └── repositories/  # In-memory user & session repository
│   └── web/                   # Frontend React & Phaser game
│       ├── index.html
│       ├── vite.config.ts     # Dev server & /api proxy to :4000
│       └── src/
│           ├── main.tsx       # React root mount
│           ├── audio/         # Procedural Web Audio sound effects
│           ├── components/    # Reusable UI cards, panels, HUD widgets
│           ├── data/          # Missions catalog & aerospace market data
│           ├── game/          # Phaser 3 Game Engine
│           │   ├── PhaserGame.tsx # React-Phaser bridge component
│           │   ├── scenes/    # Launch, Orbit, Landing, Drift, Workshop scenes
│           │   └── systems/   # Procedural Earth atmosphere & starfields
│           ├── pages/         # Screen pages (Workshop, Launch, Market, etc.)
│           └── stores/        # Zustand stores (game, auth, LOS)
├── packages/
│   └── shared/                # Cross-package types and utilities
├── prisma/                    # Database schema and seed scripts
└── docs/                      # Phase audit reports & integration contracts
```

---

## ⚡ Getting Started

### Prerequisites
- **Node.js**: v18.0.0 or higher (v20+ / v22+ recommended)
- **npm**: v9.0.0 or higher

Check your installed versions:
```bash
node -v
npm -v
```

### Installation

Install dependencies from the root of `mission-architect`:

```bash
npm install
```

### Running Development Servers

You can launch both the backend API and frontend client in parallel:

#### Terminal 1 — Backend API
```bash
npm run dev:api
```
*The API server will start on [http://localhost:4000](http://localhost:4000).*

#### Terminal 2 — Frontend Web
```bash
npm run dev:web
```
*The Vite development server will start on [http://localhost:5173](http://localhost:5173).*

> **Tip**: Vite is preconfigured to proxy all `/api` requests directly to `http://localhost:4000`.

### Building for Production

To create an optimized production build of the frontend:

```bash
npm run build
```

This compiles TypeScript definitions (`tsc -b`) and runs `vite build`, bundling static assets into `apps/web/dist/`.

---

## 📡 API Reference

The backend API runs on port `4000` by default.

### Health Check
- `GET /health`
  - Returns `{ "status": "ok" }`.

### Authentication (`/api/auth`)
- `POST /api/auth/register`
  - **Body**: `{ "username": "pilot1", "password": "password123", "callsign": "Apollo" }`
  - Returns user profile, bearer token, and clearance message.
- `POST /api/auth/login`
  - **Body**: `{ "username": "pilot1", "password": "password123" }`
  - Rate-limited to 10 requests per minute.
  - Returns bearer token and user profile.
- `GET /api/auth/me`
  - **Headers**: `Authorization: Bearer <token>`
  - Returns the currently authenticated user.
- `POST /api/auth/logout`
  - **Headers**: `Authorization: Bearer <token>`
  - Invalidates the active session.

> **Default Seed User**:  
> Username: `commander` | Password: `spaceapps2026`

### Missions (`/api/missions`)
- `GET /api/missions`: Returns the complete catalog of 5 space missions.
- `GET /api/missions/:id`: Returns details and objectives for a specific mission.

### Leaderboard (`/api/leaderboard`)
- `GET /api/leaderboard?timeframe=all-time`
  - Supported timeframes: `all-time`, `monthly`, `weekly`.
  - Returns top ranked commanders, XP, level, and mission completion statistics.

---

## ⚙️ Game Mechanics & Engineering Details

### 1. The React ↔ Phaser Integration Contract
The application uses a clean event-driven interface between React state management and the Phaser visual canvas:
- `<PhaserGame />` mounts inside any React page (`LaunchPage`, `ResultsPage`, `WorkshopPage`).
- **One-Way State Flow**: React passes authoritative evaluation results (`missionOutcome="success" | "failure"`) as props or dispatches events via the Phaser Event Bus (`launch:trigger`, `launch:skip`).
- **Resilience**: If WebGL/Canvas is unsupported or restricted, the React UI degrades gracefully without interrupting gameplay or debriefing screens.

### 2. Line of Sight (LOS) Communications
A dedicated telemetry calculation algorithm checks whether the spacecraft maintains line of sight with ground tracking networks based on altitude, orbital position, and celestial horizon curvature. Loss of signal triggers warnings on the mission control telemetry dashboard.

---

## 👥 Contributing & Team

Developed for the **NASA Space Apps Challenge** by:

- **Pannaga M Davasam** — Lead Integrator & Fullstack Frontend Architect
- **Sonakshi V Jain** — Phaser 2D Visuals, Animation Specialist & QA
- **Sriganesh Doddaballapur** — Game Mechanics & Backend Engineering
- **Vineeth** — Systems Engineering & Integration
- **GIGZ-XD** — Gameplay & Design

---

## 📄 License

This project is licensed under the **MIT License** — see the [LICENSE](../../LICENSE) file for details.
