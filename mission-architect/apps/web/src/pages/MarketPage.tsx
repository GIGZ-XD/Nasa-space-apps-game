import { useState } from "react";
import { Screen, Panel, Btn, Coins, Img, Moonscape } from "../components/layout/ui";
import { MARKET_CATEGORIES, type MarketCategory } from "../data/marketData";
import { PLAYER } from "../data/missions";

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
}: {
  cat: MarketCategory;
  idx: number;
  onView: () => void;
}) {
  const unlocked = PLAYER.level >= cat.unlockLevel;
  // 3-column top row (idx 0,1,2), 2-column bottom row (idx 3,4) centered
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
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
          <span style={{ fontSize: 22 }}>{cat.emoji}</span>
          <span style={{ fontWeight: 700, fontSize: 15, color: unlocked ? "#eaf2ff" : "#8899bb" }}>
            {cat.name}
          </span>
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
}: {
  cat: MarketCategory;
  onBack: () => void;
}) {
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
          <span style={{ color: "var(--gold)", fontWeight: 700, fontSize: 26 }}>
            {cat.emoji} {cat.name.toUpperCase()} — PARTS CATALOGUE
          </span>
        </div>
      </Panel>
      <Coins />

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
            const partUnlocked = PLAYER.level >= part.unlockLevel;
            return (
              <div
                key={part.id}
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 2fr auto auto",
                  alignItems: "center",
                  gap: 20,
                  padding: "12px 16px",
                  marginBottom: 8,
                  background: partUnlocked ? "rgba(11,26,64,0.9)" : "rgba(8,14,30,0.7)",
                  border: `2px solid ${partUnlocked ? "#1b5fb3" : "#0f2040"}`,
                  clipPath:
                    "polygon(8px 0,calc(100% - 8px) 0,100% 8px,100% calc(100% - 8px),calc(100% - 8px) 100%,8px 100%,0 calc(100% - 8px),0 8px)",
                  opacity: partUnlocked ? 1 : 0.5,
                  filter: partUnlocked ? "none" : "grayscale(0.4)",
                }}
              >
                <div>
                  <div
                    style={{
                      fontWeight: 700,
                      fontSize: 16,
                      color: partUnlocked ? "#eaf2ff" : "#7788aa",
                      marginBottom: 2,
                    }}
                  >
                    {partUnlocked ? "" : "🔒 "}
                    {part.name}
                  </div>
                  {!partUnlocked && (
                    <div style={{ fontSize: 12, color: "var(--gold)" }}>
                      Unlocks at Level {part.unlockLevel}
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
                    color: "var(--gold)",
                    whiteSpace: "nowrap",
                    minWidth: 70,
                    textAlign: "right",
                  }}
                >
                  💰 {fmt(part.price)}
                </div>
                <div>
                  {partUnlocked ? (
                    <button
                      style={{
                        background: "linear-gradient(#ffe45c,#f0a010)",
                        border: "2px solid #fff0a0",
                        color: "#2a1600",
                        fontWeight: 700,
                        fontSize: 14,
                        padding: "6px 18px",
                        cursor: "pointer",
                        clipPath:
                          "polygon(6px 0,calc(100% - 6px) 0,100% 6px,100% calc(100% - 6px),calc(100% - 6px) 100%,6px 100%,0 calc(100% - 6px),0 6px)",
                        fontFamily: "inherit",
                      }}
                    >
                      Buy
                    </button>
                  ) : (
                    <div
                      style={{
                        width: 70,
                        height: 32,
                        background: "#0a1230",
                        border: "2px solid #1b3a78",
                        clipPath:
                          "polygon(6px 0,calc(100% - 6px) 0,100% 6px,100% calc(100% - 6px),calc(100% - 6px) 100%,6px 100%,0 calc(100% - 6px),0 6px)",
                      }}
                    />
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
      <Coins />
    </Screen>
  );
}

export function MarketPage({ go }: { go: (s: string) => void }) {
  const [activeCategory, setActiveCategory] = useState<MarketCategory | null>(null);

  if (activeCategory) {
    return <PartsView cat={activeCategory} onBack={() => setActiveCategory(null)} />;
  }

  const intelUnlocked = PLAYER.level >= 2;

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
