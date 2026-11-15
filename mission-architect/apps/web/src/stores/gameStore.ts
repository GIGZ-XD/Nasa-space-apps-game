import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { MarketPart, MarketIntel } from "../data/marketData";

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
  /** Mission ids unlocked by completing the previous mission successfully. */
  unlockedMissionIds: number[];

  // Actions
  buyPart: (part: MarketPart) => { success: boolean; reason?: string };
  isPartOwned: (partId: string) => boolean;
  buyIntel: (intel: MarketIntel) => { success: boolean; reason?: string };
  isIntelOwned: (intelId: string) => boolean;
  canAfford: (price: number) => boolean;
  addCoins: (amount: number) => void;
  addXp: (amount: number) => void;
  setInstalledPart: (categoryId: string, partId: string | null) => void;
  /** Toggle a part in a category that holds several parts (sensors / landers). */
  toggleInstalledPart: (categoryId: string, partId: string) => void;
  unlockMission: (missionId: number) => void;
  resetProgress: () => void;
  /** Reset all progress unless the given user already owns the saved state. */
  switchUser: (userId: string, playerName?: string) => void;
}

export const STARTING_COINS = 50_000_000;

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
      unlockedMissionIds: [],

      toggleInstalledPart: (categoryId, partId) => {
        set((state) => {
          const cur = state.installedParts?.[categoryId];
          const list = Array.isArray(cur) ? cur : cur ? [cur] : [];
          const next = list.includes(partId) ? list.filter((p) => p !== partId) : [...list, partId];
          const parts = { ...(state.installedParts || {}) };
          if (next.length) parts[categoryId] = next;
          else delete parts[categoryId];
          return { installedParts: parts };
        });
      },

      unlockMission: (missionId) => {
        set((state) => ({
          unlockedMissionIds: (state.unlockedMissionIds || []).includes(missionId)
            ? state.unlockedMissionIds
            : [...(state.unlockedMissionIds || []), missionId],
        }));
      },

      setInstalledPart: (categoryId, partId) => {
        set((state) => {
          const next = { ...(state.installedParts || {}) };
          if (partId) next[categoryId] = partId;
          else delete next[categoryId];
          return { installedParts: next };
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
        set({
          coins: state.coins - part.price,
          ownedPartIds: [...owned, part.id],
        });
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
        set({
          coins: state.coins - intel.price,
          ownedIntelIds: [...owned, intel.id],
        });
        return { success: true };
      },

      isIntelOwned: (intelId: string) => {
        return (get().ownedIntelIds || []).includes(intelId);
      },

      canAfford: (price: number) => {
        return get().coins >= price;
      },

      addCoins: (amount: number) => {
        set((state) => ({ coins: state.coins + amount }));
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
          return { xp: newXp, level: newLevel, xpMax: newXpMax };
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
          unlockedMissionIds: [],
        });
      },

      switchUser: (userId: string, playerName?: string) => {
        if (get().ownerId === userId) return;
        set({
          coins: STARTING_COINS,
          xp: 150,
          xpMax: 500,
          level: 1,
          playerName: playerName || "Commander_01",
          ownedPartIds: [],
          ownedIntelIds: [],
          ownerId: userId,
          installedParts: {},
          unlockedMissionIds: [],
        });
      },
    }),
    {
      name: "mission_architect_game_state",
    }
  )
);
