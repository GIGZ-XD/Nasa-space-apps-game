import Phaser from "phaser";

/**
 * BootScene
 * Initial scene executed by Phaser.
 * Configures any engine-level requirements and transitions to PreloadScene.
 */
export class BootScene extends Phaser.Scene {
  public static readonly KEY = "BootScene";

  constructor() {
    super({ key: BootScene.KEY });
  }

  init(): void {
    // Engine initialization and input configuration can be placed here.
  }

  preload(): void {
    // Immediate boot-stage assets can be queued here if required.
    // Kept asset-free to avoid missing asset runtime failures in Phase 1.
  }

  create(): void {
    // Transition to the asset preload phase
    this.scene.start("PreloadScene");
  }
}
