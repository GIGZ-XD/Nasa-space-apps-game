import Phaser from "phaser";
import { Starfield } from "../systems/Starfield";
import { Planet } from "../objects/Planet";
import { Spacecraft } from "../objects/Spacecraft";
import { SceneTransitionCoordinator } from "../systems/SceneTransition";
import { WorkshopScene } from "./WorkshopScene";
import { LaunchScene } from "./LaunchScene";
import { OutcomeAnimationController } from "../animations/outcomeAnimation";
import { MissionOutcomeStatus, MissionOutcomePayload, OUTCOME_EVENTS } from "../types/outcome";

/**
 * OrbitScene
 *
 * Visualizes the spacecraft operating in orbit around the target planet with
 * dynamic mission outcome presentation (Nominal, Success, Failure).
 *
 * Key Capabilities (Phase 4):
 * - Smooth 2.5D orbital movement with perspective scaling and depth sorting.
 * - Authoritative React-driven outcome handling (Success / Failure / Pending).
 * - Radio downlink pulse animation on Mission Success.
 * - Trajectory decay, tumbling, and spark ejection on Mission Failure.
 * - Dynamic telemetry HUD updating according to mission state.
 * - Resilient cleanup of all tweens, timers, graphics, and listeners on shutdown.
 */
export class OrbitScene extends Phaser.Scene {
  public static readonly KEY = "OrbitScene";

  private starfield?: Starfield;
  private planet?: Planet;
  private spacecraft?: Spacecraft;
  private trajectoryGraphics?: Phaser.GameObjects.Graphics;
  private hudContainer?: Phaser.GameObjects.Container;
  private outcomeController?: OutcomeAnimationController;

  // HUD text references for dynamic updates
  private statusTitleText?: Phaser.GameObjects.Text;
  private telemetryText?: Phaser.GameObjects.Text;
  private hintText?: Phaser.GameObjects.Text;

  // Orbital mechanics parameters
  private orbitAngle: number = 0;
  private orbitCenterX: number = 0;
  private orbitCenterY: number = 0;
  private baseOrbitRadiusX: number = 280;
  private baseOrbitRadiusY: number = 95;
  private orbitSpeed: number = 0.55; // radians per second

  // Active outcome state
  private activeOutcome: MissionOutcomeStatus = "pending";
  private outcomeListener?: (payload: MissionOutcomePayload) => void;

  constructor() {
    super({ key: OrbitScene.KEY });
  }

  create(): void {
    const { width, height } = this.scale;

    // 1. Starfield Background
    this.starfield = new Starfield(this, {
      width,
      height,
      starCount: 160,
      enableDrift: true,
      driftSpeed: 3,
      enableTwinkle: true,
    });

    // 2. Planet (Center Stage)
    this.orbitCenterX = Math.round(width * 0.5);
    this.orbitCenterY = Math.round(height * 0.5);
    const planetRadius = Math.round(Math.min(width, height) * 0.22);

    this.planet = new Planet(this, this.orbitCenterX, this.orbitCenterY, {
      radius: planetRadius,
      type: "terrestrial",
      hasAtmosphere: true,
      hasRing: false,
    });
    this.planet.setDepth(0);

    // 3. Orbital Trajectory Line
    this.trajectoryGraphics = this.add.graphics();
    this.trajectoryGraphics.setDepth(-5);
    this.drawOrbitalPath(0x00e5ff, 0.28, 1.0);

    // 4. Spacecraft in Orbit
    this.spacecraft = new Spacecraft(this, this.orbitCenterX + this.baseOrbitRadiusX, this.orbitCenterY, {
      scale: 2.2,
      enableIdleFloat: false, // Explicit orbital positioning
    });
    this.spacecraft.setDepth(10);

    // 5. Outcome Animation Controller
    this.outcomeController = new OutcomeAnimationController({
      scene: this,
      spacecraft: this.spacecraft,
      planetCenterX: this.orbitCenterX,
      planetCenterY: this.orbitCenterY,
      onDecayComplete: () => {
        this.events.emit(OUTCOME_EVENTS.DECAY_COMPLETE);
        this.game.events?.emit(OUTCOME_EVENTS.DECAY_COMPLETE);
      },
    });

    // 6. Telemetry & Navigation HUD
    this.buildOrbitHUD(width, height);

    // 7. Keyboard Shortcuts for Testing & Verification
    this.setupKeyboardControls();

    // 8. Register Outcome Listener from React Event Bus
    this.setupOutcomeListener();

    // 9. Inspect Registry for initial outcome prop
    const registryOutcome = this.registry.get("missionOutcome") as MissionOutcomeStatus | undefined;
    if (registryOutcome) {
      this.setMissionOutcome(registryOutcome);
    }

    // 10. Robust Lifecycle Cleanup
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.cleanupResources();
    });
  }

  /**
   * Sets up communication listener for mission outcome dispatched by React
   */
  private setupOutcomeListener(): void {
    this.outcomeListener = (payload: MissionOutcomePayload) => {
      if (!payload || !payload.status) return;
      this.setMissionOutcome(payload.status, payload.reason, payload.score);
    };

    // Listen on both scene-local and game-wide event bus
    this.events.on(OUTCOME_EVENTS.SET_OUTCOME, this.outcomeListener);
    this.game.events?.on(OUTCOME_EVENTS.SET_OUTCOME, this.outcomeListener);
  }

  /**
   * Authoritative setter for mission outcome visualization
   */
  public setMissionOutcome(outcome: MissionOutcomeStatus, reason?: string, score?: number): void {
    if (this.activeOutcome === outcome && outcome !== "pending") return;
    this.activeOutcome = outcome;

    this.outcomeController?.applyOutcome(outcome);
    this.updateHUDForOutcome(outcome, reason, score);

    // Dispatch acknowledgment back to React / listeners
    if (outcome === "success") {
      this.events.emit(OUTCOME_EVENTS.SUCCESS_RENDERED);
      this.game.events?.emit(OUTCOME_EVENTS.SUCCESS_RENDERED);
    } else if (outcome === "failure") {
      this.events.emit(OUTCOME_EVENTS.FAILURE_RENDERED);
      this.game.events?.emit(OUTCOME_EVENTS.FAILURE_RENDERED);
    }
  }

  /**
   * Updates HUD labels, colors, and telemetry according to outcome
   */
  private updateHUDForOutcome(outcome: MissionOutcomeStatus, reason?: string, score?: number): void {
    if (!this.statusTitleText || !this.telemetryText || !this.hintText) return;

    if (outcome === "success") {
      this.statusTitleText
        .setText("MISSION ACCOMPLISHED // PRIMARY OBJECTIVES ACHIEVED")
        .setColor("#22c55e");

      const scoreLabel = typeof score === "number" ? `SCORE: ${score}/100 | ` : "";
      this.telemetryText
        .setText(`${scoreLabel}ORBIT: STABLE 420x385 KM | DOWNLINK: 100% | STATUS: NOMINAL`)
        .setColor("#22c55e");

      this.hintText
        .setText("TELEMETRY LOCKED // SOLAR ARRAYS DEPLOYED // SCIENCE PAYLOAD ACTIVE")
        .setColor("#86efac");
    } else if (outcome === "failure") {
      this.statusTitleText
        .setText("MISSION ANOMALY // CRITICAL ORBITAL DECAY")
        .setColor("#ef4444");

      const reasonLabel = reason ? `[${reason.toUpperCase()}] ` : "";
      this.telemetryText
        .setText(`${reasonLabel}ALTITUDE DECAYING | LOSS OF SIGNAL IMMINENT | STATUS: INFEASIBLE`)
        .setColor("#ef4444");

      this.hintText
        .setText("SYSTEM ALERT: ATTITUDE CONTROL FAILURE // STABILIZATION BURN FAILED")
        .setColor("#fca5a5");
    } else {
      // Pending / Nominal
      this.statusTitleText
        .setText("ORBIT INSERTION CONFIRMED // MISSION ARCHITECT")
        .setColor("#00e5ff");

      this.telemetryText
        .setText("APO: 420 KM | PER: 385 KM | INC: 51.6° | STATUS: STABLE ORBIT")
        .setColor("#22c55e");

      this.hintText
        .setText("ORBIT LOCKED // SOLAR ARRAYS DEPLOYED // AWAITING EVALUATION")
        .setColor("#94a3b8");
    }
  }

  /**
   * Draws the projected orbital ellipse track
   */
  private drawOrbitalPath(color: number, alpha: number, radiusScale: number = 1.0): void {
    if (!this.trajectoryGraphics) return;
    const g = this.trajectoryGraphics;
    g.clear();

    const rx = this.baseOrbitRadiusX * radiusScale;
    const ry = this.baseOrbitRadiusY * radiusScale;

    g.lineStyle(1.5, color, alpha);
    g.strokeEllipse(this.orbitCenterX, this.orbitCenterY, rx * 2, ry * 2);
  }

  /**
   * Builds the orbital telemetry HUD, mission indicators, and dev controls
   */
  private buildOrbitHUD(width: number, height: number): void {
    this.hudContainer = this.add.container(0, 0);
    this.hudContainer.setDepth(100);

    const hudBg = this.add.graphics();
    hudBg.fillStyle(0x020617, 0.75);
    hudBg.lineStyle(1, 0x1e293b, 0.85);

    // Top status banner bar
    hudBg.fillRect(24, 20, width - 48, 38);
    hudBg.strokeRect(24, 20, width - 48, 38);

    // Mission status text
    this.statusTitleText = this.add.text(
      36,
      28,
      "ORBIT INSERTION CONFIRMED // MISSION ARCHITECT",
      {
        fontFamily: "Courier, monospace",
        fontSize: "14px",
        color: "#00e5ff",
      }
    );

    this.telemetryText = this.add.text(
      width - 36,
      28,
      "APO: 420 KM | PER: 385 KM | INC: 51.6° | STATUS: STABLE ORBIT",
      {
        fontFamily: "Courier, monospace",
        fontSize: "12px",
        color: "#22c55e",
      }
    ).setOrigin(1, 0);

    // Bottom Navigation & Dev Action Bar
    const bottomY = height - 44;
    hudBg.fillRect(24, bottomY, width - 48, 32);
    hudBg.strokeRect(24, bottomY, width - 48, 32);

    this.hintText = this.add.text(
      36,
      bottomY + 8,
      "ORBIT LOCKED // SOLAR ARRAYS DEPLOYED // AWAITING EVALUATION",
      {
        fontFamily: "Courier, monospace",
        fontSize: "11px",
        color: "#94a3b8",
      }
    );

    // Interactive dev buttons for runtime verification
    let btnX = width - 470;

    const makeBtn = (label: string, color: string, onClick: () => void) => {
      const btn = this.add.text(btnX, bottomY + 6, label, {
        fontFamily: "Courier, monospace",
        fontSize: "11px",
        color,
      }).setInteractive({ useHandCursor: true });
      btn.on("pointerdown", onClick);
      btnX += btn.width + 12;
      return btn;
    };

    const successBtn = makeBtn("[ SUCCESS (S) ]", "#22c55e", () => this.setMissionOutcome("success"));
    const failureBtn = makeBtn("[ FAILURE (F) ]", "#ef4444", () => this.setMissionOutcome("failure", "Power Depletion"));
    const resetBtn = makeBtn("[ RESET (R) ]", "#94a3b8", () => this.setMissionOutcome("pending"));
    const workshopBtn = makeBtn("[ WORKSHOP (W) ]", "#38bdf8", () => this.returnToWorkshop());
    const relaunchBtn = makeBtn("[ LAUNCH (L) ]", "#f59e0b", () => this.relaunch());

    this.hudContainer.add([
      hudBg,
      this.statusTitleText,
      this.telemetryText,
      this.hintText,
      successBtn,
      failureBtn,
      resetBtn,
      workshopBtn,
      relaunchBtn,
    ]);
  }

  private setupKeyboardControls(): void {
    if (!this.input.keyboard) return;

    this.input.keyboard.on("keydown-S", () => {
      this.setMissionOutcome("success");
    });

    this.input.keyboard.on("keydown-F", () => {
      this.setMissionOutcome("failure", "Orbital Decay");
    });

    this.input.keyboard.on("keydown-R", () => {
      this.setMissionOutcome("pending");
    });

    this.input.keyboard.on("keydown-W", () => {
      this.returnToWorkshop();
    });

    this.input.keyboard.on("keydown-L", () => {
      this.relaunch();
    });
  }

  private returnToWorkshop(): void {
    SceneTransitionCoordinator.transitionTo({
      fromScene: this,
      toSceneKey: WorkshopScene.KEY,
    });
  }

  private relaunch(): void {
    SceneTransitionCoordinator.transitionTo({
      fromScene: this,
      toSceneKey: LaunchScene.KEY,
    });
  }

  update(time: number, delta: number): void {
    this.starfield?.update(time, delta);
    this.planet?.update(time, delta);
    this.outcomeController?.update(time, delta);

    if (this.spacecraft) {
      this.spacecraft.update(time, delta);

      const dt = delta / 1000;
      const modifiers = this.outcomeController?.getOrbitModifiers() ?? {
        radiusScale: 1.0,
        rotationOffset: 0,
        trajectoryColor: 0x00e5ff,
        trajectoryAlpha: 0.28,
      };

      // Re-draw trajectory path matching active outcome styling
      this.drawOrbitalPath(modifiers.trajectoryColor, modifiers.trajectoryAlpha, modifiers.radiusScale);

      // Advance orbital position
      this.orbitAngle += this.orbitSpeed * dt;

      const cos = Math.cos(this.orbitAngle);
      const sin = Math.sin(this.orbitAngle);

      const currentRadiusX = this.baseOrbitRadiusX * modifiers.radiusScale;
      const currentRadiusY = this.baseOrbitRadiusY * modifiers.radiusScale;

      // Position spacecraft along projected ellipse
      this.spacecraft.x = this.orbitCenterX + cos * currentRadiusX;
      this.spacecraft.y = this.orbitCenterY + sin * currentRadiusY;

      // 2.5D Depth and Perspective:
      if (sin > 0) {
        this.spacecraft.setDepth(10);
        const depthScale = (2.0 + sin * 0.4) * Math.min(1.0, modifiers.radiusScale + 0.1);
        this.spacecraft.setScale(depthScale);
      } else {
        this.spacecraft.setDepth(-10);
        const depthScale = (2.0 + sin * 0.4) * Math.min(1.0, modifiers.radiusScale + 0.1);
        this.spacecraft.setScale(Math.max(1.2, depthScale));
      }

      // Orbital flight orientation angle + outcome tumble offset
      const nominalAngle = Math.atan2(
        sin * currentRadiusY * 0.2,
        -cos * currentRadiusX * 0.2
      );
      this.spacecraft.rotation = nominalAngle + modifiers.rotationOffset;
    }
  }

  /**
   * Safe disposal of all scene resources
   */
  private cleanupResources(): void {
    if (this.outcomeListener) {
      this.events.off(OUTCOME_EVENTS.SET_OUTCOME, this.outcomeListener);
      this.game.events?.off(OUTCOME_EVENTS.SET_OUTCOME, this.outcomeListener);
      this.outcomeListener = undefined;
    }

    this.outcomeController?.destroy();
    this.outcomeController = undefined;

    this.starfield?.destroy();
    this.starfield = undefined;

    this.planet?.destroy();
    this.planet = undefined;

    this.spacecraft?.destroy();
    this.spacecraft = undefined;

    this.trajectoryGraphics?.destroy();
    this.trajectoryGraphics = undefined;

    this.hudContainer?.destroy();
    this.hudContainer = undefined;

    this.input.keyboard?.removeAllListeners();
  }
}
