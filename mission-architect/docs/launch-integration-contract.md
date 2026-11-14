# Mission Architect — Launch & Orbit Integration Contract

**Document Version**: 1.0.0  
**Authors**: Person 4 (Sonakshi — Phaser 2D Visuals)  
**Target Consumer**: Person 2 (Pannaga — Frontend Architecture & Integration)  
**Status**: Proposed & Ready for Cross-Workstream Review  

---

## 1. Overview

This document specifies the contract between React (`apps/web/src/pages/LaunchPage.tsx` and `ResultsPage.tsx`) and the Phaser 2D Game Engine (`apps/web/src/game/`).

It defines:
1. Supported component props for `<PhaserGame />`.
2. Scene transitions and direct scene mounting.
3. Event triggers and lifecycle synchronization (Countdown, Ignition, Liftoff, Orbit insertion).
4. Error handling and headless/reduced-motion fallbacks.

---

## 2. Component Props Interface

```typescript
import type { CSSProperties } from "react";
import type Phaser from "phaser";

export interface PhaserGameProps {
  /** Configurable canvas width in pixels or CSS string (default: 1280) */
  width?: number | string;
  /** Configurable canvas height in pixels or CSS string (default: 720) */
  height?: number | string;
  /** Optional custom CSS class name applied to the outer host <div> */
  className?: string;
  /** Optional custom inline styles applied to the outer host <div> */
  style?: CSSProperties;
  /**
   * Initial scene to display:
   * - 'WorkshopScene': Orbital Spacecraft Builder design lab (default).
   * - 'LaunchScene': Launchpad 39A with rocket, gantry, and ascent animation.
   * - 'OrbitScene': Spacecraft in active orbital flight around planet.
   */
  initialScene?: "WorkshopScene" | "LaunchScene" | "OrbitScene";
  /** Optional array of Scene classes to override default registry */
  scenes?: Phaser.Types.Scenes.SceneType[];
  /** Callback invoked once Phaser.Game has fully booted and emitted its ready event */
  onGameReady?: (game: Phaser.Game) => void;
  /** Callback invoked after the game instance is destroyed on unmount */
  onGameDestroyed?: () => void;
}
```

---

## 3. Scene Lifecycle & Transitions

```
[ BootScene ] ──► [ PreloadScene ] ──► [ WorkshopScene ]
                                              │
                                              ▼ (Launch trigger)
                                       [ LaunchScene ]
                                              │
                                              ▼ (Orbit cutoff)
                                        [ OrbitScene ]
```

### Scene Keys

```typescript
export const SCENE_KEYS = {
  BOOT: "BootScene",
  PRELOAD: "PreloadScene",
  WORKSHOP: "WorkshopScene",
  LAUNCH: "LaunchScene",
  ORBIT: "OrbitScene",
} as const;
```

---

## 4. How Pannaga Connects to `<PhaserGame />`

### A. On the Spacecraft Builder Page (`SpacecraftBuilderPage.tsx`)
Mounts the orbital workshop scene showing the assembled craft and planet:
```tsx
import { PhaserGame } from "../game";

<div className="relative w-full h-[600px] rounded-lg overflow-hidden">
  <PhaserGame initialScene="WorkshopScene" />
</div>
```

### B. On the Launch Transition Page (`LaunchPage.tsx`)
Mounts the launchpad scene with liftoff animation:
```tsx
import { PhaserGame } from "../game";

<div className="relative w-full h-[600px] rounded-lg overflow-hidden">
  <PhaserGame
    initialScene="LaunchScene"
    onGameReady={(game) => {
      // Optional: React can listen to Phaser launch events if desired
      const launchScene = game.scene.getScene("LaunchScene");
      launchScene?.events.on("launch:complete", () => {
        navigate(`/missions/${missionId}/results`);
      });
    }}
  />
</div>
```

### C. On the Results Debriefing Page (`ResultsPage.tsx`)
Mounts the orbital flight scene:
```tsx
<div className="w-full h-[360px] rounded-lg overflow-hidden">
  <PhaserGame initialScene="OrbitScene" />
</div>
```

---

## 5. Event Triggers (Phaser Event Bus)

When React wants to imperatively control the launchpad sequence from outside:

| Event Name | Direction | Payload | Description |
|---|---|---|---|
| `launch:trigger` | React $\rightarrow$ Phaser | `void` | Begins the T-3 countdown and liftoff sequence. |
| `launch:skip` | React $\rightarrow$ Phaser | `void` | Instantly skips ascent and fast-forwards to `OrbitScene`. |
| `launch:ignition` | Phaser $\rightarrow$ React | `void` | Dispatched when engine ignition sequence commences. |
| `launch:liftoff` | Phaser $\rightarrow$ React | `void` | Dispatched when rocket clears the gantry tower. |
| `launch:staging` | Phaser $\rightarrow$ React | `void` | Dispatched when fairing separates at the space boundary. |
| `launch:complete` | Phaser $\rightarrow$ React | `void` | Dispatched when orbit insertion transition begins. |

---

## 6. Fallback and Graceful Degradation

1. **Phaser Disabled / WebGL/Canvas Blocked**:
   If the browser or testing environment blocks canvas initialization, `<PhaserGame />` fails silently without unhandled exceptions.
2. **Immediate Route Navigation (Skip)**:
   If the player clicks "Proceed to Debrief" or navigates away mid-launch, `<PhaserGame />` unmount cleanup immediately cancels all active tweens, stops the animation loop, and purges the canvas without memory leaks.
