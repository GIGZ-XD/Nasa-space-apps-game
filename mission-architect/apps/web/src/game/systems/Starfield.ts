import Phaser from "phaser";

export interface StarfieldConfig {
  width?: number;
  height?: number;
  starCount?: number;
  enableDrift?: boolean;
  driftSpeed?: number;
  enableTwinkle?: boolean;
}

interface TwinkleStar {
  x: number;
  y: number;
  baseSize: number;
  color: number;
  alpha: number;
  twinkleSpeed: number;
  phase: number;
}

/**
 * Starfield System
 *
 * Generates an optimized, layered retro pixel-art starfield with:
 * - Ambient cosmic dust / nebula backdrop gradients.
 * - Multi-tier stars (distant 1px, midground 2px, foreground 3px cross-stars).
 * - Subtle twinkle animations and optional horizontal/vertical parallax drift.
 * - Efficient batch rendering via Phaser Graphics primitives.
 */
export class Starfield {
  private scene: Phaser.Scene;
  private width: number;
  private height: number;
  private enableDrift: boolean;
  private driftSpeed: number;
  private enableTwinkle: boolean;

  // Render layers
  private nebulaGraphics: Phaser.GameObjects.Graphics;
  private staticStarsGraphics: Phaser.GameObjects.Graphics;
  private dynamicStarsGraphics: Phaser.GameObjects.Graphics;

  // Dynamic stars data
  private twinklingStars: TwinkleStar[] = [];
  private currentOffset: number = 0;

  constructor(scene: Phaser.Scene, config: StarfieldConfig = {}) {
    this.scene = scene;
    this.width = config.width ?? scene.scale.width;
    this.height = config.height ?? scene.scale.height;
    this.enableDrift = config.enableDrift ?? true;
    this.driftSpeed = config.driftSpeed ?? 4; // px per second
    this.enableTwinkle = config.enableTwinkle ?? true;

    const starCount = config.starCount ?? 160;

    // Layer 1: Nebula / cosmic dust backdrop
    this.nebulaGraphics = this.scene.add.graphics();
    this.nebulaGraphics.setDepth(-100);
    this.renderNebulaBands();

    // Layer 2: Static distant stars (1px and small 2px)
    this.staticStarsGraphics = this.scene.add.graphics();
    this.staticStarsGraphics.setDepth(-90);
    this.renderStaticStars(Math.floor(starCount * 0.7));

    // Layer 3: Dynamic twinkling and foreground cross stars
    this.dynamicStarsGraphics = this.scene.add.graphics();
    this.dynamicStarsGraphics.setDepth(-80);
    this.initializeTwinklingStars(Math.floor(starCount * 0.3));
  }

  /**
   * Renders subtle pixel-art nebula dust patches to give cosmic depth
   */
  private renderNebulaBands(): void {
    const g = this.nebulaGraphics;
    g.clear();

    // Palette of deep atmospheric space dust
    const nebulaColors = [0x0c1026, 0x141838, 0x120d2a, 0x091428];

    // Procedural pseudo-random dithered clusters
    for (let i = 0; i < 6; i++) {
      const cx = (i * 263 + 120) % this.width;
      const cy = (i * 187 + 90) % this.height;
      const radius = 100 + (i % 3) * 60;
      const color = nebulaColors[i % nebulaColors.length];

      // Draw tiered concentric soft circular bands for retro pixel nebula
      for (let r = radius; r > 20; r -= 20) {
        const alpha = 0.08 * (1 - r / radius);
        g.fillStyle(color, alpha);
        g.fillCircle(cx, cy, r);
      }
    }
  }

  /**
   * Generates fixed distant stars (drawn once into a static graphics layer)
   */
  private renderStaticStars(count: number): void {
    const g = this.staticStarsGraphics;
    g.clear();

    const starPalette = [
      { color: 0x64748b, alpha: 0.5 }, // Faint slate blue
      { color: 0x94a3b8, alpha: 0.7 }, // Cool silver
      { color: 0xe2e8f0, alpha: 0.8 }, // Bright white
      { color: 0x38bdf8, alpha: 0.7 }, // Cyan tint
      { color: 0xfde047, alpha: 0.6 }, // Warm yellow
    ];

    for (let i = 0; i < count; i++) {
      // Deterministic spread
      const x = (i * 379 + 53) % this.width;
      const y = (i * 547 + 97) % this.height;
      const paletteItem = starPalette[i % starPalette.length];
      const size = (i % 5 === 0) ? 2 : 1;

      g.fillStyle(paletteItem.color, paletteItem.alpha);
      g.fillRect(x, y, size, size);
    }
  }

  /**
   * Populates dynamic stars that twinkle and drift
   */
  private initializeTwinklingStars(count: number): void {
    const brightColors = [0xffffff, 0x67e8f9, 0xfef08a, 0xa5f3fc];

    for (let i = 0; i < count; i++) {
      const x = (i * 491 + 173) % this.width;
      const y = (i * 613 + 83) % this.height;
      const isCrossStar = i % 6 === 0;

      this.twinklingStars.push({
        x,
        y,
        baseSize: isCrossStar ? 3 : 2,
        color: brightColors[i % brightColors.length],
        alpha: 0.5 + (i % 5) * 0.1,
        twinkleSpeed: 1.5 + (i % 4) * 0.8,
        phase: (i * 1.3) % (Math.PI * 2),
      });
    }
  }

  /**
   * Updates twinkling animation and subtle parallax drift each frame
   */
  public update(time: number, delta: number): void {
    if (!this.enableTwinkle && !this.enableDrift) {
      return;
    }

    const g = this.dynamicStarsGraphics;
    g.clear();

    if (this.enableDrift) {
      this.currentOffset += (this.driftSpeed * delta) / 1000;
    }

    const sec = time / 1000;

    for (const star of this.twinklingStars) {
      // Wrap horizontal position if drift is active
      let renderX = star.x - (this.enableDrift ? this.currentOffset % this.width : 0);
      if (renderX < 0) {
        renderX += this.width;
      }

      // Calculate smooth sinusoidal twinkling alpha
      const twinkle = Math.sin(sec * star.twinkleSpeed + star.phase);
      const alpha = Phaser.Math.Clamp(star.alpha + twinkle * 0.35, 0.2, 1.0);

      g.fillStyle(star.color, alpha);

      if (star.baseSize >= 3) {
        // Draw 4-point retro cross star:
        //   .
        //  ...
        //   .
        g.fillRect(renderX - 1, star.y, 3, 1);
        g.fillRect(renderX, star.y - 1, 1, 3);
      } else {
        g.fillRect(renderX, star.y, star.baseSize, star.baseSize);
      }
    }
  }

  /**
   * Resizes the starfield when the scene dimensions change
   */
  public resize(width: number, height: number): void {
    this.width = width;
    this.height = height;
    this.renderNebulaBands();
    this.renderStaticStars(120);
    this.initializeTwinklingStars(40);
  }

  /**
   * Destroys graphics resources and cancels listeners
   */
  public destroy(): void {
    this.nebulaGraphics.destroy();
    this.staticStarsGraphics.destroy();
    this.dynamicStarsGraphics.destroy();
    this.twinklingStars = [];
  }
}
