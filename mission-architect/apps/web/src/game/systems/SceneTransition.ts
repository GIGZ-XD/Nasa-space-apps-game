import Phaser from "phaser";

export interface TransitionOptions {
  fromScene: Phaser.Scene;
  toSceneKey: string;
  duration?: number;
  data?: Record<string, unknown>;
  onBeforeTransition?: () => void;
  onComplete?: () => void;
}

/**
 * SceneTransitionCoordinator
 *
 * Provides safe, robust scene transitions with:
 * - Duplicate transition locking (prevents rapid re-triggering or overlapping scene switches).
 * - Smooth camera fade transitions.
 * - Scene shutdown lifecycle compliance.
 * - Instant skip support.
 */
export class SceneTransitionCoordinator {
  private static isTransitioning: boolean = false;

  /**
   * Transitions from the active scene to the target scene key with a smooth camera fade
   */
  public static transitionTo(options: TransitionOptions): void {
    if (this.isTransitioning) {
      console.warn(`[SceneTransition] Transition to ${options.toSceneKey} ignored: already transitioning.`);
      return;
    }

    const { fromScene, toSceneKey, duration = 400, data = {}, onBeforeTransition, onComplete } = options;

    if (!fromScene.scene.isActive()) {
      console.warn(`[SceneTransition] Cannot transition from inactive scene: ${fromScene.scene.key}`);
      return;
    }

    this.isTransitioning = true;
    onBeforeTransition?.();

    // Camera fade to deep space black
    fromScene.cameras.main.fade(duration, 2, 6, 19, false, (_cam: Phaser.Cameras.Scene2D.Camera, progress: number) => {
      if (progress >= 1) {
        this.executeSceneSwitch(fromScene, toSceneKey, data, onComplete);
      }
    });
  }

  /**
   * Instantly transitions without camera fade (used for skip actions)
   */
  public static skipTo(options: TransitionOptions): void {
    const { fromScene, toSceneKey, data = {}, onBeforeTransition, onComplete } = options;

    this.isTransitioning = true;
    onBeforeTransition?.();

    this.executeSceneSwitch(fromScene, toSceneKey, data, onComplete);
  }

  private static executeSceneSwitch(
    fromScene: Phaser.Scene,
    toSceneKey: string,
    data: Record<string, unknown>,
    onComplete?: () => void
  ): void {
    try {
      fromScene.scene.start(toSceneKey, data);
      onComplete?.();
    } catch (err) {
      console.error(`[SceneTransition] Failed to transition to scene '${toSceneKey}':`, err);
    } finally {
      this.isTransitioning = false;
    }
  }

  /**
   * Resets the transition lock (useful if a scene catches an unhandled abort)
   */
  public static resetLock(): void {
    this.isTransitioning = false;
  }
}
