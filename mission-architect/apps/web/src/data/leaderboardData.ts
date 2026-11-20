import { LeaderboardEntry, LeaderboardTimeframe, LeaderboardResponse } from "../types/leaderboard";

/**
 * Helper to assign title based on level
 */
export function getCommanderTitle(level: number): string {
  if (level >= 20) return "Fleet Admiral";
  if (level >= 15) return "Chief Flight Director";
  if (level >= 10) return "Deep Space Commander";
  if (level >= 7) return "Orbital Specialist";
  if (level >= 5) return "Flight Officer";
  if (level >= 3) return "Space Explorer";
  if (level >= 2) return "Cadet Pilot";
  return "Junior Astronaut";
}

/**
 * Computes deterministic sorted rankings with tie-breaking and rank assigning
 * from the actual list of real registered users / commanders.
 */
export function buildLeaderboardResponse(
  users: Array<{
    id: string;
    username: string;
    callsign?: string;
    progress?: {
      xp?: number;
      level?: number;
      completedMissionIds?: number[];
    };
  }>,
  currentUserId?: string | null,
  timeframe: LeaderboardTimeframe = "all-time"
): LeaderboardResponse {
  const entriesRaw: LeaderboardEntry[] = users.map((u) => {
    const level = u.progress?.level ?? 1;
    const totalXp = u.progress?.xp ?? 0;
    const weeklyXp = totalXp; // Total XP earned
    const missionsCompleted = Array.isArray(u.progress?.completedMissionIds)
      ? u.progress.completedMissionIds.length
      : 0;
    const isCurrentPlayer = Boolean(currentUserId && (u.id === currentUserId || u.username === currentUserId));

    return {
      playerId: u.id,
      username: u.callsign || u.username,
      avatar: "/assets/sprites/ui/avatar.jpg",
      level,
      totalXp,
      weeklyXp,
      title: getCommanderTitle(level),
      missionsCompleted,
      isCurrentPlayer,
    };
  });

  const xpKey = timeframe === "weekly" ? "weeklyXp" : "totalXp";

  // Sort by XP descending, then level descending, then username ascending
  const sorted = entriesRaw.sort((a, b) => {
    const xpDiff = b[xpKey] - a[xpKey];
    if (xpDiff !== 0) return xpDiff;
    const levelDiff = b.level - a.level;
    if (levelDiff !== 0) return levelDiff;
    return a.username.localeCompare(b.username);
  });

  // Assign ranks and badges
  const entries: LeaderboardEntry[] = sorted.map((entry, index) => {
    const rank = index + 1;
    let badge: "gold" | "silver" | "bronze" | null = null;
    if (rank === 1) badge = "gold";
    else if (rank === 2) badge = "silver";
    else if (rank === 3) badge = "bronze";

    return {
      ...entry,
      rank,
      badge,
    };
  });

  const currentPlayer = entries.find((e) => e.isCurrentPlayer) || entries[0] || {
    playerId: "guest",
    username: "Commander",
    avatar: "/assets/sprites/ui/avatar.jpg",
    level: 1,
    totalXp: 0,
    weeklyXp: 0,
    title: "Junior Astronaut",
    rank: 1,
    isCurrentPlayer: true,
  };

  return {
    timeframe,
    updatedAt: new Date().toISOString(),
    entries,
    currentPlayer,
    currentPlayerRank: currentPlayer.rank ?? 1,
  };
}

/** Legacy fallback if needed */
export function getLeaderboardData(timeframe: LeaderboardTimeframe = "all-time"): LeaderboardResponse {
  return buildLeaderboardResponse([], null, timeframe);
}
