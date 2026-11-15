import { useState, useEffect } from "react";
import { PhaserGame } from "../game";
import { OUTCOME_EVENTS } from "../game/types/outcome";
import { classifyClick, playSfx, preloadSfx } from "../audio/sfx";
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
  // True once the spacecraft has finished 2 orbits after launch (reveals the result)
  const [orbitsDone, setOrbitsDone] = useState(false);
  // Pictures of the parts that were launched (the parts themselves are consumed)
  const [loadout, setLoadout] = useState<Record<string, string>>({});

  // Sound effects: preload, button clicks, and the mission-success jingle
  useEffect(() => {
    preloadSfx();
    const onClick = (e: MouseEvent) => {
      const btn = (e.target as Element | null)?.closest?.("button");
      if (btn) playSfx(classifyClick(btn));
    };
    document.addEventListener("click", onClick, true);
    return () => document.removeEventListener("click", onClick, true);
  }, []);
  const evaluationResult = useLOSStore((s) => s.evaluationResult);

  // Success jingle when "MISSION SUCCESSFUL" appears after the 2 orbits
  useEffect(() => {
    if (orbitsDone && evaluationResult?.mission_status === "SUCCESS") playSfx("success");
  }, [orbitsDone, evaluationResult]);

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
  if (screen === "workshop") {
    return <WorkshopPage mission={mission} go={go} launch={(lo) => {
      setLoadout(lo);
      setOrbitsDone(false);
      setScreen("launch");
    }} />;
  }
  if (screen === "launch") {
    const outcome = evaluationResult ? (evaluationResult.mission_status === "SUCCESS" ? "success" : "failure") : "pending";
    return (
      <div style={{ position: "fixed", inset: 0, background: "#030611" }}>
        <PhaserGame
          initialScene="LaunchScene"
          missionOutcome={outcome}
          loadout={loadout}
          onGameReady={(game) => {
            // Reveal the result only after the spacecraft has flown 2 orbits
            game.events.on(OUTCOME_EVENTS.ORBITS_COMPLETE, () => setOrbitsDone(true));
            // A failed launch explodes instead of reaching orbit
            // (short delay so the explosion is seen before the message)
            game.events.on(OUTCOME_EVENTS.LAUNCH_FAILED, () => {
              playSfx("lose"); // plays with the explosion
              setTimeout(() => setOrbitsDone(true), 1800);
            });
          }}
        />
        {orbitsDone && (
          <div
            style={{
              position: "absolute",
              top: "12%",
              left: 0,
              right: 0,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 18,
              zIndex: 1000,
              pointerEvents: "none",
              textAlign: "center",
            }}
          >
            <div
              className="px"
              style={{
                fontSize: "clamp(24px, 4.4vw, 64px)",
                fontWeight: 900,
                letterSpacing: 2,
                color: outcome === "success" ? "#4ade80" : "#f87171",
                textShadow:
                  outcome === "success"
                    ? "0 0 24px rgba(74, 222, 128, 0.8), 0 4px 0 #064e3b"
                    : "0 0 24px rgba(248, 113, 113, 0.8), 0 4px 0 #7f1d1d",
              }}
            >
              {outcome === "success" ? "MISSION SUCCESSFUL" : "MISSION FAILED"}
            </div>
            <button
              onClick={() => setScreen("results")}
              style={{
                pointerEvents: "auto",
                padding: "12px 34px",
                fontSize: 22,
                fontWeight: 800,
                letterSpacing: 2,
                cursor: "pointer",
                color: outcome === "success" ? "#2a1600" : "#fff",
                background: outcome === "success" ? "linear-gradient(#ffe45c,#f0a010)" : "linear-gradient(#991b1b,#7f1d1d)",
                border: `3px solid ${outcome === "success" ? "#fff0a0" : "#f87171"}`,
                boxShadow: "0 0 18px rgba(255, 210, 31, 0.6)",
              }}
            >
              {outcome === "success" ? "Claim your rewards ›" : "View debrief ›"}
            </button>
          </div>
        )}
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
