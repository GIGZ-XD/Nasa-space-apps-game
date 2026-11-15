import Phaser from "phaser";
import { Starfield } from "../systems/Starfield";
import { createRetroGroundTexture, GROUND_CENTER_ROW } from "../systems/RetroPlanetTexture";
import { OUTCOME_EVENTS } from "../types/outcome";

/**
 * LandingScene (missions 3 and 4)
 *
 * The lander (mission 3, over the Moon) or rover (mission 4, over Mars) the
 * player chose drifts down on a parachute and touches down on a retro pixel-art
 * planet. When it lands, the mission-complete event is dispatched to React.
 */
export class LandingScene extends Phaser.Scene {
  public static readonly KEY = "LandingScene";

  private starfield?: Starfield;
  private craft?: Phaser.GameObjects.Image | Phaser.GameObjects.Rectangle;
  private chute?: Phaser.GameObjects.Graphics;
  private dust?: Phaser.GameObjects.Graphics;
  private statusText!: Phaser.GameObjects.Text;
  private telemetryText!: Phaser.GameObjects.Text;

  private isMars = false;
  private surfaceY = 0;
  private startY = -120;
  private craftHalf = 40;
  private descent = { t: 0 }; // 0..1 progress
  private landed = false;
  private reported = false;
  private dustPuffs: { x: number; y: number; vx: number; vy: number; r: number; a: number }[] = [];

  constructor() {
    super({ key: LandingScene.KEY });
  }

  preload(): void {
    const loadout = (this.registry.get("loadout") as Record<string, string> | undefined) ?? {};
    if (loadout.lander && !this.textures.exists("part-lander")) this.load.image("part-lander", loadout.lander);
  }

  create(): void {
    const { width, height } = this.scale;
    const loadout = (this.registry.get("loadout") as Record<string, string> | undefined) ?? {};
    this.isMars = loadout.mission === "4";
    this.landed = false;
    this.reported = false;
    this.dustPuffs = [];
    this.descent = { t: 0 };

    this.starfield = new Starfield(this, { width, height, starCount: 150, enableDrift: true, driftSpeed: 2, enableTwinkle: true });

    // --- Retro pixel-art ground (moon or mars) with a gently curved horizon ---
    const GW = 180;
    const GH = 56;
    createRetroGroundTexture(this, this.isMars ? "retro-ground-mars" : "retro-ground-moon", this.isMars ? "mars" : "moon", GW, GH);
    const cx = Math.round(width / 2);
    const scale = Math.ceil(width / GW) + 0; // whole-number scale keeps pixels crisp
    const groundTop = Math.round(height * 0.78);
    if (this.isMars) {
      // dusty orange sky glow low on the horizon
      const haze = this.add.graphics().setDepth(-1);
      for (let i = 0; i < 10; i++) {
        haze.fillStyle(0xd9824b, 0.035);
        haze.fillRect(0, groundTop - 40 - i * 22, width, height - (groundTop - 40 - i * 22));
      }
    }
    this.add
      .image(cx, groundTop, this.isMars ? "retro-ground-mars" : "retro-ground-moon")
      .setOrigin(0.5, 0)
      .setScale(scale)
      .setDepth(0);
    this.surfaceY = groundTop + GROUND_CENTER_ROW * scale;

    // --- Lander / rover (the part the player chose) ---
    if (this.textures.exists("part-lander")) {
      const img = this.add.image(cx, this.startY, "part-lander");
      // the part pictures carry a caption under the craft: show only the craft (top ~60%)
      const cropH = Math.round(img.height * 0.6);
      img.setCrop(0, 0, img.width, cropH);
      img.setOrigin(0.5, cropH / 2 / img.height);
      const sc = 150 / Math.max(img.width, cropH);
      img.setScale(sc);
      this.craft = img;
      this.craftHalf = (cropH * sc) / 2;
    } else {
      this.craft = this.add.rectangle(cx, this.startY, 80, 80, 0xcbd5e1);
      this.craftHalf = 40;
    }
    this.craft.setDepth(10);

    this.chute = this.add.graphics().setDepth(11);
    this.dust = this.add.graphics().setDepth(9);

    this.buildHUD(width, height);

    // Slow, decelerating descent (about 18 s)
    const landY = this.surfaceY - this.craftHalf + 4;
    this.tweens.add({
      targets: this.descent,
      t: 1,
      duration: 18000,
      ease: "Sine.easeOut",
      onComplete: () => this.touchdown(),
    });
    this.landY = landY;

    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.starfield?.destroy();
      this.starfield = undefined;
    });
  }

  private landY = 0;

  private buildHUD(width: number, height: number): void {
    const bg = this.add.graphics().setDepth(100);
    bg.fillStyle(0x020617, 0.75);
    bg.lineStyle(1, 0x1e293b, 0.85);
    bg.fillRect(24, 16, width - 48, 44);
    bg.strokeRect(24, 16, width - 48, 44);
    bg.fillRect(24, height - 44, width - 48, 28);
    bg.strokeRect(24, height - 44, width - 48, 28);

    const style = { fontFamily: "Courier, monospace", fontSize: "13px" } as const;
    this.add
      .text(36, 30, this.isMars ? "MISSION ARCHITECT // MARS ENTRY, DESCENT & LANDING" : "MISSION ARCHITECT // LUNAR LANDING", { ...style, color: "#00e5ff" })
      .setDepth(101);
    this.statusText = this.add.text(width - 36, 30, "STATUS: PARACHUTE DEPLOYED // DESCENDING", { ...style, color: "#22c55e" }).setOrigin(1, 0).setDepth(101);
    this.telemetryText = this.add.text(36, height - 36, "", { ...style, fontSize: "11px", color: "#94a3b8" }).setDepth(101);
  }

  private drawChute(x: number, y: number, sway: number, collapse: number): void {
    const g = this.chute!;
    g.clear();
    if (collapse >= 1) return;
    const w = 190 * (1 - collapse * 0.5);
    const h = 90 * (1 - collapse * 0.7);
    const top = y - this.craftHalf - 130 + collapse * 60;
    const cx = x + sway * 14;
    const px = 6; // pixel block size for the retro look
    // canopy: stacked pixel rows forming a dome with alternating stripes
    for (let row = 0; row < h / px; row++) {
      const t = row / (h / px);
      const half = Math.sqrt(Math.max(0, 1 - Math.pow(1 - t, 2))) * (w / 2);
      const cols = Math.floor((half * 2) / px);
      for (let c = 0; c < cols; c++) {
        const stripe = Math.floor(c / 3) % 2 === 0;
        g.fillStyle(stripe ? 0xf8fafc : 0xf97316, 1);
        g.fillRect(Math.round(cx - half + c * px), Math.round(top + row * px), px, px);
      }
    }
    g.fillStyle(0x7c2d12, 1);
    g.fillRect(Math.round(cx - w / 2), Math.round(top + h - 2), Math.round(w), 4); // hem
    // suspension lines
    g.lineStyle(2, 0xe2e8f0, 0.9);
    const bx = x;
    const by = y - this.craftHalf + 6;
    for (const f of [-0.5, -0.17, 0.17, 0.5]) {
      g.lineBetween(cx + f * w, top + h, bx + f * 24, by);
    }
  }

  private touchdown(): void {
    if (this.landed) return;
    this.landed = true;
    this.statusText.setText("STATUS: TOUCHDOWN CONFIRMED // MISSION ACCOMPLISHED");
    this.statusText.setColor("#4ade80");
    this.cameras.main.shake(300, 0.004);
    // dust cloud
    const x = (this.craft as Phaser.GameObjects.Image).x;
    for (let i = 0; i < 40; i++) {
      this.dustPuffs.push({
        x: x + (Math.random() - 0.5) * 60,
        y: this.surfaceY - 4,
        vx: (Math.random() - 0.5) * 160,
        vy: -Math.random() * 40,
        r: 6 + Math.random() * 12,
        a: 0.8,
      });
    }
    // the chute collapses and falls away
    this.tweens.add({ targets: this.descent, t: 2, duration: 1600, ease: "Sine.easeIn" });
    this.time.delayedCall(2200, () => {
      if (this.reported) return;
      this.reported = true;
      this.events.emit(OUTCOME_EVENTS.ORBITS_COMPLETE);
      this.game.events?.emit(OUTCOME_EVENTS.ORBITS_COMPLETE);
    });
  }

  update(time: number, delta: number): void {
    this.starfield?.update(time, delta);
    if (!this.craft) return;

    const p = Math.min(1, this.descent.t);
    const y = this.startY + (this.landY - this.startY) * p;
    const sway = this.landed ? 0 : Math.sin(time / 650) * (1 - p) * 0.9;
    const x = Math.round(this.scale.width / 2) + sway * 18;
    this.craft.setPosition(x, y);
    (this.craft as Phaser.GameObjects.Image).setRotation(this.landed ? 0 : sway * 0.06);

    const collapse = Math.max(0, this.descent.t - 1); // 0..1 after touchdown
    this.drawChute(x, y, sway, this.landed ? collapse : 0);

    if (!this.landed) {
      const altitude = Math.max(0, Math.round((this.landY - y) * 6));
      const rate = Math.max(0.5, (1 - p) * 32).toFixed(1);
      this.telemetryText.setText(`ALT: ${altitude} M | DESCENT RATE: ${rate} M/S | PARACHUTE: DEPLOYED`);
    } else {
      this.telemetryText.setText("ALT: 0 M | DESCENT RATE: 0.0 M/S | SYSTEMS: NOMINAL");
    }

    // dust simulation
    const g = this.dust!;
    g.clear();
    const dt = delta / 1000;
    for (let i = this.dustPuffs.length - 1; i >= 0; i--) {
      const d = this.dustPuffs[i];
      d.x += d.vx * dt;
      d.y += d.vy * dt;
      d.vx *= 0.97;
      d.r += 10 * dt;
      d.a -= 0.5 * dt;
      if (d.a <= 0) {
        this.dustPuffs.splice(i, 1);
        continue;
      }
      g.fillStyle(this.isMars ? 0xd9824b : 0xb8b6ae, d.a);
      g.fillRect(Math.round(d.x), Math.round(d.y), Math.round(d.r), Math.round(d.r * 0.7)); // chunky pixel puffs
    }
  }
}
