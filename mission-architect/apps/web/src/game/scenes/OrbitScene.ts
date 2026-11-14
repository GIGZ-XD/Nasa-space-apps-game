import Phaser from "phaser";
import { Starfield } from "../systems/Starfield";
import { Planet } from "../objects/Planet";
import { Spacecraft } from "../objects/Spacecraft";
import { SceneTransitionCoordinator } from "../systems/SceneTransition";
import { WorkshopScene } from "./WorkshopScene";
import { LaunchScene } from "./LaunchScene";

/**
 * OrbitScene
 *
 * Visualizes the spacecraft successfully operating in orbital flight around the planet.
 * Features:
 * - Reusable Starfield and Planet systems from Phase 2.
 * - Dynamic 2.5D orbital flight mechanics (varying perspective depth, scale, and occlusion).
 * - Faint orbital trajectory ellipse path.
 * - Mission control orbital telemetry HUD with inclination and altitude readouts.
 * - Temporary navigation buttons for testing the full scene loop.
 */
export class OrbitScene extends Phaser.Scene {
  public static readonly KEY = "OrbitScene";

  private starfield?: Starfield;
  private planet?: Planet;
  private spacecraft?: Spacecraft;
  private trajectoryGraphics?: Phaser.GameObjects.Graphics;
  private hudContainer?: Phaser.GameObjects.Container;

  // Orbital mechanics parameters
  private orbitAngle: number = 0;
  private orbitCenterX: number = 0;
  private orbitCenterY: number = 0;
  private orbitRadiusX: number = 280;
  private orbitRadiusY: number = 95;
  private orbitSpeed: number = 0.55; // radians per second

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

    // 3. Faint Orbital Trajectory Line
    this.trajectoryGraphics = this.add.graphics();
    this.trajectoryGraphics.setDepth(-5);
    this.drawOrbitalPath();

    // 4. Spacecraft in Orbit
    this.spacecraft = new Spacecraft(this, this.orbitCenterX + this.orbitRadiusX, this.orbitCenterY, {
      scale: 2.2,
      enableIdleFloat: false, // We control orbital position explicitly
    });
    this.spacecraft.setDepth(10);

    // 5. Telemetry & Navigation HUD
    this.buildOrbitHUD(width, height);

    // 6. Keyboard Shortcuts for Testing
    this.setupKeyboardControls();

    // 7. Cleanup on Shutdown
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.starfield?.destroy();
      this.planet?.destroy();
      this.spacecraft?.destroy();
      this.trajectoryGraphics?.destroy();
      this.hudContainer?.destroy();
      this.input.keyboard?.removeAllListeners();
    });
  }

  /**
   * Draws the projected orbital ellipse track
   */
  private drawOrbitalPath(): void {
    if (!this.trajectoryGraphics) return;
    const g = this.trajectoryGraphics;
    g.clear();

    // Faint dashed cyan orbital path
    g.lineStyle(1, 0x00e5ff, 0.28);
    g.strokeEllipse(this.orbitCenterX, this.orbitCenterY, this.orbitRadiusX * 2, this.orbitRadiusY * 2);
  }

  /**
   * Builds the orbital insertion telemetry HUD and testing controls
   */
  private buildOrbitHUD(width: number, height: number): void {
    this.hudContainer = this.add.container(0, 0);
    this.hudContainer.setDepth(100);

    const hudBg = this.add.graphics();
    hudBg.fillStyle(0x020617, 0.7);
    hudBg.lineStyle(1, 0x1e293b, 0.8);

    // Top status banner bar
    hudBg.fillRect(24, 20, width - 48, 38);
    hudBg.strokeRect(24, 20, width - 48, 38);

    // Mission status text
    const title = this.add.text(
      36,
      28,
      "ORBIT INSERTION CONFIRMED // MISSION ARCHITECT",
      {
        fontFamily: "Courier, monospace",
        fontSize: "14px",
        color: "#00e5ff",
      }
    );

    const telemetryText = this.add.text(
      width - 36,
      28,
      "APO: 420 KM | PER: 385 KM | INC: 51.6° | STATUS: STABLE ORBIT",
      {
        fontFamily: "Courier, monospace",
        fontSize: "12px",
        color: "#22c55e",
      }
    ).setOrigin(1, 0);

    // Bottom Navigation Bar with Clickable Dev Triggers
    const bottomY = height - 44;
    hudBg.fillRect(24, bottomY, width - 48, 32);
    hudBg.strokeRect(24, bottomY, width - 48, 32);

    const hintText = this.add.text(
      36,
      bottomY + 8,
      "ORBIT LOCKED // SOLAR ARRAYS DEPLOYED // TELEMETRY NOMINAL",
      {
        fontFamily: "Courier, monospace",
        fontSize: "11px",
        color: "#94a3b8",
      }
    );

    // Dev action: Return to Workshop Button
    const workshopBtn = this.add.text(
      width - 240,
      bottomY + 6,
      "[ WORKSHOP (W) ]",
      {
        fontFamily: "Courier, monospace",
        fontSize: "12px",
        color: "#38bdf8",
      }
    ).setInteractive({ useHandCursor: true });

    workshopBtn.on("pointerdown", () => {
      this.returnToWorkshop();
    });

    // Dev action: Re-run Launch Button
    const relaunchBtn = this.add.text(
      width - 110,
      bottomY + 6,
      "[ RE-LAUNCH (L) ]",
      {
        fontFamily: "Courier, monospace",
        fontSize: "12px",
        color: "#f59e0b",
      }
    ).setInteractive({ useHandCursor: true });

    relaunchBtn.on("pointerdown", () => {
      this.relaunch();
    });

    this.hudContainer.add([hudBg, title, telemetryText, hintText, workshopBtn, relaunchBtn]);
  }

  private setupKeyboardControls(): void {
    if (!this.input.keyboard) return;

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

    if (this.spacecraft) {
      this.spacecraft.update(time, delta);

      // Advance orbital position
      const dt = delta / 1000;
      this.orbitAngle += this.orbitSpeed * dt;

      const cos = Math.cos(this.orbitAngle);
      const sin = Math.sin(this.orbitAngle);

      // Position spacecraft along projected ellipse
      this.spacecraft.x = this.orbitCenterX + cos * this.orbitRadiusX;
      this.spacecraft.y = this.orbitCenterY + sin * this.orbitRadiusY;

      // 2.5D Depth and Perspective:
      // When sin > 0, spacecraft is in front of the planet (depth = 10, scale = 2.4).
      // When sin < 0, spacecraft is behind the planet (depth = -10, scale = 1.6).
      if (sin > 0) {
        this.spacecraft.setDepth(10);
        const depthScale = 2.0 + sin * 0.4;
        this.spacecraft.setScale(depthScale);
      } else {
        this.spacecraft.setDepth(-10);
        const depthScale = 2.0 + sin * 0.4;
        this.spacecraft.setScale(Math.max(1.4, depthScale));
      }

      // S-curve orbital flight orientation angle
      this.spacecraft.rotation = Math.atan2(
        sin * this.orbitRadiusY * 0.2,
        -cos * this.orbitRadiusX * 0.2
      );
    }
  }
}
