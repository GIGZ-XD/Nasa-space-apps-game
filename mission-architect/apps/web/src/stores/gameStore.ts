import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { MarketPart, MarketIntel } from "../data/marketData";

export interface UserSaveData {
  coins: number;
  xp: number;
  xpMax: number;
  level: number;
  playerName: string;
  ownedPartIds: string[];
  ownedIntelIds: string[];
  installedParts: Record<string, string | string[]>;
  unlockedMissionIds: number[];
  completedMissionIds: number[];
  ownerId: string;
}

export interface GameState {
  coins: number;
  xp: number;
  xpMax: number;
  level: number;
  playerName: string;
  ownedPartIds: string[];
  ownedIntelIds: string[];
  ownerId: string | null;
  /** Parts placed in the workshop assembly bay, keyed by category id. */
  installedParts: Record<string, string | string[]>;
  /** Mission ids unlocked (by level or special grant). */
  unlockedMissionIds: number[];
  /** Missions successfully completed at least once. */
  completedMissionIds: number[];

  // Actions
  buyPart: (part: MarketPart) => { success: boolean; reason?: string };
  isPartOwned: (partId: string) => boolean;
  buyIntel: (intel: MarketIntel) => { success: boolean; reason?: string };
  isIntelOwned: (intelId: string) => boolean;
  canAfford: (price: number) => boolean;
  addCoins: (amount: number) => void;
  addXp: (amount: number) => void;
  /** Set when XP raised the player's level; consumed by the results screen. */
  pendingLevelUp: boolean;
  clearLevelUp: () => void;
  setInstalledPart: (categoryId: string, partId: string | null) => void;
  /** Toggle a part in a category that holds several parts (sensors / landers). */
  toggleInstalledPart: (categoryId: string, partId: string) => void;
  unlockMission: (missionId: number) => void;
  isMissionUnlocked: (missionId: number) => boolean;
  completeMission: (missionId: number) => void;
  recalcUnlockedMissions: () => void;
  /** Destroys parts used on a mission: removes them from inventory and the assembly bay. */
  consumeParts: (partIds: string[]) => void;
  resetProgress: () => void;
  saveCurrentProgress: () => void;
  logoutUser: () => void;
  /** Reset or restore progress when switching user. */
  switchUser: (userId: string, playerName?: string, remoteProgress?: any) => void;
}

export const STARTING_COINS = 5_000_000;

export function formatCoins(amount: number): string {
  if (amount >= 1_000_000) {
    const val = amount / 1_000_000;
    return (val % 1 === 0 ? val.toFixed(0) : val.toFixed(2)) + "M";
  }
  if (amount >= 1_000) {
    const val = amount / 1_000;
    return (val % 1 === 0 ? val.toFixed(0) : val.toFixed(1)) + "K";
  }
  return amount.toString();
}

const SAVE_KEY_PREFIX = "ma_user_save_";

export function getSaveKey(userId: string): string {
  return `${SAVE_KEY_PREFIX}${userId}`;
}

export function saveUserStateToStorage(userId: string, data: Partial<UserSaveData>): void {
  if (!userId) return;
  try {
    const existingStr = localStorage.getItem(getSaveKey(userId));
    const existing = existingStr ? JSON.parse(existingStr) : {};
    const merged = { ...existing, ...data, ownerId: userId };
    localStorage.setItem(getSaveKey(userId), JSON.stringify(merged));
  } catch (err) {
    console.error("Failed to save user state to storage", err);
  }
}

export function loadUserStateFromStorage(userId: string): UserSaveData | null {
  if (!userId) return null;
  try {
    const raw = localStorage.getItem(getSaveKey(userId));
    if (!raw) return null;
    return JSON.parse(raw);
  } catch (err) {
    console.error("Failed to load user state from storage", err);
    return null;
  }
}

/** Sync progress to backend if an auth token is active */
function syncProgressToBackend(progress: Partial<UserSaveData>): void {
  try {
    const token = localStorage.getItem("ma_auth_token");
    if (!token) return;
    fetch("/api/auth/progress", {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ progress }),
    }).catch(() => {
      // Background sync non-fatal
    });
  } catch {
    // Non-fatal
  }
}

function syncSave(state: GameState): void {
  if (!state.ownerId) return;
  const data: UserSaveData = {
    coins: state.coins,
    xp: state.xp,
    xpMax: state.xpMax,
    level: state.level,
    playerName: state.playerName,
    ownedPartIds: state.ownedPartIds || [],
    ownedIntelIds: state.ownedIntelIds || [],
    installedParts: state.installedParts || {},
    unlockedMissionIds: state.unlockedMissionIds || [1],
    completedMissionIds: state.completedMissionIds || [],
    ownerId: state.ownerId,
  };
  saveUserStateToStorage(state.ownerId, data);
  syncProgressToBackend(data);
}

export const useGameStore = create<GameState>()(
  persist(
    (set, get) => ({
      coins: STARTING_COINS,
      xp: 150,
      xpMax: 500,
      level: 1,
      playerName: "Commander_01",
      ownedPartIds: [],
      ownedIntelIds: [],
      ownerId: null,
      installedParts: {},
      unlockedMissionIds: [1],
      completedMissionIds: [],
      pendingLevelUp: false,
      clearLevelUp: () => set({ pendingLevelUp: false }),

      isMissionUnlocked: (missionId: number) => {
        const state = get();
        // Mission 1 is unlocked for everyone.
        // Mission 2 unlocks at level 2.
        // Mission 3 unlocks at level 3.
        // Mission 4 unlocks at level 4.
        // Mission 5 unlocks at level 5.
        // Admin or manually unlocked missions in unlockedMissionIds are also accessible.
        return state.level >= missionId || (state.unlockedMissionIds || []).includes(missionId);
      },

      toggleInstalledPart: (categoryId, partId) => {
        set((state) => {
          const cur = state.installedParts?.[categoryId];
          const list = Array.isArray(cur) ? cur : cur ? [cur] : [];
          const next = list.includes(partId) ? list.filter((p) => p !== partId) : [...list, partId];
          const parts = { ...(state.installedParts || {}) };
          if (next.length) parts[categoryId] = next;
          else delete parts[categoryId];
          const nextState = { installedParts: parts };
          syncSave({ ...state, ...nextState });
          return nextState;
        });
      },

      consumeParts: (partIds) => {
        set((state) => {
          const gone = new Set(partIds);
          const installed: Record<string, string | string[]> = {};
          for (const [cat, v] of Object.entries(state.installedParts || {})) {
            const list = (Array.isArray(v) ? v : [v]).filter((id) => !gone.has(id));
            if (list.length) installed[cat] = list;
          }
          const nextState = {
            ownedPartIds: (state.ownedPartIds || []).filter((id) => !gone.has(id)),
            installedParts: installed,
          };
          syncSave({ ...state, ...nextState });
          return nextState;
        });
      },

      unlockMission: (missionId) => {
        set((state) => {
          const nextList = (state.unlockedMissionIds || []).includes(missionId)
            ? state.unlockedMissionIds
            : [...(state.unlockedMissionIds || []), missionId];
          const nextState = { unlockedMissionIds: nextList };
          syncSave({ ...state, ...nextState });
          return nextState;
        });
      },

      completeMission: (missionId) => {
        set((state) => {
          const completed = (state.completedMissionIds || []).includes(missionId)
            ? state.completedMissionIds
            : [...(state.completedMissionIds || []), missionId];
          const nextState = { completedMissionIds: completed };
          syncSave({ ...state, ...nextState });
          return nextState;
        });
      },

      recalcUnlockedMissions: () => {
        set((state) => {
          const newlyUnlocked = [1, 2, 3, 4, 5].filter((id) => id <= state.level);
          const merged = Array.from(new Set([1, ...(state.unlockedMissionIds || []), ...newlyUnlocked]));
          const nextState = { unlockedMissionIds: merged };
          syncSave({ ...state, ...nextState });
          return nextState;
        });
      },

      setInstalledPart: (categoryId, partId) => {
        set((state) => {
          const next = { ...(state.installedParts || {}) };
          if (partId) next[categoryId] = partId;
          else delete next[categoryId];
          const nextState = { installedParts: next };
          syncSave({ ...state, ...nextState });
          return nextState;
        });
      },

      buyPart: (part: MarketPart) => {
        const state = get();
        const owned = state.ownedPartIds || [];
        if (owned.includes(part.id)) {
          return { success: false, reason: "Already owned!" };
        }
        if (state.coins < part.price) {
          return { success: false, reason: "Insufficient funds!" };
        }
        const nextState = {
          coins: state.coins - part.price,
          ownedPartIds: [...owned, part.id],
        };
        set(nextState);
        syncSave({ ...state, ...nextState });
        return { success: true };
      },

      isPartOwned: (partId: string) => {
        return (get().ownedPartIds || []).includes(partId);
      },

      buyIntel: (intel: MarketIntel) => {
        const state = get();
        const owned = state.ownedIntelIds || [];
        if (owned.includes(intel.id)) {
          return { success: false, reason: "Intel report already in inventory!" };
        }
        if (state.coins < intel.price) {
          return { success: false, reason: "Insufficient funds for classified intel!" };
        }
        const nextState = {
          coins: state.coins - intel.price,
          ownedIntelIds: [...owned, intel.id],
        };
        set(nextState);
        syncSave({ ...state, ...nextState });
        return { success: true };
      },

      isIntelOwned: (intelId: string) => {
        return (get().ownedIntelIds || []).includes(intelId);
      },

      canAfford: (price: number) => {
        return get().coins >= price;
      },

      addCoins: (amount: number) => {
        set((state) => {
          const nextState = { coins: state.coins + amount };
          syncSave({ ...state, ...nextState });
          return nextState;
        });
      },

      addXp: (amount: number) => {
        set((state) => {
          let newXp = state.xp + amount;
          let newLevel = state.level;
          let newXpMax = state.xpMax;
          while (newXp >= newXpMax) {
            newXp -= newXpMax;
            newLevel += 1;
            newXpMax = Math.round(newXpMax * 1.5);
          }

          // Mission unlock logic:
          // Level 1: Mission 1
          // Level 2: Mission 2
          // Level 3: Mission 3
          // Level 4: Mission 4
          // Level 5: Mission 5
          const newlyUnlocked = [1, 2, 3, 4, 5].filter((id) => id <= newLevel);
          const mergedUnlocked = Array.from(new Set([1, ...(state.unlockedMissionIds || []), ...newlyUnlocked]));

          const nextState = {
            xp: newXp,
            level: newLevel,
            xpMax: newXpMax,
            unlockedMissionIds: mergedUnlocked,
            pendingLevelUp: state.pendingLevelUp || newLevel > state.level,
          };
          syncSave({ ...state, ...nextState });
          return nextState;
        });
      },

      saveCurrentProgress: () => {
        syncSave(get());
      },

      logoutUser: () => {
        const state = get();
        if (state.ownerId) {
          // Save user's state to their specific storage slot
          syncSave(state);
        }
        // Reset active session to default guest state
        set({
          coins: STARTING_COINS,
          xp: 150,
          xpMax: 500,
          level: 1,
          playerName: "Commander_01",
          ownedPartIds: [],
          ownedIntelIds: [],
          ownerId: null,
          installedParts: {},
          unlockedMissionIds: [1],
          completedMissionIds: [],
          pendingLevelUp: false,
        });
      },

      resetProgress: () => {
        set({
          coins: STARTING_COINS,
          xp: 150,
          xpMax: 500,
          level: 1,
          playerName: "Commander_01",
          ownedPartIds: [],
          ownedIntelIds: [],
          ownerId: null,
          installedParts: {},
          unlockedMissionIds: [1],
          completedMissionIds: [],
          pendingLevelUp: false,
        });
      },

      switchUser: (userId: string, playerName?: string, remoteProgress?: any) => {
        const current = get();

        // If currently on this user and already initialized, update name if needed
        if (current.ownerId === userId) {
          if (playerName && current.playerName !== playerName) {
            set({ playerName });
            syncSave({ ...current, playerName });
          }
          return;
        }

        // Save previous user if different
        if (current.ownerId && current.ownerId !== userId) {
          syncSave(current);
        }

        const isAdmin = userId === "usr-admin-gigz-001";
        // Check local storage save for this specific user
        const localSave = loadUserStateFromStorage(userId);
        // Prioritize local save or remote progress
        const saved = localSave || remoteProgress;

        if (saved) {
          const restoredLevel = typeof saved.level === "number" ? saved.level : (isAdmin ? 20 : 1);
          const unlockedFromLevel = [1, 2, 3, 4, 5].filter((id) => id <= restoredLevel);
          const restoredUnlocked = Array.from(new Set([
            1,
            ...(saved.unlockedMissionIds || []),
            ...unlockedFromLevel,
            ...(isAdmin ? [2, 3, 4, 5] : []),
          ]));

          const nextState: Partial<GameState> = {
            coins: typeof saved.coins === "number" ? saved.coins : (isAdmin ? 200_000_000 : STARTING_COINS),
            xp: typeof saved.xp === "number" ? saved.xp : (isAdmin ? 0 : 150),
            xpMax: typeof saved.xpMax === "number" ? saved.xpMax : (isAdmin ? 99999 : 500),
            level: restoredLevel,
            playerName: playerName || saved.playerName || (isAdmin ? "ADMIN_GIGZ" : "Commander_01"),
            ownedPartIds: Array.isArray(saved.ownedPartIds) ? saved.ownedPartIds : [],
            ownedIntelIds: Array.isArray(saved.ownedIntelIds) ? saved.ownedIntelIds : [],
            ownerId: userId,
            installedParts: saved.installedParts && typeof saved.installedParts === "object" ? saved.installedParts : {},
            unlockedMissionIds: restoredUnlocked,
            completedMissionIds: Array.isArray(saved.completedMissionIds) ? saved.completedMissionIds : [],
            pendingLevelUp: false,
          };
          set(nextState as GameState);
          syncSave({ ...current, ...nextState } as GameState);
          return;
        }

        // New user initialization
        const initialLevel = isAdmin ? 20 : 1;
        const initialUnlocked = isAdmin ? [1, 2, 3, 4, 5] : [1];
        const initialCoins = isAdmin ? 200_000_000 : STARTING_COINS;
        const initialXp = isAdmin ? 0 : 150;
        const initialXpMax = isAdmin ? 99999 : 500;
        const initialName = playerName || (isAdmin ? "ADMIN_GIGZ" : "Commander_01");

        const newState: Partial<GameState> = {
          coins: initialCoins,
          xp: initialXp,
          xpMax: initialXpMax,
          level: initialLevel,
          playerName: initialName,
          ownedPartIds: [],
          ownedIntelIds: [],
          ownerId: userId,
          installedParts: {},
          unlockedMissionIds: initialUnlocked,
          completedMissionIds: isAdmin ? [1, 2, 3, 4, 5] : [],
          pendingLevelUp: false,
        };
        set(newState as GameState);
        syncSave({ ...current, ...newState } as GameState);
      },
    }),
    {
      name: "mission_architect_game_state",
    }
  )
);
