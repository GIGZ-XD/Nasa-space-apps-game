/**
 * Leaderboard Data Types
 */

export interface LeaderboardEntry {
  playerId: string;
  username: string;
  avatar: string;
  level: number;
  totalXp: number;
  weeklyXp: number;
  rank?: number;
  badge?: "gold" | "silver" | "bronze" | null;
  title?: string;
  missionsCompleted?: number;
  isCurrentPlayer?: boolean;
}

export type LeaderboardTimeframe = "all-time" | "weekly";

export interface LeaderboardResponse {
  timeframe: LeaderboardTimeframe;
  updatedAt: string;
  entries: LeaderboardEntry[];
  currentPlayer: LeaderboardEntry;
  currentPlayerRank: number;
}
