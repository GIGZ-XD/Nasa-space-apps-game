import { create } from 'zustand';
import { API_BASE } from '../services/apiClient';
import { useGameStore } from './gameStore';

// ── Types ─────────────────────────────────────────────────────────────────────

export interface AuthUser {
  id: string;
  username: string;
  callsign?: string;
  createdAt?: string;
  lastLoginAt?: string;
}

interface AuthState {
  user: AuthUser | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isInitialized: boolean;
  error: string | null;

  // Actions
  login: (username: string, password: string) => Promise<void>;
  register: (username: string, password: string, callsign?: string) => Promise<void>;
  logout: () => Promise<void>;
  checkSession: () => Promise<void>;
  clearError: () => void;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

const TOKEN_KEY = 'ma_auth_token';

function saveToken(token: string) {
  try {
    localStorage.setItem(TOKEN_KEY, token);
  } catch {}
}

function loadToken(): string | null {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

function clearToken() {
  try {
    localStorage.removeItem(TOKEN_KEY);
  } catch {}
}

async function apiFetch(
  path: string,
  options: RequestInit = {},
  token?: string | null,
): Promise<Response> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  try {
    return await fetch(`${API_BASE}${path}`, { ...options, headers });
  } catch {
    // If relative /api failed (e.g. running directly without Vite proxy), attempt direct localhost:4000
    if (API_BASE.startsWith('/')) {
      try {
        return await fetch(`http://localhost:4000/api${path}`, { ...options, headers });
      } catch {}
    }
    throw new Error(
      'Space Command server is unreachable. Please verify the backend API is running on http://localhost:4000.',
    );
  }
}

function extractErrorMessage(data: unknown, fallback: string): string {
  if (!data || typeof data !== 'object') return fallback;
  const d = data as Record<string, unknown>;
  if (typeof d.message === 'string') return d.message;
  if (d.error) {
    if (typeof d.error === 'string') return d.error;
    if (typeof d.error === 'object') {
      const errObj = d.error as Record<string, unknown>;
      if (typeof errObj.message === 'string') return errObj.message;
    }
  }
  return fallback;
}

// ── Store ─────────────────────────────────────────────────────────────────────

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  token: loadToken(),
  isAuthenticated: false,
  isLoading: false,
  isInitialized: false,
  error: null,

  clearError: () => set({ error: null }),

  login: async (username, password) => {
    set({ isLoading: true, error: null });
    try {
      const res = await apiFetch('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ username, password }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(extractErrorMessage(data, 'Login failed. Please check credentials.'));
      }
      saveToken(data.token);
      useGameStore.getState().switchUser(String(data.user?.id), data.user?.callsign || data.user?.username);
      set({
        user: data.user,
        token: data.token,
        isAuthenticated: true,
        isLoading: false,
        isInitialized: true,
        error: null,
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Login failed';
      set({ isLoading: false, error: message });
      throw err;
    }
  },

  register: async (username, password, callsign) => {
    set({ isLoading: true, error: null });
    try {
      const res = await apiFetch('/auth/register', {
        method: 'POST',
        body: JSON.stringify({ username, password, callsign }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(extractErrorMessage(data, 'Registration failed. Please try again.'));
      }
      saveToken(data.token);
      useGameStore.getState().switchUser(String(data.user?.id), data.user?.callsign || data.user?.username);
      set({
        user: data.user,
        token: data.token,
        isAuthenticated: true,
        isLoading: false,
        isInitialized: true,
        error: null,
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Registration failed';
      set({ isLoading: false, error: message });
      throw err;
    }
  },

  logout: async () => {
    const { token } = get();
    set({ isLoading: true });
    try {
      if (token) {
        await apiFetch('/auth/logout', { method: 'POST' }, token).catch(() => {});
      }
    } catch {}
    clearToken();
    useGameStore.getState().resetProgress();
    set({
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,
      isInitialized: true,
      error: null,
    });
  },

  checkSession: async () => {
    const token = loadToken();
    if (!token) {
      set({ user: null, token: null, isAuthenticated: false, isLoading: false, isInitialized: true });
      return;
    }
    set({ isLoading: true });
    try {
      const res = await apiFetch('/auth/me', {}, token);
      if (res.ok) {
        const data = await res.json();
        useGameStore.getState().switchUser(String(data.user?.id), data.user?.callsign || data.user?.username);
        set({ user: data.user, token, isAuthenticated: true, isLoading: false, isInitialized: true });
      } else {
        clearToken();
        set({ user: null, token: null, isAuthenticated: false, isLoading: false, isInitialized: true });
      }
    } catch {
      clearToken();
      set({ user: null, token: null, isAuthenticated: false, isLoading: false, isInitialized: true });
    }
  },
}));
