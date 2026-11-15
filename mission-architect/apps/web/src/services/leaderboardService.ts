import { LeaderboardResponse, LeaderboardTimeframe } from "../types/leaderboard";
import { getLeaderboardData } from "../data/leaderboardData";
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
    try {
      const response = await fetch(`${API_BASE}/leaderboard?timeframe=${timeframe}`, {
        headers: { Accept: "application/json" },
      });

      if (response.ok) {
        const data = (await response.json()) as LeaderboardResponse;
        if (data && Array.isArray(data.entries)) {
          return data;
        }
      }
    } catch {
      // Gracefully fall back to local seed data if backend is offline
    }

    // Return deterministic mock/local data
    return getLeaderboardData(timeframe);
  },
};
