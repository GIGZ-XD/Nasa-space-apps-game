export { PhaserGame } from "./PhaserGame";
export type { PhaserGameProps } from "./PhaserGame";

export {
  createGameConfig,
  gameConfig,
  DEFAULT_GAME_WIDTH,
  DEFAULT_GAME_HEIGHT,
  SPACE_THEME_BACKGROUND,
} from "./config/gameConfig";
export type { GameConfigOptions } from "./config/gameConfig";

export { BootScene } from "./scenes/BootScene";
export { PreloadScene } from "./scenes/PreloadScene";
export { WorkshopScene } from "./scenes/WorkshopScene";

export { Spacecraft } from "./objects/Spacecraft";
export type { SpacecraftConfig } from "./objects/Spacecraft";

export { Planet } from "./objects/Planet";
export type { PlanetConfig, PlanetType } from "./objects/Planet";

export { Starfield } from "./systems/Starfield";
export type { StarfieldConfig } from "./systems/Starfield";
