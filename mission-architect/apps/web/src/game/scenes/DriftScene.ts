import Phaser from "phaser";
import { Starfield } from "../systems/Starfield";
import { OUTCOME_EVENTS } from "../types/outcome";

/**
 * DriftScene (mission 5: deep-space explorer)
 *
 * The spacecraft the player built simply drifts through deep space. After a
 * while the mission-complete event is dispatched to React.
 */
export class DriftScene extends Phaser.Scene {
  public static readonly KEY = "DriftScene";
  private static readonly DRIFT_SECONDS = 18;

  private starfield?: Starfield;
  private craft?: Phaser.GameObjects.Image | Phaser.GameObjects.Rectangle;
  private statusText!: Phaser.GameObjects.Text;
  private telemetryText!: Phaser.GameObjects.Text;
  private elapsed = 0;
  private reported = false;

  constructor() {
    super({ key: DriftScene.KEY });
  }

  preload(): void {
    const loadout = (this.registry.get("loadout") as Record<string, string> | undefined) ?? {};
    const url = loadout.satellite || loadout.lander || loadout.vehicle;
    if (url && !this.textures.exists("part-explorer")) this.load.image("part-explorer", url);
  }

  create(): void {
    const { width, height } = this.scale;
    this.elapsed = 0;
    this.reported = false;

    this.starfield = new Starfield(this, { width, height, starCount: 220, enableDrift: true, driftSpeed: 6, enableTwinkle: true });

    if (this.textures.exists("part-explorer")) {
      const img = this.add.image(width * 0.2, height * 0.68, "part-explorer");
      img.setScale(190 / Math.max(img.width, img.height));
      this.craft = img;
    } else {
      this.craft = this.add.rectangle(width * 0.2, height * 0.68, 120, 120, 0xcbd5e1);
    }
    this.craft.setDepth(10);

    const bg = this.add.graphics().setDepth(100);
    bg.fillStyle(0x020617, 0.75);
    bg.lineStyle(1, 0x1e293b, 0.85);
    bg.fillRect(24, 16, width - 48, 44);
    bg.strokeRect(24, 16, width - 48, 44);
    bg.fillRect(24, height - 44, width - 48, 28);
    bg.strokeRect(24, height - 44, width - 48, 28);
    const style = { fontFamily: "Courier, monospace", fontSize: "13px" } as const;
    this.add.text(36, 30, "MISSION ARCHITECT // DEEP-SPACE EXPLORER", { ...style, color: "#00e5ff" }).setDepth(101);
    this.statusText = this.add.text(width - 36, 30, "STATUS: COASTING // SIGNAL NOMINAL", { ...style, color: "#22c55e" }).setOrigin(1, 0).setDepth(101);
    this.telemetryText = this.add.text(36, height - 36, "", { ...style, fontSize: "11px", color: "#94a3b8" }).setDepth(101);

    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.starfield?.destroy();
      this.starfield = undefined;
    });
  }

  update(time: number, delta: number): void {
    this.starfield?.update(time, delta);
    if (!this.craft) return;
    const { width, height } = this.scale;
    this.elapsed += delta / 1000;
    const p = Math.min(1, this.elapsed / DriftScene.DRIFT_SECONDS);

    // slow diagonal drift with a gentle bob and tumble
    const x = width * (0.2 + 0.6 * p);
    const y = height * (0.68 - 0.32 * p) + Math.sin(time / 900) * 10;
    this.craft.setPosition(x, y);
    (this.craft as Phaser.GameObjects.Image).setRotation(Math.sin(time / 2400) * 0.12 + p * 0.5);

    const au = (p * 42.6 + 5.2).toFixed(1);
    this.telemetryText.setText(`DISTANCE FROM SUN: ${au} AU | VELOCITY: 16.9 KM/S | SIGNAL DELAY: ${(p * 5.9 + 0.7).toFixed(1)} H`);

    if (p >= 1 && !this.reported) {
      this.reported = true;
      this.statusText.setText("STATUS: DEEP-SPACE OBJECTIVES ACHIEVED // MISSION ACCOMPLISHED");
      this.statusText.setColor("#4ade80");
      this.events.emit(OUTCOME_EVENTS.ORBITS_COMPLETE);
      this.game.events?.emit(OUTCOME_EVENTS.ORBITS_COMPLETE);
    }
  }
}
