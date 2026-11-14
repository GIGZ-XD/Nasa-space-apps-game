import Phaser from "phaser";

export interface RocketConfig {
  x?: number;
  y?: number;
  scale?: number;
  textureKey?: string;
}

/**
 * Rocket
 *
 * 2D Retro Pixel-Art Launch Vehicle Game Object.
 * Features:
 * - Multi-stage rocket booster fuselage with aerodynamic nose cone.
 * - Upper stage payload fairing section protecting the spacecraft.
 * - Interstage ring with thermal conduits and raceways.
 * - Base delta stabilizing fins and engine cluster bells.
 * - Designated exhaust anchor point for particle & flame animations.
 * - Fairing separation animation support.
 */
export class Rocket extends Phaser.GameObjects.Container {
  private bodyGraphics!: Phaser.GameObjects.Graphics;
  private fairingGraphics!: Phaser.GameObjects.Graphics;
  private rocketScale: number;

  public isFairingSeparated: boolean = false;

  constructor(scene: Phaser.Scene, x: number, y: number, config: RocketConfig = {}) {
    super(scene, x, y);

    this.rocketScale = config.scale ?? 2.0;
    this.setScale(this.rocketScale);

    if (config.textureKey && scene.textures.exists(config.textureKey)) {
      const sprite = scene.add.sprite(0, 0, config.textureKey);
      this.add(sprite);
    } else {
      this.buildProceduralRocket();
    }

    scene.add.existing(this);
  }

  private buildProceduralRocket(): void {
    // 1. Lower & Upper Booster Fuselage
    this.bodyGraphics = this.scene.add.graphics();
    this.add(this.bodyGraphics);
    this.drawBoosterBody();

    // 2. Payload Fairing (top nose cone that can jettison)
    this.fairingGraphics = this.scene.add.graphics();
    this.add(this.fairingGraphics);
    this.drawPayloadFairing();
  }

  /**
   * Draws the core booster stages, engine nozzles, conduits, and fins
   */
  private drawBoosterBody(): void {
    const g = this.bodyGraphics;
    g.clear();

    // -------------------------------------------------------------
    // STAGE 1 CORE BOOSTER TANK
    // -------------------------------------------------------------
    // Main White / Off-White Fuselage (Height: ~90px, Width: 20px)
    g.fillStyle(0xe2e8f0, 1);
    g.fillRect(-10, -30, 20, 75);

    // Dark specular shadow on starboard edge for cylinder depth
    g.fillStyle(0x94a3b8, 1);
    g.fillRect(6, -30, 4, 75);

    // Clean white highlight strip on port edge
    g.fillStyle(0xffffff, 1);
    g.fillRect(-9, -30, 3, 75);

    // Stage 1 Mission Striping (Red Aerospace Stripe)
    g.fillStyle(0xef4444, 1);
    g.fillRect(-10, 0, 20, 6);
    g.fillStyle(0x1e293b, 1); // Mission logo box
    g.fillRect(-6, 8, 12, 10);
    g.fillStyle(0x38bdf8, 1); // Mission insignia pixel
    g.fillRect(-4, 10, 8, 6);

    // Vertical avionics raceway conduit along the hull
    g.fillStyle(0x475569, 1);
    g.fillRect(-2, -30, 3, 75);

    // Interstage Ring (Separator between Stage 1 & Stage 2)
    g.fillStyle(0x1e293b, 1);
    g.fillRect(-11, -34, 22, 5);
    g.fillStyle(0xd97706, 1); // Thermal umbilical connector
    g.fillRect(9, -33, 3, 3);

    // -------------------------------------------------------------
    // BASE SECTION & AERODYNAMIC FINS
    // -------------------------------------------------------------
    // Engine mount thrust structure base
    g.fillStyle(0x334155, 1);
    g.fillRect(-12, 45, 24, 7);

    // Left delta stabilizing fin
    g.fillStyle(0xef4444, 1);
    g.beginPath();
    g.moveTo(-10, 30);
    g.lineTo(-24, 52);
    g.lineTo(-10, 52);
    g.closePath();
    g.fillPath();

    // Right delta stabilizing fin
    g.beginPath();
    g.moveTo(10, 30);
    g.lineTo(24, 52);
    g.lineTo(10, 52);
    g.closePath();
    g.fillPath();

    // Center fin keel
    g.fillStyle(0x94a3b8, 1);
    g.fillRect(-1, 38, 2, 14);

    // Engine Nozzle Cluster Bells (2 primary propulsion nozzles)
    g.fillStyle(0x1e293b, 1);
    g.fillRect(-8, 52, 6, 8);
    g.fillRect(2, 52, 6, 8);

    // Engine bell interior glow ring
    g.fillStyle(0x475569, 1);
    g.fillRect(-7, 58, 4, 2);
    g.fillRect(3, 58, 4, 2);
  }

  /**
   * Draws the aerodynamic payload fairing / nose cone
   */
  private drawPayloadFairing(): void {
    const g = this.fairingGraphics;
    g.clear();

    // Stage 2 tank section
    g.fillStyle(0xe2e8f0, 1);
    g.fillRect(-10, -52, 20, 18);
    g.fillStyle(0x94a3b8, 1);
    g.fillRect(6, -52, 4, 18);

    // Fairing Nose Cone (curved pixel aerodynamic ogive)
    g.fillStyle(0xf8fafc, 1);
    g.fillRect(-9, -60, 18, 8);
    g.fillRect(-7, -68, 14, 8);
    g.fillRect(-5, -74, 10, 6);
    g.fillRect(-3, -79, 6, 5);
    g.fillRect(-1, -83, 2, 4); // Aerodynamic tip cap

    // Fairing separation seam line
    g.fillStyle(0x0f172a, 0.7);
    g.fillRect(-10, -35, 20, 2);
    g.fillRect(-1, -82, 2, 47); // Vertical split line
  }

  /**
   * Returns the world-space coordinate of the rocket exhaust nozzles
   */
  public getExhaustWorldPosition(): { x: number; y: number } {
    const bottomLocalY = 60 * this.rocketScale;
    return {
      x: this.x,
      y: this.y + bottomLocalY,
    };
  }

  /**
   * Animates fairing jettison / separation when reaching orbit
   */
  public separateFairing(onComplete?: () => void): void {
    if (this.isFairingSeparated) return;
    this.isFairingSeparated = true;

    this.scene.tweens.add({
      targets: this.fairingGraphics,
      y: -40,
      alpha: 0,
      scaleX: 1.4,
      duration: 600,
      ease: "Power2.easeOut",
      onComplete: () => {
        onComplete?.();
      },
    });
  }

  /**
   * Resets the rocket to initial launchpad state
   */
  public reset(x?: number, y?: number): void {
    if (x !== undefined) this.x = x;
    if (y !== undefined) this.y = y;
    this.isFairingSeparated = false;
    this.fairingGraphics.y = 0;
    this.fairingGraphics.alpha = 1;
    this.fairingGraphics.scaleX = 1;
    this.drawPayloadFairing();
    this.rotation = 0;
  }
}
