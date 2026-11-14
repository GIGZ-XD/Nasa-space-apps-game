import { useState } from "react";
import { PhaserGame } from "../game";
import { MISSIONS } from "../data/missions";
import { HomePage } from "../pages/HomePage";
import { MissionSelectPage } from "../pages/MissionSelectPage";
import { MissionBriefPage } from "../pages/MissionBriefPage";
import { LeaderboardPage } from "../pages/LeaderboardPage";
import { DevHarness } from "./DevHarness";

type Screen = "home" | "select" | "brief" | "workshop" | "leaderboard";

export function App() {
  const [screen, setScreen] = useState<Screen>(() => (new URLSearchParams(window.location.search).get("screen") as Screen) || "home");
  const [missionId, setMissionId] = useState(4);

  if (new URLSearchParams(window.location.search).has("dev")) return <DevHarness />;

  const go = (s: string) => setScreen(s as Screen);
  const mission = MISSIONS.find((m) => m.id === missionId) ?? MISSIONS[0];

  if (screen === "leaderboard") return <LeaderboardPage go={go} />;
  if (screen === "select") return <MissionSelectPage go={go} open={(id) => { setMissionId(id); setScreen("brief"); }} />;
  if (screen === "brief") return <MissionBriefPage mission={mission} go={go} start={() => setScreen("workshop")} />;
  if (screen === "workshop")
    return (
      <div style={{ position: "fixed", inset: 0, background: "#030611" }}>
        <button className="overlay-back" onClick={() => setScreen("brief")} style={{ padding: "6px 12px", cursor: "pointer" }}>← Back to brief</button>
        <PhaserGame initialScene="WorkshopScene" />
      </div>
    );
  return <HomePage go={go} />;
}
