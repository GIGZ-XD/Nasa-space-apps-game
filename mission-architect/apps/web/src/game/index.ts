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

// Scenes
export { BootScene } from "./scenes/BootScene";
export { PreloadScene } from "./scenes/PreloadScene";
export { WorkshopScene } from "./scenes/WorkshopScene";
export { LaunchScene } from "./scenes/LaunchScene";
export type { LaunchState } from "./scenes/LaunchScene";
export { OrbitScene } from "./scenes/OrbitScene";

// Game Objects
export { Spacecraft } from "./objects/Spacecraft";
export type { SpacecraftConfig } from "./objects/Spacecraft";

export { Planet } from "./objects/Planet";
export type { PlanetConfig, PlanetType } from "./objects/Planet";

export { Rocket } from "./objects/Rocket";
export type { RocketConfig } from "./objects/Rocket";

// Systems & Animations
export { Starfield } from "./systems/Starfield";
export type { StarfieldConfig } from "./systems/Starfield";

export { SceneTransitionCoordinator } from "./systems/SceneTransition";
export type { TransitionOptions } from "./systems/SceneTransition";

export { LaunchAnimationController } from "./animations/launchAnimation";
export type { LaunchAnimationConfig, LaunchAnimationCallbacks } from "./animations/launchAnimation";
