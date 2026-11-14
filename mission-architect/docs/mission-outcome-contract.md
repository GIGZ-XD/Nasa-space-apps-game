# Mission Architect — Mission Outcome & Orbital Simulation Contract

**Document Version**: 1.0.0  
**Phase**: Phase 4  
**Authors**: Person 4 (Sonakshi — Phaser 2D Visuals & Animation Specialist)  
**Target Consumer**: Person 2 (Pannaga — Frontend Architecture & Integration)  
**Status**: Implemented, Verified & Ready for Integration  

---

## 1. Overview & Architectural Principle

This document governs the integration between the React application (`ResultsPage.tsx`, `LaunchPage.tsx`) and the Phaser 2D game engine for **Phase 4: Mission Outcome & Orbital Simulation**.

### Cardinal Rule
> **React/API remains the single authoritative source of truth for mission feasibility, scoring, and success/failure evaluation.**  
> Phaser is strictly responsible for visual representation, orbital kinematics, and outcome presentation animations. Phaser never computes scores or alters evaluation state.

---

## 2. Component Interface (`<PhaserGame />`)

`<PhaserGame />` provides a declarative, type-safe interface for passing mission outcomes directly via props or responding dynamically to state transitions.

```typescript
import type { CSSProperties } from "react";
import type Phaser from "phaser";

export type MissionOutcomeStatus = "pending" | "success" | "failure";

export interface PhaserGameProps {
  /** Configurable canvas width in pixels or CSS string (default: 1280) */
  width?: number | string;
  /** Configurable canvas height in pixels or CSS string (default: 720) */
  height?: number | string;
  /** Optional custom CSS class name applied to outer host div */
  className?: string;
  /** Optional custom inline styles applied to outer host div */
  style?: CSSProperties;
  /**
   * Initial scene to mount directly:
   * - 'WorkshopScene': Orbital Spacecraft Builder design lab.
   * - 'LaunchScene': Cape Canaveral launchpad with ascent animation.
   * - 'OrbitScene': Spacecraft in 2.5D orbital flight around target planet.
   */
  initialScene?: "WorkshopScene" | "LaunchScene" | "OrbitScene";
  /**
   * Authoritative mission evaluation outcome passed from React:
   * - 'pending': Nominal orbital flight awaiting evaluation (default).
   * - 'success': High-gain antenna downlink, glowing emerald trajectory, nominal telemetry lock.
   * - 'failure': Orbital decay, erratic spacecraft tumble, spark ejection, emergency alert HUD.
   */
  missionOutcome?: MissionOutcomeStatus;
  /** Callback invoked once Phaser.Game has fully booted and emitted its ready event */
  onGameReady?: (game: Phaser.Game) => void;
  /** Callback invoked after the game instance is destroyed on unmount */
  onGameDestroyed?: () => void;
}
```

---

## 3. Bidirectional Event Bus Contract

When React or Phaser needs to dispatch or acknowledge outcome events asynchronously:

```typescript
export const OUTCOME_EVENTS = {
  /** React -> Phaser: Dispatched to trigger an outcome state change */
  SET_OUTCOME: "mission:outcome",
  /** Phaser -> React: Dispatched when success animation has commenced */
  SUCCESS_RENDERED: "outcome:success:rendered",
  /** Phaser -> React: Dispatched when failure animation has commenced */
  FAILURE_RENDERED: "outcome:failure:rendered",
  /** Phaser -> React: Dispatched when orbital decay animation concludes */
  DECAY_COMPLETE: "outcome:decay:complete",
} as const;
```

### Event Payload Structure
```typescript
export interface MissionOutcomePayload {
  status: "pending" | "success" | "failure";
  reason?: string;       // e.g., "Power Depletion", "Excess Payload Mass"
  score?: number;        // Overall evaluation score (0-100)
  missionId?: string;    // e.g., "earth-observation", "artemis-base"
}
```

---

## 4. How Pannaga Connects on `ResultsPage.tsx`

On the mission evaluation debriefing page (`apps/web/src/pages/ResultsPage.tsx`):

```tsx
import { PhaserGame } from "../game";

export function ResultsPage() {
  const { evaluation } = useSpacecraft(); // Or API result
  const isMissionSuccessful = evaluation && evaluation.overallScore >= 70;

  return (
    <div className="relative w-full h-[380px] rounded-lg overflow-hidden border border-slate-800 bg-slate-950">
      <PhaserGame
        initialScene="OrbitScene"
        missionOutcome={isMissionSuccessful ? "success" : "failure"}
        onGameReady={(game) => {
          // Optional: Listen for decay completion or telemetry sync
          game.events.on("outcome:decay:complete", () => {
            console.log("[Debrief] Visual decay animation finalized");
          });
        }}
      />
    </div>
  );
}
```

---

## 5. Resilience & Fault Tolerance Guarantees

1. **Missing or Delayed Outcome**:
   If `missionOutcome` is omitted or delayed while the backend computes evaluation metrics, `OrbitScene` runs in nominal `pending` mode with smooth orbital flight and neutral telemetry. It seamlessly transitions the moment the prop updates.
2. **Component Destruction on Fast Navigation**:
   If the user navigates away or skips to debrief immediately, `<PhaserGame />` unmount triggers `cleanupResources()`, safely terminating all active tweens, timers, and particle emitters with zero memory leaks.
3. **Phaser Unavailable / Headless Fallback**:
   The React `ResultsPage` does not block on or require Phaser animation completions. Evaluation scores and telemetry criteria render independently in pure React/HTML.
