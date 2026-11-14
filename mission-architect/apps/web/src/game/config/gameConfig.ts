import Phaser from "phaser";
import { BootScene } from "../scenes/BootScene";
import { PreloadScene } from "../scenes/PreloadScene";
import { WorkshopScene } from "../scenes/WorkshopScene";

export interface GameConfigOptions {
  parent?: HTMLElement | string;
  width?: number | string;
  height?: number | string;
  scenes?: Phaser.Types.Scenes.SceneType[];
  scaleMode?: Phaser.Scale.ScaleModes;
  autoCenter?: Phaser.Scale.Center;
}

export const DEFAULT_GAME_WIDTH = 1280;
export const DEFAULT_GAME_HEIGHT = 720;
export const SPACE_THEME_BACKGROUND = "#050713";

/**
 * Creates the Phaser 3 game configuration.
 *
 * Configured specifically for:
 * - Canvas 2D rendering (`Phaser.CANVAS`)
 * - Responsive Scale Manager (`Phaser.Scale.FIT` centered)
 * - Crisp pixel-art-friendly rendering (`pixelArt: true`, `antialias: false`, `roundPixels: true`)
 * - Deep space theme background
 * - Registration of BootScene, PreloadScene, and WorkshopScene
 * - No unnecessary physics or third-party plugins
 */
export function createGameConfig(options: GameConfigOptions = {}): Phaser.Types.Core.GameConfig {
  const {
    parent,
    width = DEFAULT_GAME_WIDTH,
    height = DEFAULT_GAME_HEIGHT,
    scenes,
    scaleMode = Phaser.Scale.FIT,
    autoCenter = Phaser.Scale.CENTER_BOTH,
  } = options;

  return {
    type: Phaser.CANVAS,
    parent,
    width,
    height,
    backgroundColor: SPACE_THEME_BACKGROUND,
    render: {
      pixelArt: true,
      antialias: false,
      roundPixels: true,
    },
    scale: {
      mode: scaleMode,
      autoCenter,
      width,
      height,
    },
    scene: scenes ?? [BootScene, PreloadScene, WorkshopScene],
  };
}

export const gameConfig = createGameConfig();
