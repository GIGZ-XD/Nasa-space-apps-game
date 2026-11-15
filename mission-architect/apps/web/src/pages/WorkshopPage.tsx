import { useState } from "react";
import { Btn, Coins, Img, Moonscape, Panel, Screen } from "../components/layout/ui";
import { ALL_MARKET_PARTS, MARKET_CATEGORIES, type MarketPart } from "../data/marketData";
import type { Mission } from "../data/missions";
import { useGameStore } from "../stores/gameStore";

const REQUIRED = new Set(["launchpad", "vehicle", "satellite", "sensors"]);
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
  const installedIds = useGameStore((s) => s.installedParts) || {};
  const setInstalledPart = useGameStore((s) => s.setInstalledPart);
  // Resolve saved ids to parts, ignoring any the player no longer owns
  const installed: Record<string, MarketPart | undefined> = {};
  for (const [catId, partId] of Object.entries(installedIds)) {
    if (ownedPartIds.includes(partId)) installed[catId] = ALL_MARKET_PARTS.find((p) => p.id === partId);
  }

  const category = MARKET_CATEGORIES.find((c) => c.id === selected) ?? MARKET_CATEGORIES[0];
  const ownedInCategory = category.parts.filter((p) => ownedPartIds.includes(p.id));
  const missing = MARKET_CATEGORIES.filter((c) => REQUIRED.has(c.id) && !installed[c.id]);
  const ready = missing.length === 0;

  const toggle = (part: MarketPart) =>
    setInstalledPart(category.id, installed[category.id]?.id === part.id ? null : part.id);

  // Bottom-to-top assembly order for the build bay
  const stack = ["launchpad", "vehicle", "satellite", "sensors", "lander"];

  return (
    <Screen>
      <Moonscape small />

      <Panel x={462} y={12} w={532} h={64}>
        <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", zIndex: 1 }}>
          <div className="px sprite-title" style={{ color: "var(--gold)", fontWeight: 700, fontSize: 22, letterSpacing: 2, textShadow: "0 0 10px rgba(255, 210, 31, 0.6)" }}>
            ★ WORKSHOP ★
          </div>
          <div style={{ color: "var(--cyan)", fontSize: 12, marginTop: 2 }}>
            Mission {mission.id}: {mission.name}
          </div>
        </div>
      </Panel>
      <Coins />

      {/* Slots */}
      <Panel x={18} y={84} w={330} h={600} tab={<>◎ Spacecraft Slots</>}>
        <div style={{ position: "absolute", left: 16, right: 16, top: 40, bottom: 14, zIndex: 1, display: "flex", flexDirection: "column", gap: 10 }}>
          {MARKET_CATEGORIES.map((c) => {
            const part = installed[c.id];
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
                  background: part ? "rgba(10, 40, 25, 0.85)" : active ? "linear-gradient(#0d3a7a,#082060)" : "rgba(8,18,44,0.7)",
                  border: `2px solid ${part ? "#22c55e" : active ? "var(--neon)" : "#1b3a6b"}`,
                }}
              >
                <span style={{ fontSize: 26 }}>{c.emoji}</span>
                <span style={{ minWidth: 0 }}>
                  <div style={{ fontSize: 12, color: "var(--cyan)", fontWeight: 700 }}>
                    {c.name}
                    {REQUIRED.has(c.id) ? " *" : ""}
                  </div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: part ? "#86efac" : "#6c88b5", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {part ? part.name : "Empty"}
                  </div>
                </span>
              </button>
            );
          })}
        </div>
      </Panel>

      {/* Build bay */}
      <Panel x={366} y={84} w={540} h={600} tab={<>🛠️ Assembly Bay</>}>
        <div style={{ position: "absolute", left: 20, right: 20, top: 44, bottom: 70, zIndex: 1, display: "flex", flexDirection: "column-reverse", alignItems: "center", justifyContent: "flex-start", gap: 8 }}>
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
                  <img className="pix" src={part.img} alt={part.name} style={{ maxHeight: "86%", maxWidth: 110, objectFit: "contain" }} />
                ) : (
                  <span style={{ fontSize: 30, opacity: part ? 1 : 0.35 }}>{cat.emoji}</span>
                )}
                <span style={{ fontSize: 13, color: part ? "#86efac" : "#6c88b5", fontWeight: 700, maxWidth: 300 }}>
                  {part ? part.name : `${cat.name} slot empty`}
                </span>
              </div>
            );
          })}
        </div>
        <div style={{ position: "absolute", left: 20, right: 20, bottom: 14, zIndex: 1, textAlign: "center", fontWeight: 700, fontSize: 14, color: ready ? "#86efac" : "var(--cyan)" }}>
          {ready
            ? "🚀 Spacecraft assembled — ready for the launchpad!"
            : `⚠️ Still needed: ${missing.map((c) => c.name).join(", ")}`}
        </div>
      </Panel>

      {/* Inventory picker */}
      <Panel x={924} y={84} w={514} h={600} tab={<>{category.emoji} Inventory — {category.name}</>}>
        <div style={{ position: "absolute", left: 16, right: 16, top: 40, bottom: 14, zIndex: 1, overflowY: "auto", display: "flex", flexDirection: "column", gap: 10, paddingRight: 4 }}>
          {ownedInCategory.length === 0 ? (
            <div style={{ margin: "auto", textAlign: "center", color: "#6c88b5", fontSize: 15, lineHeight: 1.5 }}>
              You don't own any {category.name.toLowerCase()} parts yet.
              <br />
              <button
                onClick={() => go("market")}
                style={{ marginTop: 14, background: "linear-gradient(#0d3a7a,#082060)", border: "2px solid var(--neon)", color: "var(--cyan)", fontWeight: 700, fontSize: 13, padding: "8px 16px", cursor: "pointer", fontFamily: "inherit" }}
              >
                Buy in Market ›
              </button>
            </div>
          ) : (
            ownedInCategory.map((part) => {
              const on = installed[category.id]?.id === part.id;
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
                  {part.img ? <img className="pix" src={part.img} alt="" style={{ width: 64, height: 64, objectFit: "contain" }} /> : <span style={{ fontSize: 30 }}>{category.emoji}</span>}
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: on ? "#86efac" : "#eaf2ff" }}>{part.name}</div>
                    <div style={{ fontSize: 12, color: "#8ec5ff" }}>{part.desc}</div>
                  </div>
                  <button
                    onClick={() => toggle(part)}
                    style={{
                      background: on ? "linear-gradient(#7f1d1d,#450a0a)" : "linear-gradient(#ffe45c,#f0a010)",
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

      <Btn x={17} y={724} w={282} h={82} icon={<Img src="/assets/sprites/ui/home.jpg" size={50} />} onClick={() => go("brief")}>
        Brief
      </Btn>

      <div style={{ opacity: ready ? 1 : 0.45, pointerEvents: ready ? "auto" : "none" }}>
        <Btn gold x={478} y={698} w={500} h={88} icon={<Img src="/assets/sprites/ui/rocket.jpg" size={62} />} chevron={false} onClick={launch}>
          GO TO LAUNCHPAD
        </Btn>
      </div>

      <Btn x={1214} y={724} w={230} h={82} icon={<Img src="/assets/sprites/ui/market.jpg" size={50} />} chevron={false} onClick={() => go("market")}>
        Market
      </Btn>
    </Screen>
  );
}
