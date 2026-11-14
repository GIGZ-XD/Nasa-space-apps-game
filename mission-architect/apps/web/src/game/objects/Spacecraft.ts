import Phaser from "phaser";

export interface SpacecraftConfig {
  x?: number;
  y?: number;
  scale?: number;
  textureKey?: string;
  enableIdleFloat?: boolean;
}

/**
 * Spacecraft
 *
 * 2D Retro Pixel-Art Spacecraft Game Object.
 * Features:
 * - Central Command / Avionics Hull with thermal gold insulation and sensor viewports.
 * - Outstretched dual solar array wings with photovoltaic blue grids and golden mounting struts.
 * - Parabolic high-gain antenna dish with feed horn.
 * - Sensor boom / science instrument mast.
 * - Animated plasma ion thruster exhaust plume with pulsating flame core.
 * - Blinking port/starboard navigation beacon lights.
 * - Gentle cosmic idle floating and micro-rotation.
 * - Modular design: supports swapping to sprite textures when component designs are loaded.
 */
export class Spacecraft extends Phaser.GameObjects.Container {
  private hullGraphics!: Phaser.GameObjects.Graphics;
  private thrusterGraphics!: Phaser.GameObjects.Graphics;
  private beaconGraphics!: Phaser.GameObjects.Graphics;

  private baseY: number;
  private enableIdleFloat: boolean;
  private craftScale: number;

  constructor(scene: Phaser.Scene, x: number, y: number, config: SpacecraftConfig = {}) {
    super(scene, x, y);

    this.baseY = y;
    this.craftScale = config.scale ?? 2.5; // Pixel-art 2.5x crisp scale
    this.enableIdleFloat = config.enableIdleFloat ?? true;

    this.setScale(this.craftScale);

    if (config.textureKey && scene.textures.exists(config.textureKey)) {
      // Modular fallback: use external sprite if provided
      const sprite = scene.add.sprite(0, 0, config.textureKey);
      this.add(sprite);
    } else {
      // Build modular procedural pixel-art spacecraft
      this.buildProceduralSpacecraft();
    }

    scene.add.existing(this);
  }

  private buildProceduralSpacecraft(): void {
    // 1. Thruster Plume (rendered behind engine bell)
    this.thrusterGraphics = this.scene.add.graphics();
    this.add(this.thrusterGraphics);

    // 2. Main Spacecraft Structure (hull, solar wings, antenna)
    this.hullGraphics = this.scene.add.graphics();
    this.add(this.hullGraphics);
    this.drawSpacecraftStructure();

    // 3. Navigation Beacons (blinking LEDs)
    this.beaconGraphics = this.scene.add.graphics();
    this.add(this.beaconGraphics);
  }

  /**
   * Draws the pixel-art spacecraft chassis, solar panels, and hardware
   */
  private drawSpacecraftStructure(): void {
    const g = this.hullGraphics;
    g.clear();

    // -------------------------------------------------------------
    // A. SOLAR ARRAY WINGS (Left & Right)
    // -------------------------------------------------------------
    // Wing Mount Struts (dark metallic gold)
    g.fillStyle(0xd97706, 1);
    g.fillRect(-52, -2, 18, 4); // Left mount truss
    g.fillRect(34, -2, 18, 4);  // Right mount truss

    // Solar Panel Arrays (Blue Photovoltaic Cells)
    const drawSolarPanel = (startX: number) => {
      // Panel border / frame
      g.fillStyle(0x1e293b, 1);
      g.fillRect(startX, -14, 28, 28);

      // Photovoltaic cells
      g.fillStyle(0x0284c7, 1);
      g.fillRect(startX + 2, -12, 11, 11);
      g.fillRect(startX + 15, -12, 11, 11);
      g.fillRect(startX + 2, 1, 11, 11);
      g.fillRect(startX + 15, 1, 11, 11);

      // Solar grid highlights (subtle cyan wires)
      g.fillStyle(0x38bdf8, 0.8);
      g.fillRect(startX + 4, -8, 7, 2);
      g.fillRect(startX + 17, -8, 7, 2);
      g.fillRect(startX + 4, 5, 7, 2);
      g.fillRect(startX + 17, 5, 7, 2);

      // Outer gold edge hinges
      g.fillStyle(0xf59e0b, 1);
      g.fillRect(startX - 1, -12, 2, 4);
      g.fillRect(startX + 27, -12, 2, 4);
      g.fillRect(startX - 1, 8, 2, 4);
      g.fillRect(startX + 27, 8, 2, 4);
    };

    drawSolarPanel(-80); // Far-left panel
    drawSolarPanel(-48); // Near-left panel
    drawSolarPanel(20);  // Near-right panel
    drawSolarPanel(52);  // Far-right panel

    // -------------------------------------------------------------
    // B. REAR ENGINE BELL & REACTION CONTROL SYSTEM (RCS)
    // -------------------------------------------------------------
    // Main Engine Nozzle
    g.fillStyle(0x334155, 1);
    g.fillRect(-8, 18, 16, 6);
    g.fillStyle(0x1e293b, 1);
    g.fillRect(-10, 24, 20, 4);

    // RCS Thruster blocks (4 corners)
    g.fillStyle(0x475569, 1);
    g.fillRect(-22, -14, 4, 4);
    g.fillRect(18, -14, 4, 4);
    g.fillRect(-22, 14, 4, 4);
    g.fillRect(18, 14, 4, 4);

    // -------------------------------------------------------------
    // C. CENTRAL SPACECRAFT SERVICE & AVIONICS HULL
    // -------------------------------------------------------------
    // Service Module Base (hexagonal dark graphite)
    g.fillStyle(0x1e293b, 1);
    g.fillRect(-16, -16, 32, 34);

    // Thermal Insulation Foil (Metallic Gold & Amber Plating)
    g.fillStyle(0xb45309, 1);
    g.fillRect(-14, -14, 28, 30);
    g.fillStyle(0xd97706, 1);
    g.fillRect(-12, -12, 24, 26);
    g.fillStyle(0xfbbf24, 0.85); // Gold reflective specular strip
    g.fillRect(-10, -10, 8, 22);

    // Avionics Command Core & Sensor Bay (Upper Nose)
    g.fillStyle(0x0f172a, 1);
    g.fillRect(-12, -26, 24, 12);
    g.fillStyle(0x334155, 1);
    g.fillRect(-10, -24, 20, 9);

    // Primary Sensor / Optical Visor (Glowing Cyan)
    g.fillStyle(0x00e5ff, 1);
    g.fillRect(-6, -22, 12, 4);
    g.fillStyle(0xe0f2fe, 1); // Specular reflection glint
    g.fillRect(-4, -22, 4, 2);

    // -------------------------------------------------------------
    // D. HIGH-GAIN PARABOLIC ANTENNA & SCIENCE BOOM
    // -------------------------------------------------------------
    // Forward Antenna Dish
    g.fillStyle(0x64748b, 1);
    g.fillRect(-1, -34, 2, 8); // Antenna mast strut

    // Parabolic Dish Curvature
    g.fillStyle(0xe2e8f0, 1);
    g.fillRect(-8, -38, 16, 3);
    g.fillRect(-6, -39, 12, 1);
    g.fillRect(-4, -40, 8, 1);

    // Dish Sub-reflector Feed Horn
    g.fillStyle(0x38bdf8, 1);
    g.fillRect(-1, -43, 2, 3);

    // Science Magnetometer Boom (Port angled arm)
    g.fillStyle(0x94a3b8, 1);
    g.fillRect(-22, -22, 2, 12);
    g.fillStyle(0xef4444, 1); // Sensor tip
    g.fillRect(-23, -24, 4, 3);
  }

  /**
   * Animates plasma thruster exhaust and blinking beacons
   */
  public update(time: number, delta: number): void {
    const sec = time / 1000;

    // 1. Idle vertical cosmic bobbing & micro-tilt
    if (this.enableIdleFloat) {
      this.y = this.baseY + Math.sin(sec * 1.8) * 8;
      this.rotation = Math.sin(sec * 1.2) * 0.03;
    }

    // 2. Animated Ion Thruster Exhaust Plume
    const tg = this.thrusterGraphics;
    tg.clear();

    const flameHeight = 12 + Math.sin(sec * 18) * 4;

    // Outer plasma glow (deep electric blue)
    tg.fillStyle(0x0284c7, 0.6);
    tg.fillRect(-7, 28, 14, flameHeight + 6);

    // Middle cyan flame core
    tg.fillStyle(0x00e5ff, 0.85);
    tg.fillRect(-5, 28, 10, flameHeight);

    // Inner bright white ignition plume
    tg.fillStyle(0xffffff, 0.95);
    tg.fillRect(-2, 28, 4, flameHeight * 0.55);

    // 3. Navigation Beacon Blinkers
    const bg = this.beaconGraphics;
    bg.clear();

    const isBlinkOn = Math.sin(sec * 3.5) > 0;

    if (isBlinkOn) {
      // Port navigation light (Red)
      bg.fillStyle(0xef4444, 1);
      bg.fillRect(-81, -15, 3, 3);

      // Starboard navigation light (Green)
      bg.fillStyle(0x22c55e, 1);
      bg.fillRect(78, -15, 3, 3);

      // Antenna beacon (Bright Strobe Cyan)
      bg.fillStyle(0x67e8f9, 1);
      bg.fillRect(-1, -45, 2, 2);
    }
  }
}
