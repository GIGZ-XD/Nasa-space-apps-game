import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { MarketPart } from "../data/marketData";

export interface GameState {
  coins: number;
  xp: number;
  xpMax: number;
  level: number;
  playerName: string;
  ownedPartIds: string[];
  ownerId: string | null;

  // Actions
  buyPart: (part: MarketPart) => { success: boolean; reason?: string };
  isPartOwned: (partId: string) => boolean;
  canAfford: (price: number) => boolean;
  addCoins: (amount: number) => void;
  addXp: (amount: number) => void;
  resetProgress: () => void;
  /** Reset all progress unless the given user already owns the saved state. */
  switchUser: (userId: string, playerName?: string) => void;
}

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
      coins: 2_500_000,
      xp: 150,
      xpMax: 500,
      level: 1,
      playerName: "Commander_01",
      ownedPartIds: [],
      ownerId: null,

      buyPart: (part: MarketPart) => {
        const state = get();
        if (state.ownedPartIds.includes(part.id)) {
          return { success: false, reason: "Already owned!" };
        }
        if (state.coins < part.price) {
          return { success: false, reason: "Insufficient funds!" };
        }
        set({
          coins: state.coins - part.price,
          ownedPartIds: [...state.ownedPartIds, part.id],
        });
        return { success: true };
      },

      isPartOwned: (partId: string) => {
        return get().ownedPartIds.includes(partId);
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
          coins: 2_500_000,
          xp: 150,
          xpMax: 500,
          level: 1,
          playerName: "Commander_01",
          ownedPartIds: [],
          ownerId: null,
        });
      },

      switchUser: (userId: string, playerName?: string) => {
        if (get().ownerId === userId) return;
        set({
          coins: 2_500_000,
          xp: 150,
          xpMax: 500,
          level: 1,
          playerName: playerName || "Commander_01",
          ownedPartIds: [],
          ownerId: userId,
        });
      },
    }),
    {
      name: "mission_architect_game_state",
    }
  )
);
