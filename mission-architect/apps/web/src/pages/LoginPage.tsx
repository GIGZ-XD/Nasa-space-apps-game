import React, { useState, useEffect } from 'react';
import { Screen, Moonscape, Img, Btn } from '../components/layout/ui';
import { useAuthStore } from '../stores/authStore';

// ── SVG Icons ─────────────────────────────────────────────────────────────────

function IconUser() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" style={{ width: 22, height: 22, color: 'var(--cyan)' }}>
      <path d="M12 12c2.7 0 4.8-2.1 4.8-4.8S14.7 2.4 12 2.4 7.2 4.5 7.2 7.2 9.3 12 12 12zm0 2.4c-3.2 0-9.6 1.6-9.6 4.8v2.4h19.2v-2.4c0-3.2-6.4-4.8-9.6-4.8z" />
    </svg>
  );
}

function IconLock() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" style={{ width: 22, height: 22, color: 'var(--cyan)' }}>
      <path d="M18 8h-1V6c0-2.8-2.2-5-5-5S7 3.2 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm-6 9c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm3.1-9H8.9V6c0-1.7 1.4-3.1 3.1-3.1 1.7 0 3.1 1.4 3.1 3.1v2z" />
    </svg>
  );
}

function IconEye({ open }: { open: boolean }) {
  return open ? (
    <svg viewBox="0 0 24 24" fill="currentColor" style={{ width: 20, height: 20, color: 'var(--cyan)' }}>
      <path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z" />
    </svg>
  ) : (
    <svg viewBox="0 0 24 24" fill="currentColor" style={{ width: 20, height: 20, color: '#4a7ea8' }}>
      <path d="M12 7c2.76 0 5 2.24 5 5 0 .65-.13 1.26-.36 1.83l2.92 2.92c1.51-1.26 2.7-2.89 3.43-4.75-1.73-4.39-6-7.5-11-7.5-1.4 0-2.74.25-3.98.7l2.16 2.16C10.74 7.13 11.35 7 12 7zM2 4.27l2.28 2.28.46.46C3.08 8.3 1.78 10.02 1 12c1.73 4.39 6 7.5 11 7.5 1.55 0 3.03-.3 4.38-.84l.42.42L19.73 22 21 20.73 3.27 3 2 4.27zM7.53 9.8l1.55 1.55c-.05.21-.08.43-.08.65 0 1.66 1.34 3 3 3 .22 0 .44-.03.65-.08l1.55 1.55c-.67.33-1.41.53-2.2.53-2.76 0-5-2.24-5-5 0-.79.2-1.53.53-2.2zm4.31-.78l3.15 3.15.02-.16c0-1.66-1.34-3-3-3l-.17.01z" />
    </svg>
  );
}

// ── LoginPage Component ───────────────────────────────────────────────────────

export function LoginPage({
  go,
  initialMode = 'login',
}: {
  go?: (s: string) => void;
  initialMode?: 'login' | 'register';
}) {
  const { login, register, isAuthenticated, isLoading, error, clearError } = useAuthStore();

  const [mode, setMode] = useState<'login' | 'register'>(initialMode);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [callsign, setCallsign] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  useEffect(() => {
    setMode(initialMode);
  }, [initialMode]);

  const isRegister = mode === 'register';

  function switchMode(next: 'login' | 'register') {
    clearError();
    setLocalError(null);
    setSuccessMsg(null);
    setPassword('');
    setConfirmPassword('');
    setMode(next);
    if (go) {
      go(next === 'register' ? 'signup' : 'login');
    }
  }

  async function handleLoginSubmit(e: React.FormEvent) {
    e.preventDefault();
    clearError();
    setLocalError(null);
    setSuccessMsg(null);

    if (!username.trim()) {
      setLocalError('Please enter your username');
      return;
    }
    if (!password) {
      setLocalError('Please enter your password');
      return;
    }

    try {
      await login(username.trim(), password);
      setSuccessMsg('Access Granted! Teleporting to Mission Control...');
      setTimeout(() => {
        if (go) go('home');
      }, 500);
    } catch {
      // error is captured in authStore
    }
  }

  async function handleRegisterSubmit(e: React.FormEvent) {
    e.preventDefault();
    clearError();
    setLocalError(null);
    setSuccessMsg(null);

    const cleanUser = username.trim();
    if (!cleanUser || cleanUser.length < 3) {
      setLocalError('Username must be at least 3 characters');
      return;
    }
    if (!password || password.length < 6) {
      setLocalError('Password must be at least 6 characters');
      return;
    }
    if (password !== confirmPassword) {
      setLocalError('Passwords do not match. Please re-enter.');
      return;
    }

    try {
      // Register new cadet account with backend
      await register(cleanUser, password, callsign.trim() || undefined);
      setSuccessMsg(`Cadet ${cleanUser} profile created! Welcome to Space Command.`);
      setTimeout(() => {
        if (go) go('home');
      }, 600);
    } catch {
      // error is captured in authStore
    }
  }

  const activeError = localError || error;

  return (
    <Screen>
      {/* Background celestial elements matching theme */}
      <img
        className="pix abs"
        src="/assets/sprites/planets/earth.jpg"
        alt="Planet"
        style={{
          left: 960,
          top: 60,
          width: 220,
          borderRadius: '50%',
          boxShadow: '0 0 35px #2bb8ff',
          opacity: 0.95,
        }}
      />
      <Moonscape />

      {/* Back button only when already authenticated */}
      {go && isAuthenticated && (
        <Btn
          x={14}
          y={16}
          w={220}
          h={64}
          icon={<Img src="/assets/sprites/ui/home.jpg" size={42} />}
          onClick={() => go('home')}
        >
          Back
        </Btn>
      )}

      {/* ── Main Space Command Center Modal ─────────────────────────────── */}
      <div
        className="panel abs"
        style={{
          left: '50%',
          top: '50%',
          transform: 'translate(-50%, -52%)',
          width: 600,
          zIndex: 10,
          filter: 'drop-shadow(0 0 18px rgba(43, 184, 255, 0.85))',
        }}
      >
        {/* Outer Frame with notched corners & double border styling */}
        <div
          className="frame"
          style={{
            position: 'absolute',
            inset: 0,
            background: 'linear-gradient(180deg, #09173a 0%, #040d24 100%)',
            border: '4px solid var(--neon, #2bb8ff)',
            clipPath:
              'polygon(20px 0, calc(100% - 20px) 0, 100% 20px, 100% calc(100% - 20px), calc(100% - 20px) 100%, 20px 100%, 0 calc(100% - 20px), 0 20px)',
            boxShadow:
              'inset 0 0 0 2px #040a1c, inset 0 0 0 4px #1b5fb3, inset 0 0 32px rgba(43,184,255,0.4)',
          }}
        />

        {/* Content Box */}
        <div
          style={{
            position: 'relative',
            zIndex: 2,
            padding: '28px 42px 28px 42px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
          }}
        >
          {/* ── Mode Selection Tabs (Clear distinction for New vs Existing) ── */}
          <div
            style={{
              display: 'flex',
              gap: 12,
              marginBottom: 16,
              width: '100%',
              justifyContent: 'center',
            }}
          >
            <button
              type="button"
              onClick={() => switchMode('login')}
              style={{
                flex: 1,
                padding: '9px 12px',
                background: !isRegister
                  ? 'linear-gradient(#0e346e, #071f49)'
                  : 'rgba(5, 14, 38, 0.65)',
                border: !isRegister
                  ? '2px solid var(--neon, #2bb8ff)'
                  : '2px solid rgba(43, 184, 255, 0.25)',
                borderRadius: 8,
                color: !isRegister ? '#ffffff' : '#73a5d1',
                fontSize: 16,
                fontWeight: 700,
                cursor: 'pointer',
                boxShadow: !isRegister
                  ? '0 0 12px rgba(43, 184, 255, 0.5)'
                  : 'none',
                transition: 'all 0.15s ease',
              }}
            >
              LOG IN <span style={{ fontSize: 13, opacity: 0.8 }}>(Existing User)</span>
            </button>

            <button
              type="button"
              onClick={() => switchMode('register')}
              style={{
                flex: 1,
                padding: '9px 12px',
                background: isRegister
                  ? 'linear-gradient(#0e346e, #071f49)'
                  : 'rgba(5, 14, 38, 0.65)',
                border: isRegister
                  ? '2px solid var(--neon, #2bb8ff)'
                  : '2px solid rgba(43, 184, 255, 0.25)',
                borderRadius: 8,
                color: isRegister ? '#ffffff' : '#73a5d1',
                fontSize: 16,
                fontWeight: 700,
                cursor: 'pointer',
                boxShadow: isRegister
                  ? '0 0 12px rgba(43, 184, 255, 0.5)'
                  : 'none',
                transition: 'all 0.15s ease',
              }}
            >
              REGISTER <span style={{ fontSize: 13, opacity: 0.8 }}>(New Cadet)</span>
            </button>
          </div>

          {/* ── Header Tab ──────────────────────────────────────────────── */}
          <div
            style={{
              marginBottom: 6,
              padding: '6px 22px',
              background: 'linear-gradient(#0c214c, #06112d)',
              border: '3px solid var(--neon)',
              clipPath:
                'polygon(12px 0, calc(100% - 12px) 0, 100% 12px, 100% calc(100% - 12px), calc(100% - 12px) 100%, 12px 100%, 0 calc(100% - 12px), 0 12px)',
              boxShadow: '0 0 14px rgba(43, 184, 255, 0.6)',
              display: 'flex',
              alignItems: 'center',
              gap: 12,
            }}
          >
            <span style={{ color: 'var(--gold, #ffd21f)', fontSize: 20, textShadow: '0 0 8px #ffd21f' }}>★</span>
            <span
              className="px"
              style={{
                color: 'var(--cyan, #5fe3ff)',
                fontSize: 18,
                fontWeight: 700,
                letterSpacing: 2,
                textShadow: '0 0 10px #2bb8ff',
              }}
            >
              {isRegister ? 'NEW CADET REGISTRATION' : 'SPACE COMMAND'}
            </span>
            <span style={{ color: 'var(--gold, #ffd21f)', fontSize: 20, textShadow: '0 0 8px #ffd21f' }}>★</span>
          </div>

          {/* Subtitle */}
          <div
            style={{
              color: '#8ec5ff',
              fontSize: 16,
              fontWeight: 600,
              marginBottom: 20,
              textAlign: 'center',
              letterSpacing: 0.5,
            }}
          >
            {isRegister
              ? 'New to Space Command? Create your Cadet profile'
              : 'Log In to Continue Your Mission'}
          </div>

          {/* ── Form ────────────────────────────────────────────────────── */}
          <form
            onSubmit={isRegister ? handleRegisterSubmit : handleLoginSubmit}
            style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 14 }}
          >
            {/* Username Input Pill */}
            <div>
              <div
                style={{
                  position: 'relative',
                  display: 'flex',
                  alignItems: 'center',
                  height: 50,
                  padding: '0 16px',
                  background: 'rgba(6, 16, 44, 0.9)',
                  border: '2px solid var(--neon, #2bb8ff)',
                  borderRadius: 25,
                  boxShadow: 'inset 0 0 12px rgba(43, 184, 255, 0.25)',
                }}
              >
                <IconUser />
                <div
                  style={{
                    width: 1,
                    height: 22,
                    background: 'rgba(43, 184, 255, 0.4)',
                    margin: '0 12px',
                  }}
                />
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder={isRegister ? 'Choose Username (min 3 chars)' : 'Username'}
                  required
                  autoComplete="username"
                  style={{
                    flex: 1,
                    background: 'transparent',
                    border: 'none',
                    outline: 'none',
                    color: '#eaf2ff',
                    fontSize: 18,
                    fontWeight: 600,
                    fontFamily: 'inherit',
                  }}
                />
              </div>
            </div>

            {/* Callsign Input Pill (for Register mode) */}
            {isRegister && (
              <div>
                <div
                  style={{
                    position: 'relative',
                    display: 'flex',
                    alignItems: 'center',
                    height: 50,
                    padding: '0 16px',
                    background: 'rgba(6, 16, 44, 0.9)',
                    border: '2px solid var(--neon, #2bb8ff)',
                    borderRadius: 25,
                    boxShadow: 'inset 0 0 12px rgba(43, 184, 255, 0.25)',
                  }}
                >
                  <span style={{ color: 'var(--gold, #ffd21f)', fontSize: 20 }}>✦</span>
                  <div
                    style={{
                      width: 1,
                      height: 22,
                      background: 'rgba(43, 184, 255, 0.4)',
                      margin: '0 12px',
                    }}
                  />
                  <input
                    type="text"
                    value={callsign}
                    onChange={(e) => setCallsign(e.target.value)}
                    placeholder="Callsign / Pilot Name (optional)"
                    autoComplete="off"
                    style={{
                      flex: 1,
                      background: 'transparent',
                      border: 'none',
                      outline: 'none',
                      color: '#eaf2ff',
                      fontSize: 18,
                      fontWeight: 600,
                      fontFamily: 'inherit',
                    }}
                  />
                </div>
              </div>
            )}

            {/* Password Input Pill */}
            <div>
              <div
                style={{
                  position: 'relative',
                  display: 'flex',
                  alignItems: 'center',
                  height: 50,
                  padding: '0 16px',
                  background: 'rgba(6, 16, 44, 0.9)',
                  border: '2px solid var(--neon, #2bb8ff)',
                  borderRadius: 25,
                  boxShadow: 'inset 0 0 12px rgba(43, 184, 255, 0.25)',
                }}
              >
                <IconLock />
                <div
                  style={{
                    width: 1,
                    height: 22,
                    background: 'rgba(43, 184, 255, 0.4)',
                    margin: '0 12px',
                  }}
                />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={isRegister ? 'Create Password (min 6 chars)' : 'Password'}
                  required
                  autoComplete={isRegister ? 'new-password' : 'current-password'}
                  style={{
                    flex: 1,
                    background: 'transparent',
                    border: 'none',
                    outline: 'none',
                    color: '#eaf2ff',
                    fontSize: 18,
                    fontWeight: 600,
                    fontFamily: 'inherit',
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    padding: 4,
                    display: 'flex',
                    alignItems: 'center',
                  }}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  <IconEye open={showPassword} />
                </button>
              </div>
            </div>

            {/* Confirm Password Input Pill (Only for Register mode) */}
            {isRegister && (
              <div>
                <div
                  style={{
                    position: 'relative',
                    display: 'flex',
                    alignItems: 'center',
                    height: 50,
                    padding: '0 16px',
                    background: 'rgba(6, 16, 44, 0.9)',
                    border: '2px solid var(--neon, #2bb8ff)',
                    borderRadius: 25,
                    boxShadow: 'inset 0 0 12px rgba(43, 184, 255, 0.25)',
                  }}
                >
                  <IconLock />
                  <div
                    style={{
                      width: 1,
                      height: 22,
                      background: 'rgba(43, 184, 255, 0.4)',
                      margin: '0 12px',
                    }}
                  />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Confirm Password"
                    required
                    autoComplete="new-password"
                    style={{
                      flex: 1,
                      background: 'transparent',
                      border: 'none',
                      outline: 'none',
                      color: '#eaf2ff',
                      fontSize: 18,
                      fontWeight: 600,
                      fontFamily: 'inherit',
                    }}
                  />
                </div>
              </div>
            )}

            {/* Error Banner */}
            {activeError && (
              <div
                style={{
                  padding: '8px 14px',
                  background: 'rgba(180, 20, 40, 0.25)',
                  border: '2px solid #ff4466',
                  borderRadius: 8,
                  color: '#ff8899',
                  fontSize: 15,
                  fontWeight: 600,
                  textAlign: 'center',
                }}
              >
                ⚠ {activeError}
              </div>
            )}

            {/* Success Banner */}
            {successMsg && (
              <div
                style={{
                  padding: '8px 14px',
                  background: 'rgba(20, 160, 80, 0.25)',
                  border: '2px solid #22c55e',
                  borderRadius: 8,
                  color: '#86efac',
                  fontSize: 15,
                  fontWeight: 600,
                  textAlign: 'center',
                }}
              >
                ✓ {successMsg}
              </div>
            )}

            {/* ── Primary Action Button (LOGIN / REGISTER CADET) ──────────── */}
            <button
              type="submit"
              disabled={isLoading}
              style={{
                marginTop: 4,
                height: 54,
                background: 'linear-gradient(180deg, #0d3876 0%, #061f49 100%)',
                border: '3px solid var(--neon, #2bb8ff)',
                borderRadius: 27,
                cursor: isLoading ? 'wait' : 'pointer',
                boxShadow:
                  '0 0 18px rgba(43, 184, 255, 0.7), inset 0 0 10px rgba(95, 227, 255, 0.4)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 12,
                transition: 'all 0.15s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = 'var(--gold, #ffd21f)';
                e.currentTarget.style.boxShadow = '0 0 22px rgba(255, 210, 31, 0.7)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = 'var(--neon, #2bb8ff)';
                e.currentTarget.style.boxShadow =
                  '0 0 18px rgba(43, 184, 255, 0.7), inset 0 0 10px rgba(95, 227, 255, 0.4)';
              }}
            >
              <span
                className="px"
                style={{
                  color: '#ffffff',
                  fontSize: 18,
                  fontWeight: 700,
                  letterSpacing: 2,
                  textShadow: '0 0 8px rgba(43, 184, 255, 0.8)',
                }}
              >
                {isLoading
                  ? 'TRANSMITTING...'
                  : isRegister
                  ? 'REGISTER CADET ›'
                  : 'LOGIN ›'}
              </span>
            </button>
          </form>

          {/* ── Mode Switch Link ────────────────────────────────────────── */}
          <div style={{ marginTop: 18, textAlign: 'center' }}>
            {isRegister ? (
              <span style={{ color: '#8ec5ff', fontSize: 16 }}>
                Already an existing Commander?{' '}
                <button
                  type="button"
                  onClick={() => switchMode('login')}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: 'var(--cyan, #5fe3ff)',
                    fontWeight: 700,
                    textDecoration: 'underline',
                    cursor: 'pointer',
                    fontSize: 16,
                  }}
                >
                  Log In here
                </button>
              </span>
            ) : (
              <span style={{ color: '#8ec5ff', fontSize: 16 }}>
                New Cadet?{' '}
                <button
                  type="button"
                  onClick={() => switchMode('register')}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: 'var(--cyan, #5fe3ff)',
                    fontWeight: 700,
                    textDecoration: 'underline',
                    cursor: 'pointer',
                    fontSize: 16,
                  }}
                >
                  Create an Account here
                </button>
              </span>
            )}
          </div>

          {/* Demo hint only for login */}
          {!isRegister && (
            <div
              style={{
                marginTop: 16,
                color: 'rgba(142, 197, 255, 0.7)',
                fontSize: 14,
                fontFamily: 'monospace',
              }}
            >
              Demo Commander: <b style={{ color: 'var(--cyan)' }}>commander</b> / <b style={{ color: 'var(--cyan)' }}>spaceapps2026</b>
            </div>
          )}
        </div>
      </div>
    </Screen>
  );
}
