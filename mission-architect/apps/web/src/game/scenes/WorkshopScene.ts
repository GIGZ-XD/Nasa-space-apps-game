import Phaser from "phaser";
import { Starfield } from "../systems/Starfield";
import { Planet } from "../objects/Planet";
import { Spacecraft } from "../objects/Spacecraft";
import { SceneTransitionCoordinator } from "../systems/SceneTransition";
import { LaunchScene } from "./LaunchScene";

/**
 * WorkshopScene
 *
 * Primary 2D pixel-art space environment for Mission Architect.
 * Composes:
 * - Layered procedural starfield with cosmic dust and twinkling stars.
 * - Detailed terrestrial pixel-art planet with atmospheric glow and cloud drift.
 * - Modular 2D spacecraft with animated thrusters, blinking beacons, and idle cosmic drift.
 * - Retro telemetry overlay HUD with launch transition trigger.
 */
export class WorkshopScene extends Phaser.Scene {
  public static readonly KEY = "WorkshopScene";

  private starfield?: Starfield;
  private planet?: Planet;
  private spacecraft?: Spacecraft;
  private hudContainer?: Phaser.GameObjects.Container;

  constructor() {
    super({ key: WorkshopScene.KEY });
  }

  create(): void {
    const { width, height } = this.scale;

    // 1. Procedural Layered Starfield System
    this.starfield = new Starfield(this, {
      width,
      height,
      starCount: 180,
      enableDrift: true,
      driftSpeed: 5,
      enableTwinkle: true,
    });

    // 2. Planet (positioned in the right-center background composition)
    const planetX = Math.round(width * 0.74);
    const planetY = Math.round(height * 0.52);
    const planetRadius = Math.round(Math.min(width, height) * 0.22);

    this.planet = new Planet(this, planetX, planetY, {
      radius: planetRadius,
      type: "terrestrial",
      hasAtmosphere: true,
      hasRing: false,
    });
    this.planet.setDepth(-10);

    // 3. Spacecraft (positioned prominently in the left-center focal point)
    const craftX = Math.round(width * 0.32);
    const craftY = Math.round(height * 0.48);

    this.spacecraft = new Spacecraft(this, craftX, craftY, {
      scale: 2.4,
      enableIdleFloat: true,
    });
    this.spacecraft.setDepth(10);

    // 4. Retro Mission Telemetry HUD with Launch Trigger
    this.buildTelemetryHUD(width, height);

    // 5. Keyboard Shortcut for Launch Transition
    if (this.input.keyboard) {
      this.input.keyboard.on("keydown-L", () => {
        this.goToLaunch();
      });
    }

    // 6. Clean teardown on scene shutdown
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.starfield?.destroy();
      this.planet?.destroy();
      this.spacecraft?.destroy();
      this.hudContainer?.destroy();
      this.input.keyboard?.removeAllListeners();
    });
  }

  /**
   * Builds the retro telemetry overlay HUD in monospace pixel aesthetic
   */
  private buildTelemetryHUD(width: number, height: number): void {
    this.hudContainer = this.add.container(0, 0);
    this.hudContainer.setDepth(100);

    const hudBg = this.add.graphics();
    hudBg.fillStyle(0x020617, 0.65);
    hudBg.lineStyle(1, 0x1e293b, 0.8);

    // Top status banner bar
    hudBg.fillRect(24, 20, width - 48, 36);
    hudBg.strokeRect(24, 20, width - 48, 36);

    // Corner decorative brackets (classic retro space strategy style)
    const drawBracket = (x: number, y: number, w: number, h: number) => {
      hudBg.lineStyle(2, 0x00e5ff, 0.8);
      hudBg.strokePoints([
        { x: x + 8, y },
        { x, y },
        { x, y: y + 8 },
      ]);
      hudBg.strokePoints([
        { x: x + w - 8, y },
        { x: x + w, y },
        { x: x + w, y: y + 8 },
      ]);
      hudBg.strokePoints([
        { x: x, y: y + h - 8 },
        { x, y: y + h },
        { x: x + 8, y: y + h },
      ]);
      hudBg.strokePoints([
        { x: x + w - 8, y: y + h },
        { x: x + w, y: y + h },
        { x: x + w, y: y + h - 8 },
      ]);
    };

    drawBracket(20, 16, width - 40, 44);

    const missionTitle = this.add.text(
      36,
      28,
      "MISSION ARCHITECT // ORBITAL DESIGN LAB",
      {
        fontFamily: "Courier, monospace",
        fontSize: "14px",
        color: "#00e5ff",
      }
    );

    const telemetryStatus = this.add.text(
      width - 36,
      28,
      "ORBIT: LEO-380KM | CRAFT: PROBE-MK1 | SYSTEMS: NOMINAL",
      {
        fontFamily: "Courier, monospace",
        fontSize: "12px",
        color: "#64748b",
      }
    ).setOrigin(1, 0);

    // Bottom mission coordinates & launch button bar
    const bottomY = height - 36;
    hudBg.fillRect(24, bottomY, width - 48, 26);
    hudBg.strokeRect(24, bottomY, width - 48, 26);

    const coordText = this.add.text(
      36,
      bottomY + 6,
      "COORD: 28.5721° N, 80.6480° W // ALT: 380 KM",
      {
        fontFamily: "Courier, monospace",
        fontSize: "11px",
        color: "#94a3b8",
      }
    );

    // Interactive Launch Button
    const launchBtn = this.add.text(
      width - 240,
      bottomY + 5,
      "[ GO TO LAUNCHPAD (L) ]",
      {
        fontFamily: "Courier, monospace",
        fontSize: "12px",
        color: "#22c55e",
      }
    ).setInteractive({ useHandCursor: true });

    launchBtn.on("pointerdown", () => {
      this.goToLaunch();
    });

    this.hudContainer.add([hudBg, missionTitle, telemetryStatus, coordText, launchBtn]);
  }

  private goToLaunch(): void {
    SceneTransitionCoordinator.transitionTo({
      fromScene: this,
      toSceneKey: LaunchScene.KEY,
    });
  }

  update(time: number, delta: number): void {
    this.starfield?.update(time, delta);
    this.planet?.update(time, delta);
    this.spacecraft?.update(time, delta);
  }
}
