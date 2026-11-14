import React, { useEffect, useRef, memo } from "react";
import Phaser from "phaser";
import {
  createGameConfig,
  DEFAULT_GAME_WIDTH,
  DEFAULT_GAME_HEIGHT,
  SPACE_THEME_BACKGROUND,
} from "./config/gameConfig";
import { MissionOutcomeStatus, OUTCOME_EVENTS } from "./types/outcome";

export interface PhaserGameProps {
  /** Configurable canvas width in pixels or CSS string (default: 1280) */
  width?: number | string;
  /** Configurable canvas height in pixels or CSS string (default: 720) */
  height?: number | string;
  /** Optional custom CSS class name for the game wrapper element */
  className?: string;
  /** Optional custom inline styles for the game wrapper element */
  style?: React.CSSProperties;
  /** Optional scenes override for advanced testing or multi-phase integration */
  scenes?: Phaser.Types.Scenes.SceneType[];
  /** Optional initial scene key to switch to after boot (e.g. 'LaunchScene' or 'OrbitScene') */
  initialScene?: string;
  /** Optional mission outcome status driven authoritatively by React ('pending' | 'success' | 'failure') */
  missionOutcome?: MissionOutcomeStatus;
  /** Callback invoked once Phaser.Game has booted and is ready */
  onGameReady?: (game: Phaser.Game) => void;
  /** Callback invoked after Phaser.Game has been destroyed during unmount */
  onGameDestroyed?: () => void;
}

/**
 * PhaserGame
 * Reusable React component integrating Phaser 3 into the React component tree.
 *
 * Key guarantees:
 * - Exactly one Phaser.Game instance created per mounted component.
 * - Robust cleanup on unmount avoiding duplicate canvases in React StrictMode.
 * - Handles asynchronous Phaser destruction safely to prevent race conditions on remount.
 * - Responds to dimension changes dynamically via Scale Manager without game re-creation.
 * - Safe against server-side rendering (SSR).
 */
export const PhaserGame: React.FC<PhaserGameProps> = memo(function PhaserGame({
  width = DEFAULT_GAME_WIDTH,
  height = DEFAULT_GAME_HEIGHT,
  className,
  style,
  scenes,
  initialScene,
  missionOutcome,
  onGameReady,
  onGameDestroyed,
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const gameRef = useRef<Phaser.Game | null>(null);

  // Maintain stable callback references so changing handlers does not re-trigger mount
  const onGameReadyRef = useRef(onGameReady);
  const onGameDestroyedRef = useRef(onGameDestroyed);
  const initialSceneRef = useRef(initialScene);
  const missionOutcomeRef = useRef(missionOutcome);

  useEffect(() => {
    onGameReadyRef.current = onGameReady;
  }, [onGameReady]);

  useEffect(() => {
    onGameDestroyedRef.current = onGameDestroyed;
  }, [onGameDestroyed]);

  useEffect(() => {
    initialSceneRef.current = initialScene;
  }, [initialScene]);

  useEffect(() => {
    missionOutcomeRef.current = missionOutcome;
    if (gameRef.current && missionOutcome) {
      gameRef.current.registry.set("missionOutcome", missionOutcome);
      gameRef.current.events?.emit(OUTCOME_EVENTS.SET_OUTCOME, { status: missionOutcome });
    }
  }, [missionOutcome]);

  useEffect(() => {
    // Avoid accessing browser-only APIs during SSR
    if (typeof window === "undefined" || !containerRef.current) {
      return;
    }

    const container = containerRef.current;
    let isCurrentMount = true;

    // Purge any residual canvases or DOM nodes from prior mounts/StrictMode cycles
    while (container.firstChild) {
      container.removeChild(container.firstChild);
    }

    // Build configuration targeted at the mounted container
    const config = createGameConfig({
      parent: container,
      width,
      height,
      scenes,
      initialScene: initialSceneRef.current,
      missionOutcome: missionOutcomeRef.current,
    });

    const game = new Phaser.Game(config);
    gameRef.current = game;

    const handleReady = () => {
      if (!isCurrentMount || gameRef.current !== game) return;

      if (onGameReadyRef.current) {
        onGameReadyRef.current(game);
      }
    };

    // Notify caller when Phaser has finished its boot and readiness sequence
    if (game.isBooted) {
      handleReady();
    } else {
      game.events?.once("ready", handleReady);
    }

    // Comprehensive lifecycle cleanup on component unmount
    return () => {
      isCurrentMount = false;

      if (gameRef.current) {
        const activeGame = gameRef.current;
        gameRef.current = null;

        // Initiate Phaser destruction and canvas removal
        activeGame.destroy(true);

        const internalGame = activeGame as unknown as {
          isBooted?: boolean;
          pendingDestroy?: boolean;
          runDestroy?: () => void;
        };

        if (internalGame.isBooted && typeof internalGame.runDestroy === "function" && internalGame.pendingDestroy) {
          try {
            internalGame.runDestroy();
          } catch {
            // Safe fallback
          }
        } else if (!internalGame.isBooted) {
          activeGame.events?.once("boot", () => {
            try {
              activeGame.destroy(true);
              if (typeof internalGame.runDestroy === "function") {
                internalGame.runDestroy();
              }
            } catch {
              // Ignore teardown errors on aborted boot
            }
          });
        }
      }

      // Ensure container has no residual elements
      while (container.firstChild) {
        container.removeChild(container.firstChild);
      }

      if (onGameDestroyedRef.current) {
        onGameDestroyedRef.current();
      }
    };
  }, [scenes]);

  // Handle dynamic dimension adjustments without destroying the game instance
  useEffect(() => {
    if (
      gameRef.current &&
      typeof width === "number" &&
      typeof height === "number" &&
      gameRef.current.scale
    ) {
      gameRef.current.scale.resize(width, height);
    }
  }, [width, height]);

  return (
    <div
      ref={containerRef}
      className={className}
      data-testid="phaser-game-container"
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        overflow: "hidden",
        backgroundColor: SPACE_THEME_BACKGROUND,
        ...style,
      }}
    />
  );
});

PhaserGame.displayName = "PhaserGame";
