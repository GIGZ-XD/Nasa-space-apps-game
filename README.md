# Cosmo-naut — Mission Architect

Mission Architect is a space-mission design and simulation game. Plan a mission, assemble a spacecraft, launch it, and review the outcome in a mission-control experience.

The project is organized as an npm workspaces monorepo with a React/TypeScript web app and an Express/TypeScript API. The web app uses Vite for development and Phaser for 2D game visuals.

## Project structure

```text
mission-architect/
├── apps/
│   ├── api/       # Express API
│   └── web/       # React, Vite, and Phaser client
├── docs/          # Design notes and integration contracts
├── packages/      # Shared packages
└── prisma/        # Database schema and migrations
```

## Requirements

- Node.js 18 or newer
- npm

## Getting started

Run commands from the `mission-architect` directory:

```bash
cd mission-architect
npm install
```

Start the API in one terminal:

```bash
npm run dev:api
```

Start the web app in another terminal:

```bash
npm run dev
```

Vite proxies requests to `/api` to the API at `http://localhost:4000`. The API listens on port `4000` by default; set `PORT` to use a different port.

## Available scripts

Run these from `mission-architect/`:

| Command | Description |
| --- | --- |
| `npm run dev` | Start the web app in Vite development mode. |
| `npm run dev:web` | Start the web app in Vite development mode. |
| `npm run dev:api` | Start the API with automatic reload. |
| `npm run build` | Type-check and build the web app for production. |
| `npm start` | Start the API. |

## Documentation

Project design and integration documents are in [`mission-architect/docs`](mission-architect/docs), including launch/orbit integration and mission-outcome contracts.

## License

See [`LICENSE`](LICENSE) for license details.
