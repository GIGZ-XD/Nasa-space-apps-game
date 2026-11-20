import { LeaderboardResponse, LeaderboardTimeframe } from "../types/leaderboard";
import { buildLeaderboardResponse } from "../data/leaderboardData";
import { useGameStore } from "../stores/gameStore";
import { API_BASE } from "./apiClient";

/**
 * Leaderboard Service
 * Handles data retrieval with API support and resilient local fallback.
 */
export const leaderboardService = {
  /**
   * Fetches leaderboard data for the specified timeframe
   */
  async getLeaderboard(timeframe: LeaderboardTimeframe = "all-time"): Promise<LeaderboardResponse> {
    const token = localStorage.getItem("ma_auth_token");
    const headers: Record<string, string> = { Accept: "application/json" };
    if (token) headers.Authorization = `Bearer ${token}`;

    try {
      const response = await fetch(`${API_BASE}/leaderboard?timeframe=${timeframe}`, {
        headers,
      });

      if (response.ok) {
        const data = (await response.json()) as LeaderboardResponse;
        if (data && Array.isArray(data.entries)) {
          return data;
        }
      }
    } catch {
      // Gracefully fall back if backend is offline
    }

    // Build fallback leaderboard from current active player session
    const current = useGameStore.getState();
    const fallbackUser = {
      id: current.ownerId || "current-player",
      username: current.playerName || "Commander",
      progress: {
        xp: current.xp,
        level: current.level,
        completedMissionIds: current.completedMissionIds,
      },
    };
    return buildLeaderboardResponse([fallbackUser], fallbackUser.id, timeframe);
  },
};
