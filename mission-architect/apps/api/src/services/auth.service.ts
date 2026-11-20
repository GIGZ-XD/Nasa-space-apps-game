import crypto from "crypto";
import { HttpError } from "../middleware/error.middleware";
import { userRepository } from "../repositories/user.repository";
import type { AuthResponse, User } from "../types/auth";

function hashPassword(password: string, salt: string): string {
  return crypto.pbkdf2Sync(password, salt, 10000, 64, "sha512").toString("hex");
}

function sanitizeUser(stored: { id: string; username: string; callsign?: string; createdAt: string; lastLoginAt?: string; progress?: any }): User {
  return {
    id: stored.id,
    username: stored.username,
    callsign: stored.callsign,
    createdAt: stored.createdAt,
    lastLoginAt: stored.lastLoginAt,
    progress: stored.progress,
  };
}

export const authService = {
  register(username: string, password: string, callsign?: string): AuthResponse {
    if (!username || typeof username !== "string") {
      throw new HttpError(400, "VALIDATION_ERROR", "Username is required");
    }
    const cleanUsername = username.trim();
    if (cleanUsername.length < 3 || cleanUsername.length > 32) {
      throw new HttpError(400, "VALIDATION_ERROR", "Username must be between 3 and 32 characters");
    }
    if (!/^[a-zA-Z0-9_-]+$/.test(cleanUsername)) {
      throw new HttpError(400, "VALIDATION_ERROR", "Username may only contain letters, numbers, hyphens, and underscores");
    }
    if (!password || typeof password !== "string" || password.length < 6) {
      throw new HttpError(400, "VALIDATION_ERROR", "Password must be at least 6 characters long");
    }

    const existing = userRepository.findByUsername(cleanUsername);
    if (existing) {
      throw new HttpError(409, "USER_EXISTS", `Username '${cleanUsername}' is already assigned in Space Command registry`);
    }

    const salt = crypto.randomBytes(16).toString("hex");
    const passwordHash = hashPassword(password, salt);
    const created = userRepository.create(cleanUsername, passwordHash, salt, callsign);
    const token = userRepository.createSession(created.id);

    return {
      user: sanitizeUser(created),
      token,
      message: `Cadet ${cleanUsername} clearance granted. Welcome to Space Command.`,
    };
  },

  login(username: string, password: string): AuthResponse {
    if (!username || !password) {
      throw new HttpError(400, "VALIDATION_ERROR", "Username and password are required");
    }

    const user = userRepository.findByUsername(username);
    if (!user) {
      throw new HttpError(401, "INVALID_CREDENTIALS", "Invalid username or password");
    }

    const inputHash = hashPassword(password, user.salt);
    const isMatch = crypto.timingSafeEqual(Buffer.from(inputHash), Buffer.from(user.passwordHash));

    if (!isMatch) {
      throw new HttpError(401, "INVALID_CREDENTIALS", "Invalid username or password");
    }

    userRepository.updateLastLogin(user.id);
    const token = userRepository.createSession(user.id);

    return {
      user: sanitizeUser(user),
      token,
      message: `Authentication verified. Welcome back to mission control, ${user.callsign || user.username}.`,
    };
  },

  getMe(authHeader?: string): User {
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      throw new HttpError(401, "UNAUTHORIZED", "Missing or malformed Authorization header");
    }
    const token = authHeader.slice(7).trim();
    const user = userRepository.getSessionUser(token);
    if (!user) {
      throw new HttpError(401, "INVALID_SESSION", "Session expired or invalid. Please log in again.");
    }
    return user;
  },

  logout(authHeader?: string): { success: boolean; message: string } {
    if (authHeader && authHeader.startsWith("Bearer ")) {
      const token = authHeader.slice(7).trim();
      userRepository.revokeSession(token);
    }
    return { success: true, message: "Logged out from Space Command successfully." };
  },
};
