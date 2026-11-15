import React, { useEffect } from "react";
import { playSfx } from "../audio/sfx";
import { Btn, Coins, Img, Moonscape, Panel, Screen } from "../components/layout/ui";
import { useLOSStore } from "../stores/losStore";
import { useGameStore, formatCoins } from "../stores/gameStore";
import { MISSIONS } from "../data/missions";

interface ResultsPageProps {
  missionId: number;
  go: (s: string) => void;
  onRetry: () => void;
}

const CLIP =
  "polygon(6px 0,calc(100% - 6px) 0,100% 6px,100% calc(100% - 6px),calc(100% - 6px) 100%,6px 100%,0 calc(100% - 6px),0 6px)";

export function ResultsPage({ missionId, go, onRetry }: ResultsPageProps) {
  const evaluationResult = useLOSStore((s) => s.evaluationResult);
  const coins = useGameStore((s) => s.coins);
  const xp = useGameStore((s) => s.xp);
  const level = useGameStore((s) => s.level);
  const mission = MISSIONS.find((m) => m.id === missionId) ?? MISSIONS[0];

  // Level-up jingle when this mission's XP raised the player's level
  useEffect(() => {
    const { pendingLevelUp, clearLevelUp } = useGameStore.getState();
    if (pendingLevelUp) {
      playSfx("level_up");
      clearLevelUp();
    }
  }, []);

  const isSuccess = evaluationResult ? evaluationResult.mission_status === "SUCCESS" : false;
  const los = evaluationResult ? evaluationResult.los : 0;
  const idealLos = evaluationResult ? evaluationResult.ideal_los : 100;
  const coinsAwarded = evaluationResult ? evaluationResult.coinsAwarded : 0;
  const xpAwarded = evaluationResult ? evaluationResult.xpAwarded : 0;
  const scores = evaluationResult ? evaluationResult.equipment_scores : [];
  const missing = evaluationResult ? evaluationResult.missing_equipment : [];
  const threshold = evaluationResult?.success_threshold ?? 60;
  const poor = scores.filter((s) => s.difference > 0 && s.suitability > 0).map((s) => `${s.label} (${s.suitability}/${s.idealSuitability})`);
  const nextUnlocked = evaluationResult?.next_level_unlocked ?? false;

  return (
    <Screen>
      <Moonscape small />

      {/* Header Banner */}
      <Panel x={380} y={12} w={680} h={68}>
        <div
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1,
          }}
        >
          <div
            className="px sprite-title"
            style={{
              color: isSuccess ? "#4ade80" : "#f87171",
              fontWeight: 800,
              fontSize: 24,
              letterSpacing: 3,
              textShadow: isSuccess
                ? "0 0 14px rgba(74, 222, 128, 0.7)"
                : "0 0 14px rgba(248, 113, 113, 0.7)",
            }}
          >
            {isSuccess ? "★ MISSION ACCOMPLISHED ★" : "⚠️ MISSION FAILED ⚠️"}
          </div>
          <div style={{ color: "var(--cyan)", fontSize: 13, marginTop: 2, fontWeight: 600 }}>
            Mission {mission.id}: {mission.name} // Telemetry Evaluation
          </div>
        </div>
      </Panel>

      <Coins />

      {/* Left Column: Overall Metrics & Rewards Card */}
      <Panel
        x={24}
        y={90}
        w={440}
        h={590}
        tab={<>📊 Level of Success (LOS)</>}
      >
        <div
          style={{
            position: "absolute",
            inset: "40px 18px 16px 18px",
            zIndex: 1,
            display: "flex",
            flexDirection: "column",
            gap: 16,
          }}
        >
          {/* Big Score Box */}
          <div
            style={{
              padding: "16px",
              background: isSuccess ? "rgba(10, 45, 25, 0.7)" : "rgba(50, 15, 15, 0.7)",
              border: `2px solid ${isSuccess ? "#22c55e" : "#ef4444"}`,
              clipPath: CLIP,
              textAlign: "center",
            }}
          >
            <div style={{ fontSize: 13, color: "#8ec5ff", fontWeight: 700, letterSpacing: 1 }}>
              FINAL SPACECRAFT SCORE
            </div>
            <div
              style={{
                fontSize: 48,
                fontWeight: 900,
                color: isSuccess ? "#86efac" : "#fca5a5",
                fontFamily: "monospace",
                margin: "4px 0",
              }}
            >
              {los.toFixed(2)}%
            </div>
            <div style={{ fontSize: 12, color: "#cbd5e1" }}>
              Benchmark Target: <b style={{ color: "var(--gold)" }}>{idealLos}%</b> | Threshold:{" "}
              <b style={{ color: "#38bdf8" }}>{threshold.toFixed(2)}%</b>
            </div>
          </div>

          {/* Progress Bar */}
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, marginBottom: 4 }}>
              <span style={{ color: "#94a3b8" }}>Mission Success Rate</span>
              <span style={{ color: isSuccess ? "#86efac" : "#f87171", fontWeight: 700 }}>
                {los.toFixed(1)}% / 100%
              </span>
            </div>
            <div
              style={{
                width: "100%",
                height: 14,
                background: "rgba(10, 20, 45, 0.8)",
                border: "1px solid #1e3a8a",
                borderRadius: 4,
                overflow: "hidden",
                position: "relative",
              }}
            >
              {/* Threshold indicator line at the success threshold */}
              <div
                style={{
                  position: "absolute",
                  left: `${threshold}%`,
                  top: 0,
                  bottom: 0,
                  width: 2,
                  background: "#f59e0b",
                  zIndex: 2,
                }}
                title={`Minimum Passing Threshold (${threshold}%)`}
              />
              <div
                style={{
                  height: "100%",
                  width: `${Math.min(100, Math.max(0, los))}%`,
                  background: isSuccess
                    ? "linear-gradient(90deg, #10b981, #22c55e)"
                    : "linear-gradient(90deg, #b91c1c, #ef4444)",
                  transition: "width 0.8s ease-out",
                }}
              />
            </div>
          </div>

          {/* Mission Debrief Card */}
          <div
            style={{
              padding: "12px 14px",
              background: "rgba(11, 26, 64, 0.65)",
              border: "1px solid #1b4a99",
              clipPath: CLIP,
              fontSize: 13,
              lineHeight: 1.5,
            }}
          >
            <div style={{ color: "var(--cyan)", fontWeight: 700, marginBottom: 6 }}>
              MISSION CONTROL DEBRIEF:
            </div>
            {isSuccess ? (
              <div style={{ color: "#e2e8f0" }}>
                Orbital telemetry confirmed! The spacecraft configuration met mission constraints with a{" "}
                <b style={{ color: "#86efac" }}>{los.toFixed(2)}%</b> operational rating. Full recovery
                and mission science rewards have been transferred to your command account.{missionId < 5 && (nextUnlocked ? " Next mission unlocked!" : "")}
              </div>
            ) : (
              <div style={{ color: "#fca5a5" }}>
                Critical orbital anomaly! The configuration achieved only{" "}
                <b style={{ color: "#f87171" }}>{los.toFixed(2)}%</b>, which falls below the minimum
                mandated <b>{threshold.toFixed(2)}%</b> passing threshold, so no completion coins or base XP are awarded and the next mission stays locked. Improve the configuration and try again.{(missing.length > 0 || poor.length > 0) && (<> Underperforming: <b>{[...missing, ...poor].join(", ")}</b>.</>)}
              </div>
            )}
          </div>

          {/* Rewards Breakdown */}
          <div
            style={{
              flex: 1,
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-evenly",
              background: "rgba(15, 23, 42, 0.6)",
              border: "1px solid #334155",
              padding: "12px 16px",
              clipPath: CLIP,
            }}
          >
            <div style={{ fontSize: 13, color: "var(--gold)", fontWeight: 700, letterSpacing: 1 }}>
              REWARDS EARNED
            </div>

            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <span style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 15, color: "#e2e8f0" }}>
                <Img src="/assets/sprites/ui/coin.jpg" size={28} />
                Coins Granted:
              </span>
              <span
                style={{
                  fontSize: 18,
                  fontWeight: 800,
                  color: isSuccess ? "#facc15" : "#64748b",
                  fontFamily: "monospace",
                }}
              >
                +{formatCoins(coinsAwarded)}
              </span>
            </div>

            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <span style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 15, color: "#e2e8f0" }}>
                <span style={{ color: "#38bdf8", fontSize: 22 }}>★</span>
                Experience (XP):
              </span>
              <span
                style={{
                  fontSize: 18,
                  fontWeight: 800,
                  color: "#38bdf8",
                  fontFamily: "monospace",
                }}
              >
                +{xpAwarded.toLocaleString()} XP
              </span>
            </div>

            <div style={{ borderTop: "1px solid #1e293b", paddingTop: 8, fontSize: 12, color: "#94a3b8" }}>
              Current Commander Balance: <b>{formatCoins(coins)}</b> | Level {level} ({xp.toLocaleString()} XP)
            </div>
          </div>
        </div>
      </Panel>

      {/* Right Column: Detailed Equipment Breakdown Table */}
      <Panel
        x={482}
        y={90}
        w={934}
        h={590}
        tab={<>🛠️ Equipment Suitability Breakdown</>}
      >
        <div
          style={{
            position: "absolute",
            inset: "40px 18px 16px 18px",
            zIndex: 1,
            overflowY: "auto",
            paddingRight: 6,
          }}
        >
          {missing.length > 0 && (
            <div
              style={{
                marginBottom: 12,
                padding: "8px 14px",
                background: "rgba(127, 29, 29, 0.4)",
                border: "1px solid #ef4444",
                borderRadius: 4,
                color: "#fca5a5",
                fontSize: 13,
                fontWeight: 600,
              }}
            >
              ⚠️ Missing Required Equipment: {missing.join(", ")} (scored as 0% suitability)
            </div>
          )}

          <table
            style={{
              width: "100%",
              borderCollapse: "collapse",
              textAlign: "left",
              fontFamily: "inherit",
              fontSize: 13,
            }}
          >
            <thead>
              <tr
                style={{
                  borderBottom: "2px solid #1b4a99",
                  color: "var(--cyan)",
                  fontSize: 12,
                  letterSpacing: 1,
                }}
              >
                <th style={{ padding: "8px 6px" }}>CATEGORY</th>
                <th style={{ padding: "8px 6px" }}>SELECTED EQUIPMENT</th>
                <th style={{ padding: "8px 6px", textAlign: "center" }}>WEIGHT (Wi)</th>
                <th style={{ padding: "8px 6px", textAlign: "center" }}>SUITABILITY (Si)</th>
                <th style={{ padding: "8px 6px", textAlign: "right" }}>CONTRIBUTION</th>
              </tr>
            </thead>
            <tbody>
              {scores.map((s, idx) => {
                const isOptimal = s.suitability === 100;
                const isZero = s.suitability === 0;
                const contrib = ((s.weight * s.suitability) / 100).toFixed(2);

                return (
                  <tr
                    key={idx}
                    style={{
                      borderBottom: "1px solid rgba(30, 58, 138, 0.4)",
                      background: isZero
                        ? "rgba(127, 29, 29, 0.15)"
                        : idx % 2 === 0
                        ? "rgba(15, 23, 42, 0.3)"
                        : "transparent",
                    }}
                  >
                    <td style={{ padding: "10px 6px", fontWeight: 700, color: "#93c5fd" }}>
                      {s.label || s.categoryName}
                    </td>
                    <td style={{ padding: "10px 6px", color: isZero ? "#f87171" : "#e2e8f0" }}>
                      {s.selectedName}
                    </td>
                    <td style={{ padding: "10px 6px", textAlign: "center", color: "#94a3b8" }}>
                      {s.weight}
                    </td>
                    <td style={{ padding: "10px 6px", textAlign: "center" }}>
                      <span
                        style={{
                          padding: "2px 8px",
                          borderRadius: 4,
                          fontWeight: 700,
                          fontSize: 12,
                          background: isZero
                            ? "rgba(239, 68, 68, 0.2)"
                            : isOptimal
                            ? "rgba(34, 197, 94, 0.2)"
                            : "rgba(245, 158, 11, 0.2)",
                          color: isZero ? "#f87171" : isOptimal ? "#4ade80" : "#f59e0b",
                          border: `1px solid ${
                            isZero ? "#ef4444" : isOptimal ? "#22c55e" : "#f59e0b"
                          }`,
                        }}
                      >
                        {s.suitability}%
                      </span>
                    </td>
                    <td
                      style={{
                        padding: "10px 6px",
                        textAlign: "right",
                        color: "var(--cyan)",
                        fontFamily: "monospace",
                        fontWeight: 700,
                      }}
                    >
                      +{contrib} pts
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {/* Formula Footnote */}
          <div
            style={{
              marginTop: 16,
              padding: "8px 12px",
              background: "rgba(8, 18, 44, 0.7)",
              border: "1px dashed #1e3a8a",
              borderRadius: 4,
              fontSize: 11,
              color: "#64748b",
            }}
          >
            LOS Formula: <code>Σ(Wi × Si) / Σ(Wi)</code> | Category weights and benchmarks are validated
            authoritatively by NASA Mission Control AEGIS engine.
          </div>
        </div>
      </Panel>

      {/* Navigation Footer */}
      <Btn
        x={24}
        y={700}
        w={240}
        h={80}
        icon={<Img src="/assets/sprites/ui/home.jpg" size={46} />}
        onClick={() => go("home")}
      >
        Dashboard
      </Btn>

      <Btn
        x={280}
        y={700}
        w={260}
        h={80}
        onClick={() => go("select")}
      >
        Mission Select
      </Btn>

      <div style={{ position: "absolute", right: 24, top: 700 }}>
        {isSuccess ? (
          <Btn
            gold
            x={0}
            y={0}
            w={380}
            h={80}
            icon={<Img src="/assets/sprites/ui/rocket.jpg" size={50} />}
            onClick={() => {
              if (missionId < 5) {
                go("select");
              } else {
                go("home");
              }
            }}
          >
            {missionId < 5 ? "PROCEED TO NEXT MISSION" : "CAMPAIGN COMPLETED"}
          </Btn>
        ) : (
          <Btn
            gold
            x={0}
            y={0}
            w={380}
            h={80}
            onClick={onRetry}
          >
            RE-ENGINEER IN WORKSHOP
          </Btn>
        )}
      </div>
    </Screen>
  );
}
