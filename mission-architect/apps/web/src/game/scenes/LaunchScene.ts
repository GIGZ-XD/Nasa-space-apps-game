import Phaser from "phaser";
import { Rocket } from "../objects/Rocket";
import { LaunchAnimationController } from "../animations/launchAnimation";
import { SceneTransitionCoordinator } from "../systems/SceneTransition";
import { OrbitScene } from "./OrbitScene";
import { LandingScene } from "./LandingScene";
import { DriftScene } from "./DriftScene";
import { WorkshopScene } from "./WorkshopScene";
import { OUTCOME_EVENTS } from "../types/outcome";

export type LaunchState = "READY" | "COUNTDOWN" | "IGNITION" | "ASCENT" | "STAGING" | "COMPLETED";

/**
 * LaunchScene
 *
 * Full 2D pixel-art rocket launch simulation scene:
 * - Launch complex with concrete flame trench, launch gantry tower, and swing arms.
 * - Dynamic sky atmosphere that transitions from twilight dusk to deep cosmic black during ascent.
 * - Staged countdown sequence (T-3, T-2, T-1, Ignition) with gantry arm retraction.
 * - Physical rocket liftoff, particle smoke billowing, and plasma exhaust plumes.
 * - Real-time flight telemetry readout (Altitude, Velocity, Dynamic Pressure).
 * - Dispatches 'launch:complete' event (both on scene and game event bus) upon orbital insertion or skip.
 * - Safe transition to OrbitScene upon orbital insertion.
 * - Instant skip support (UI button and 'S' key).
 */
export class LaunchScene extends Phaser.Scene {
  public static readonly KEY = "LaunchScene";

  private rocket!: Rocket;
  private animController!: LaunchAnimationController;

  private skyGraphics!: Phaser.GameObjects.Graphics;
  private gantryGraphics!: Phaser.GameObjects.Graphics;
  private padGraphics!: Phaser.GameObjects.Graphics;
  private hudContainer!: Phaser.GameObjects.Container;

  private state: LaunchState = "READY";
  private countdownTimer?: Phaser.Time.TimerEvent;
  private countdownValue: number = 3;
  private hasEmittedComplete: boolean = false;

  private statusText!: Phaser.GameObjects.Text;
  private telemetryText!: Phaser.GameObjects.Text;
  private countdownDisplay!: Phaser.GameObjects.Text;

  private padY: number = 0;
  private rocketStartX: number = 0;
  private rocketStartY: number = 0;
  private gantryArmOffset: number = 0;

  constructor() {
    super({ key: LaunchScene.KEY });
  }

  preload(): void {
    // Load the launch vehicle and pad the player chose (URLs supplied through the registry)
    const loadout = (this.registry.get("loadout") as Record<string, string> | undefined) ?? {};
    if (loadout.vehicle && !this.textures.exists("part-vehicle")) this.load.image("part-vehicle", loadout.vehicle);
    if (loadout.pad && !this.textures.exists("part-pad")) this.load.image("part-pad", loadout.pad);
  }

  create(): void {
    const { width, height } = this.scale;

    this.state = "READY";
    this.countdownValue = 3;
    this.gantryArmOffset = 0;
    this.hasEmittedComplete = false;

    this.padY = Math.round(height * 0.82);
    this.rocketStartX = Math.round(width * 0.5);
    this.rocketStartY = this.padY - 80;

    // 1. Atmospheric Sky Background
    this.skyGraphics = this.add.graphics();
    this.skyGraphics.setDepth(-100);
    this.drawSky(0);

    // 2. Launch Pad & Concrete Base
    this.padGraphics = this.add.graphics();
    this.padGraphics.setDepth(2);
    this.drawLaunchPad(width, height);

    // 3. Gantry Umbilical Tower & Retractable Arms
    this.gantryGraphics = this.add.graphics();
    this.gantryGraphics.setDepth(4);
    this.drawGantryTower(this.rocketStartX, this.padY, 0);
    if (this.textures.exists("part-pad")) {
      // the player's chosen launchpad replaces the generic gantry tower
      this.gantryGraphics.setVisible(false);
      const padImg = this.add.image(this.rocketStartX, this.padY + 4, "part-pad").setOrigin(0.5, 1).setDepth(3);
      padImg.setScale(300 / padImg.height);
    }

    // 4. Rocket (Center on pad)
    const hasVehicle = this.textures.exists("part-vehicle");
    this.rocket = new Rocket(this, this.rocketStartX, this.rocketStartY, {
      scale: 2.2,
      textureKey: hasVehicle ? "part-vehicle" : undefined,
      targetHeight: 300,
    });
    this.rocket.setDepth(10);
    if (hasVehicle) {
      // stand the chosen rocket on the pad
      this.rocketStartY = this.padY - this.rocket.getBottomOffset() - 6;
      this.rocket.y = this.rocketStartY;
    }

    // 5. Launch Animation Controller
    this.animController = new LaunchAnimationController({
      scene: this,
      rocket: this.rocket,
      padY: this.padY,
      shouldFail: () => this.registry.get("missionOutcome") === "failure",
      callbacks: {
        onFailure: () => {
          this.state = "COMPLETED";
          this.statusText.setText("STATUS: ANOMALY // VEHICLE LOST // MISSION FAILED");
          this.statusText.setColor("#ef4444");
          this.telemetryText.setText("TELEMETRY LOST");
          this.events.emit(OUTCOME_EVENTS.LAUNCH_FAILED);
          this.game.events?.emit(OUTCOME_EVENTS.LAUNCH_FAILED);
        },
        onIgnition: () => {
          this.state = "IGNITION";
          this.statusText.setText("STATUS: MAIN ENGINES IGNITED // THRUST BUILDING");
          this.statusText.setColor("#f59e0b");
        },
        onLiftoff: () => {
          this.state = "ASCENT";
          this.statusText.setText("STATUS: LIFTOFF! // TOWER CLEARED");
          this.statusText.setColor("#22c55e");
        },
        onMaxQ: () => {
          this.statusText.setText("STATUS: MAX DYNAMIC PRESSURE (MAX-Q)");
          this.statusText.setColor("#38bdf8");
        },
        onStaging: () => {
          this.state = "STAGING";
          this.statusText.setText("STATUS: FAIRING SEPARATION // SPACE BOUNDARY REACHED");
          this.statusText.setColor("#00e5ff");
        },
        onComplete: () => {
          this.onAscentComplete();
        },
      },
    });

    // 6. Launch HUD & Controls
    this.buildLaunchHUD(width, height);

    // 7. Interactive Controls (Space / Click / S)
    this.setupControls();

    // 8. Cleanup on Scene Shutdown
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.cleanupResources();
    });
  }

  private cleanupResources(): void {
    if (this.countdownTimer) {
      this.countdownTimer.destroy();
      this.countdownTimer = undefined;
    }
    this.animController?.destroy();
    this.rocket?.destroy();
    this.skyGraphics?.destroy();
    this.gantryGraphics?.destroy();
    this.padGraphics?.destroy();
    this.hudContainer?.destroy();
    this.input.keyboard?.removeAllListeners();
  }

  /**
   * Draws the atmospheric twilight sky gradient (dims into deep space as rocket climbs)
   */
  private drawSky(altitudeProgress: number): void {
    const { width, height } = this.scale;
    const g = this.skyGraphics;
    g.clear();

    const baseTop = Phaser.Display.Color.Interpolate.ColorWithColor(
      new Phaser.Display.Color(15, 23, 42),
      new Phaser.Display.Color(2, 6, 23),
      100,
      Math.min(100, altitudeProgress * 100)
    );

    const baseBottom = Phaser.Display.Color.Interpolate.ColorWithColor(
      new Phaser.Display.Color(30, 41, 59),
      new Phaser.Display.Color(5, 7, 19),
      100,
      Math.min(100, altitudeProgress * 100)
    );

    const topColor = Phaser.Display.Color.GetColor(baseTop.r, baseTop.g, baseTop.b);
    const bottomColor = Phaser.Display.Color.GetColor(baseBottom.r, baseBottom.g, baseBottom.b);

    g.fillGradientStyle(topColor, topColor, bottomColor, bottomColor, 1);
    g.fillRect(0, 0, width, height);

    // Distant stars fade in as atmosphere thins
    if (altitudeProgress > 0.3) {
      g.fillStyle(0xffffff, (altitudeProgress - 0.3) * 1.4);
      for (let i = 0; i < 40; i++) {
        const sx = (i * 277 + 43) % width;
        const sy = (i * 191 + 19) % (height * 0.6);
        g.fillRect(sx, sy, 2, 2);
      }
    }
  }

  /**
   * Draws the launchpad platform, terrain, and flame deflector trench
   */
  private drawLaunchPad(width: number, height: number): void {
    const g = this.padGraphics;
    g.clear();

    const padY = this.padY;

    // Distant coastline & water
    g.fillStyle(0x0f172a, 1);
    g.fillRect(0, padY + 30, width, height - (padY + 30));

    // Ground terrain / concrete aprons
    g.fillStyle(0x1e293b, 1);
    g.fillRect(0, padY + 10, width, 24);

    // Launch table concrete platform (center)
    const tableWidth = 240;
    const tableX = (width - tableWidth) / 2;
    g.fillStyle(0x334155, 1);
    g.fillRect(tableX, padY - 14, tableWidth, 26);

    // Hazard safety stripe along launch deck
    for (let x = tableX; x < tableX + tableWidth; x += 16) {
      g.fillStyle(x % 32 === 0 ? 0xf59e0b : 0x0f172a, 1);
      g.fillRect(x, padY - 14, 16, 4);
    }

    // Flame trench deflector pit
    g.fillStyle(0x020617, 1);
    g.fillRect(width / 2 - 36, padY - 10, 72, 22);

    // Heavy hold-down clamps
    g.fillStyle(0x64748b, 1);
    g.fillRect(width / 2 - 32, padY - 18, 10, 14);
    g.fillRect(width / 2 + 22, padY - 18, 10, 14);
  }

  /**
   * Draws the launch umbilical gantry tower and retractable support arms
   */
  private drawGantryTower(rocketX: number, padY: number, armRetractOffset: number): void {
    const g = this.gantryGraphics;
    g.clear();

    const towerX = rocketX + 54;
    const towerTopY = padY - 240;
    const towerWidth = 32;
    const towerHeight = 240;

    // Gantry tower vertical lattice columns (Red / Orange structural steel)
    g.fillStyle(0xef4444, 1);
    g.fillRect(towerX, towerTopY, 6, towerHeight);
    g.fillRect(towerX + towerWidth - 6, towerTopY, 6, towerHeight);

    // Tower cross-bracing trusses
    g.lineStyle(2, 0xd97706, 0.9);
    for (let y = towerTopY; y < padY; y += 24) {
      g.strokeLineShape(new Phaser.Geom.Line(towerX, y, towerX + towerWidth, y + 24));
      g.strokeLineShape(new Phaser.Geom.Line(towerX + towerWidth, y, towerX, y + 24));
    }

    // Umbilical swing arms (retract on ignition)
    const arm1Y = towerTopY + 50;  // Payload fairing arm
    const arm2Y = towerTopY + 130; // Interstage fuel arm

    g.fillStyle(0x475569, 1);
    // Arm 1
    g.fillRect(towerX - 44 + armRetractOffset, arm1Y, 44, 6);
    g.fillStyle(0x38bdf8, 1); // Umbilical disconnect plug
    g.fillRect(towerX - 46 + armRetractOffset, arm1Y + 1, 4, 4);

    // Arm 2
    g.fillStyle(0x475569, 1);
    g.fillRect(towerX - 44 + armRetractOffset, arm2Y, 44, 8);
    g.fillStyle(0xf59e0b, 1);
    g.fillRect(towerX - 46 + armRetractOffset, arm2Y + 2, 4, 4);
  }

  /**
   * Builds the mission control launch HUD overlay
   */
  private buildLaunchHUD(width: number, height: number): void {
    this.hudContainer = this.add.container(0, 0);
    this.hudContainer.setDepth(100);

    const hudBg = this.add.graphics();
    hudBg.fillStyle(0x020617, 0.7);
    hudBg.lineStyle(1, 0x1e293b, 0.8);

    // Top status banner bar
    hudBg.fillRect(24, 20, width - 48, 40);
    hudBg.strokeRect(24, 20, width - 48, 40);

    const title = this.add.text(
      36,
      28,
      "MISSION ARCHITECT // LAUNCH COMPLEX 39A",
      {
        fontFamily: "Courier, monospace",
        fontSize: "14px",
        color: "#00e5ff",
      }
    );

    this.statusText = this.add.text(
      width - 36,
      28,
      "STATUS: VEHICLE ARMED & READY ON PAD",
      {
        fontFamily: "Courier, monospace",
        fontSize: "12px",
        color: "#38bdf8",
      }
    ).setOrigin(1, 0);

    // Large Center-Screen Countdown Display
    this.countdownDisplay = this.add.text(
      width / 2,
      height * 0.28,
      "",
      {
        fontFamily: "Courier, monospace",
        fontSize: "48px",
        color: "#00e5ff",
        stroke: "#020617",
        strokeThickness: 6,
      }
    ).setOrigin(0.5, 0.5);

    // Bottom Action / Telemetry Bar
    const bottomY = height - 44;
    hudBg.fillRect(24, bottomY, width - 48, 32);
    hudBg.strokeRect(24, bottomY, width - 48, 32);

    this.telemetryText = this.add.text(
      36,
      bottomY + 8,
      "T-00:00:00 | ALT: 0.0 KM | VEL: 0 M/S | DOWNSCALE: NOMINAL",
      {
        fontFamily: "Courier, monospace",
        fontSize: "11px",
        color: "#94a3b8",
      }
    );

    // Start Launch Button
    const startLaunchBtn = this.add.text(
      width - 290,
      bottomY + 6,
      "[ START LAUNCH (SPACE) ]",
      {
        fontFamily: "Courier, monospace",
        fontSize: "12px",
        color: "#22c55e",
      }
    ).setInteractive({ useHandCursor: true });

    startLaunchBtn.on("pointerdown", () => {
      this.triggerLaunchSequence();
    });

    // Skip to Orbit Button
    const skipBtn = this.add.text(
      width - 110,
      bottomY + 6,
      "[ SKIP (S) ]",
      {
        fontFamily: "Courier, monospace",
        fontSize: "12px",
        color: "#f59e0b",
      }
    ).setInteractive({ useHandCursor: true });

    skipBtn.on("pointerdown", () => {
      this.skipToOrbit();
    });

    this.hudContainer.add([
      hudBg,
      title,
      this.statusText,
      this.countdownDisplay,
      this.telemetryText,
      startLaunchBtn,
      skipBtn,
    ]);
  }

  private setupControls(): void {
    if (!this.input.keyboard) return;

    this.input.keyboard.on("keydown-SPACE", () => {
      this.triggerLaunchSequence();
    });

    this.input.keyboard.on("keydown-S", () => {
      this.skipToOrbit();
    });
  }

  /**
   * Initiates the T-3 countdown sequence
   */
  public triggerLaunchSequence(): void {
    if (this.state !== "READY") return;
    this.state = "COUNTDOWN";

    this.statusText.setText("STATUS: TERMINAL COUNTDOWN INITIATED");
    this.statusText.setColor("#f59e0b");

    this.countdownValue = 3;
    this.updateCountdownDisplay();

    this.countdownTimer = this.time.addEvent({
      delay: 1000,
      repeat: 3,
      callback: () => {
        this.countdownValue--;
        this.updateCountdownDisplay();

        if (this.countdownValue === 0) {
          // T-0: Retract Gantry Umbilical Arms
          this.retractGantryArms();

          // Start physical ignition & liftoff
          this.animController.igniteAndLaunch();
        }
      },
    });
  }

  private updateCountdownDisplay(): void {
    if (this.countdownValue > 0) {
      this.countdownDisplay.setText(`T - 0${this.countdownValue}`);
      this.cameras.main.shake(100, 0.001);
    } else if (this.countdownValue === 0) {
      this.countdownDisplay.setText("IGNITION!");
      this.countdownDisplay.setColor("#f97316");

      // Fade out countdown text after ignition
      this.tweens.add({
        targets: this.countdownDisplay,
        alpha: 0,
        duration: 1000,
        delay: 500,
      });
    }
  }

  /**
   * Retracts gantry swing arms back from rocket fuselage
   */
  private retractGantryArms(): void {
    this.tweens.add({
      targets: this,
      gantryArmOffset: 32, // Swing arms pull back 32px
      duration: 800,
      ease: "Power2.easeOut",
      onUpdate: () => {
        this.drawGantryTower(this.rocketStartX, this.padY, this.gantryArmOffset);
      },
    });
  }

  /**
   * Emits the launch:complete event strictly once per launch cycle
   */
  private emitLaunchComplete(): void {
    if (this.hasEmittedComplete) return;
    this.hasEmittedComplete = true;

    // Emit on scene events
    this.events.emit("launch:complete");
    // Emit on global game events (accessible via game instance)
    this.game.events.emit("launch:complete");
  }

  /** Which scene follows the launch: orbit (missions 1-2), landing (3-4) or deep-space drift (5). */
  private nextSceneKey(): string {
    const mission = ((this.registry.get("loadout") as Record<string, string> | undefined) ?? {}).mission;
    if (mission === "3" || mission === "4") return LandingScene.KEY;
    if (mission === "5") return DriftScene.KEY;
    return OrbitScene.KEY;
  }

  /**
   * Called when rocket ascends past the upper stratosphere
   */
  private onAscentComplete(): void {
    if (this.state === "COMPLETED") return;
    this.state = "COMPLETED";

    this.emitLaunchComplete();

    // Transition smoothly to OrbitScene
    SceneTransitionCoordinator.transitionTo({
      fromScene: this,
      toSceneKey: this.nextSceneKey(),
      duration: 800,
    });
  }

  /**
   * Instantly skips the launch animation and proceeds to orbit
   */
  public skipToOrbit(): void {
    if (this.state === "COMPLETED") return;

    // A doomed mission can't skip past its failure
    if (this.registry.get("missionOutcome") === "failure") {
      if (this.countdownTimer) {
        this.countdownTimer.destroy();
        this.countdownTimer = undefined;
      }
      this.retractGantryArms();
      this.animController.triggerFailure();
      return;
    }
    this.state = "COMPLETED";

    if (this.countdownTimer) {
      this.countdownTimer.destroy();
      this.countdownTimer = undefined;
    }

    this.cameras.main.shake(0, 0); // cancel active shakes
    this.animController.skip();
    this.emitLaunchComplete();

    SceneTransitionCoordinator.skipTo({
      fromScene: this,
      toSceneKey: this.nextSceneKey(),
    });
  }

  update(time: number, delta: number): void {
    this.animController.update(time, delta);

    // Dynamic telemetry calculations based on rocket altitude
    if (this.state === "ASCENT" || this.state === "STAGING") {
      const distanceClimbed = Math.max(0, this.rocketStartY - this.rocket.y);
      const simulatedAltitudeKm = Math.min(380, Math.round((distanceClimbed / 400) * 380));
      const simulatedVelocityMs = Math.min(7800, Math.round(Math.sqrt(distanceClimbed) * 280));

      this.telemetryText.setText(
        `ALT: ${simulatedAltitudeKm} KM | VEL: ${simulatedVelocityMs} M/S | STAGE: ${this.state}`
      );

      // Interpolate atmospheric sky gradient as rocket climbs
      const progress = Math.min(1.0, distanceClimbed / 450);
      this.drawSky(progress);
    }
  }
}
