import { useState } from "react";
import { Btn, Coins, Img, Moonscape, Panel, Screen } from "../components/layout/ui";
import type { Mission } from "../data/missions";
import { findPartByNameOrSlot, type MarketPart } from "../data/marketData";
import { useGameStore, formatCoins } from "../stores/gameStore";

function fmt(n: number): string {
  if (n >= 1_000_000) {
    const v = n / 1_000_000;
    return (v % 1 === 0 ? v.toFixed(0) : v.toFixed(1)) + "M";
  }
  return (n / 1_000).toFixed(0) + "K";
}

export function MissionBriefPage({
  mission,
  go,
  start,
}: {
  mission: Mission;
  go: (s: string) => void;
  start: () => void;
}) {
  const [activeTab, setActiveTab] = useState<"objectives" | "parts">("objectives");
  const [toast, setToast] = useState<string | null>(null);

  const { isPartOwned, canAfford, buyPart } = useGameStore();
  const [first, ...rest] = mission.tagline.split(". ");

  // Resolve mission parts against market catalog
  const resolvedParts = (mission.parts || []).map((p) => {
    const matched = findPartByNameOrSlot(p.name);
    return {
      slot: p.slot,
      name: p.name,
      icon: p.icon,
      marketPart: matched,
      owned: matched ? isPartOwned(matched.id) : false,
    };
  });

  const ownedCount = resolvedParts.filter((p) => p.owned).length;
  const allOwned = resolvedParts.length > 0 && ownedCount === resolvedParts.length;

  const handleBuy = (mp: MarketPart) => {
    const res = buyPart(mp);
    if (res.success) {
      setToast(`🎉 Acquired ${mp.name} for $${fmt(mp.price)}!`);
      setTimeout(() => setToast(null), 3500);
    } else {
      setToast(`❌ ${res.reason || "Insufficient funds!"}`);
      setTimeout(() => setToast(null), 3500);
    }
  };

  return (
    <Screen>
      <Moonscape small />

      {/* Back button */}
      <Btn x={25} y={16} w={100} h={64} chevron={false} onClick={() => go("select")}>
        {""}
      </Btn>
      <span
        className="abs"
        style={{
          left: 48,
          top: 24,
          fontSize: 44,
          color: "var(--cyan)",
          zIndex: 3,
          pointerEvents: "none",
        }}
      >
        ←
      </span>

      {/* Mission title panel */}
      <Panel x={146} y={14} w={506} h={70}>
        <div
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            alignItems: "center",
            gap: 16,
            padding: "0 20px",
            zIndex: 1,
            fontSize: 30,
            fontWeight: 700,
            whiteSpace: "nowrap",
          }}
        >
          <Img src={mission.id === 4 ? "/assets/sprites/ui/rover.jpg" : mission.card} size={46} />
          <span>
            <span className="hl">Mission {mission.id}:</span> {mission.name}
          </span>
        </div>
      </Panel>

      <Coins />

      {/* Toast Notification */}
      {toast && (
        <div
          style={{
            position: "absolute",
            top: 92,
            left: "50%",
            transform: "translateX(-50%)",
            background: "rgba(6, 16, 44, 0.95)",
            border: "2px solid var(--gold)",
            color: "var(--gold)",
            padding: "8px 24px",
            borderRadius: 6,
            fontWeight: 700,
            fontSize: 16,
            zIndex: 100,
            boxShadow: "0 0 20px rgba(255, 210, 31, 0.6)",
            pointerEvents: "none",
          }}
        >
          {toast}
        </div>
      )}

      {/* Mission Hero / Art panel */}
      <Panel x={58} y={102} w={592} h={440}>
        <img
          className="pix abs"
          src={mission.hero ?? mission.card}
          alt={mission.name}
          style={{
            left: 10,
            top: 10,
            width: 572,
            height: 232 + 80,
            objectFit: "cover",
            border: "3px solid #1b4a99",
          }}
        />
        <p
          style={{
            position: "absolute",
            left: 40,
            top: 336,
            right: 30,
            margin: 0,
            fontSize: 24,
            fontWeight: 600,
            lineHeight: 1.3,
            zIndex: 1,
          }}
        >
          {first}
          {rest.length ? ". " + rest.join(". ") : ""}
        </p>
      </Panel>

      {/* Mission Rewards panel */}
      <Panel
        x={68}
        y={560}
        w={572}
        h={96}
        tab={
          <>
            <span style={{ color: "var(--gold)", fontSize: 28 }}>★</span>Mission Rewards
          </>
        }
      >
        <div
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 50,
            paddingTop: 12,
            fontSize: 32,
            fontWeight: 600,
            zIndex: 1,
          }}
        >
          <span style={{ display: "inline-flex", alignItems: "center", gap: 14 }}>
            <Img src="/assets/sprites/ui/coin.jpg" size={46} />
            {mission.cost}
          </span>
          <span style={{ display: "inline-flex", alignItems: "center", gap: 14 }}>
            <span style={{ color: "#4db8ff", fontSize: 40 }}>★</span>
            {mission.xp.toLocaleString()} XP
          </span>
        </div>
      </Panel>

      {/* Right panel: Objectives & Spacecraft Hardware Tabs */}
      <Panel
        x={685}
        y={102}
        w={715}
        h={556}
        tab={
          <div style={{ display: "flex", gap: 14, alignItems: "center" }}>
            <button
              onClick={() => setActiveTab("objectives")}
              style={{
                background: "none",
                border: "none",
                color: activeTab === "objectives" ? "var(--gold)" : "#88a0d0",
                fontWeight: 700,
                fontSize: 22,
                cursor: "pointer",
                padding: 0,
                textDecoration: activeTab === "objectives" ? "underline" : "none",
              }}
            >
              ◎ Mission Objectives
            </button>
            <span style={{ color: "#3a6099" }}>|</span>
            <button
              onClick={() => setActiveTab("parts")}
              style={{
                background: "none",
                border: "none",
                color: activeTab === "parts" ? "var(--cyan)" : "#88a0d0",
                fontWeight: 700,
                fontSize: 22,
                cursor: "pointer",
                padding: 0,
                textDecoration: activeTab === "parts" ? "underline" : "none",
              }}
            >
              🛠️ Spacecraft Parts ({ownedCount}/{resolvedParts.length})
            </button>
          </div>
        }
      >
        {activeTab === "objectives" ? (
          <ul
            className="obj"
            style={{ position: "absolute", left: 18, right: 22, top: 36, margin: 0, zIndex: 1 }}
          >
            {mission.objectives.map((o) => (
              <li
                key={o.id}
                style={{ height: Math.min(84, 470 / mission.objectives.length) }}
              >
                <span className="dot" />
                <b>{o.id}</b>
                <div>
                  <strong>{o.title}</strong>
                  <small>{o.text}</small>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <div
            style={{
              position: "absolute",
              left: 18,
              right: 18,
              top: 36,
              bottom: 18,
              overflowY: "auto",
              zIndex: 1,
              display: "flex",
              flexDirection: "column",
              gap: 10,
              paddingRight: 6,
            }}
          >
            {resolvedParts.map((item, index) => {
              const mp = item.marketPart;
              const affordable = mp ? canAfford(mp.price) : false;

              return (
                <div
                  key={index}
                  style={{
                    display: "grid",
                    gridTemplateColumns: "auto 1fr auto auto",
                    alignItems: "center",
                    gap: 14,
                    padding: "10px 14px",
                    background: item.owned
                      ? "rgba(10, 40, 25, 0.85)"
                      : "rgba(11, 26, 64, 0.85)",
                    border: `2px solid ${item.owned ? "#22c55e" : "#1b5fb3"}`,
                    clipPath:
                      "polygon(6px 0,calc(100% - 6px) 0,100% 6px,100% calc(100% - 6px),calc(100% - 6px) 100%,6px 100%,0 calc(100% - 6px),0 6px)",
                    boxShadow: item.owned ? "inset 0 0 10px rgba(34, 197, 94, 0.2)" : "none",
                  }}
                >
                  <span style={{ fontSize: 28 }}>{item.icon}</span>
                  <div>
                    <div style={{ fontSize: 13, color: "var(--cyan)", fontWeight: 600 }}>
                      {item.slot}
                    </div>
                    <div
                      style={{
                        fontSize: 16,
                        fontWeight: 700,
                        color: item.owned ? "#86efac" : "#eaf2ff",
                      }}
                    >
                      {item.name}
                    </div>
                  </div>

                  {mp && (
                    <div
                      style={{
                        fontSize: 16,
                        fontWeight: 700,
                        color: item.owned ? "#86efac" : "var(--gold)",
                        textAlign: "right",
                        minWidth: 70,
                      }}
                    >
                      💰 {fmt(mp.price)}
                    </div>
                  )}

                  <div>
                    {item.owned ? (
                      <button
                        disabled
                        style={{
                          background: "linear-gradient(#15803d,#064e3b)",
                          border: "2px solid #22c55e",
                          color: "#86efac",
                          fontWeight: 700,
                          fontSize: 13,
                          padding: "6px 14px",
                          clipPath:
                            "polygon(4px 0,calc(100% - 4px) 0,100% 4px,100% calc(100% - 4px),calc(100% - 4px) 100%,4px 100%,0 calc(100% - 4px),0 4px)",
                          fontFamily: "inherit",
                          cursor: "default",
                        }}
                      >
                        ✓ READY
                      </button>
                    ) : mp ? (
                      <button
                        onClick={() => handleBuy(mp)}
                        disabled={!affordable}
                        style={{
                          background: affordable
                            ? "linear-gradient(#ffe45c,#f0a010)"
                            : "#1e293b",
                          border: `2px solid ${affordable ? "#fff0a0" : "#475569"}`,
                          color: affordable ? "#2a1600" : "#94a3b8",
                          fontWeight: 700,
                          fontSize: 13,
                          padding: "6px 16px",
                          cursor: affordable ? "pointer" : "not-allowed",
                          clipPath:
                            "polygon(4px 0,calc(100% - 4px) 0,100% 4px,100% calc(100% - 4px),calc(100% - 4px) 100%,4px 100%,0 calc(100% - 4px),0 4px)",
                          fontFamily: "inherit",
                          boxShadow: affordable ? "0 0 10px rgba(255, 210, 31, 0.5)" : "none",
                        }}
                      >
                        {affordable ? "Buy" : "Need Funds"}
                      </button>
                    ) : (
                      <button
                        onClick={() => go("market")}
                        style={{
                          background: "linear-gradient(#0d3a7a,#082060)",
                          border: "2px solid var(--neon)",
                          color: "var(--cyan)",
                          fontWeight: 700,
                          fontSize: 12,
                          padding: "6px 12px",
                          cursor: "pointer",
                          fontFamily: "inherit",
                        }}
                      >
                        Find in Market
                      </button>
                    )}
                  </div>
                </div>
              );
            })}

            {/* Assembly readiness summary banner */}
            <div
              style={{
                marginTop: 6,
                padding: "10px 14px",
                background: allOwned ? "rgba(34, 197, 94, 0.2)" : "rgba(43, 184, 255, 0.15)",
                border: `2px solid ${allOwned ? "#22c55e" : "var(--neon)"}`,
                borderRadius: 6,
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <span
                style={{
                  fontWeight: 700,
                  fontSize: 14,
                  color: allOwned ? "#86efac" : "var(--cyan)",
                }}
              >
                {allOwned
                  ? "🚀 All Spacecraft Hardware Assembled & Verified!"
                  : `⚠️ Spacecraft Assembly: ${ownedCount} / ${resolvedParts.length} Parts Installed`}
              </span>
              <button
                onClick={() => go("market")}
                style={{
                  background: "linear-gradient(#0d3a7a,#082060)",
                  border: "1px solid var(--neon)",
                  color: "#fff",
                  fontSize: 12,
                  fontWeight: 700,
                  padding: "4px 10px",
                  cursor: "pointer",
                  borderRadius: 4,
                  fontFamily: "inherit",
                }}
              >
                Open Market Store ›
              </button>
            </div>
          </div>
        )}
      </Panel>

      {/* Start Mission Button */}
      <Btn
        gold
        x={478}
        y={698}
        w={500}
        h={88}
        icon={<Img src="/assets/sprites/ui/rocket.jpg" size={62} />}
        chevron={false}
        onClick={start}
      >
        START MISSION
      </Btn>

      {/* Dashboard Nav */}
      <Btn
        x={17}
        y={724}
        w={282}
        h={82}
        icon={<Img src="/assets/sprites/ui/home.jpg" size={50} />}
        onClick={() => go("home")}
      >
        Dashboard
      </Btn>

      {/* Market Nav Button — now active! */}
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
