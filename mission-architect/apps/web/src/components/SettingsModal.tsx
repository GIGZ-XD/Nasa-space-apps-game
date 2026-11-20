import { useState, useRef, useEffect } from "react";
import { useAuthStore } from "../stores/authStore";
import { useGameStore } from "../stores/gameStore";
import { API_BASE } from "../services/apiClient";

// ── Sound Volume Store (simple localStorage) ─────────────────────────────────
const VOL_KEY = "ma_sound_volume";
function loadVolume(): number {
  try {
    const v = localStorage.getItem(VOL_KEY);
    return v !== null ? Math.max(0, Math.min(1, parseFloat(v))) : 0.7;
  } catch {
    return 0.7;
  }
}
function saveVolume(v: number) {
  try { localStorage.setItem(VOL_KEY, String(v)); } catch {}
}

// ── Types ─────────────────────────────────────────────────────────────────────
type ConfirmMode = null | "delete" | "reset";

interface Props {
  open: boolean;
  onClose: () => void;
  onLogout: () => void;
}

export function SettingsModal({ open, onClose, onLogout }: Props) {
  const { token, isAuthenticated, user } = useAuthStore();
  const [volume, setVolume] = useState(loadVolume);
  const [confirmMode, setConfirmMode] = useState<ConfirmMode>(null);
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState("");
  const passRef = useRef<HTMLInputElement>(null);

  // Focus password input when confirm mode opens
  useEffect(() => {
    if (confirmMode && passRef.current) passRef.current.focus();
  }, [confirmMode]);

  if (!open) return null;

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = parseFloat(e.target.value);
    setVolume(v);
    saveVolume(v);
    // Dispatch a custom event so audio system can pick it up
    window.dispatchEvent(new CustomEvent("ma-volume-change", { detail: v }));
  };

  const handleDelete = async () => {
    if (!password.trim()) { setError("Enter your password to confirm."); return; }
    setLoading(true); setError("");
    try {
      const res = await fetch(`${API_BASE}/auth/account`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ password }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.message || data.error?.message || "Delete failed");
      // Clear everything and go to login
      localStorage.removeItem("ma_auth_token");
      if (user?.id) localStorage.removeItem(`ma_user_save_${user.id}`);
      window.location.reload();
    } catch (err: any) {
      setError(err.message || "Failed to delete account");
    } finally {
      setLoading(false);
    }
  };

  const handleReset = async () => {
    if (!password.trim()) { setError("Enter your password to confirm."); return; }
    setLoading(true); setError("");
    try {
      const res = await fetch(`${API_BASE}/auth/reset`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ password }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.message || data.error?.message || "Reset failed");
      // Reset local game store
      if (user?.id) localStorage.removeItem(`ma_user_save_${user.id}`);
      useGameStore.getState().resetProgress();
      setSuccess("Account reset to default! Reloading...");
      setTimeout(() => window.location.reload(), 1200);
    } catch (err: any) {
      setError(err.message || "Failed to reset account");
    } finally {
      setLoading(false);
    }
  };

  const cancelConfirm = () => {
    setConfirmMode(null);
    setPassword("");
    setError("");
    setSuccess("");
  };

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <div
      style={{
        position: "fixed", inset: 0, zIndex: 1000,
        display: "flex", alignItems: "center", justifyContent: "center",
        background: "rgba(0,0,0,0.75)", backdropFilter: "blur(4px)",
      }}
      onClick={(e) => { if (e.target === e.currentTarget && !confirmMode) onClose(); }}
    >
      <div style={{
        width: 420, background: "linear-gradient(180deg, #0b1a40, #061030)",
        border: "3px solid #2bb8ff", borderRadius: 12, padding: "28px 32px",
        boxShadow: "0 0 30px rgba(43,184,255,0.4), inset 0 0 20px rgba(43,184,255,0.15)",
        fontFamily: "'IBM Plex Sans', system-ui, sans-serif", color: "#eaf2ff",
      }}>
        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
          <div style={{ fontSize: 22, fontWeight: 700, color: "#5fe3ff", letterSpacing: 1 }}>⚙ SETTINGS</div>
          <button
            onClick={onClose}
            style={{
              background: "none", border: "none", color: "#5fe3ff", fontSize: 24,
              cursor: "pointer", padding: "0 4px", lineHeight: 1,
            }}
          >✕</button>
        </div>

        {/* Volume Control */}
        <div style={{ marginBottom: 24 }}>
          <label style={{ fontSize: 15, fontWeight: 600, color: "#a5b4fc", display: "block", marginBottom: 8 }}>
            🔊 Sound Volume
          </label>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <span style={{ fontSize: 14, color: "#6b7db3", width: 24 }}>{volume === 0 ? "🔇" : volume < 0.4 ? "🔈" : volume < 0.7 ? "🔉" : "🔊"}</span>
            <input
              type="range" min="0" max="1" step="0.01" value={volume}
              onChange={handleVolumeChange}
              style={{ flex: 1, accentColor: "#2bb8ff", height: 6, cursor: "pointer" }}
            />
            <span style={{ fontSize: 14, color: "#6b7db3", width: 36, textAlign: "right" }}>{Math.round(volume * 100)}%</span>
          </div>
        </div>

        <div style={{ borderTop: "1px solid #1b3a78", margin: "0 0 20px" }} />

        {/* Logout */}
        {isAuthenticated && (
          <button
            onClick={onLogout}
            style={{
              width: "100%", padding: "12px 0", marginBottom: 12,
              background: "rgba(43, 184, 255, 0.1)", border: "2px solid #2bb8ff",
              borderRadius: 8, color: "#5fe3ff", fontSize: 16, fontWeight: 700,
              cursor: "pointer", letterSpacing: 1,
            }}
          >🚀 LOGOUT</button>
        )}

        {isAuthenticated && !confirmMode && (
          <>
            <div style={{ borderTop: "1px solid #1b3a78", margin: "12px 0 16px" }} />
            <div style={{ fontSize: 13, color: "#6b7db3", marginBottom: 10 }}>Danger Zone</div>

            {/* Reset Account */}
            <button
              onClick={() => { setConfirmMode("reset"); setError(""); setSuccess(""); setPassword(""); }}
              style={{
                width: "100%", padding: "10px 0", marginBottom: 8,
                background: "rgba(234, 179, 8, 0.1)", border: "2px solid #eab308",
                borderRadius: 8, color: "#fde047", fontSize: 14, fontWeight: 700,
                cursor: "pointer",
              }}
            >🔄 RESET ACCOUNT</button>

            {/* Delete Account */}
            <button
              onClick={() => { setConfirmMode("delete"); setError(""); setSuccess(""); setPassword(""); }}
              style={{
                width: "100%", padding: "10px 0",
                background: "rgba(220, 38, 38, 0.1)", border: "2px solid #dc2626",
                borderRadius: 8, color: "#fca5a5", fontSize: 14, fontWeight: 700,
                cursor: "pointer",
              }}
            >🗑 DELETE ACCOUNT</button>
          </>
        )}

        {/* Confirmation dialog */}
        {confirmMode && (
          <div style={{ marginTop: 12, padding: 16, background: "rgba(0,0,0,0.3)", borderRadius: 8, border: `2px solid ${confirmMode === "delete" ? "#dc2626" : "#eab308"}` }}>
            <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 8, color: confirmMode === "delete" ? "#fca5a5" : "#fde047" }}>
              {confirmMode === "delete"
                ? "⚠ Are you sure you want to DELETE your account?"
                : "⚠ Are you sure you want to RESET your account?"}
            </div>
            <div style={{ fontSize: 13, color: "#a5b4fc", marginBottom: 12 }}>
              {confirmMode === "delete"
                ? "This action is PERMANENT. All your progress, inventory, and data will be lost forever."
                : "This will reset your coins, XP, level, inventory, and missions back to default. Your account credentials will stay the same."}
            </div>
            <div style={{ marginBottom: 10 }}>
              <label style={{ fontSize: 13, color: "#6b7db3", display: "block", marginBottom: 4 }}>Enter your password to confirm:</label>
              <input
                ref={passRef}
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") confirmMode === "delete" ? handleDelete() : handleReset(); }}
                placeholder="Password"
                style={{
                  width: "100%", padding: "8px 12px", fontSize: 14,
                  background: "#0a1230", border: "2px solid #1b3a78", borderRadius: 6,
                  color: "#eaf2ff", outline: "none",
                }}
              />
            </div>
            {error && <div style={{ color: "#f87171", fontSize: 13, marginBottom: 8 }}>⚠ {error}</div>}
            {success && <div style={{ color: "#4ade80", fontSize: 13, marginBottom: 8 }}>✓ {success}</div>}
            <div style={{ display: "flex", gap: 8 }}>
              <button
                onClick={cancelConfirm}
                disabled={loading}
                style={{
                  flex: 1, padding: "8px 0", background: "#1b3a78", border: "none",
                  borderRadius: 6, color: "#a5b4fc", fontSize: 13, fontWeight: 700, cursor: "pointer",
                }}
              >CANCEL</button>
              <button
                onClick={confirmMode === "delete" ? handleDelete : handleReset}
                disabled={loading}
                style={{
                  flex: 1, padding: "8px 0",
                  background: confirmMode === "delete" ? "#991b1b" : "#854d0e",
                  border: "none", borderRadius: 6,
                  color: "#fff", fontSize: 13, fontWeight: 700, cursor: "pointer",
                  opacity: loading ? 0.6 : 1,
                }}
              >{loading ? "Processing..." : confirmMode === "delete" ? "DELETE FOREVER" : "RESET NOW"}</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
