import Phaser from "phaser";

export type PlanetType = "terrestrial" | "gas-giant" | "martian" | "ice";

export interface PlanetConfig {
  x?: number;
  y?: number;
  radius?: number;
  type?: PlanetType;
  hasAtmosphere?: boolean;
  hasRing?: boolean;
  textureKey?: string;
}

/**
 * Planet
 *
 * 2D Retro Pixel-Art Planet Game Object.
 * Features:
 * - Spherical pixel-shaded body with continent/crater/band details.
 * - Directional sunlight illumination with dithered crescent shadow (terminator line).
 * - Multi-tiered atmospheric glow and haze corona.
 * - Optional planetary rings with equatorial tilt and shadow projection.
 * - Modular architecture: uses procedural pixel graphics by default, or seamlessly
 *   binds to external sprite textures when supplied in future phases.
 */
export class Planet extends Phaser.GameObjects.Container {
  private planetRadius: number;
  private planetType: PlanetType;
  private hasAtmosphere: boolean;
  private hasRing: boolean;

  private bodyGraphics!: Phaser.GameObjects.Graphics;
  private atmosphereGraphics?: Phaser.GameObjects.Graphics;
  private ringGraphics?: Phaser.GameObjects.Graphics;
  private cloudLayer?: Phaser.GameObjects.Graphics;

  private cloudOffset: number = 0;

  constructor(scene: Phaser.Scene, x: number, y: number, config: PlanetConfig = {}) {
    super(scene, x, y);

    this.planetRadius = config.radius ?? 140;
    this.planetType = config.type ?? "terrestrial";
    this.hasAtmosphere = config.hasAtmosphere ?? true;
    this.hasRing = config.hasRing ?? false;

    if (config.textureKey && scene.textures.exists(config.textureKey)) {
      // Modular fallback: use external sprite if provided
      const sprite = scene.add.sprite(0, 0, config.textureKey);
      sprite.setDisplaySize(this.planetRadius * 2, this.planetRadius * 2);
      this.add(sprite);
    } else {
      // Build procedural pixel-art planet
      this.buildProceduralPlanet();
    }

    scene.add.existing(this);
  }

  private buildProceduralPlanet(): void {
    // 1. Back Ring (rendered behind planet body if rings enabled)
    if (this.hasRing) {
      this.ringGraphics = this.scene.add.graphics();
      this.add(this.ringGraphics);
      this.drawRings(true);
    }

    // 2. Main Planet Body (with terrain & surface bands)
    this.bodyGraphics = this.scene.add.graphics();
    this.add(this.bodyGraphics);
    this.drawPlanetBody();

    // 3. Dynamic cloud / surface drift layer
    this.cloudLayer = this.scene.add.graphics();
    this.add(this.cloudLayer);
    this.drawClouds(0);

    // 4. Crescent Shadow (directional light from top-left, shadow on bottom-right)
    this.drawTerminatorShadow();

    // 5. Front Ring (rendered in front of planet body)
    if (this.hasRing && this.ringGraphics) {
      this.drawRings(false);
    }

    // 6. Atmospheric Glow Corona
    if (this.hasAtmosphere) {
      this.atmosphereGraphics = this.scene.add.graphics();
      this.add(this.atmosphereGraphics);
      this.drawAtmosphere();
    }
  }

  /**
   * Draws the planet's spherical body with geographical features
   */
  private drawPlanetBody(): void {
    const g = this.bodyGraphics;
    const r = this.planetRadius;

    // Base ocean / surface color
    let baseColor = 0x1e3a8a; // Deep ocean blue
    let landColor = 0x10b981; // Continental green
    let highlightColor = 0x38bdf8; // Shallow coastal cyan

    if (this.planetType === "martian") {
      baseColor = 0x991b1b; // Rust red
      landColor = 0xd97706; // Amber desert
      highlightColor = 0xfef08a; // Polar cap / highlands
    } else if (this.planetType === "gas-giant") {
      baseColor = 0x78350f; // Bronze
      landColor = 0xb45309; // Caramel
      highlightColor = 0xfde68a; // Cream bands
    }

    // Base circle
    g.fillStyle(baseColor, 1);
    g.fillCircle(0, 0, r);

    // Pixel-art geographical landmasses / atmospheric bands
    g.fillStyle(landColor, 1);

    if (this.planetType === "gas-giant") {
      // Horizontal planetary storm bands
      for (let y = -r; y < r; y += 8) {
        if (Math.abs(y) % 24 < 12) {
          const bandWidth = Math.sqrt(Math.max(0, r * r - y * y));
          g.fillRect(-bandWidth, y, bandWidth * 2, 6);
        }
      }
    } else {
      // Pixel continent blobs
      const continents = [
        { x: -r * 0.4, y: -r * 0.3, w: r * 0.6, h: r * 0.4 },
        { x: r * 0.1, y: -r * 0.1, w: r * 0.5, h: r * 0.5 },
        { x: -r * 0.2, y: r * 0.25, w: r * 0.7, h: r * 0.35 },
      ];

      for (const cont of continents) {
        for (let py = cont.y; py < cont.y + cont.h; py += 4) {
          for (let px = cont.x; px < cont.x + cont.w; px += 4) {
            // Keep inside planet radius
            if (px * px + py * py < (r - 4) * (r - 4)) {
              // Procedural pixel noise
              if (((px * 13 + py * 17) % 7) > 1) {
                g.fillRect(px, py, 4, 4);
              }
            }
          }
        }
      }

      // Coastal shallows highlights
      g.fillStyle(highlightColor, 0.6);
      g.fillRect(-r * 0.45, -r * 0.1, 8, 8);
      g.fillRect(r * 0.05, 0, 10, 6);
      g.fillRect(-r * 0.1, r * 0.2, 12, 6);
    }
  }

  /**
   * Draws dynamic drifting cloud bands
   */
  private drawClouds(offset: number): void {
    if (!this.cloudLayer) return;
    const g = this.cloudLayer;
    g.clear();

    const r = this.planetRadius;
    g.fillStyle(0xffffff, 0.75); // Bright pixel clouds

    const cloudBands = [
      { y: -r * 0.55, h: 8, speed: 1.0 },
      { y: -r * 0.2, h: 12, speed: 0.8 },
      { y: r * 0.15, h: 10, speed: 1.2 },
      { y: r * 0.45, h: 6, speed: 0.9 },
    ];

    for (const band of cloudBands) {
      for (let x = -r; x < r; x += 16) {
        const shiftedX = (((x + offset * band.speed + r) % (r * 2)) - r);
        const y = band.y;

        // Ensure cloud is inside planet circle
        if (shiftedX * shiftedX + y * y < (r - 4) * (r - 4)) {
          // Pixel cloud cluster shape
          g.fillRect(shiftedX, y, 14, band.h);
          g.fillRect(shiftedX + 3, y - 2, 8, band.h + 4);
        }
      }
    }
  }

  /**
   * Creates dithered retro terminator shadow (light from top-left, shadow on bottom-right)
   */
  private drawTerminatorShadow(): void {
    const r = this.planetRadius;
    const shadowGraphics = this.scene.add.graphics();
    this.add(shadowGraphics);

    // Deep shadow on unlit side
    shadowGraphics.fillStyle(0x020617, 0.72);

    for (let y = -r; y <= r; y += 4) {
      for (let x = -r; x <= r; x += 4) {
        if (x * x + y * y <= r * r) {
          // Normal along light direction (-1, -1) towards top-left
          const lightIntensity = (-x - y) / (Math.sqrt(2) * r);

          if (lightIntensity < -0.15) {
            // Full shadow
            shadowGraphics.fillRect(x, y, 4, 4);
          } else if (lightIntensity < 0.1) {
            // Dithered shadow transition
            if ((Math.abs(x) + Math.abs(y)) % 8 === 0) {
              shadowGraphics.fillRect(x, y, 4, 4);
            }
          }
        }
      }
    }
  }

  /**
   * Draws soft atmospheric halo surrounding the planet
   */
  private drawAtmosphere(): void {
    if (!this.atmosphereGraphics) return;
    const g = this.atmosphereGraphics;
    g.clear();

    const r = this.planetRadius;
    const haloColor = this.planetType === "martian" ? 0xf97316 : 0x38bdf8;

    // Concentric corona rings with fading alpha
    for (let i = 1; i <= 6; i++) {
      const ringRadius = r + i * 2.5;
      const alpha = 0.3 * (1 - i / 7);
      g.lineStyle(2, haloColor, alpha);
      g.strokeCircle(0, 0, ringRadius);
    }
  }

  /**
   * Draws retro planetary rings if enabled
   */
  private drawRings(isBack: boolean): void {
    if (!this.ringGraphics) return;
    const g = this.ringGraphics;
    const r = this.planetRadius;

    const ringInner = r * 1.35;
    const ringOuter = r * 2.1;

    g.lineStyle(3, 0xfde68a, isBack ? 0.4 : 0.85);

    // Draw elliptical ring arcs
    for (let rad = ringInner; rad <= ringOuter; rad += 4) {
      const alpha = (rad % 8 === 0) ? 0.3 : 0.7;
      g.lineStyle(2, 0xe2e8f0, isBack ? alpha * 0.5 : alpha);
      g.strokeEllipse(0, 0, rad * 2, rad * 0.55);
    }
  }

  /**
   * Animates cloud movement and atmospheric breathing each frame
   */
  public update(time: number, delta: number): void {
    this.cloudOffset += (delta * 0.015);
    this.drawClouds(this.cloudOffset);
  }
}
