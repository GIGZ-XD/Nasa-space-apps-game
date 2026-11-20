import crypto from "crypto";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import type { StoredUser, User, AuthSession } from "../types/auth";

// Persistence file for users
const USERS_FILE =
  process.env.USERS_FILE ||
  path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../data/users.json");

// Initial seed demo user for instant testing
const seedSalt = crypto.randomBytes(16).toString("hex");
const seedHash = crypto.pbkdf2Sync("spaceapps2026", seedSalt, 10000, 64, "sha512").toString("hex");

// Admin account — ADMIN_GIGZ
const adminSalt = "a9f4c2b1e3d8f7a6b5c4d3e2f1a0b9c8";
const adminHash = crypto.pbkdf2Sync("propqwert@123", adminSalt, 10000, 64, "sha512").toString("hex");

const usersByUsername = new Map<string, StoredUser>();
const usersById = new Map<string, StoredUser>();

// Active sessions map: token -> AuthSession (expires in 24h)
const activeSessions = new Map<string, AuthSession>();

const SESSION_TTL_MS = 24 * 60 * 60 * 1000;

function saveToDisk() {
  if (process.env.USERS_FILE === ":memory:") return;
  try {
    fs.mkdirSync(path.dirname(USERS_FILE), { recursive: true });
    const list = Array.from(usersById.values());
    fs.writeFileSync(USERS_FILE, JSON.stringify(list, null, 2), "utf8");
  } catch (err) {
    console.error("Failed to save users to disk", err);
  }
}

function loadFromDisk() {
  if (process.env.USERS_FILE === ":memory:") return;
  try {
    if (fs.existsSync(USERS_FILE)) {
      const content = fs.readFileSync(USERS_FILE, "utf8");
      const list: StoredUser[] = JSON.parse(content);
      for (const u of list) {
        usersById.set(u.id, u);
        usersByUsername.set(u.username.trim().toLowerCase(), u);
      }
    }
  } catch (err) {
    console.error("Failed to load users from disk", err);
  }

  // Ensure default seed accounts exist
  if (!usersByUsername.has("commander")) {
    const commanderUser: StoredUser = {
      id: "usr-commander-001",
      username: "commander",
      callsign: "Vanguard One",
      passwordHash: seedHash,
      salt: seedSalt,
      createdAt: new Date().toISOString(),
      lastLoginAt: new Date().toISOString(),
    };
    usersByUsername.set("commander", commanderUser);
    usersById.set("usr-commander-001", commanderUser);
  }

  if (!usersByUsername.has("admin_gigz")) {
    const adminUser: StoredUser = {
      id: "usr-admin-gigz-001",
      username: "ADMIN_GIGZ",
      callsign: "ADMIN_GIGZ",
      passwordHash: adminHash,
      salt: adminSalt,
      createdAt: new Date().toISOString(),
      lastLoginAt: new Date().toISOString(),
      progress: {
        coins: 200_000_000,
        xp: 0,
        xpMax: 99999,
        level: 20,
        unlockedMissionIds: [1, 2, 3, 4, 5],
        completedMissionIds: [1, 2, 3, 4, 5],
      },
    };
    usersByUsername.set("admin_gigz", adminUser);
    usersById.set("usr-admin-gigz-001", adminUser);
  }
}

loadFromDisk();

export const userRepository = {
  findByUsername(username: string): StoredUser | undefined {
    return usersByUsername.get(username.trim().toLowerCase());
  },

  findById(id: string): StoredUser | undefined {
    return usersById.get(id);
  },

  create(username: string, passwordHash: string, salt: string, callsign?: string): StoredUser {
    const trimmed = username.trim();
    const normalized = trimmed.toLowerCase();
    const id = `usr-${Date.now()}-${crypto.randomBytes(3).toString("hex")}`;
    const user: StoredUser = {
      id,
      username: trimmed,
      callsign: callsign?.trim() || `Pilot ${trimmed}`,
      passwordHash,
      salt,
      createdAt: new Date().toISOString(),
      progress: {
        coins: 5_000_000,
        xp: 150,
        xpMax: 500,
        level: 1,
        ownedPartIds: [],
        ownedIntelIds: [],
        installedParts: {},
        unlockedMissionIds: [1],
        completedMissionIds: [],
      },
    };
    usersByUsername.set(normalized, user);
    usersById.set(id, user);
    saveToDisk();
    return user;
  },

  updateLastLogin(userId: string): void {
    const user = usersById.get(userId);
    if (user) {
      user.lastLoginAt = new Date().toISOString();
      saveToDisk();
    }
  },

  updateProgress(userId: string, progress: any): StoredUser | undefined {
    const user = usersById.get(userId);
    if (user) {
      user.progress = { ...(user.progress || {}), ...progress };
      saveToDisk();
    }
    return user;
  },

  createSession(userId: string): string {
    const token = `tok_${crypto.randomBytes(32).toString("hex")}`;
    const now = Date.now();
    activeSessions.set(token, {
      token,
      userId,
      createdAt: now,
      expiresAt: now + SESSION_TTL_MS,
    });
    return token;
  },

  getSessionUser(token: string): User | undefined {
    const session = activeSessions.get(token);
    if (!session) return undefined;
    if (Date.now() > session.expiresAt) {
      activeSessions.delete(token);
      return undefined;
    }
    const stored = usersById.get(session.userId);
    if (!stored) return undefined;
    const { passwordHash: _p, salt: _s, ...user } = stored;
    return user;
  },

  revokeSession(token: string): boolean {
    return activeSessions.delete(token);
  },

  getAllUsers(): StoredUser[] {
    return Array.from(usersById.values());
  },

  count(): number {
    return usersByUsername.size;
  },

  deleteUser(userId: string): boolean {
    const user = usersById.get(userId);
    if (!user) return false;
    usersById.delete(userId);
    usersByUsername.delete(user.username.trim().toLowerCase());
    // Revoke all sessions for this user
    for (const [token, session] of activeSessions.entries()) {
      if (session.userId === userId) activeSessions.delete(token);
    }
    saveToDisk();
    return true;
  },

  resetProgress(userId: string): StoredUser | undefined {
    const user = usersById.get(userId);
    if (!user) return undefined;
    user.progress = {
      coins: 5_000_000,
      xp: 150,
      xpMax: 500,
      level: 1,
      ownedPartIds: [],
      ownedIntelIds: [],
      installedParts: {},
      unlockedMissionIds: [1],
      completedMissionIds: [],
    };
    saveToDisk();
    return user;
  },
};
