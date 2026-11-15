import { useState } from "react";
import { Screen, Panel, Btn, Coins, Img, Moonscape } from "../components/layout/ui";
import { MARKET_CATEGORIES, type MarketCategory, type MarketPart } from "../data/marketData";
import { useGameStore, formatCoins } from "../stores/gameStore";

function fmt(n: number): string {
  if (n >= 1_000_000) {
    const v = n / 1_000_000;
    return (v % 1 === 0 ? v.toFixed(0) : v.toFixed(1)) + "M";
  }
  return (n / 1_000).toFixed(0) + "K";
}

function CategoryCard({
  cat,
  idx,
  onView,
  playerLevel,
}: {
  cat: MarketCategory;
  idx: number;
  onView: () => void;
  playerLevel: number;
}) {
  const { isPartOwned } = useGameStore();
  const unlocked = playerLevel >= cat.unlockLevel;
  const ownedCount = cat.parts.filter((p) => isPartOwned(p.id)).length;

  const topRow = idx < 3;
  const col = topRow ? idx : idx - 3;
  const colCount = topRow ? 3 : 2;
  const cardW = 238;
  const cardH = 180;
  const gapX = 14;
  const totalW = colCount * cardW + (colCount - 1) * gapX;
  const startX = topRow ? 18 : 18 + (3 * cardW + 2 * gapX - totalW) / 2;
  const x = startX + col * (cardW + gapX);
  const y = topRow ? 60 : 254;

  return (
    <div
      style={{
        position: "absolute",
        left: x,
        top: y,
        width: cardW,
        height: cardH,
        opacity: unlocked ? 1 : 0.55,
        filter: unlocked ? "none" : "grayscale(0.5)",
        cursor: unlocked ? "pointer" : "default",
      }}
      onClick={unlocked ? onView : undefined}
    >
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: "linear-gradient(#0b1a40,#061030)",
          border: `3px solid ${unlocked ? "var(--neon)" : "#2a78c8"}`,
          clipPath:
            "polygon(12px 0,calc(100% - 12px) 0,100% 12px,100% calc(100% - 12px),calc(100% - 12px) 100%,12px 100%,0 calc(100% - 12px),0 12px)",
          boxShadow: unlocked
            ? "inset 0 0 18px rgba(43,184,255,.3), 0 0 7px rgba(43,184,255,.6)"
            : "none",
        }}
      />
      <div style={{ position: "absolute", inset: 0, padding: "10px 12px", zIndex: 1 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 4 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ fontSize: 22 }}>{cat.emoji}</span>
            <span style={{ fontWeight: 700, fontSize: 15, color: unlocked ? "#eaf2ff" : "#8899bb" }}>
              {cat.name}
            </span>
          </div>
          {ownedCount > 0 && (
            <span
              style={{
                fontSize: 11,
                fontWeight: 700,
                color: "#86efac",
                background: "rgba(34, 197, 94, 0.2)",
                border: "1px solid #22c55e",
                padding: "2px 6px",
                borderRadius: 4,
              }}
            >
              {ownedCount}/{cat.parts.length}
            </span>
          )}
        </div>
        <div style={{ fontSize: 13, color: unlocked ? "var(--gold)" : "#5566aa", marginBottom: 4 }}>
          {unlocked ? "✅" : "🔒"} {unlocked ? "Available" : `Unlocks at Level ${cat.unlockLevel}`}
        </div>
        <div
          style={{
            fontSize: 12,
            color: "var(--cyan)",
            marginBottom: 10,
            fontFamily: "'IBM Plex Sans', sans-serif",
          }}
        >
          💰 {cat.priceRange}
        </div>
        <button
          onClick={unlocked ? onView : undefined}
          disabled={!unlocked}
          style={{
            position: "absolute",
            bottom: 10,
            left: 12,
            right: 12,
            height: 32,
            background: unlocked ? "linear-gradient(#0d3a7a,#082060)" : "#0a1230",
            border: `2px solid ${unlocked ? "var(--neon)" : "#1b3a78"}`,
            color: unlocked ? "var(--cyan)" : "#334",
            fontWeight: 700,
            fontSize: 13,
            cursor: unlocked ? "pointer" : "default",
            clipPath:
              "polygon(6px 0,calc(100% - 6px) 0,100% 6px,100% calc(100% - 6px),calc(100% - 6px) 100%,6px 100%,0 calc(100% - 6px),0 6px)",
            fontFamily: "inherit",
          }}
        >
          View Parts ›
        </button>
      </div>
    </div>
  );
}

function PartsView({
  cat,
  onBack,
  playerLevel,
}: {
  cat: MarketCategory;
  onBack: () => void;
  playerLevel: number;
}) {
  const { isPartOwned, canAfford, buyPart } = useGameStore();
  const [toast, setToast] = useState<string | null>(null);

  const handleBuy = (part: MarketPart) => {
    const result = buyPart(part);
    if (result.success) {
      setToast(`🎉 Acquired ${part.name} for $${fmt(part.price)}!`);
      setTimeout(() => setToast(null), 3500);
    } else {
      setToast(`❌ ${result.reason || "Purchase failed!"}`);
      setTimeout(() => setToast(null), 3500);
    }
  };

  return (
    <Screen>
      <Moonscape small />
      {/* Header */}
      <Panel x={462} y={16} w={532} h={64}>
        <div
          style={{
            position: "absolute",
            inset: 0,
            display: "grid",
            placeItems: "center",
            zIndex: 1,
          }}
        >
          <span style={{ color: "var(--gold)", fontWeight: 700, fontSize: 24 }}>
            {cat.emoji} {cat.name.toUpperCase()} — PARTS CATALOGUE
          </span>
        </div>
      </Panel>
      <Coins />

      {/* Toast Notification Banner */}
      {toast && (
        <div
          style={{
            position: "absolute",
            top: 84,
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

      {/* Parts list panel */}
      <Panel x={18} y={96} w={1420} h={614}>
        <div
          style={{
            position: "absolute",
            inset: "14px 14px",
            overflowY: "auto",
            zIndex: 1,
            paddingRight: 4,
          }}
        >
          {cat.parts.map((part) => {
            const partUnlocked = playerLevel >= part.unlockLevel;
            const owned = isPartOwned(part.id);
            const affordable = canAfford(part.price);

            return (
              <div
                key={part.id}
                style={{
                  display: "grid",
                  gridTemplateColumns: "1.2fr 2fr auto auto",
                  alignItems: "center",
                  gap: 20,
                  padding: "12px 16px",
                  marginBottom: 8,
                  background: owned
                    ? "rgba(10, 40, 25, 0.85)"
                    : partUnlocked
                    ? "rgba(11,26,64,0.9)"
                    : "rgba(8,14,30,0.7)",
                  border: `2px solid ${
                    owned ? "#22c55e" : partUnlocked ? "#1b5fb3" : "#0f2040"
                  }`,
                  clipPath:
                    "polygon(8px 0,calc(100% - 8px) 0,100% 8px,100% calc(100% - 8px),calc(100% - 8px) 100%,8px 100%,0 calc(100% - 8px),0 8px)",
                  opacity: partUnlocked ? 1 : 0.5,
                  filter: partUnlocked ? "none" : "grayscale(0.4)",
                  boxShadow: owned ? "inset 0 0 12px rgba(34, 197, 94, 0.2)" : "none",
                }}
              >
                <div>
                  <div
                    style={{
                      fontWeight: 700,
                      fontSize: 16,
                      color: owned ? "#86efac" : partUnlocked ? "#eaf2ff" : "#7788aa",
                      marginBottom: 2,
                    }}
                  >
                    {!partUnlocked ? "🔒 " : owned ? "✓ " : ""}
                    {part.name}
                  </div>
                  {!partUnlocked && (
                    <div style={{ fontSize: 12, color: "var(--gold)" }}>
                      Unlocks at Level {part.unlockLevel}
                    </div>
                  )}
                  {owned && (
                    <div style={{ fontSize: 12, color: "#4ade80", fontWeight: 600 }}>
                      Hardware ready in hangar
                    </div>
                  )}
                </div>
                <div style={{ fontSize: 14, color: "#b0c4e8", lineHeight: 1.4 }}>
                  {part.desc}
                </div>
                <div
                  style={{
                    fontWeight: 700,
                    fontSize: 18,
                    color: owned ? "#86efac" : "var(--gold)",
                    whiteSpace: "nowrap",
                    minWidth: 70,
                    textAlign: "right",
                  }}
                >
                  💰 {fmt(part.price)}
                </div>
                <div>
                  {!partUnlocked ? (
                    <div
                      style={{
                        width: 90,
                        height: 34,
                        background: "#0a1230",
                        border: "2px solid #1b3a78",
                        display: "grid",
                        placeItems: "center",
                        color: "#64748b",
                        fontSize: 12,
                        clipPath:
                          "polygon(6px 0,calc(100% - 6px) 0,100% 6px,100% calc(100% - 6px),calc(100% - 6px) 100%,6px 100%,0 calc(100% - 6px),0 6px)",
                      }}
                    >
                      LOCKED
                    </div>
                  ) : owned ? (
                    <button
                      disabled
                      style={{
                        background: "linear-gradient(#15803d,#064e3b)",
                        border: "2px solid #22c55e",
                        color: "#86efac",
                        fontWeight: 700,
                        fontSize: 14,
                        padding: "8px 18px",
                        clipPath:
                          "polygon(6px 0,calc(100% - 6px) 0,100% 6px,100% calc(100% - 6px),calc(100% - 6px) 100%,6px 100%,0 calc(100% - 6px),0 6px)",
                        fontFamily: "inherit",
                        cursor: "default",
                        boxShadow: "0 0 10px rgba(34, 197, 94, 0.4)",
                      }}
                    >
                      ✓ OWNED
                    </button>
                  ) : (
                    <button
                      onClick={() => handleBuy(part)}
                      disabled={!affordable}
                      style={{
                        background: affordable
                          ? "linear-gradient(#ffe45c,#f0a010)"
                          : "#1e293b",
                        border: `2px solid ${affordable ? "#fff0a0" : "#475569"}`,
                        color: affordable ? "#2a1600" : "#94a3b8",
                        fontWeight: 700,
                        fontSize: 14,
                        padding: "8px 22px",
                        cursor: affordable ? "pointer" : "not-allowed",
                        clipPath:
                          "polygon(6px 0,calc(100% - 6px) 0,100% 6px,100% calc(100% - 6px),calc(100% - 6px) 100%,6px 100%,0 calc(100% - 6px),0 6px)",
                        fontFamily: "inherit",
                        boxShadow: affordable ? "0 0 12px rgba(255, 210, 31, 0.6)" : "none",
                      }}
                    >
                      {affordable ? "Buy" : "Need Funds"}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </Panel>

      {/* Back button */}
      <Btn x={17} y={724} w={320} h={82} icon={<span style={{ fontSize: 32 }}>‹</span>} onClick={onBack}>
        Back to Market
      </Btn>
    </Screen>
  );
}

export function MarketPage({ go }: { go: (s: string) => void }) {
  const [activeCategory, setActiveCategory] = useState<MarketCategory | null>(null);
  const { level } = useGameStore();

  if (activeCategory) {
    return (
      <PartsView
        cat={activeCategory}
        onBack={() => setActiveCategory(null)}
        playerLevel={level}
      />
    );
  }

  const intelUnlocked = level >= 2;

  return (
    <Screen>
      <Moonscape />

      {/* Title header */}
      <Panel x={462} y={10} w={532} h={68}>
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
            style={{
              color: "var(--gold)",
              fontWeight: 700,
              fontSize: 28,
              textShadow: "2px 2px 0 #7a4a00",
            }}
          >
            ⭐ MARKET ⭐
          </div>
          <div style={{ color: "var(--cyan)", fontSize: 13 }}>
            Buy essential parts or valuable mission intel
          </div>
        </div>
      </Panel>
      <Coins />

      {/* Space Parts Store — left panel */}
      <Panel x={18} y={90} w={800} h={580}>
        <div
          style={{
            position: "absolute",
            inset: "16px 18px",
            zIndex: 1,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 4 }}>
            <span style={{ fontSize: 28 }}>🔧</span>
            <div>
              <div style={{ fontWeight: 700, fontSize: 22, color: "#eaf2ff" }}>
                SPACE PARTS STORE
              </div>
              <div style={{ fontSize: 13, color: "#8899cc" }}>
                Purchase spacecraft components and equipment
              </div>
            </div>
          </div>

          {/* Category cards container */}
          <div style={{ position: "relative", height: 460, marginTop: 8 }}>
            {MARKET_CATEGORIES.map((cat, idx) => (
              <CategoryCard
                key={cat.id}
                cat={cat}
                idx={idx}
                onView={() => setActiveCategory(cat)}
                playerLevel={level}
              />
            ))}
          </div>
        </div>
      </Panel>

      {/* Intel Market — right panel */}
      <Panel x={826} y={90} w={612} h={580}>
        <div
          style={{
            position: "absolute",
            inset: "16px 18px",
            zIndex: 1,
            display: "flex",
            flexDirection: "column",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
            <span style={{ fontSize: 28 }}>👥</span>
            <div>
              <div style={{ fontWeight: 700, fontSize: 22, color: "#eaf2ff" }}>
                INTEL MARKET
              </div>
              <div style={{ fontSize: 13, color: "#8899cc" }}>
                Buy or sell mission information
              </div>
            </div>
          </div>

          {!intelUnlocked && (
            <div
              style={{
                flex: 1,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                gap: 10,
                marginBottom: 20,
              }}
            >
              <div style={{ fontSize: 72 }}>🔒</div>
              <div
                style={{ fontWeight: 700, fontSize: 24, color: "#eaf2ff", textAlign: "center" }}
              >
                Market Locked
              </div>
              <div style={{ fontSize: 15, color: "#8899cc", textAlign: "center" }}>
                Reach Level 2 to unlock
              </div>
            </div>
          )}

          {/* Sell Intel row */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 14,
              padding: "14px 16px",
              background: intelUnlocked ? "rgba(11,26,64,0.9)" : "rgba(8,14,30,0.5)",
              border: `2px solid ${intelUnlocked ? "#1b5fb3" : "#0f2040"}`,
              marginBottom: 10,
              opacity: intelUnlocked ? 1 : 0.4,
              clipPath:
                "polygon(8px 0,calc(100% - 8px) 0,100% 8px,100% calc(100% - 8px),calc(100% - 8px) 100%,8px 100%,0 calc(100% - 8px),0 8px)",
            }}
          >
            <span style={{ fontSize: 32 }}>📋</span>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 700, fontSize: 17, color: "#eaf2ff" }}>SELL INTEL</div>
              <div style={{ fontSize: 13, color: "#8899cc" }}>
                Share your mission insights with other players and earn coins!
              </div>
            </div>
            {intelUnlocked && (
              <span style={{ color: "var(--gold)", fontSize: 20 }}>⭐</span>
            )}
          </div>

          {/* Buy Intel row */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 14,
              padding: "14px 16px",
              background: intelUnlocked ? "rgba(11,26,64,0.9)" : "rgba(8,14,30,0.5)",
              border: `2px solid ${intelUnlocked ? "#1b5fb3" : "#0f2040"}`,
              marginBottom: 10,
              opacity: intelUnlocked ? 1 : 0.4,
              clipPath:
                "polygon(8px 0,calc(100% - 8px) 0,100% 8px,100% calc(100% - 8px),calc(100% - 8px) 100%,8px 100%,0 calc(100% - 8px),0 8px)",
            }}
          >
            <span style={{ fontSize: 32 }}>🛒</span>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 700, fontSize: 17, color: "#eaf2ff" }}>BUY INTEL</div>
              <div style={{ fontSize: 13, color: "#8899cc" }}>
                Purchase valuable mission information from other players.
              </div>
            </div>
            {intelUnlocked && (
              <button
                style={{
                  background: "linear-gradient(#0d3a7a,#082060)",
                  border: "2px solid var(--neon)",
                  color: "var(--cyan)",
                  fontWeight: 700,
                  fontSize: 13,
                  padding: "6px 14px",
                  cursor: "pointer",
                  fontFamily: "inherit",
                  clipPath:
                    "polygon(6px 0,calc(100% - 6px) 0,100% 6px,100% calc(100% - 6px),calc(100% - 6px) 100%,6px 100%,0 calc(100% - 6px),0 6px)",
                }}
              >
                Browse Intel ›
              </button>
            )}
          </div>
        </div>
      </Panel>

      {/* Bottom nav */}
      <Btn
        x={12}
        y={724}
        w={290}
        h={82}
        icon={<Img src="/assets/sprites/ui/home.jpg" size={50} />}
        onClick={() => go("home")}
      >
        Dashboard
      </Btn>
      <Btn
        x={1222}
        y={724}
        w={222}
        h={82}
        icon={<Img src="/assets/sprites/ui/market.jpg" size={50} />}
        chevron={false}
        gold
      >
        Market
      </Btn>
    </Screen>
  );
}
