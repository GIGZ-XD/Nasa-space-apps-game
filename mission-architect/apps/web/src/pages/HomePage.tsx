import { useState } from "react";
import { Btn, Coins, Img, Moonscape, Panel, Screen } from "../components/layout/ui";
import { SettingsModal } from "../components/SettingsModal";
import { PLAYER } from "../data/missions";
import { useAuthStore } from "../stores/authStore";
import { useGameStore } from "../stores/gameStore";

export function HomePage({ go }: { go: (s: string) => void }) {
  const { user, isAuthenticated, logout } = useAuthStore();
  const { level, xp, xpMax } = useGameStore();
  const commanderName = isAuthenticated && user ? (user.callsign || user.username) : PLAYER.name;
  const [settingsOpen, setSettingsOpen] = useState(false);

  return (
    <Screen>
      <img className="pix abs" src="/assets/sprites/planets/mars.jpg" alt="Mars" style={{ left: 634, top: 114, width: 106, borderRadius: "50%" }} />
      <img className="pix abs" src="/assets/sprites/planets/earth.jpg" alt="Earth" style={{ left: 893, top: 88, width: 196, borderRadius: "50%", boxShadow: "0 0 26px #2bb8ff" }} />
      <Moonscape />

      {/* Commander Profile Card */}
      <Panel x={20} y={18} w={462} h={100}>
        <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", gap: 18, padding: "0 22px", zIndex: 1 }}>
          <Img src="/assets/sprites/ui/avatar.jpg" size={80} />
          <div style={{ flex: 1 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div style={{ color: "var(--cyan)", fontWeight: 700, fontSize: 24, maxWidth: 280, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {commanderName}
              </div>
            </div>
            <div style={{ fontSize: 18, color: "#a5b4fc" }}>Level {level}</div>
            <div style={{ display: "flex", gap: 14, alignItems: "center", marginTop: 4 }}>
              <div className="xp"><i style={{ width: `${Math.min(100, (xp / xpMax) * 100)}%` }} /></div>
              <span style={{ color: "var(--cyan)", fontSize: 18, fontWeight: 600 }}>{xp} / {xpMax} XP</span>
            </div>
          </div>
        </div>
      </Panel>

      {/* Coins + Settings Gear */}
      <div className="abs" style={{ right: 0, top: 0, display: "flex", alignItems: "center", gap: 8, zIndex: 5 }}>
        <Coins />
        <button
          onClick={() => setSettingsOpen(true)}
          className="abs"
          style={{
            left: 1434, top: 30, width: 50, height: 50,
            background: "none", border: "none", cursor: "pointer", padding: 0, zIndex: 6,
          }}
          title="Settings"
        >
          <Img src="/assets/sprites/ui/gear.jpg" size={46} />
        </button>
      </div>

      <Btn x={14} y={302} w={264} h={72} icon={<Img src="/assets/sprites/ui/trophy.jpg" size={50} />} onClick={() => go("leaderboard")}>Leaderboard</Btn>
      <Btn x={14} y={388} w={264} h={72} icon={<Img src="/assets/sprites/ui/book.jpg" size={50} />} onClick={() => go("tutorial")}>Tutorial</Btn>
      <img className="pix abs" src="/assets/sprites/ui/stella2.jpg" alt="STELLA" style={{ left: 1212, top: 172, width: 224, WebkitMaskImage: "radial-gradient(ellipse at 50% 50%,#000 70%,transparent 96%)", maskImage: "radial-gradient(ellipse at 50% 50%,#000 70%,transparent 96%)" }} />
      <Panel x={1176} y={392} w={262} h={136} className="bubble home-bubble">
        <div style={{ position: "absolute", inset: 0, padding: "18px 22px", fontWeight: 600, fontSize: 21, lineHeight: 1.3, zIndex: 1 }}>
          Hi! I'm <b className="hl">STELLA!</b><br />Need help? Check out the tutorial anytime!
        </div>
      </Panel>
      <Btn x={12} y={724} w={290} h={82} icon={<Img src="/assets/sprites/ui/rocket.jpg" size={56} />} onClick={() => go("select")}>Missions</Btn>
      <Btn x={1222} y={634} w={222} h={78} icon={<Img src="/assets/sprites/ui/gear.jpg" size={46} />} chevron={false} onClick={() => go("inventory")}>Inventory</Btn>
      <Btn x={1222} y={724} w={222} h={82} icon={<Img src="/assets/sprites/ui/market.jpg" size={50} />} chevron={false} onClick={() => go("market")}>Market</Btn>

      {/* Settings Modal */}
      <SettingsModal
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        onLogout={async () => {
          setSettingsOpen(false);
          await logout();
          go("login");
        }}
      />
    </Screen>
  );
}
