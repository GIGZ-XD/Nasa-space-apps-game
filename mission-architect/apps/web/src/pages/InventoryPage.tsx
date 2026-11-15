import { useState } from "react";
import { Screen, Panel, Btn, Coins, Img, Moonscape } from "../components/layout/ui";
import { ALL_MARKET_PARTS, MARKET_INTEL, MARKET_CATEGORIES, type MarketPart, type MarketIntel } from "../data/marketData";
import { useGameStore, formatCoins } from "../stores/gameStore";

type FilterTab = "all" | "hardware" | "intel";

export function InventoryPage({ go }: { go: (s: string) => void }) {
  const { ownedPartIds, ownedIntelIds } = useGameStore();
  const [filter, setFilter] = useState<FilterTab>("all");
  const [selectedIntel, setSelectedIntel] = useState<MarketIntel | null>(null);

  // Retrieve full objects for owned items
  const ownedParts: MarketPart[] = (ownedPartIds || [])
    .map((id) => ALL_MARKET_PARTS.find((p) => p.id === id))
    .filter((p): p is MarketPart => p !== undefined);

  const ownedIntels: MarketIntel[] = (ownedIntelIds || [])
    .map((id) => MARKET_INTEL.find((i) => i.id === id))
    .filter((i): i is MarketIntel => i !== undefined);

  // Calculate total inventory valuation
  const totalHardwareValue = ownedParts.reduce((acc, p) => acc + p.price, 0);
  const totalIntelValue = ownedIntels.reduce((acc, i) => acc + i.price, 0);
  const totalValuation = totalHardwareValue + totalIntelValue;

  // Helper to get category info for a part
  const getCategoryForPart = (partId: string) => {
    return MARKET_CATEGORIES.find((c) => c.parts.some((p) => p.id === partId));
  };

  const showHardware = filter === "all" || filter === "hardware";
  const showIntel = filter === "all" || filter === "intel";
  const isEmpty = ownedParts.length === 0 && ownedIntels.length === 0;

  return (
    <Screen>
      <Moonscape small />

      {/* Header Panel */}
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
            ★ HANGAR & INVENTORY ★
          </div>
          <div style={{ color: "var(--cyan)", fontSize: 12, marginTop: 2 }}>
            Acquired Hardware Components & Classified Intel Dossiers
          </div>
        </div>
      </Panel>
      <Coins />

      {/* Main Content Area */}
      <Panel x={18} y={84} w={1420} h={626}>
        <div
          style={{
            position: "absolute",
            inset: "16px 20px",
            zIndex: 1,
            display: "flex",
            flexDirection: "column",
            gap: 12,
          }}
        >
          {/* Top Controls: Filter Tabs + Stats Summary */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              borderBottom: "2px solid rgba(43, 184, 255, 0.25)",
              paddingBottom: 10,
            }}
          >
            {/* Filter Tabs */}
            <div style={{ display: "flex", gap: 10 }}>
              <button
                onClick={() => setFilter("all")}
                style={{
                  background: filter === "all" ? "linear-gradient(#0d3a7a, #082060)" : "rgba(8,18,44,0.6)",
                  border: `2px solid ${filter === "all" ? "var(--neon)" : "#1b3a6b"}`,
                  color: filter === "all" ? "#fff" : "#8ec5ff",
                  padding: "8px 18px",
                  fontSize: 13,
                  fontWeight: 700,
                  cursor: "pointer",
                  fontFamily: "inherit",
                  clipPath: "polygon(6px 0,calc(100% - 6px) 0,100% 6px,100% calc(100% - 6px),calc(100% - 6px) 100%,6px 100%,0 calc(100% - 6px),0 6px)",
                  boxShadow: filter === "all" ? "0 0 10px rgba(43, 184, 255, 0.5)" : "none",
                }}
              >
                ALL ITEMS ({ownedParts.length + ownedIntels.length})
              </button>
              <button
                onClick={() => setFilter("hardware")}
                style={{
                  background: filter === "hardware" ? "linear-gradient(#0d3a7a, #082060)" : "rgba(8,18,44,0.6)",
                  border: `2px solid ${filter === "hardware" ? "var(--neon)" : "#1b3a6b"}`,
                  color: filter === "hardware" ? "#fff" : "#8ec5ff",
                  padding: "8px 18px",
                  fontSize: 13,
                  fontWeight: 700,
                  cursor: "pointer",
                  fontFamily: "inherit",
                  clipPath: "polygon(6px 0,calc(100% - 6px) 0,100% 6px,100% calc(100% - 6px),calc(100% - 6px) 100%,6px 100%,0 calc(100% - 6px),0 6px)",
                  boxShadow: filter === "hardware" ? "0 0 10px rgba(43, 184, 255, 0.5)" : "none",
                }}
              >
                🚀 HARDWARE COMPONENTS ({ownedParts.length})
              </button>
              <button
                onClick={() => setFilter("intel")}
                style={{
                  background: filter === "intel" ? "linear-gradient(#0d3a7a, #082060)" : "rgba(8,18,44,0.6)",
                  border: `2px solid ${filter === "intel" ? "var(--neon)" : "#1b3a6b"}`,
                  color: filter === "intel" ? "#fff" : "#8ec5ff",
                  padding: "8px 18px",
                  fontSize: 13,
                  fontWeight: 700,
                  cursor: "pointer",
                  fontFamily: "inherit",
                  clipPath: "polygon(6px 0,calc(100% - 6px) 0,100% 6px,100% calc(100% - 6px),calc(100% - 6px) 100%,6px 100%,0 calc(100% - 6px),0 6px)",
                  boxShadow: filter === "intel" ? "0 0 10px rgba(43, 184, 255, 0.5)" : "none",
                }}
              >
                📁 CLASSIFIED INTEL ({ownedIntels.length})
              </button>
            </div>

            {/* Quick Stats Pill */}
            <div style={{ display: "flex", gap: 18, alignItems: "center" }}>
              <div style={{ fontSize: 13, color: "#8ec5ff" }}>
                Total Valuation:{" "}
                <span style={{ color: "var(--gold)", fontWeight: 700, fontSize: 16 }}>
                  ${formatCoins(totalValuation)}
                </span>
              </div>
            </div>
          </div>

          {/* Empty State */}
          {isEmpty && (
            <div
              style={{
                flex: 1,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                gap: 16,
              }}
            >
              <div style={{ fontSize: 64, filter: "drop-shadow(0 0 16px rgba(43, 184, 255, 0.5))" }}>
                🛰️
              </div>
              <div
                className="px"
                style={{
                  color: "#8ec5ff",
                  fontSize: 18,
                  letterSpacing: 2,
                  textAlign: "center",
                }}
              >
                NO HARDWARE OR INTEL IN INVENTORY
              </div>
              <div
                style={{
                  color: "#6c88b5",
                  fontSize: 15,
                  maxWidth: 540,
                  textAlign: "center",
                  lineHeight: 1.5,
                }}
              >
                Your hangar is currently empty. Visit the Space Parts Market to acquire rocket boosters,
                scientific payloads, landers, and classified mission telemetry.
              </div>
              <button
                onClick={() => go("market")}
                style={{
                  marginTop: 8,
                  background: "linear-gradient(#ffe45c, #f0a010)",
                  border: "2px solid #fff0a0",
                  color: "#2a1600",
                  fontWeight: 700,
                  fontSize: 15,
                  padding: "10px 28px",
                  cursor: "pointer",
                  clipPath: "polygon(8px 0,calc(100% - 8px) 0,100% 8px,100% calc(100% - 8px),calc(100% - 8px) 100%,8px 100%,0 calc(100% - 8px),0 8px)",
                  boxShadow: "0 0 16px rgba(255, 210, 31, 0.6)",
                  fontFamily: "inherit",
                }}
              >
                VISIT MARKET NOW ›
              </button>
            </div>
          )}

          {/* Items List */}
          {!isEmpty && (
            <div
              style={{
                flex: 1,
                overflowY: "auto",
                paddingRight: 6,
                display: "flex",
                flexDirection: "column",
                gap: 10,
              }}
            >
              {/* Hardware Section */}
              {showHardware && ownedParts.length > 0 && (
                <div>
                  <div
                    style={{
                      fontSize: 14,
                      fontWeight: 700,
                      color: "var(--cyan)",
                      marginBottom: 8,
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                    }}
                  >
                    <span>🚀</span>
                    <span>HARDWARE COMPONENTS ({ownedParts.length})</span>
                  </div>

                  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    {ownedParts.map((part) => {
                      const cat = getCategoryForPart(part.id);
                      return (
                        <div
                          key={part.id}
                          style={{
                            display: "grid",
                            gridTemplateColumns: "84px 1.4fr 2fr auto auto",
                            alignItems: "center",
                            gap: 16,
                            padding: "10px 16px",
                            background: "rgba(10, 40, 25, 0.75)",
                            border: "2px solid #22c55e",
                            clipPath: "polygon(8px 0,calc(100% - 8px) 0,100% 8px,100% calc(100% - 8px),calc(100% - 8px) 100%,8px 100%,0 calc(100% - 8px),0 8px)",
                            boxShadow: "inset 0 0 12px rgba(34, 197, 94, 0.15)",
                          }}
                        >
                          {/* Part Image */}
                          <div
                            style={{
                              width: 80,
                              height: 72,
                              background: "rgba(6, 16, 44, 0.85)",
                              border: "2px solid rgba(34, 197, 94, 0.4)",
                              borderRadius: 4,
                              display: "grid",
                              placeItems: "center",
                              overflow: "hidden",
                            }}
                          >
                            {part.img ? (
                              <img
                                src={part.img}
                                alt={part.name}
                                style={{
                                  maxWidth: 74,
                                  maxHeight: 68,
                                  objectFit: "contain",
                                  imageRendering: "pixelated",
                                }}
                              />
                            ) : (
                              <span style={{ fontSize: 32 }}>{cat?.emoji || "⚙️"}</span>
                            )}
                          </div>

                          {/* Name & Category */}
                          <div>
                            <div
                              style={{
                                fontSize: 11,
                                color: "#86efac",
                                fontWeight: 700,
                                textTransform: "uppercase",
                                letterSpacing: 1,
                                marginBottom: 2,
                              }}
                            >
                              {cat ? `${cat.emoji} ${cat.name}` : "SPACECRAFT HARDWARE"}
                            </div>
                            <div style={{ fontWeight: 700, fontSize: 16, color: "#f0fdf4" }}>
                              {part.name}
                            </div>
                          </div>

                          {/* Description */}
                          <div style={{ fontSize: 13, color: "#bbf7d0", lineHeight: 1.4 }}>
                            {part.desc}
                          </div>

                          {/* Value */}
                          <div style={{ textAlign: "right", whiteSpace: "nowrap" }}>
                            <div style={{ fontSize: 11, color: "#86efac" }}>Valuation</div>
                            <div style={{ fontWeight: 700, fontSize: 16, color: "var(--gold)" }}>
                              ${formatCoins(part.price)}
                            </div>
                          </div>

                          {/* Status Badge */}
                          <div
                            style={{
                              background: "rgba(34, 197, 94, 0.2)",
                              border: "1px solid #22c55e",
                              color: "#86efac",
                              fontSize: 12,
                              fontWeight: 700,
                              padding: "6px 12px",
                              borderRadius: 4,
                              whiteSpace: "nowrap",
                            }}
                          >
                            ✓ IN HANGAR
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Intel Section */}
              {showIntel && ownedIntels.length > 0 && (
                <div style={{ marginTop: showHardware && ownedParts.length > 0 ? 14 : 0 }}>
                  <div
                    style={{
                      fontSize: 14,
                      fontWeight: 700,
                      color: "var(--gold)",
                      marginBottom: 8,
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                    }}
                  >
                    <span>📁</span>
                    <span>CLASSIFIED INTEL DOSSIERS ({ownedIntels.length})</span>
                  </div>

                  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    {ownedIntels.map((intel) => (
                      <div
                        key={intel.id}
                        style={{
                          display: "grid",
                          gridTemplateColumns: "84px 1.4fr 2fr auto auto",
                          alignItems: "center",
                          gap: 16,
                          padding: "10px 16px",
                          background: "rgba(20, 24, 60, 0.8)",
                          border: "2px solid #38bdf8",
                          clipPath: "polygon(8px 0,calc(100% - 8px) 0,100% 8px,100% calc(100% - 8px),calc(100% - 8px) 100%,8px 100%,0 calc(100% - 8px),0 8px)",
                          boxShadow: "inset 0 0 12px rgba(56, 189, 248, 0.15)",
                        }}
                      >
                        {/* Intel Icon */}
                        <div
                          style={{
                            width: 80,
                            height: 72,
                            background: "rgba(6, 16, 44, 0.85)",
                            border: "2px solid rgba(56, 189, 248, 0.4)",
                            borderRadius: 4,
                            display: "grid",
                            placeItems: "center",
                            fontSize: 36,
                          }}
                        >
                          {intel.icon}
                        </div>

                        {/* Title & Badge */}
                        <div>
                          <div style={{ display: "flex", gap: 6, alignItems: "center", marginBottom: 2 }}>
                            <span
                              style={{
                                fontSize: 10,
                                fontWeight: 700,
                                background: "rgba(239, 68, 68, 0.25)",
                                border: "1px solid #ef4444",
                                color: "#fca5a5",
                                padding: "1px 6px",
                                borderRadius: 3,
                              }}
                            >
                              {intel.badge}
                            </span>
                            <span style={{ fontSize: 11, color: "var(--cyan)", fontWeight: 600 }}>
                              {intel.category.toUpperCase()} INTEL
                            </span>
                          </div>
                          <div style={{ fontWeight: 700, fontSize: 15, color: "#f0f9ff" }}>
                            {intel.title}
                          </div>
                        </div>

                        {/* Summary */}
                        <div style={{ fontSize: 13, color: "#bae6fd", lineHeight: 1.4 }}>
                          {intel.summary}
                        </div>

                        {/* Valuation */}
                        <div style={{ textAlign: "right", whiteSpace: "nowrap" }}>
                          <div style={{ fontSize: 11, color: "#7dd3fc" }}>Value</div>
                          <div style={{ fontWeight: 700, fontSize: 16, color: "var(--gold)" }}>
                            ${formatCoins(intel.price)}
                          </div>
                        </div>

                        {/* Read Dossier Button */}
                        <button
                          onClick={() => setSelectedIntel(intel)}
                          style={{
                            background: "linear-gradient(#0284c7, #0369a1)",
                            border: "2px solid #38bdf8",
                            color: "#fff",
                            fontWeight: 700,
                            fontSize: 12,
                            padding: "8px 14px",
                            cursor: "pointer",
                            fontFamily: "inherit",
                            clipPath: "polygon(6px 0,calc(100% - 6px) 0,100% 6px,100% calc(100% - 6px),calc(100% - 6px) 100%,6px 100%,0 calc(100% - 6px),0 6px)",
                            whiteSpace: "nowrap",
                            boxShadow: "0 0 10px rgba(56, 189, 248, 0.4)",
                          }}
                        >
                          OPEN DOSSIER 👁️
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </Panel>

      {/* Classified Intel Dossier Modal */}
      {selectedIntel && (
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: "rgba(2, 6, 23, 0.85)",
            backdropFilter: "blur(4px)",
            display: "grid",
            placeItems: "center",
            zIndex: 100,
          }}
          onClick={() => setSelectedIntel(null)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              width: 720,
              maxWidth: "92%",
              background: "linear-gradient(#0b1a40, #061030)",
              border: "3px solid var(--neon)",
              borderRadius: 8,
              padding: 24,
              boxShadow: "0 0 30px rgba(43, 184, 255, 0.6)",
              position: "relative",
            }}
          >
            {/* Modal Header */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
              <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                <span style={{ fontSize: 40 }}>{selectedIntel.icon}</span>
                <div>
                  <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 4 }}>
                    <span
                      style={{
                        fontSize: 11,
                        fontWeight: 700,
                        background: "rgba(239, 68, 68, 0.3)",
                        border: "1px solid #ef4444",
                        color: "#fca5a5",
                        padding: "2px 8px",
                        borderRadius: 4,
                      }}
                    >
                      {selectedIntel.badge}
                    </span>
                    <span style={{ fontSize: 13, color: "var(--cyan)", fontWeight: 600 }}>
                      SPACE COMMAND INTELLIGENCE REPORT
                    </span>
                  </div>
                  <h3 style={{ margin: 0, color: "#fff", fontSize: 20, fontWeight: 700 }}>
                    {selectedIntel.title}
                  </h3>
                </div>
              </div>
              <button
                onClick={() => setSelectedIntel(null)}
                style={{
                  background: "transparent",
                  border: "none",
                  color: "#94a3b8",
                  fontSize: 24,
                  cursor: "pointer",
                }}
              >
                ✕
              </button>
            </div>

            {/* Dossier Content */}
            <div
              style={{
                background: "rgba(2, 6, 23, 0.75)",
                border: "1px solid rgba(56, 189, 248, 0.3)",
                padding: 16,
                borderRadius: 6,
                fontFamily: "monospace",
                color: "#7dd3fc",
                fontSize: 14,
                lineHeight: 1.6,
                whiteSpace: "pre-line",
                maxHeight: 280,
                overflowY: "auto",
                marginBottom: 20,
              }}
            >
              {selectedIntel.dossier}
            </div>

            {/* Footer */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontSize: 12, color: "#64748b" }}>
                Security Clearance Level: {selectedIntel.unlockLevel} · Classified NASA Deep-Space Telemetry
              </span>
              <button
                onClick={() => setSelectedIntel(null)}
                style={{
                  background: "linear-gradient(#0284c7, #0369a1)",
                  border: "2px solid #38bdf8",
                  color: "#fff",
                  fontWeight: 700,
                  fontSize: 13,
                  padding: "8px 20px",
                  cursor: "pointer",
                  fontFamily: "inherit",
                  borderRadius: 4,
                }}
              >
                CLOSE DOSSIER
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bottom Navigation */}
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

      <Btn
        x={315}
        y={724}
        w={270}
        h={82}
        icon={<Img src="/assets/sprites/ui/rocket.jpg" size={56} />}
        onClick={() => go("select")}
      >
        Missions
      </Btn>

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
