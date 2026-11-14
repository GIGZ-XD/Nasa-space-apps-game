import Phaser from "phaser";
import { WorkshopScene } from "./WorkshopScene";

/**
 * PreloadScene
 * Asset-loading stage for the Mission Architect game.
 * Loads external game assets and transitions to WorkshopScene.
 * Handles missing optional assets gracefully via loaderror listener.
 */
export class PreloadScene extends Phaser.Scene {
  public static readonly KEY = "PreloadScene";

  constructor() {
    super({ key: PreloadScene.KEY });
  }

  preload(): void {
    // Graceful handling of missing optional assets
    this.load.on("loaderror", (fileObj: Phaser.Loader.File) => {
      console.warn(`[PreloadScene] Optional asset failed to load: ${fileObj.key} (${fileObj.src})`);
    });

    const { width, height } = this.scale;
    const progressBox = this.add.graphics();
    const progressBar = this.add.graphics();
    const boxWidth = Math.min(320, width * 0.5);
    const boxHeight = 16;
    const x = (width - boxWidth) / 2;
    const y = (height - boxHeight) / 2;

    progressBox.fillStyle(0x1a233a, 0.8);
    progressBox.fillRect(x, y, boxWidth, boxHeight);

    const loadingText = this.add
      .text(width / 2, y - 24, "SYSTEMS INITIALIZING...", {
        fontFamily: "Courier, monospace",
        fontSize: "14px",
        color: "#64b5f6",
      })
      .setOrigin(0.5, 0.5);

    this.load.on("progress", (value: number) => {
      progressBar.clear();
      progressBar.fillStyle(0x00e5ff, 1);
      progressBar.fillRect(x + 2, y + 2, (boxWidth - 4) * value, boxHeight - 4);
    });

    this.load.on("complete", () => {
      progressBar.destroy();
      progressBox.destroy();
      loadingText.destroy();
    });

    // In future phases, sprite textures and audio files will be queued here.
  }

  create(): void {
    // Transition to the WorkshopScene
    this.scene.start(WorkshopScene.KEY);
  }
}
