import Phaser from "phaser";
import { Rocket } from "../objects/Rocket";

export interface LaunchAnimationCallbacks {
  onIgnition?: () => void;
  onLiftoff?: () => void;
  onMaxQ?: () => void;
  onStaging?: () => void;
  onComplete?: () => void;
  /** Fired after a failed launch's explosion has played */
  onFailure?: () => void;
}

export interface LaunchAnimationConfig {
  scene: Phaser.Scene;
  rocket: Rocket;
  padY: number;
  callbacks?: LaunchAnimationCallbacks;
  /** When this returns true the rocket climbs a little, then explodes. */
  shouldFail?: () => boolean;
}

interface Debris {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  life: number;
  maxLife: number;
  color: number;
  fire: boolean;
}

interface SmokePuff {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  alpha: number;
  color: number;
}

/**
 * LaunchAnimationController
 *
 * Orchestrates the full pixel-art rocket liftoff sequence:
 * - Engine ignition with expanding plasma exhaust.
 * - Pad smoke billow effects drawn via Canvas 2D graphics.
 * - Accelerating ascent tween (exponential curve simulating real rocket dynamics).
 * - Downrange pitch kick tilt.
 * - Camera micro-rumble and stage milestone events.
 * - Clean teardown and instant skip capabilities.
 */
export class LaunchAnimationController {
  private scene: Phaser.Scene;
  private rocket: Rocket;
  private padY: number;
  private callbacks?: LaunchAnimationCallbacks;
  private shouldFail?: () => boolean;

  private explosionGraphics: Phaser.GameObjects.Graphics;
  private debris: Debris[] = [];
  private isFailed: boolean = false;
  private flameGraphics: Phaser.GameObjects.Graphics;
  private smokeGraphics: Phaser.GameObjects.Graphics;

  private activeTweens: Phaser.Tweens.Tween[] = [];
  private smokePuffs: SmokePuff[] = [];

  private isIgnited: boolean = false;
  private isAscending: boolean = false;
  private isCompleted: boolean = false;
  private flameIntensity: number = 0;

  constructor(config: LaunchAnimationConfig) {
    this.scene = config.scene;
    this.rocket = config.rocket;
    this.padY = config.padY;
    this.callbacks = config.callbacks;
    this.shouldFail = config.shouldFail;
    this.explosionGraphics = this.scene.add.graphics();
    this.explosionGraphics.setDepth(20);

    // Visual layers
    this.smokeGraphics = this.scene.add.graphics();
    this.smokeGraphics.setDepth(5);

    this.flameGraphics = this.scene.add.graphics();
    this.flameGraphics.setDepth(15);
  }

  /**
   * Begins the launch sequence: Ignition -> Hold-down -> Liftoff
   */
  public igniteAndLaunch(): void {
    if (this.isIgnited || this.isCompleted) return;
    this.isIgnited = true;

    this.callbacks?.onIgnition?.();

    // 1. Ignition Flare & Pad Smoke (Duration: 1200ms)
    this.scene.cameras.main.shake(1200, 0.003);

    const ignitionTween = this.scene.tweens.add({
      targets: this,
      flameIntensity: 1.0,
      duration: 1000,
      ease: "Power1.easeIn",
      onComplete: () => {
        this.startLiftoff();
      },
    });
    this.activeTweens.push(ignitionTween);
  }

  /**
   * Executes the physical liftoff and atmospheric ascent
   */
  private startLiftoff(): void {
    if (this.isCompleted) return;
    this.isAscending = true;

    this.callbacks?.onLiftoff?.();

    // Failed mission: lift off, climb a little, then blow up
    if (this.shouldFail?.()) {
      this.startFailedAscent();
      return;
    }

    // Camera rumble increases on liftoff
    this.scene.cameras.main.shake(2500, 0.005);

    const screenHeight = this.scene.scale.height;
    const targetY = -200; // Ascend well above the viewport

    // Accelerating upward liftoff tween
    const liftoffTween = this.scene.tweens.add({
      targets: this.rocket,
      y: targetY,
      duration: 5200,
      ease: "Power2.easeIn",
      onUpdate: (tween) => {
        const progress = tween.progress;

        // Downrange pitch-kick tilt (slight eastward inclination)
        if (progress > 0.25) {
          this.rocket.rotation = (progress - 0.25) * 0.12;
        }

        // Max-Q milestone check (~40% into ascent)
        if (progress > 0.45 && progress < 0.48) {
          this.callbacks?.onMaxQ?.();
        }

        // Staging / fairing separation near boundary (~85%)
        if (progress > 0.85 && !this.rocket.isFairingSeparated) {
          this.rocket.separateFairing(() => {
            this.callbacks?.onStaging?.();
          });
        }
      },
      onComplete: () => {
        this.finishLaunch();
      },
    });

    this.activeTweens.push(liftoffTween);
  }

  /** Rises ~230px with a wobble, then explodes. */
  private startFailedAscent(): void {
    this.scene.cameras.main.shake(2400, 0.006);
    const startY = this.rocket.y;
    const climb = this.scene.tweens.add({
      targets: this.rocket,
      y: startY - 230,
      duration: 2600,
      ease: "Power2.easeIn",
      onUpdate: (tween) => {
        // Engine instability: growing wobble before the failure
        this.rocket.rotation = Math.sin(tween.progress * 40) * 0.05 * tween.progress;
      },
      onComplete: () => this.triggerFailure(),
    });
    this.activeTweens.push(climb);
  }

  /** Destroys the rocket in a fireball (also used if the player skips a doomed launch). */
  public triggerFailure(): void {
    if (this.isFailed || this.isCompleted) return;
    this.isFailed = true;
    this.isAscending = false;
    this.flameIntensity = 0;
    this.flameGraphics.clear();
    this.smokeGraphics.clear();
    this.smokePuffs = [];
    for (const t of this.activeTweens) if (t.isPlaying()) t.stop();
    this.activeTweens = [];

    const { x, y } = this.rocket;
    this.rocket.setVisible(false);

    const palette = [0xffffff, 0xfde047, 0xf97316, 0xef4444, 0x7f1d1d, 0x334155];
    for (let i = 0; i < 110; i++) {
      const a = Math.random() * Math.PI * 2;
      const speed = 60 + Math.random() * 420;
      const fire = Math.random() < 0.75;
      this.debris.push({
        x: x + (Math.random() - 0.5) * 20,
        y: y + (Math.random() - 0.5) * 40,
        vx: Math.cos(a) * speed,
        vy: Math.sin(a) * speed - 60,
        size: fire ? 8 + Math.random() * 22 : 3 + Math.random() * 6,
        life: 0,
        maxLife: fire ? 0.7 + Math.random() * 0.9 : 1.2 + Math.random() * 1.2,
        color: fire ? palette[Math.floor(Math.random() * 4)] : palette[4 + Math.floor(Math.random() * 2)],
        fire,
      });
    }

    this.scene.cameras.main.flash(350, 255, 220, 140);
    this.scene.cameras.main.shake(900, 0.018);
    this.callbacks?.onFailure?.();
  }

  /**
   * Updates exhaust flames and smoke puffs each animation frame
   */
  public update(time: number, delta: number): void {
    this.updateExplosion(delta);
    if (this.isCompleted || this.isFailed) return;

    const sec = time / 1000;
    const exhaust = this.rocket.getExhaustWorldPosition();

    // -------------------------------------------------------------
    // 1. DRAW ENGINE EXHAUST FLAME
    // -------------------------------------------------------------
    const fg = this.flameGraphics;
    fg.clear();

    if (this.isIgnited && this.flameIntensity > 0) {
      const baseFlameLength = 36 * this.flameIntensity;
      const flicker = Math.sin(sec * 40) * 8;
      const totalLength = baseFlameLength + (this.isAscending ? 30 : 0) + flicker;

      const plumeX = exhaust.x;
      const plumeY = exhaust.y;

      // Outer orange plasma cone
      fg.fillStyle(0xf97316, 0.85);
      fg.beginPath();
      fg.moveTo(plumeX - 16, plumeY);
      fg.lineTo(plumeX + 16, plumeY);
      fg.lineTo(plumeX, plumeY + totalLength);
      fg.closePath();
      fg.fillPath();

      // Mid bright yellow flame
      fg.fillStyle(0xfde047, 0.95);
      fg.beginPath();
      fg.moveTo(plumeX - 10, plumeY);
      fg.lineTo(plumeX + 10, plumeY);
      fg.lineTo(plumeX, plumeY + totalLength * 0.75);
      fg.closePath();
      fg.fillPath();

      // Inner white combustion core
      fg.fillStyle(0xffffff, 1.0);
      fg.beginPath();
      fg.moveTo(plumeX - 5, plumeY);
      fg.lineTo(plumeX + 5, plumeY);
      fg.lineTo(plumeX, plumeY + totalLength * 0.45);
      fg.closePath();
      fg.fillPath();

      // Emit new pad smoke puffs while near the ground
      if (this.rocket.y > this.padY - 250) {
        for (let i = 0; i < 3; i++) {
          this.smokePuffs.push({
            x: plumeX + (Math.random() - 0.5) * 20,
            y: plumeY + (Math.random() - 0.5) * 8,
            vx: (Math.random() - 0.5) * 80 + (i % 2 === 0 ? 30 : -30),
            vy: (Math.random() - 0.5) * 20 - 5,
            radius: 8 + Math.random() * 8,
            alpha: 0.7,
            color: Math.random() > 0.5 ? 0x94a3b8 : 0xcbd5e1,
          });
        }
      }
    }

    // -------------------------------------------------------------
    // 2. SIMULATE & DRAW SMOKE PUFFS
    // -------------------------------------------------------------
    const sg = this.smokeGraphics;
    sg.clear();

    const dt = delta / 1000;
    for (let i = this.smokePuffs.length - 1; i >= 0; i--) {
      const puff = this.smokePuffs[i];
      puff.x += puff.vx * dt;
      puff.y += puff.vy * dt;
      puff.radius += 18 * dt; // Smoke expands
      puff.alpha -= 0.65 * dt; // Smoke dissipates

      if (puff.alpha <= 0) {
        this.smokePuffs.splice(i, 1);
        continue;
      }

      sg.fillStyle(puff.color, puff.alpha);
      sg.fillCircle(puff.x, puff.y, puff.radius);
    }
  }

  private updateExplosion(delta: number): void {
    const g = this.explosionGraphics;
    g.clear();
    const dt = delta / 1000;
    for (let i = this.debris.length - 1; i >= 0; i--) {
      const d = this.debris[i];
      d.life += dt;
      if (d.life >= d.maxLife) {
        this.debris.splice(i, 1);
        continue;
      }
      d.vy += (d.fire ? 40 : 520) * dt; // fire drifts, debris falls
      d.x += d.vx * dt;
      d.y += d.vy * dt;
      d.vx *= 0.985;
      const t = d.life / d.maxLife;
      g.fillStyle(d.color, 1 - t);
      const size = d.fire ? d.size * (1 + t * 0.8) : d.size;
      if (d.fire) g.fillCircle(d.x, d.y, size);
      else g.fillRect(d.x, d.y, size, size);
    }
  }

  /**
   * Instantly skips the launch animation and proceeds to orbit
   */
  public skip(): void {
    if (this.isCompleted || this.isFailed) return;

    // Cancel all active tweens
    for (const tween of this.activeTweens) {
      if (tween.isPlaying()) {
        tween.stop();
      }
    }
    this.activeTweens = [];

    this.finishLaunch();
  }

  private finishLaunch(): void {
    if (this.isCompleted) return;
    this.isCompleted = true;

    this.flameGraphics.clear();
    this.smokeGraphics.clear();
    this.smokePuffs = [];

    this.callbacks?.onComplete?.();
  }

  /**
   * Cleans up all active tweens, graphics, and emitters
   */
  public destroy(): void {
    for (const tween of this.activeTweens) {
      if (tween.isPlaying()) {
        tween.stop();
      }
    }
    this.activeTweens = [];
    this.smokePuffs = [];
    this.debris = [];
    this.explosionGraphics.destroy();
    this.flameGraphics.destroy();
    this.smokeGraphics.destroy();
  }
}
