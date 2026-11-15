import { useState, useEffect } from "react";
import { PhaserGame } from "../game";
import { MISSIONS } from "../data/missions";
import { HomePage } from "../pages/HomePage";
import { MissionSelectPage } from "../pages/MissionSelectPage";
import { MissionBriefPage } from "../pages/MissionBriefPage";
import { LeaderboardPage } from "../pages/LeaderboardPage";
import { MarketPage } from "../pages/MarketPage";
import { WorkshopPage } from "../pages/WorkshopPage";
import { InventoryPage } from "../pages/InventoryPage";
import { ResultsPage } from "../pages/ResultsPage";
import { LoginPage } from "../pages/LoginPage";
import { DevHarness } from "./DevHarness";
import { useAuthStore } from "../stores/authStore";
import { useLOSStore } from "../stores/losStore";
import { Screen as StageScreen } from "../components/layout/ui";

type Screen = "home" | "select" | "brief" | "workshop" | "launch" | "results" | "leaderboard" | "market" | "inventory" | "login" | "signup";

export function App() {
  const { isAuthenticated, isInitialized, checkSession } = useAuthStore();

  useEffect(() => {
    checkSession();
  }, [checkSession]);

  const [screen, setScreen] = useState<Screen>(() => {
    const p = window.location.pathname.toLowerCase();
    if (p === "/signup" || p === "/register") return "signup";
    const s = new URLSearchParams(window.location.search).get("screen") as Screen;
    if (s === "signup" || s === "market") return s;
    return "login";
  });
  const [missionId, setMissionId] = useState(4);
  const [marketFromWorkshop, setMarketFromWorkshop] = useState(false);

  if (new URLSearchParams(window.location.search).has("dev")) return <DevHarness />;

  const go = (s: string) => {
    if (s === "market") setMarketFromWorkshop(screen === "workshop" || (screen === "market" && marketFromWorkshop));
    else if (s !== "inventory") setMarketFromWorkshop(false);
    setScreen(s as Screen);
    if (s === "login" || s === "signup") {
      window.history.pushState({}, "", `/${s}`);
    } else if (s === "home") {
      window.history.pushState({}, "", "/");
    }
  };

  if (!isInitialized) {
    return (
      <StageScreen>
        <div
          style={{
            position: "absolute",
            inset: 0,
            display: "grid",
            placeItems: "center",
            zIndex: 10,
          }}
        >
          <div
            style={{
              padding: "16px 32px",
              background: "rgba(6, 16, 44, 0.9)",
              border: "3px solid var(--neon, #2bb8ff)",
              borderRadius: 8,
              boxShadow: "0 0 20px rgba(43, 184, 255, 0.6)",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 12,
            }}
          >
            <span
              className="px"
              style={{
                color: "var(--cyan, #5fe3ff)",
                fontSize: 18,
                letterSpacing: 2,
                textShadow: "0 0 10px #2bb8ff",
              }}
            >
              INITIALIZING SPACE COMMAND LINK...
            </span>
            <span style={{ color: "#8ec5ff", fontSize: 15, fontFamily: "monospace" }}>
              Verifying security clearance...
            </span>
          </div>
        </div>
      </StageScreen>
    );
  }

  if (!isAuthenticated) {
    if (screen === "signup") {
      return <LoginPage go={go} initialMode="register" />;
    }
    return <LoginPage go={go} initialMode="login" />;
  }

  const mission = MISSIONS.find((m) => m.id === missionId) ?? MISSIONS[0];

  if (screen === "leaderboard") return <LeaderboardPage go={go} />;
  if (screen === "select") {
    return (
      <MissionSelectPage
        go={go}
        open={(id) => {
          setMissionId(id);
          setScreen("brief");
        }}
      />
    );
  }
  if (screen === "brief") {
    return (
      <MissionBriefPage
        mission={mission}
        go={go}
        start={() => setScreen("workshop")}
      />
    );
  }
  const evaluationResult = useLOSStore((s) => s.evaluationResult);

  if (screen === "workshop") {
    return <WorkshopPage mission={mission} go={go} launch={() => setScreen("launch")} />;
  }
  if (screen === "launch") {
    const outcome = evaluationResult ? (evaluationResult.mission_status === "SUCCESS" ? "success" : "failure") : "pending";
    return (
      <div style={{ position: "fixed", inset: 0, background: "#030611" }}>
        <div style={{ position: "absolute", top: 12, left: 16, right: 16, display: "flex", justifyContent: "space-between", zIndex: 1000, pointerEvents: "auto" }}>
          <button
            className="overlay-back"
            onClick={() => setScreen("workshop")}
            style={{ padding: "8px 16px", cursor: "pointer", background: "rgba(10, 24, 60, 0.85)", border: "2px solid #1b4a99", color: "#eaf2ff", fontWeight: 700 }}
          >
            ← Back to workshop
          </button>
          <button
            onClick={() => setScreen("results")}
            style={{
              padding: "8px 20px",
              cursor: "pointer",
              background: outcome === "success" ? "linear-gradient(#15803d, #166534)" : "linear-gradient(#991b1b, #7f1d1d)",
              border: `2px solid ${outcome === "success" ? "#4ade80" : "#f87171"}`,
              color: "#fff",
              fontWeight: 800,
              fontSize: 14,
              letterSpacing: 1,
              boxShadow: "0 0 14px rgba(0,0,0,0.6)",
            }}
          >
            ★ VIEW MISSION DEBRIEF & REWARDS ›
          </button>
        </div>
        <PhaserGame
          initialScene="LaunchScene"
          missionOutcome={outcome}
        />
      </div>
    );
  }
  if (screen === "results") {
    return (
      <ResultsPage
        missionId={missionId}
        go={go}
        onRetry={() => setScreen("workshop")}
      />
    );
  }
  if (screen === "market") {
    return <MarketPage go={go} fromWorkshop={marketFromWorkshop} />;
  }
  if (screen === "inventory") {
    return <InventoryPage go={go} />;
  }
  if (screen === "login") {
    return <LoginPage go={go} initialMode="login" />;
  }
  if (screen === "signup") {
    return <LoginPage go={go} initialMode="register" />;
  }

  return <HomePage go={go} />;
}
