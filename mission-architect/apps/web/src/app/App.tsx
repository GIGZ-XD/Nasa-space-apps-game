import { useState, useEffect } from "react";
import { PhaserGame } from "../game";
import { MISSIONS } from "../data/missions";
import { HomePage } from "../pages/HomePage";
import { MissionSelectPage } from "../pages/MissionSelectPage";
import { MissionBriefPage } from "../pages/MissionBriefPage";
import { LoginPage } from "../pages/LoginPage";
import { DevHarness } from "./DevHarness";
import { useAuthStore } from "../stores/authStore";
import { Screen as StageScreen } from "../components/layout/ui";

type Screen = "home" | "select" | "brief" | "workshop" | "login" | "signup";

export function App() {
  const { isAuthenticated, isInitialized, checkSession } = useAuthStore();

  useEffect(() => {
    checkSession();
  }, [checkSession]);

  const [screen, setScreen] = useState<Screen>(() => {
    const p = window.location.pathname.toLowerCase();
    if (p === "/signup" || p === "/register") return "signup";
    const s = new URLSearchParams(window.location.search).get("screen") as Screen;
    if (s === "signup") return "signup";
    // By default, start at login
    return "login";
  });
  const [missionId, setMissionId] = useState(4);

  if (new URLSearchParams(window.location.search).has("dev")) return <DevHarness />;

  const go = (s: string) => {
    setScreen(s as Screen);
    if (s === "login" || s === "signup") {
      window.history.pushState({}, "", `/${s}`);
    } else if (s === "home") {
      window.history.pushState({}, "", "/");
    }
  };

  // 1. While checking stored session on app boot
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

  // 2. If NOT authenticated, enforce login or signup page as the gateway
  if (!isAuthenticated) {
    if (screen === "signup") {
      return <LoginPage go={go} initialMode="register" />;
    }
    return <LoginPage go={go} initialMode="login" />;
  }

  // 3. Authenticated: routing
  const mission = MISSIONS.find((m) => m.id === missionId) ?? MISSIONS[0];

  if (screen === "login") {
    return <LoginPage go={go} initialMode="login" />;
  }
  if (screen === "signup") {
    return <LoginPage go={go} initialMode="register" />;
  }
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
    return (
      <div style={{ position: "fixed", inset: 0, background: "#030611" }}>
        <button
          className="overlay-back"
          onClick={() => setScreen("brief")}
          style={{ padding: "6px 12px", cursor: "pointer" }}
        >
          ← Back to brief
        </button>
        <PhaserGame initialScene="WorkshopScene" />
      </div>
    );
  }

  return <HomePage go={go} />;
}
