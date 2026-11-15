import { useState, useEffect, useMemo } from "react";
import { Btn, Coins, Img, Moonscape, Panel, Screen } from "../components/layout/ui";
import { ALL_MARKET_PARTS, MARKET_CATEGORIES, type MarketPart } from "../data/marketData";
import type { Mission } from "../data/missions";
import { useGameStore } from "../stores/gameStore";
import { useLOSStore } from "../stores/losStore";

const REQUIRED = new Set(["launchpad", "vehicle", "satellite", "sensors"]);
/** Categories that can hold several parts at once. */
const MULTI = new Set(["sensors", "lander"]);
const CLIP =
  "polygon(6px 0,calc(100% - 6px) 0,100% 6px,100% calc(100% - 6px),calc(100% - 6px) 100%,6px 100%,0 calc(100% - 6px),0 6px)";

export function WorkshopPage({
  mission,
  go,
  launch,
}: {
  mission: Mission;
  go: (s: string) => void;
  launch: () => void;
}) {
  const ownedPartIds = useGameStore((s) => s.ownedPartIds) || [];
  const [selected, setSelected] = useState(MARKET_CATEGORIES[0].id);
  // Level 5 has two expert missions with different ideal spacecraft
  const VARIANTS = [
    { id: "bennu", label: "Bennu Rendezvous" },
    { id: "msr", label: "Mars Sample Return" },
  ];
  const [variant, setVariant] = useState<string | undefined>(mission.id === 5 ? "bennu" : undefined);
  const [bayView, setBayView] = useState<"assembly" | "telemetry">("assembly");
  const installedIds = useGameStore((s) => s.installedParts) || {};
  const setInstalledPart = useGameStore((s) => s.setInstalledPart);
  const toggleInstalledPart = useGameStore((s) => s.toggleInstalledPart);
  const unlockMission = useGameStore((s) => s.unlockMission);
  const addCoins = useGameStore((s) => s.addCoins);
  const addXp = useGameStore((s) => s.addXp);

  const fetchLiveLOS = useLOSStore((s) => s.fetchLiveLOS);
  const evaluateMission = useLOSStore((s) => s.evaluateMission);
  const liveResult = useLOSStore((s) => s.liveResult);
  const loadingLive = useLOSStore((s) => s.loadingLive);

  // Resolve saved ids to parts, ignoring any the player no longer owns
  // Sensors and landers can hold several parts (comms, cameras, drills ...)
  const installedList: Record<string, MarketPart[]> = useMemo(() => {
    const map: Record<string, MarketPart[]> = {};
    for (const [catId, value] of Object.entries(installedIds)) {
      const ids = Array.isArray(value) ? value : [value];
      const parts = ids
        .filter((id) => ownedPartIds.includes(id))
        .map((id) => ALL_MARKET_PARTS.find((p) => p.id === id))
        .filter((p): p is MarketPart => Boolean(p));
      if (parts.length) map[catId] = parts;
    }
    return map;
  }, [installedIds, ownedPartIds]);

  // First part per category, used by the single-part visual slots
  const installed: Record<string, MarketPart | undefined> = useMemo(() => {
    const map: Record<string, MarketPart | undefined> = {};
    for (const [catId, parts] of Object.entries(installedList)) map[catId] = parts[0];
    return map;
  }, [installedList]);

  const installedPartIds = useMemo(
    () => Object.values(installedList).flat().map((p) => p.id),
    [installedList],
  );

  // Recalculate live LOS whenever installed parts or mission level change
  useEffect(() => {
    fetchLiveLOS(mission.id, installedPartIds, variant);
  }, [mission.id, installedPartIds, variant, fetchLiveLOS]);

  const category = MARKET_CATEGORIES.find((c) => c.id === selected) ?? MARKET_CATEGORIES[0];
  const ownedInCategory = category.parts.filter((p) => ownedPartIds.includes(p.id));
  // Launch eligibility is decided by the backend (all slots + hard constraints)
  const constraints = liveResult?.constraints;
  const missing = liveResult?.missing_equipment ?? [];
  const ready = !loadingLive && liveResult?.launch_allowed === true;
  const threshold = liveResult?.success_threshold ?? 30;
  const [launchError, setLaunchError] = useState<string | null>(null);

  const toggle = (part: MarketPart) => {
    if (MULTI.has(category.id)) toggleInstalledPart(category.id, part.id);
    else setInstalledPart(category.id, installedList[category.id]?.[0]?.id === part.id ? null : part.id);
  };

  const handleLaunch = async () => {
    if (!ready) return;
    setLaunchError(null);
    // Backend re-validates everything and calculates rewards (never trusts the client)
    const result = await evaluateMission(mission.id, installedPartIds, variant);
    if (!result) {
      setLaunchError(useLOSStore.getState().error || "Launch failed");
      return;
    }
    if (result.rewarded) {
      if (result.coinsAwarded > 0) addCoins(result.coinsAwarded);
      if (result.xpAwarded > 0) addXp(result.xpAwarded);
      if (result.next_level_unlocked) unlockMission(mission.id + 1);
    }
    launch();
  };

  // Bottom-to-top assembly order for the build bay
  const stack = ["launchpad", "vehicle", "satellite", "sensors", "lander"];

  const losScore = liveResult?.los ?? 0;
  const completedSlots = liveResult?.required_completed ?? 0;
  const totalSlots = liveResult?.required_total ?? 0;

  return (
    <Screen>
      <Moonscape small />

      {/* Top Banner */}
      <Panel x={462} y={12} w={532} h={64}>
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
              color: "var(--gold)",
              fontWeight: 700,
              fontSize: 22,
              letterSpacing: 2,
              textShadow: "0 0 10px rgba(255, 210, 31, 0.6)",
            }}
          >
            ★ WORKSHOP & AEGIS LOS EVALUATOR ★
          </div>
          <div style={{ color: "var(--cyan)", fontSize: 12, marginTop: 2 }}>
            Mission {mission.id}: {mission.name}
          </div>
        </div>
      </Panel>
      <Coins />

      {/* Spacecraft Slots (Left) */}
      <Panel x={18} y={84} w={330} h={600} tab={<>◎ Spacecraft Slots</>}>
        <div
          style={{
            position: "absolute",
            left: 16,
            right: 16,
            top: 40,
            bottom: 14,
            zIndex: 1,
            display: "flex",
            flexDirection: "column",
            gap: 10,
          }}
        >
          {MARKET_CATEGORIES.map((c) => {
            const part = installed[c.id];
            const count = installedList[c.id]?.length ?? 0;
            const active = c.id === selected;
            return (
              <button
                key={c.id}
                onClick={() => setSelected(c.id)}
                style={{
                  flex: 1,
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  padding: "0 12px",
                  textAlign: "left",
                  fontFamily: "inherit",
                  cursor: "pointer",
                  color: "#eaf2ff",
                  clipPath: CLIP,
                  background: part
                    ? "rgba(10, 40, 25, 0.85)"
                    : active
                    ? "linear-gradient(#0d3a7a,#082060)"
                    : "rgba(8,18,44,0.7)",
                  border: `2px solid ${part ? "#22c55e" : active ? "var(--neon)" : "#1b3a6b"}`,
                }}
              >
                <span style={{ fontSize: 26 }}>{c.emoji}</span>
                <span style={{ minWidth: 0, flex: 1 }}>
                  <div style={{ fontSize: 12, color: "var(--cyan)", fontWeight: 700 }}>
                    {c.name}
                    {REQUIRED.has(c.id) ? " *" : ""}
                  </div>
                  <div
                    style={{
                      fontSize: 13,
                      fontWeight: 700,
                      color: part ? "#86efac" : "#6c88b5",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {count > 1 ? `${count} parts installed` : part ? part.name : "Empty slot"}
                  </div>
                </span>
                {part && (
                  <span
                    style={{
                      fontSize: 10,
                      background: "rgba(34, 197, 94, 0.2)",
                      border: "1px solid #22c55e",
                      color: "#86efac",
                      padding: "2px 6px",
                      borderRadius: 3,
                    }}
                  >
                    OK
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </Panel>

      {/* Center Bay (Build Bay & Live LOS HUD) */}
      <Panel
        x={366}
        y={84}
        w={540}
        h={600}
        tab={
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <span
              onClick={() => setBayView("assembly")}
              style={{
                cursor: "pointer",
                color: bayView === "assembly" ? "var(--gold)" : "#94a3b8",
                fontWeight: bayView === "assembly" ? 700 : 500,
              }}
            >
              🛠️ Assembly Bay
            </span>
            <span style={{ color: "#334155" }}>|</span>
            <span
              onClick={() => setBayView("telemetry")}
              style={{
                cursor: "pointer",
                color: bayView === "telemetry" ? "var(--gold)" : "#94a3b8",
                fontWeight: bayView === "telemetry" ? 700 : 500,
              }}
            >
              📊 LOS vs Ideal
            </span>
          </div>
        }
      >
        {mission.id === 5 && (
          <div style={{ position: "absolute", left: 16, right: 16, top: 108, zIndex: 3, display: "flex", gap: 8 }}>
            {VARIANTS.map((v) => (
              <button
                key={v.id}
                onClick={() => setVariant(v.id)}
                style={{
                  flex: 1,
                  padding: "4px 6px",
                  fontSize: 11,
                  fontWeight: 700,
                  fontFamily: "inherit",
                  cursor: "pointer",
                  color: variant === v.id ? "#2a1600" : "#8ec5ff",
                  background: variant === v.id ? "linear-gradient(#ffe45c,#f0a010)" : "rgba(8,18,44,0.8)",
                  border: `2px solid ${variant === v.id ? "#fff0a0" : "#1b3a6b"}`,
                }}
              >
                {v.label}
              </button>
            ))}
          </div>
        )}

        {/* Top Live Performance Metric Banner */}
        <div
          style={{
            position: "absolute",
            left: 16,
            right: 16,
            top: 40,
            height: 64,
            zIndex: 2,
            background: "rgba(6, 16, 44, 0.9)",
            border: "1px solid #1b4a99",
            clipPath: CLIP,
            padding: "8px 14px",
            display: "grid",
            gridTemplateColumns: "1fr 1fr 1fr",
            alignItems: "center",
            textAlign: "center",
          }}
        >
          <div>
            <div style={{ fontSize: 10, color: "#8ec5ff", textTransform: "uppercase" }}>
              Spacecraft LOS
            </div>
            <div
              style={{
                fontSize: 22,
                fontWeight: 900,
                color: losScore >= threshold ? "#4ade80" : "#f87171",
                fontFamily: "monospace",
              }}
            >
              {loadingLive ? "..." : `${losScore.toFixed(1)}%`}
            </div>
          </div>

          <div>
            <div style={{ fontSize: 10, color: "#8ec5ff", textTransform: "uppercase" }}>
              Passing Threshold
            </div>
            <div style={{ fontSize: 14, fontWeight: 700, color: "#38bdf8", marginTop: 2 }}>
              &ge; {threshold.toFixed(2)}%
            </div>
            <div style={{ fontSize: 10, color: "#94a3b8" }}>Ideal: {(liveResult?.ideal_los ?? 100).toFixed(0)}%</div>
          </div>

          <div>
            <div style={{ fontSize: 10, color: "#8ec5ff", textTransform: "uppercase" }}>
              Slots Filled
            </div>
            <div style={{ fontSize: 15, fontWeight: 800, color: "var(--cyan)", marginTop: 2 }}>
              {completedSlots} / {totalSlots}
            </div>
            <div style={{ fontSize: 10, color: ready ? "#86efac" : "#f59e0b" }}>
              {ready ? "Ready" : "Incomplete"}
            </div>
          </div>
        </div>

        {/* View 1: Visual Assembly Bay Stack */}
        {bayView === "assembly" ? (
          <div
            style={{
              position: "absolute",
              left: 20,
              right: 20,
              top: mission.id === 5 ? 140 : 116,
              bottom: 60,
              zIndex: 1,
              display: "flex",
              flexDirection: "column-reverse",
              alignItems: "center",
              justifyContent: "flex-start",
              gap: 6,
            }}
          >
            {stack.map((id) => {
              const part = installed[id];
              const cat = MARKET_CATEGORIES.find((c) => c.id === id)!;
              return (
                <div
                  key={id}
                  style={{
                    width: "100%",
                    flex: 1,
                    minHeight: 0,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 14,
                    border: `2px dashed ${part ? "#22c55e" : "#1b3a6b"}`,
                    background: part ? "rgba(10, 40, 25, 0.5)" : "rgba(8,18,44,0.4)",
                  }}
                >
                  {part?.img ? (
                    <img
                      className="pix"
                      src={part.img}
                      alt={part.name}
                      style={{ maxHeight: "86%", maxWidth: 100, objectFit: "contain" }}
                    />
                  ) : (
                    <span style={{ fontSize: 26, opacity: part ? 1 : 0.35 }}>{cat.emoji}</span>
                  )}
                  <span
                    style={{
                      fontSize: 12,
                      color: part ? "#86efac" : "#6c88b5",
                      fontWeight: 700,
                      maxWidth: 280,
                    }}
                  >
                    {part ? part.name : `${cat.name} slot empty`}
                  </span>
                </div>
              );
            })}
          </div>
        ) : (
          /* View 2: Detailed Category-wise Telemetry Table */
          <div
            style={{
              position: "absolute",
              left: 20,
              right: 20,
              top: mission.id === 5 ? 140 : 116,
              bottom: 60,
              zIndex: 1,
              overflowY: "auto",
              paddingRight: 4,
            }}
          >
            <div style={{ fontSize: 12, color: "#94a3b8", marginBottom: 8 }}>
              Ideal vs player, per required slot (weighted contribution to LOS):
            </div>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 11 }}>
              <thead>
                <tr style={{ color: "var(--cyan)", borderBottom: "1px solid #1b4a99" }}>
                  <th style={{ textAlign: "left", padding: "5px 3px" }}>SLOT</th>
                  <th style={{ textAlign: "left", padding: "5px 3px" }}>IDEAL</th>
                  <th style={{ textAlign: "left", padding: "5px 3px" }}>PLAYER</th>
                  <th style={{ textAlign: "center", padding: "5px 3px" }}>I / P</th>
                  <th style={{ textAlign: "center", padding: "5px 3px" }}>Δ</th>
                  <th style={{ textAlign: "center", padding: "5px 3px" }}>WT</th>
                  <th style={{ textAlign: "right", padding: "5px 3px" }}>PTS</th>
                </tr>
              </thead>
              <tbody>
                {(liveResult?.equipment_scores || []).map((s, i) => (
                  <tr
                    key={i}
                    style={{
                      borderBottom: "1px solid rgba(27, 74, 153, 0.3)",
                      background: s.difference > 0 ? "rgba(239, 68, 68, 0.08)" : "transparent",
                    }}
                  >
                    <td style={{ padding: "6px 3px", color: "#93c5fd", fontWeight: 700 }}>{s.label}</td>
                    <td style={{ padding: "6px 3px", color: "#94a3b8", maxWidth: 90, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {s.idealName}
                    </td>
                    <td style={{ padding: "6px 3px", color: s.suitability === 0 ? "#f87171" : "#e2e8f0", maxWidth: 90, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {s.selectedName}
                    </td>
                    <td style={{ padding: "6px 3px", textAlign: "center", color: "#94a3b8" }}>
                      {s.idealSuitability} / {s.suitability}
                    </td>
                    <td style={{ padding: "6px 3px", textAlign: "center", fontWeight: 700, color: s.difference === 0 ? "#4ade80" : s.suitability === 0 ? "#f87171" : "#f59e0b" }}>
                      {s.difference === 0 ? "✓" : `−${s.difference}`}
                    </td>
                    <td style={{ padding: "6px 3px", textAlign: "center", color: "#94a3b8" }}>{s.weight}</td>
                    <td style={{ padding: "6px 3px", textAlign: "right", color: "#e2e8f0" }}>
                      {s.contribution.toFixed(1)}/{s.maxContribution.toFixed(1)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {(liveResult?.selected_equipment?.length ?? 0) > 0 && (
              <div style={{ marginTop: 12 }}>
                <div style={{ fontSize: 12, color: "var(--cyan)", fontWeight: 700, marginBottom: 6 }}>
                  YOUR SELECTED PARTS — HOW THEY WERE READ
                </div>
                {liveResult!.selected_equipment.map((e) => {
                  const color = e.status === "USED" ? "#86efac" : e.status === "OFF_SPEC" ? "#fbbf24" : e.status === "UNUSED" ? "#94a3b8" : "#f87171";
                  return (
                    <div key={e.partId} style={{ display: "flex", justifyContent: "space-between", gap: 8, fontSize: 11, padding: "3px 4px", color }}>
                      <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: 200 }}>
                        {e.status === "USED" ? "✓" : e.status === "OFF_SPEC" ? "≈" : e.status === "UNUSED" ? "–" : "✗"} {e.playerName}
                      </span>
                      <span style={{ textAlign: "right" }}>{e.message}</span>
                    </div>
                  );
                })}
              </div>
            )}

            {constraints && (
              <div style={{ marginTop: 12 }}>
                <div style={{ fontSize: 12, color: "var(--cyan)", fontWeight: 700, marginBottom: 6 }}>
                  HARD CONSTRAINTS · Readiness {constraints.mission_readiness_score.toFixed(0)}% · {constraints.destination}
                </div>
                {constraints.checks.map((c) => (
                  <div
                    key={c.id}
                    style={{ display: "flex", justifyContent: "space-between", fontSize: 11, padding: "3px 4px", color: c.passed ? "#86efac" : "#f87171" }}
                  >
                    <span>{c.passed ? "✓" : "✗"} {c.label}</span>
                    <span>
                      {c.actual.toLocaleString()} / {c.limit.toLocaleString()} {c.unit}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {launchError && (
          <div style={{ position: "absolute", left: 20, right: 20, bottom: 34, zIndex: 2, textAlign: "center", fontSize: 12, color: "#f87171", fontWeight: 700 }}>
            {launchError}
          </div>
        )}

        {/* Bottom Status text */}
        <div
          style={{
            position: "absolute",
            left: 20,
            right: 20,
            bottom: 14,
            zIndex: 1,
            textAlign: "center",
            fontWeight: 700,
            fontSize: 13,
            color: ready ? "#86efac" : "var(--cyan)",
          }}
        >
          {ready
            ? `🚀 Ready for launch! Expected LOS: ${losScore.toFixed(1)}% — projected ${
                losScore >= threshold ? "SUCCESS" : "FAILURE"
              }`
            : missing.length
            ? `⚠️ Missing mandatory: ${missing.join(", ")}`
            : `⚠️ ${(constraints?.blockers ?? ["Checking systems..."]).join(" · ")}`}
        </div>
      </Panel>

      {/* Inventory Picker (Right) */}
      <Panel
        x={924}
        y={84}
        w={514}
        h={600}
        tab={<>{category.emoji} Inventory — {category.name}</>}
      >
        <div
          style={{
            position: "absolute",
            left: 16,
            right: 16,
            top: 40,
            bottom: 14,
            zIndex: 1,
            overflowY: "auto",
            display: "flex",
            flexDirection: "column",
            gap: 10,
            paddingRight: 4,
          }}
        >
          {ownedInCategory.length === 0 ? (
            <div
              style={{
                margin: "auto",
                textAlign: "center",
                color: "#6c88b5",
                fontSize: 15,
                lineHeight: 1.5,
              }}
            >
              You don't own any {category.name.toLowerCase()} parts yet.
              <br />
              <button
                onClick={() => go("market")}
                style={{
                  marginTop: 14,
                  background: "linear-gradient(#0d3a7a,#082060)",
                  border: "2px solid var(--neon)",
                  color: "var(--cyan)",
                  fontWeight: 700,
                  fontSize: 13,
                  padding: "8px 16px",
                  cursor: "pointer",
                  fontFamily: "inherit",
                }}
              >
                Buy in Market ›
              </button>
            </div>
          ) : (
            ownedInCategory.map((part) => {
              const on = (installedList[category.id] ?? []).some((p) => p.id === part.id);
              return (
                <div
                  key={part.id}
                  style={{
                    display: "grid",
                    gridTemplateColumns: "64px 1fr auto",
                    alignItems: "center",
                    gap: 12,
                    padding: "8px 12px",
                    clipPath: CLIP,
                    background: on ? "rgba(10, 40, 25, 0.85)" : "rgba(11, 26, 64, 0.85)",
                    border: `2px solid ${on ? "#22c55e" : "#1b5fb3"}`,
                  }}
                >
                  {part.img ? (
                    <img
                      className="pix"
                      src={part.img}
                      alt=""
                      style={{ width: 64, height: 64, objectFit: "contain" }}
                    />
                  ) : (
                    <span style={{ fontSize: 30 }}>{category.emoji}</span>
                  )}
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: on ? "#86efac" : "#eaf2ff" }}>
                      {part.name}
                    </div>
                    <div style={{ fontSize: 12, color: "#8ec5ff" }}>{part.desc}</div>
                  </div>
                  <button
                    onClick={() => toggle(part)}
                    style={{
                      background: on
                        ? "linear-gradient(#7f1d1d,#450a0a)"
                        : "linear-gradient(#ffe45c,#f0a010)",
                      border: `2px solid ${on ? "#ef4444" : "#fff0a0"}`,
                      color: on ? "#fecaca" : "#2a1600",
                      fontWeight: 700,
                      fontSize: 13,
                      padding: "6px 14px",
                      cursor: "pointer",
                      fontFamily: "inherit",
                    }}
                  >
                    {on ? "Remove" : "Install"}
                  </button>
                </div>
              );
            })
          )}
        </div>
      </Panel>

      {/* Footer Navigation Buttons */}
      <Btn
        x={17}
        y={724}
        w={282}
        h={82}
        icon={<Img src="/assets/sprites/ui/home.jpg" size={50} />}
        onClick={() => go("brief")}
      >
        Brief
      </Btn>

      <div style={{ opacity: ready ? 1 : 0.45, pointerEvents: ready ? "auto" : "none" }}>
        <Btn
          gold
          x={478}
          y={698}
          w={500}
          h={88}
          icon={<Img src="/assets/sprites/ui/rocket.jpg" size={62} />}
          chevron={false}
          onClick={handleLaunch}
        >
          GO TO LAUNCHPAD
        </Btn>
      </div>

      <Btn
        x={1214}
        y={724}
        w={230}
        h={82}
        icon={<Img src="/assets/sprites/ui/market.jpg" size={50} />}
        chevron={false}
        onClick={() => go("market")}
      >
        Market
      </Btn>
    </Screen>
  );
}
