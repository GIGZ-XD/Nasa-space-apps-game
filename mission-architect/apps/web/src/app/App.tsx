import { useState } from "react";
import { PhaserGame, MissionOutcomeStatus } from "../game";

export function App() {
  const [isGameMounted, setIsGameMounted] = useState(true);
  const [activeScene, setActiveScene] = useState<string>("WorkshopScene");
  const [missionOutcome, setMissionOutcome] = useState<MissionOutcomeStatus>("pending");

  return (
    <main
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        minHeight: "100vh",
        backgroundColor: "#030611",
        color: "#eceff1",
        fontFamily: "system-ui, -apple-system, sans-serif",
        margin: 0,
        padding: "1rem",
        boxSizing: "border-box",
      }}
    >
      <header
        style={{
          width: "100%",
          maxWidth: "1280px",
          display: "flex",
          flexWrap: "wrap",
          justifyContent: "space-between",
          alignItems: "center",
          gap: "0.75rem",
          marginBottom: "0.75rem",
        }}
      >
        <div>
          <h1 style={{ margin: 0, fontSize: "1.25rem", color: "#00e5ff" }}>
            Mission Architect — Phase 4: Mission Outcome &amp; Orbit Simulation
          </h1>
          <p style={{ margin: "0.25rem 0 0 0", fontSize: "0.85rem", color: "#94a3b8" }}>
            Active Scene: <span style={{ color: "#38bdf8", fontWeight: "bold" }}>{activeScene}</span> | Outcome:{" "}
            <span
              style={{
                color:
                  missionOutcome === "success"
                    ? "#22c55e"
                    : missionOutcome === "failure"
                    ? "#ef4444"
                    : "#f59e0b",
                fontWeight: "bold",
                textTransform: "uppercase",
              }}
            >
              {missionOutcome}
            </span>
          </p>
        </div>

        <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem" }}>
          {/* Scene Selectors */}
          <button
            onClick={() => {
              setActiveScene("WorkshopScene");
              setMissionOutcome("pending");
            }}
            style={{
              background: activeScene === "WorkshopScene" ? "#0284c7" : "#1e293b",
              color: "#ffffff",
              border: "1px solid #38bdf8",
              borderRadius: "4px",
              padding: "0.4rem 0.75rem",
              cursor: "pointer",
              fontSize: "0.8rem",
            }}
          >
            1. Workshop
          </button>
          <button
            onClick={() => {
              setActiveScene("LaunchScene");
              setMissionOutcome("pending");
            }}
            style={{
              background: activeScene === "LaunchScene" ? "#d97706" : "#1e293b",
              color: "#ffffff",
              border: "1px solid #f59e0b",
              borderRadius: "4px",
              padding: "0.4rem 0.75rem",
              cursor: "pointer",
              fontSize: "0.8rem",
            }}
          >
            2. Launchpad
          </button>
          <button
            onClick={() => setActiveScene("OrbitScene")}
            style={{
              background: activeScene === "OrbitScene" ? "#16a34a" : "#1e293b",
              color: "#ffffff",
              border: "1px solid #22c55e",
              borderRadius: "4px",
              padding: "0.4rem 0.75rem",
              cursor: "pointer",
              fontSize: "0.8rem",
            }}
          >
            3. Orbit Scene
          </button>

          {/* Outcome Simulation Triggers */}
          <button
            onClick={() => {
              setActiveScene("OrbitScene");
              setMissionOutcome("success");
            }}
            style={{
              background: missionOutcome === "success" ? "#15803d" : "#064e3b",
              color: "#86efac",
              border: "1px solid #22c55e",
              borderRadius: "4px",
              padding: "0.4rem 0.75rem",
              cursor: "pointer",
              fontWeight: "bold",
              fontSize: "0.8rem",
            }}
          >
            Simulate Success
          </button>
          <button
            onClick={() => {
              setActiveScene("OrbitScene");
              setMissionOutcome("failure");
            }}
            style={{
              background: missionOutcome === "failure" ? "#991b1b" : "#450a0a",
              color: "#fca5a5",
              border: "1px solid #ef4444",
              borderRadius: "4px",
              padding: "0.4rem 0.75rem",
              cursor: "pointer",
              fontWeight: "bold",
              fontSize: "0.8rem",
            }}
          >
            Simulate Failure
          </button>
          <button
            onClick={() => setMissionOutcome("pending")}
            style={{
              background: "#334155",
              color: "#cbd5e1",
              border: "1px solid #64748b",
              borderRadius: "4px",
              padding: "0.4rem 0.75rem",
              cursor: "pointer",
              fontSize: "0.8rem",
            }}
          >
            Reset
          </button>

          {/* Mount / Unmount Toggle */}
          <button
            onClick={() => setIsGameMounted((prev) => !prev)}
            style={{
              background: isGameMounted ? "#b91c1c" : "#0369a1",
              color: "#ffffff",
              border: "none",
              borderRadius: "4px",
              padding: "0.4rem 0.75rem",
              cursor: "pointer",
              fontSize: "0.8rem",
              fontWeight: "bold",
            }}
          >
            {isGameMounted ? "Unmount" : "Mount"}
          </button>
        </div>
      </header>

      <section
        style={{
          width: "100%",
          maxWidth: "1280px",
          height: "720px",
          maxHeight: "80vh",
          borderRadius: "8px",
          overflow: "hidden",
          border: "1px solid #1a233a",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {isGameMounted ? (
          <PhaserGame
            key={activeScene}
            initialScene={activeScene}
            missionOutcome={missionOutcome}
          />
        ) : (
          <div style={{ color: "#78909c", fontFamily: "monospace" }}>
            Game unmounted. Phaser instance destroyed and canvas cleanly removed.
          </div>
        )}
      </section>
    </main>
  );
}
