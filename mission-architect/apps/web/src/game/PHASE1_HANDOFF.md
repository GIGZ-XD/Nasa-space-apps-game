# Phase 1: Phaser 3 & React Integration — Handoff Document

**Owner**: Person 4 — Sonakshi  
**Phase**: Phase 1 (Complete)  
**Target Package**: `@mission-architect/web`  
**Status**: Ready for Phase 2

---

## 1. Files Created and Modified

### Created Files
- `apps/web/src/game/index.ts`: Public module barrel exporting `PhaserGame`, `createGameConfig`, `gameConfig`, default scenes, and TypeScript types.
- `apps/web/src/game/PHASE1_HANDOFF.md`: This integration and architecture handoff guide.
- `apps/web/tsconfig.json`: TypeScript configuration for the web application workspace extending `../../tsconfig.base.json`.

### Modified Files
- `apps/web/package.json`: Added `phaser: "^3.90.0"` dependency.
- `apps/web/src/game/config/gameConfig.ts`: Production Phaser 3 game configuration with Canvas rendering, responsive Scale Manager, and pixel-art settings.
- `apps/web/src/game/scenes/BootScene.ts`: Initial bootloader scene executing engine initialization and starting `PreloadScene`.
- `apps/web/src/game/scenes/PreloadScene.ts`: Asset preloading stage with procedural visuals and graceful handling of missing optional assets.
- `apps/web/src/game/PhaserGame.tsx`: Reusable React wrapper component managing Phaser 3 lifecycle, unmount cleanup, and React 18 StrictMode compatibility.
- `apps/web/src/app/App.tsx`: Development test harness demonstrating the game canvas and interactive mount/unmount lifecycle testing.
- `mission-architect/.gitignore`: Added `*.tsbuildinfo` to prevent checking in build cache files.
- `mission-architect/package-lock.json`: Updated workspace lockfile.

---

## 2. Phaser Version and Configuration

- **Version**: `phaser@^3.90.0` (Phaser 3).
- **Renderer**: `Phaser.CANVAS` (pure 2D Canvas rendering).
- **Default Resolution**: `1280 x 720` (16:9 base aspect ratio).
- **Scaling Mode**: `Phaser.Scale.FIT` with `Phaser.Scale.CENTER_BOTH` auto-centering.
- **Pixel Art Settings**:
  - `render.pixelArt: true`
  - `render.antialias: false`
  - `render.roundPixels: true`
- **Background Color**: `#050713` (deep space navy-black).
- **Scenes Registered by Default**: `[BootScene, PreloadScene]`.
- **Physics / Extra Plugins**: None configured (keeps bundle lean; can be extended in future phases if needed).

---

## 3. How React Mounts and Destroys Phaser

1. **Mounting**:
   - `PhaserGame` renders a designated wrapper `<div>` referenced via `containerRef`.
   - `useEffect` checks for browser environment (`window !== "undefined"` and `containerRef.current`).
   - Any residual DOM nodes in `containerRef.current` are cleared.
   - `new Phaser.Game(config)` is initialized with `parent: containerRef.current`.
   - The game instance is stored in `gameRef.current`.
   - When the game finishes booting and emits its `ready` event, the optional `onGameReady(game)` callback is invoked.

2. **Destruction & Cleanup**:
   - When the React component unmounts (or during React 18 StrictMode's dev mount-unmount-remount sequence), the `useEffect` cleanup handler executes:
     1. Calls `activeGame.destroy(true)`: Requests Phaser stop and remove its canvas.
     2. Calls internal `runDestroy()` synchronously if already booted: Cancels requestAnimationFrame loop immediately to prevent lingering frame callbacks from racing against an immediate remount.
     3. If unmounted before boot finishes, binds a one-time `boot` listener to ensure destruction triggers when boot resolves.
     4. Purges all children from `containerRef.current`.
     5. Calls the optional `onGameDestroyed()` callback.
     6. Clears `gameRef.current = null`.

---

## 4. How to Import and Use PhaserGame

```tsx
import { PhaserGame } from "../game";

export function GameView() {
  return (
    <div style={{ width: "100%", height: "100%", minHeight: "600px" }}>
      <PhaserGame
        width={1280}
        height={720}
        onGameReady={(game) => {
          console.log("Phaser 3 game engine ready:", game);
        }}
      />
    </div>
  );
}
```

---

## 5. Supported Component Props

| Prop | Type | Default | Description |
|---|---|---|---|
| `width` | `number \| string` | `1280` | Canvas width in pixels or CSS percentage string. |
| `height` | `number \| string` | `720` | Canvas height in pixels or CSS percentage string. |
| `className` | `string` | `undefined` | Optional CSS class applied to the outer host `<div>`. |
| `style` | `React.CSSProperties` | `undefined` | Optional custom inline styles merged with the host container styles. |
| `scenes` | `Phaser.Types.Scenes.SceneType[]` | `[BootScene, PreloadScene]` | Override scene list to register custom scenes. |
| `onGameReady` | `(game: Phaser.Game) => void` | `undefined` | Callback invoked once Phaser has booted and is ready. |
| `onGameDestroyed` | `() => void` | `undefined` | Callback invoked after the game and canvas have been torn down. |

---

## 6. How Another Teammate Can Add a New Phaser Scene

To add a new scene (e.g., `WorkshopScene` or `LaunchScene`):

1. **Create the Scene**: Extend `Phaser.Scene` in `src/game/scenes/`:
   ```ts
   import Phaser from "phaser";

   export class WorkshopScene extends Phaser.Scene {
     public static readonly KEY = "WorkshopScene";

     constructor() {
       super({ key: WorkshopScene.KEY });
     }

     create(): void {
       // Scene logic here
     }
   }
   ```
2. **Register the Scene**: Either:
   - Pass it in `scenes` prop to `PhaserGame`:
     ```tsx
     <PhaserGame scenes={[BootScene, PreloadScene, WorkshopScene]} />
     ```
   - Or add it to `createGameConfig` in `src/game/config/gameConfig.ts`.
3. **Transition to the Scene**: From `PreloadScene.ts` (or any other scene):
   ```ts
   this.scene.start("WorkshopScene");
   ```

---

## 7. Current Limitations or Pending Dependencies

- **Assets**: Phase 1 uses procedural graphics (Canvas primitives) for loader and starfield. External PNG/SVG sprite loading can be safely placed in `PreloadScene.preload()`.
- **Audio Context**: No audio assets are loaded in Phase 1.
- **Routing**: Client-side routing is not yet configured by the team; `router.tsx` is an empty export.

---

## 8. Exact Instructions for Pannaga (Application & Routing Integration)

1. **Where to Mount**:
   - Pannaga can mount `<PhaserGame />` inside `WorkshopPage.tsx` (`apps/web/src/pages/WorkshopPage.tsx`) or `LaunchPage.tsx` (`apps/web/src/pages/LaunchPage.tsx`).
2. **Container Sizing**:
   - Provide a parent container with explicit width/height (or flexbox `100%`) so Phaser's `Scale.FIT` manager centers and scales the canvas appropriately:
     ```tsx
     // Example in WorkshopPage.tsx:
     import { PhaserGame } from "../game";

     export function WorkshopPage() {
       return (
         <div className="workshop-container" style={{ width: "100%", height: "calc(100vh - 64px)" }}>
           <PhaserGame />
         </div>
       );
     }
     ```
3. **Restoring `App.tsx`**:
   - Once the application router (`apps/web/src/app/router.tsx`) is implemented with route definitions (e.g. React Router or custom router), replace the test harness in `apps/web/src/app/App.tsx` with your router provider (`<RouterProvider router={router} />`).
