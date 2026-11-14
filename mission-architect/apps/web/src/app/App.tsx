import { useState } from "react";
import { PhaserGame } from "../game";

export function App() {
  const [isGameMounted, setIsGameMounted] = useState(true);

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
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "1rem",
        }}
      >
        <h1 style={{ margin: 0, fontSize: "1.25rem", color: "#00e5ff" }}>
          Mission Architect — Phase 1: Phaser 3 &amp; React Integration
        </h1>
        <button
          onClick={() => setIsGameMounted((prev) => !prev)}
          style={{
            background: isGameMounted ? "#c62828" : "#0288d1",
            color: "#ffffff",
            border: "none",
            borderRadius: "4px",
            padding: "0.5rem 1rem",
            cursor: "pointer",
            fontWeight: "bold",
          }}
        >
          {isGameMounted ? "Unmount Game (Test Lifecycle)" : "Mount Game (Test Lifecycle)"}
        </button>
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
          <PhaserGame />
        ) : (
          <div style={{ color: "#78909c", fontFamily: "monospace" }}>
            Game unmounted. Phaser instance destroyed and canvas cleanly removed.
          </div>
        )}
      </section>
    </main>
  );
}
