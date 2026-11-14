import { useEffect, useRef, useState } from "react";
import { Panel, Screen, Img } from "../components/layout/ui";
import { leaderboardService } from "../services/leaderboardService";
import { LeaderboardEntry, LeaderboardTimeframe, LeaderboardResponse } from "../types/leaderboard";
import "../styles/leaderboard.css";

/* ── helpers ─────────────────────────────────────────────────────────────── */

function MedalIcon({ badge }: { badge?: string | null }) {
  if (badge === "gold") return <span className="lb-medal lb-medal-gold">🥇</span>;
  if (badge === "silver") return <span className="lb-medal lb-medal-silver">🥈</span>;
  if (badge === "bronze") return <span className="lb-medal lb-medal-bronze">🥉</span>;
  return null;
}

function RankLabel({ rank }: { rank?: number }) {
  if (!rank) return null;
  if (rank === 1) return <span className="lb-rank-num lb-rank-gold">#{rank}</span>;
  if (rank === 2) return <span className="lb-rank-num lb-rank-silver">#{rank}</span>;
  if (rank === 3) return <span className="lb-rank-num lb-rank-bronze">#{rank}</span>;
  return <span className="lb-rank-num">#{rank}</span>;
}

function Avatar({ src, size = 44 }: { src: string; size?: number }) {
  return (
    <img
      src={src}
      alt=""
      className="lb-avatar"
      style={{ width: size, height: size }}
      onError={(e) => { (e.target as HTMLImageElement).src = "/assets/sprites/ui/avatar.jpg"; }}
    />
  );
}

/* ── podium card ─────────────────────────────────────────────────────────── */

function PodiumCard({ entry, pos }: { entry: LeaderboardEntry; pos: "gold" | "silver" | "bronze" }) {
  const heights: Record<string, number> = { gold: 160, silver: 120, bronze: 100 };
  const labels: Record<string, string> = { gold: "1ST", silver: "2ND", bronze: "3RD" };
  return (
    <div className={`lb-podium-card lb-podium-${pos}`}>
      <MedalIcon badge={pos} />
      <Avatar src={entry.avatar} size={pos === "gold" ? 70 : 54} />
      <div className="lb-pod-name">{entry.username}</div>
      <div className="lb-pod-meta">Lv.{entry.level} · {(pos === "gold" ? entry.totalXp : entry.totalXp).toLocaleString()} XP</div>
      {entry.isCurrentPlayer && <span className="lb-you-tag">YOU</span>}
      <div className="lb-pod-base" style={{ height: heights[pos] }}>
        <span className="lb-pod-place">{labels[pos]}</span>
      </div>
    </div>
  );
}

/* ── ranking row ─────────────────────────────────────────────────────────── */

function RankRow({ entry }: { entry: LeaderboardEntry }) {
  return (
    <div className={`lb-row${entry.isCurrentPlayer ? " lb-row-current" : ""}`}>
      <RankLabel rank={entry.rank} />
      <Avatar src={entry.avatar} size={36} />
      <span className="lb-row-name">
        {entry.username}
        {entry.isCurrentPlayer && <span className="lb-you-inline"> ◀ YOU</span>}
      </span>
      <span className="lb-row-level">Lv.{entry.level}</span>
      <span className="lb-row-xp">{entry.totalXp.toLocaleString()} XP</span>
    </div>
  );
}

/* ── main page ───────────────────────────────────────────────────────────── */

export function LeaderboardPage({ go }: { go: (s: string) => void }) {
  const [timeframe, setTimeframe] = useState<LeaderboardTimeframe>("all-time");
  const [data, setData] = useState<LeaderboardResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const tableRef = useRef<HTMLDivElement>(null);

  async function load(tf: LeaderboardTimeframe) {
    setLoading(true);
    setError(null);
    try {
      const res = await leaderboardService.getLeaderboard(tf);
      setData(res);
    } catch {
      setError("UNABLE TO LOAD COMMANDER RANKINGS");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(timeframe); }, [timeframe]);

  /* scroll to current player row */
  useEffect(() => {
    if (!data || !tableRef.current) return;
    const el = tableRef.current.querySelector(".lb-row-current");
    if (el) el.scrollIntoView({ block: "center", behavior: "smooth" });
  }, [data]);

  const [p1, p2, p3] = data?.entries ?? [];

  return (
    <Screen>
      {/* space background planets */}
      <img className="pix abs" src="/assets/sprites/planets/mars.jpg" alt=""
        style={{ left: 1300, top: 60, width: 80, borderRadius: "50%", opacity: 0.6 }} />
      <img className="pix abs" src="/assets/sprites/planets/earth.jpg" alt=""
        style={{ left: 60, top: 580, width: 120, borderRadius: "50%", opacity: 0.25, boxShadow: "0 0 26px #2bb8ff" }} />

      {/* ── HEADER BAR ───────────────────────────────────────────────────── */}
      <Panel x={14} y={12} w={1428} h={76}>
        <div className="lb-header">
          <button className="lb-back-btn" onClick={() => go("home")}>← BACK</button>

          <div className="lb-title-group">
            <Img src="/assets/sprites/ui/trophy.jpg" size={40} />
            <div>
              <div className="lb-title">LEADERBOARD</div>
              <div className="lb-subtitle">RANK THE BEST SPACE COMMANDERS</div>
            </div>
          </div>

          <div className="lb-controls">
            <button
              className={`lb-tab-btn${timeframe === "all-time" ? " lb-tab-active" : ""}`}
              onClick={() => setTimeframe("all-time")}
            >ALL-TIME</button>
            <button
              className={`lb-tab-btn${timeframe === "weekly" ? " lb-tab-active" : ""}`}
              onClick={() => setTimeframe("weekly")}
            >WEEKLY</button>
            <button
              className="lb-refresh-btn"
              onClick={() => load(timeframe)}
              title="Refresh"
              disabled={loading}
            >{loading ? "⏳" : "↺"}</button>
          </div>
        </div>
      </Panel>

      {/* ── LOADING / ERROR STATES ────────────────────────────────────────── */}
      {loading && (
        <div className="lb-state-overlay">
          <div className="lb-spinner" />
          <div className="lb-state-text">LOADING COMMANDER RANKINGS...</div>
        </div>
      )}

      {!loading && error && (
        <div className="lb-state-overlay">
          <div className="lb-state-text lb-state-error">{error}</div>
          <button className="lb-refresh-btn" style={{ marginTop: 20, fontSize: 18 }} onClick={() => load(timeframe)}>↺ RETRY</button>
        </div>
      )}

      {/* ── MAIN CONTENT ─────────────────────────────────────────────────── */}
      {!loading && !error && data && (
        <>
          {/* PODIUM */}
          <Panel x={14} y={98} w={760} h={330}>
            <div className="lb-section-label">TOP COMMANDERS</div>
            <div className="lb-podium">
              {p2 && <PodiumCard entry={p2} pos="silver" />}
              {p1 && <PodiumCard entry={p1} pos="gold" />}
              {p3 && <PodiumCard entry={p3} pos="bronze" />}
            </div>
          </Panel>

          {/* RANKINGS TABLE */}
          <Panel x={788} y={98} w={654} h={620}>
            <div className="lb-section-label">GLOBAL RANKINGS</div>
            {/* table header */}
            <div className="lb-row lb-row-header">
              <span className="lb-rank-num" style={{ opacity: 0.7 }}>RANK</span>
              <span style={{ width: 36 }} />
              <span className="lb-row-name" style={{ opacity: 0.7 }}>COMMANDER</span>
              <span className="lb-row-level" style={{ opacity: 0.7 }}>LVL</span>
              <span className="lb-row-xp" style={{ opacity: 0.7 }}>
                {timeframe === "weekly" ? "WEEK XP" : "TOTAL XP"}
              </span>
            </div>
            {/* scrollable rows */}
            <div className="lb-table-wrap" ref={tableRef}>
              {data.entries.map((e) => (
                <RankRow key={e.playerId} entry={
                  timeframe === "weekly"
                    ? { ...e, totalXp: e.weeklyXp }  // show weeklyXp in xp column
                    : e
                } />
              ))}
            </div>
          </Panel>

          {/* MY RANK */}
          <Panel x={14} y={438} w={760} h={280}>
            <div className="lb-section-label">YOUR PROFILE</div>
            <div className="lb-my-rank">
              <div className="lb-my-rank-badge">
                #{data.currentPlayerRank}
              </div>
              <Avatar src={data.currentPlayer.avatar} size={68} />
              <div className="lb-my-rank-info">
                <div className="lb-my-rank-name">{data.currentPlayer.username}</div>
                <div className="lb-my-rank-meta">
                  Level {data.currentPlayer.level} · {data.currentPlayer.title ?? "Mission Commander"}
                </div>
                <div className="lb-my-rank-xp">
                  <span className="lb-xp-label">{timeframe === "weekly" ? "WEEK XP" : "TOTAL XP"}</span>
                  <span className="lb-xp-val">
                    {(timeframe === "weekly" ? data.currentPlayer.weeklyXp : data.currentPlayer.totalXp).toLocaleString()}
                  </span>
                </div>
                <div className="lb-my-rank-bar-wrap">
                  <div
                    className="lb-my-rank-bar"
                    style={{
                      width: `${Math.min(100, ((timeframe === "weekly" ? data.currentPlayer.weeklyXp : data.currentPlayer.totalXp) / 6000) * 100)}%`
                    }}
                  />
                </div>
              </div>
              <div className="lb-my-rank-missions">
                <div className="lb-stat-box">
                  <div className="lb-stat-val">{data.currentPlayer.missionsCompleted ?? 1}</div>
                  <div className="lb-stat-label">MISSIONS</div>
                </div>
                <div className="lb-stat-box">
                  <div className="lb-stat-val">{data.currentPlayer.level}</div>
                  <div className="lb-stat-label">LEVEL</div>
                </div>
              </div>
            </div>
          </Panel>
        </>
      )}
    </Screen>
  );
}
