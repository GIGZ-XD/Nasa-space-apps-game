/**
 * Mission Outcome Types for React-Phaser Communication
 */

export type MissionOutcomeStatus = "pending" | "success" | "failure";

export interface MissionOutcomePayload {
  /** The outcome status provided authoritatively by React/API */
  status: MissionOutcomeStatus;
  /** Optional human-readable reason or anomaly description */
  reason?: string;
  /** Optional overall score (0-100) from mission evaluation */
  score?: number;
  /** Optional mission identifier or title */
  missionId?: string;
}

export const OUTCOME_EVENTS = {
  /** React -> Phaser: Dispatched to notify Phaser of the evaluation result */
  SET_OUTCOME: "mission:outcome",
  /** Phaser -> React: Dispatched when success animation sequence has initialized */
  SUCCESS_RENDERED: "outcome:success:rendered",
  /** Phaser -> React: Dispatched when failure animation sequence has initialized */
  FAILURE_RENDERED: "outcome:failure:rendered",
  /** Phaser -> React: Dispatched when orbital decay animation reaches conclusion */
  DECAY_COMPLETE: "outcome:decay:complete",
} as const;
