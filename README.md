
> **NASA Space Apps Challenge** — An educational space-mission design, spacecraft engineering, budget management, and orbital physics simulation game.

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![React](https://img.shields.io/badge/React-18.3-61DAFB?logo=react&logoColor=black)](https://react.dev/)
[![Phaser](https://img.shields.io/badge/Phaser-3.90-red?logo=phaser&logoColor=white)](https://phaser.io/)
[![Vite](https://img.shields.io/badge/Vite-5.4-646C9F?logo=vite&logoColor=white)](https://vitejs.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.5-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Express](https://img.shields.io/badge/Express-4.19-000000?logo=express&logoColor=white)](https://expressjs.com/)
[![Node.js](https://img.shields.io/badge/Node.js-%E2%89%A518-339933?logo=node.js&logoColor=white)](https://nodejs.org/)

# Cosmo!
### Design. Build. Launch. Explore.

Cosmo! is a browser-based interactive space exploration game developed during the NASA Space Apps Challenge 2026.

Step into the role of a space mission designer. Design and assemble spacecraft, manage resources, make engineering decisions, launch missions and explore the universe.

From orbital missions to challenging deep-space exploration, put your spacecraft engineering skills to the test!

## Game Features

- Mission Progression: Explore five mission levels, from simpler orbital missions to complex deep-space exploration.
- Spacecraft Builder: Design and assemble spacecraft using different components.
- Interactive Gameplay: Experience animated spacecraft launches, orbital environments and mission scenarios.
- Economy & Resource Management: Purchase spacecraft components, manage inventory and make budget-conscious decisions.
- Mission Systems: Evaluate mission performance and work with Line-of-Sight (LOS) communication mechanics.
- Achievements & Rewards: Track progress through achievements, rewards and leaderboards.

## Technology Stack

### Frontend & Game Engine
- React 18
- TypeScript
- Phaser 3
- Vite
- Zustand
- Web Audio API

### Backend & Infrastructure
- Node.js
- Express.js
- Zod
- Prisma
- API authentication and rate limiting
- Vercel
- Render

## Project Architecture

Cosmo! follows a monorepo architecture with separate frontend and backend applications, alongside shared packages and project documentation.

```text
.
├── LICENSE
├── package.json
└── mission-architect/
    ├── package.json
    ├── tsconfig.base.json
    ├── apps/
    │   ├── api/
    │   │   ├── package.json
    │   │   └── src/
    │   │       ├── app.ts
    │   │       ├── server.ts
    │   │       ├── middleware/
    │   │       ├── routes/
    │   │       ├── services/
    │   │       └── repositories/
    │   │
    │   └── web/
    │       ├── index.html
    │       ├── vite.config.ts
    │       └── src/
    │           ├── main.tsx
    │           ├── audio/
    │           ├── components/
    │           ├── data/
    │           ├── game/
    │           │   ├── PhaserGame.tsx
    │           │   ├── scenes/
    │           │   └── systems/
    │           ├── pages/
    │           └── stores/
    │
    ├── packages/
    │   └── shared/
    │
    ├── prisma/
    └── docs/
```

### Architecture Overview

- apps/web: React frontend and Phaser-powered game.
- apps/api: Express backend providing authentication, mission and leaderboard APIs.
- packages/shared: Shared TypeScript types and utilities.
- prisma: Database schema and seed scripts.
- docs: Phase audit reports and integration documentation.

The frontend and backend communicate through API endpoints, with Vite providing API proxy configuration during development.

## Getting Started

### Prerequisites

- Node.js
- npm
- Git

### Installation

Clone the repository:

```bash
git clone https://github.com/GIGZ-XD/Nasa-space-apps-game.git
```

Navigate to the application workspace:

```bash
cd Nasa-space-apps-game/mission-architect
```

Install dependencies:

```bash
npm install
```

### Running the Application

Start the backend API:

```bash
npm run dev --workspace apps/api
```

Start the frontend in a separate terminal:

```bash
npm run dev --workspace apps/web
```

The backend runs on port 4000, while the Vite development server provides the frontend and proxies API requests to the backend.

Configure the required environment variables, including `VITE_API_BASE_URL`, according to your local environment.

## Play Online

Experience Cosmo! directly in your browser:

[Play Cosmo!](https://nasa-space-apps-game-psi.vercel.app/)

## Project Background

Cosmo! was developed as part of the NASA Space Apps Challenge 2026.

We participated in the Bengaluru Local Event on November 14–15, 2026, at Jain School of Sciences, Bengaluru.

### Team

- Pannaga
- Vineeth
- Sonakshi
- Tanishka
- Sriganesh

## Ongoing Development

Cosmo! is an evolving project. Development continues beyond the event, with ongoing improvements to gameplay, existing systems and new features.

The published version represents one stage of the project's development.

## Acknowledgements

Special thanks to NASA, its partners and the NASA Space Apps Challenge team for providing this platform and opportunity to learn, collaborate and innovate.

Thanks to our teammates for their dedication, ideas and contributions throughout the development process.

## Links

- Play Online: https://nasa-space-apps-game-psi.vercel.app/
- GitHub Repository: https://github.com/GIGZ-XD/Nasa-space-apps-game

---

Made with curiosity, teamwork and a passion for space exploration.

**Welcome aboard, Cosmonaut!**
