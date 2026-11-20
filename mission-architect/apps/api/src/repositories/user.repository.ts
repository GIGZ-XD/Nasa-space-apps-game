import crypto from "crypto";
import type { StoredUser, User, AuthSession } from "../types/auth";

// Initial seed demo user for instant testing
const seedSalt = crypto.randomBytes(16).toString("hex");
const seedHash = crypto.pbkdf2Sync("spaceapps2026", seedSalt, 10000, 64, "sha512").toString("hex");

// Admin account — ADMIN_GIGZ
const adminSalt = "a9f4c2b1e3d8f7a6b5c4d3e2f1a0b9c8";
const adminHash = crypto.pbkdf2Sync("propqwert@123", adminSalt, 10000, 64, "sha512").toString("hex");

const usersByUsername = new Map<string, StoredUser>([
  [
    "commander",
    {
      id: "usr-commander-001",
      username: "commander",
      callsign: "Vanguard One",
      passwordHash: seedHash,
      salt: seedSalt,
      createdAt: new Date().toISOString(),
      lastLoginAt: new Date().toISOString(),
    },
  ],
  [
    "admin_gigz",
    {
      id: "usr-admin-gigz-001",
      username: "ADMIN_GIGZ",
      callsign: "ADMIN_GIGZ",
      passwordHash: adminHash,
      salt: adminSalt,
      createdAt: new Date().toISOString(),
      lastLoginAt: new Date().toISOString(),
    },
  ],
]);

const usersById = new Map<string, StoredUser>([
  ["usr-commander-001", usersByUsername.get("commander")!],
  ["usr-admin-gigz-001", usersByUsername.get("admin_gigz")!],
]);

// Active sessions map: token -> AuthSession (expires in 24h)
const activeSessions = new Map<string, AuthSession>();

const SESSION_TTL_MS = 24 * 60 * 60 * 1000;

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
    };
    usersByUsername.set(normalized, user);
    usersById.set(id, user);
    return user;
  },

  updateLastLogin(userId: string): void {
    const user = usersById.get(userId);
    if (user) {
      user.lastLoginAt = new Date().toISOString();
    }
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

  count(): number {
    return usersByUsername.size;
  },
};
