import { PLAYER } from "./missions";
import { LeaderboardEntry, LeaderboardTimeframe, LeaderboardResponse } from "../types/leaderboard";

/**
 * Seed Space Commanders Dataset
 * Realistic NASA-themed commanders with progression levels and XP records.
 */
export const SEED_COMMANDERS: LeaderboardEntry[] = [
  {
    playerId: "cmd-001",
    username: "AstroValkyrie",
    avatar: "/assets/sprites/spacecraft/card-1.jpg",
    level: 12,
    totalXp: 5420,
    weeklyXp: 1280,
    title: "Chief Flight Director",
    missionsCompleted: 18,
  },
  {
    playerId: "cmd-002",
    username: "NovaExplorer",
    avatar: "/assets/sprites/spacecraft/card-2.jpg",
    level: 11,
    totalXp: 4890,
    weeklyXp: 940,
    title: "Deep Space Navigator",
    missionsCompleted: 15,
  },
  {
    playerId: "cmd-003",
    username: "CosmicPioneer",
    avatar: "/assets/sprites/spacecraft/card-3.jpg",
    level: 10,
    totalXp: 4210,
    weeklyXp: 1120,
    title: "Orbital Specialist",
    missionsCompleted: 14,
  },
  {
    playerId: "cmd-004",
    username: "SpaceRanger_X",
    avatar: "/assets/sprites/ui/rover.jpg",
    level: 8,
    totalXp: 3200,
    weeklyXp: 750,
    title: "Surface Explorer",
    missionsCompleted: 10,
  },
  {
    playerId: "cmd-005",
    username: "AstroKing",
    avatar: "/assets/sprites/spacecraft/card-4.jpg",
    level: 7,
    totalXp: 2900,
    weeklyXp: 620,
    title: "Propulsion Engineer",
    missionsCompleted: 9,
  },
  {
    playerId: "cmd-006",
    username: "StarWalker_99",
    avatar: "/assets/sprites/spacecraft/card-5.jpg",
    level: 5,
    totalXp: 1250,
    weeklyXp: 380,
    title: "Astrodynamics Pilot",
    missionsCompleted: 5,
  },
  {
    playerId: "cmd-007",
    username: "LunarOrbit_X",
    avatar: "/assets/sprites/planets/earth.jpg",
    level: 4,
    totalXp: 980,
    weeklyXp: 290,
    title: "Lunar Surveyor",
    missionsCompleted: 3,
  },
  {
    playerId: "cmd-008",
    username: "MarsSurveyor",
    avatar: "/assets/sprites/planets/mars.jpg",
    level: 3,
    totalXp: 640,
    weeklyXp: 140,
    title: "Atmospheric Analyst",
    missionsCompleted: 2,
  },
  {
    playerId: "cmd-009",
    username: "OrionCadet",
    avatar: "/assets/sprites/ui/rocket.jpg",
    level: 2,
    totalXp: 320,
    weeklyXp: 90,
    title: "Flight Apprentice",
    missionsCompleted: 1,
  },
  {
    playerId: "cmd-player",
    username: PLAYER.name,
    avatar: "/assets/sprites/ui/avatar.jpg",
    level: PLAYER.level,
    totalXp: PLAYER.xp,
    weeklyXp: PLAYER.xp,
    title: "Mission Commander",
    missionsCompleted: 1,
    isCurrentPlayer: true,
  },
  {
    playerId: "cmd-010",
    username: "Voyager_07",
    avatar: "/assets/sprites/ui/gear.jpg",
    level: 1,
    totalXp: 100,
    weeklyXp: 50,
    title: "Junior Astronaut",
    missionsCompleted: 0,
  },
];

/**
 * Computes deterministic sorted rankings with tie-breaking and rank assigning
 */
export function getLeaderboardData(timeframe: LeaderboardTimeframe = "all-time"): LeaderboardResponse {
  const xpKey = timeframe === "weekly" ? "weeklyXp" : "totalXp";

  // Sort by selected XP descending, then level descending, then username ascending
  const sorted = [...SEED_COMMANDERS].sort((a, b) => {
    const xpDiff = b[xpKey] - a[xpKey];
    if (xpDiff !== 0) return xpDiff;
    const levelDiff = b.level - a.level;
    if (levelDiff !== 0) return levelDiff;
    return a.username.localeCompare(b.username);
  });

  // Assign deterministic ranks and podium badges
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

  const currentPlayer = entries.find((e) => e.isCurrentPlayer) || {
    playerId: "cmd-player",
    username: PLAYER.name,
    avatar: "/assets/sprites/ui/avatar.jpg",
    level: PLAYER.level,
    totalXp: PLAYER.xp,
    weeklyXp: PLAYER.xp,
    title: "Mission Commander",
    rank: entries.length,
    isCurrentPlayer: true,
  };

  return {
    timeframe,
    updatedAt: new Date().toISOString(),
    entries,
    currentPlayer,
    currentPlayerRank: currentPlayer.rank ?? entries.length,
  };
}
