import Phaser from "phaser";
import { Spacecraft } from "../objects/Spacecraft";
import { MissionOutcomeStatus } from "../types/outcome";

export interface OutcomeAnimationConfig {
  scene: Phaser.Scene;
  spacecraft: Spacecraft;
  planetCenterX: number;
  planetCenterY: number;
  onDecayComplete?: () => void;
}

/**
 * OutcomeAnimationController
 *
 * Manages procedural visual effects and tweens for Mission Success and Mission Failure
 * states in the OrbitScene.
 *
 * Guarantees:
 * - Single source of truth: only activates upon authoritative outcome instructions.
 * - Guarded against duplicate trigger invocations.
 * - Full lifecycle disposal of all tweens, timers, graphics, and emitters on scene shutdown.
 */
export class OutcomeAnimationController {
  private scene: Phaser.Scene;
  private spacecraft: Spacecraft;
  private planetCenterX: number;
  private planetCenterY: number;
  private onDecayComplete?: () => void;

  // Graphics layers
  private successFxGraphics?: Phaser.GameObjects.Graphics;
  private failureFxGraphics?: Phaser.GameObjects.Graphics;

  // State management
  private currentOutcome: MissionOutcomeStatus = "pending";
  private isDestroyed: boolean = false;

  // Animation timers and tweens
  private radioWaveTimer?: Phaser.Time.TimerEvent;
  private sparkTimer?: Phaser.Time.TimerEvent;
  private activeTweens: Phaser.Tweens.Tween[] = [];

  // Visual state variables
  private radioWaves: Array<{ radius: number; maxRadius: number; alpha: number }> = [];
  private sparks: Array<{ x: number; y: number; vx: number; vy: number; life: number; maxLife: number; color: number }> = [];
  private warningStrobeAlpha: number = 0;
  private isDecaying: boolean = false;
  private decayProgress: number = 0;

  constructor(config: OutcomeAnimationConfig) {
    this.scene = config.scene;
    this.spacecraft = config.spacecraft;
    this.planetCenterX = config.planetCenterX;
    this.planetCenterY = config.planetCenterY;
    this.onDecayComplete = config.onDecayComplete;

    this.successFxGraphics = this.scene.add.graphics();
    this.successFxGraphics.setDepth(15);

    this.failureFxGraphics = this.scene.add.graphics();
    this.failureFxGraphics.setDepth(20);
  }

  /**
   * Returns current active outcome state
   */
  public getOutcome(): MissionOutcomeStatus {
    return this.currentOutcome;
  }

  /**
   * Applies the mission outcome visualization
   */
  public applyOutcome(outcome: MissionOutcomeStatus): void {
    if (this.isDestroyed || this.currentOutcome === outcome) return;

    this.resetEffects();
    this.currentOutcome = outcome;

    if (outcome === "success") {
      this.initSuccessEffects();
    } else if (outcome === "failure") {
      this.initFailureEffects();
    }
  }

  /**
   * Clears active visual effects and returns to nominal orbit state
   */
  public resetEffects(): void {
    // Clear tweens
    for (const tw of this.activeTweens) {
      if (tw.isPlaying()) {
        tw.stop();
        tw.remove();
      }
    }
    this.activeTweens = [];

    // Clear timers
    this.radioWaveTimer?.destroy();
    this.radioWaveTimer = undefined;
    this.sparkTimer?.destroy();
    this.sparkTimer = undefined;

    // Reset data
    this.radioWaves = [];
    this.sparks = [];
    this.warningStrobeAlpha = 0;
    this.isDecaying = false;
    this.decayProgress = 0;
    this.currentOutcome = "pending";

    // Clear graphics
    this.successFxGraphics?.clear();
    this.failureFxGraphics?.clear();
  }

  // --------------------------------------------------------------------------
  // SUCCESS VISUAL EFFECTS
  // --------------------------------------------------------------------------

  private initSuccessEffects(): void {
    // 1. Periodic radio wave transmission from high-gain antenna
    this.radioWaveTimer = this.scene.time.addEvent({
      delay: 900,
      callback: () => {
        if (this.isDestroyed || this.currentOutcome !== "success") return;
        this.radioWaves.push({
          radius: 10,
          maxRadius: 160,
          alpha: 1.0,
        });
      },
      loop: true,
    });

    // 2. Soft golden/cyan shimmer tween on the spacecraft
    const shimmerTween = this.scene.tweens.add({
      targets: this.spacecraft,
      alpha: { from: 1.0, to: 0.85 },
      duration: 600,
      yoyo: true,
      repeat: 3,
      ease: "Sine.easeInOut",
      onComplete: () => {
        if (this.spacecraft) this.spacecraft.alpha = 1.0;
      },
    });
    this.activeTweens.push(shimmerTween);
  }

  // --------------------------------------------------------------------------
  // FAILURE VISUAL EFFECTS
  // --------------------------------------------------------------------------

  private initFailureEffects(): void {
    this.isDecaying = true;

    // 1. Screen edge red warning strobe flash
    const strobeTween = this.scene.tweens.add({
      targets: this,
      warningStrobeAlpha: { from: 0.35, to: 0.05 },
      duration: 500,
      yoyo: true,
      repeat: -1,
      ease: "Cubic.easeInOut",
    });
    this.activeTweens.push(strobeTween);

    // 2. Spark / debris ejection timer
    this.sparkTimer = this.scene.time.addEvent({
      delay: 80,
      callback: () => {
        if (this.isDestroyed || this.currentOutcome !== "failure") return;
        this.emitSparks();
      },
      loop: true,
    });

    // 3. Gradual orbital decay progress tween
    const decayTween = this.scene.tweens.add({
      targets: this,
      decayProgress: { from: 0, to: 1.0 },
      duration: 6500,
      ease: "Quad.easeIn",
      onComplete: () => {
        if (this.onDecayComplete) {
          this.onDecayComplete();
        }
      },
    });
    this.activeTweens.push(decayTween);
  }

  private emitSparks(): void {
    const scX = this.spacecraft.x;
    const scY = this.spacecraft.y;

    for (let i = 0; i < 3; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 25 + Math.random() * 50;
      const colors = [0xef4444, 0xf59e0b, 0xffffff, 0xd97706];

      this.sparks.push({
        x: scX + (Math.random() - 0.5) * 20,
        y: scY + (Math.random() - 0.5) * 20,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 0,
        maxLife: 0.35 + Math.random() * 0.35,
        color: colors[Math.floor(Math.random() * colors.length)],
      });
    }
  }

  // --------------------------------------------------------------------------
  // PER-FRAME UPDATE LOOP
  // --------------------------------------------------------------------------

  public update(time: number, delta: number): void {
    if (this.isDestroyed) return;
    const dt = delta / 1000;

    if (this.currentOutcome === "success") {
      this.updateSuccessFx(dt);
    } else if (this.currentOutcome === "failure") {
      this.updateFailureFx(dt);
    }
  }

  private updateSuccessFx(dt: number): void {
    const g = this.successFxGraphics;
    if (!g) return;
    g.clear();

    const scX = this.spacecraft.x;
    const scY = this.spacecraft.y;

    // Draw and expand radio transmission waves
    for (let i = this.radioWaves.length - 1; i >= 0; i--) {
      const wave = this.radioWaves[i];
      wave.radius += 70 * dt;
      wave.alpha = Math.max(0, 1.0 - wave.radius / wave.maxRadius);

      if (wave.alpha <= 0 || wave.radius >= wave.maxRadius) {
        this.radioWaves.splice(i, 1);
        continue;
      }

      // Draw pixel-art pulsed wave concentric arcs facing the planet
      g.lineStyle(2, 0x00e5ff, wave.alpha * 0.85);
      g.strokeCircle(scX, scY, wave.radius);

      g.lineStyle(1, 0x22c55e, wave.alpha * 0.45);
      g.strokeCircle(scX, scY, Math.max(2, wave.radius - 4));
    }
  }

  private updateFailureFx(dt: number): void {
    const g = this.failureFxGraphics;
    if (!g) return;
    g.clear();

    const { width, height } = this.scene.scale;

    // 1. Draw emergency red perimeter alert strobe
    if (this.warningStrobeAlpha > 0.01) {
      g.lineStyle(6, 0xef4444, this.warningStrobeAlpha);
      g.strokeRect(3, 3, width - 6, height - 6);

      // Warning corner markers
      g.fillStyle(0xef4444, this.warningStrobeAlpha * 0.7);
      g.fillRect(0, 0, 30, 8);
      g.fillRect(0, 0, 8, 30);
      g.fillRect(width - 30, 0, 30, 8);
      g.fillRect(width - 8, 0, 8, 30);
      g.fillRect(0, height - 8, 30, 8);
      g.fillRect(0, height - 30, 8, 30);
      g.fillRect(width - 30, height - 8, 30, 8);
      g.fillRect(width - 8, height - 30, 8, 30);
    }

    // 2. Update and render spark particles
    for (let i = this.sparks.length - 1; i >= 0; i--) {
      const s = this.sparks[i];
      s.life += dt;
      if (s.life >= s.maxLife) {
        this.sparks.splice(i, 1);
        continue;
      }

      s.x += s.vx * dt;
      s.y += s.vy * dt;
      const progress = s.life / s.maxLife;
      const alpha = 1.0 - progress;

      g.fillStyle(s.color, alpha);
      g.fillRect(Math.round(s.x), Math.round(s.y), 2, 2);
    }
  }

  /**
   * Provides orbital simulation modifiers based on outcome
   */
  public getOrbitModifiers(): {
    radiusScale: number;
    rotationOffset: number;
    trajectoryColor: number;
    trajectoryAlpha: number;
  } {
    if (this.currentOutcome === "success") {
      return {
        radiusScale: 1.0,
        rotationOffset: 0,
        trajectoryColor: 0x22c55e, // Luminous Emerald
        trajectoryAlpha: 0.65,
      };
    }

    if (this.currentOutcome === "failure") {
      // Orbital radius decays inward toward the planet as decayProgress increases
      const radiusScale = Math.max(0.35, 1.0 - this.decayProgress * 0.55);
      // Spacecraft tumbles erratically with increasing speed
      const tumbleRate = 4.0 + this.decayProgress * 8.0;
      const rotationOffset = Math.sin(this.scene.time.now * 0.005 * tumbleRate) * 0.85;

      return {
        radiusScale,
        rotationOffset,
        trajectoryColor: 0xef4444, // Crimson Red Anomaly
        trajectoryAlpha: 0.75,
      };
    }

    // Nominal / Pending Orbit
    return {
      radiusScale: 1.0,
      rotationOffset: 0,
      trajectoryColor: 0x00e5ff, // Electric Cyan
      trajectoryAlpha: 0.28,
    };
  }

  /**
   * Destroys all graphics, tweens, and timers
   */
  public destroy(): void {
    if (this.isDestroyed) return;
    this.isDestroyed = true;

    this.resetEffects();

    this.successFxGraphics?.destroy();
    this.successFxGraphics = undefined;

    this.failureFxGraphics?.destroy();
    this.failureFxGraphics = undefined;
  }
}
