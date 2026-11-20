import { Router, Request, Response, NextFunction } from "express";
import { z } from "zod";
import { authService } from "../services/auth.service";
import { userRepository } from "../repositories/user.repository";

export const authRoutes = Router();

// In-memory lightweight rate limiter (no external deps)
const attemptsMap = new Map<string, { count: number; resetAt: number }>();
const loginRateLimit = (req: Request, res: Response, next: NextFunction) => {
  const ip = req.ip || req.socket.remoteAddress || "unknown";
  const now = Date.now();
  const entry = attemptsMap.get(ip);
  if (!entry || now > entry.resetAt) {
    attemptsMap.set(ip, { count: 1, resetAt: now + 60_000 });
    return next();
  }
  if (entry.count >= 20) {
    return res.status(429).json({ error: "Too many login attempts. Please try again later." });
  }
  entry.count++;
  return next();
};

const loginSchema = z.object({
  username: z.string().min(1, "Username is required"),
  password: z.string().min(1, "Password is required"),
});

const registerSchema = z.object({
  username: z.string().min(3, "Username must be at least 3 characters").max(32),
  password: z.string().min(6, "Password must be at least 6 characters"),
  callsign: z.string().max(40).optional(),
});

// POST /api/auth/register
authRoutes.post("/register", (req, res, next) => {
  try {
    const input = registerSchema.parse(req.body);
    const result = authService.register(input.username, input.password, input.callsign);
    res.status(201).json(result);
  } catch (err) {
    next(err);
  }
});

// POST /api/auth/login
authRoutes.post("/login", loginRateLimit, (req, res, next) => {
  try {
    const input = loginSchema.parse(req.body);
    const result = authService.login(input.username, input.password);
    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
});

// GET /api/auth/me
authRoutes.get("/me", (req, res, next) => {
  try {
    const user = authService.getMe(req.headers.authorization);
    res.json({ user });
  } catch (err) {
    next(err);
  }
});

// PUT /api/auth/progress
authRoutes.put("/progress", (req, res, next) => {
  try {
    const user = authService.getMe(req.headers.authorization);
    const updated = userRepository.updateProgress(user.id, req.body.progress || req.body);
    res.json({ success: true, progress: updated?.progress });
  } catch (err) {
    next(err);
  }
});

// POST /api/auth/logout
authRoutes.post("/logout", (req, res, next) => {
  try {
    const result = authService.logout(req.headers.authorization);
    res.json(result);
  } catch (err) {
    next(err);
  }
});

// DELETE /api/auth/account
authRoutes.delete("/account", (req, res, next) => {
  try {
    const { password } = req.body || {};
    const result = authService.deleteAccount(req.headers.authorization, password);
    res.json(result);
  } catch (err) {
    next(err);
  }
});

// POST /api/auth/reset
authRoutes.post("/reset", (req, res, next) => {
  try {
    const { password } = req.body || {};
    const result = authService.resetAccount(req.headers.authorization, password);
    res.json(result);
  } catch (err) {
    next(err);
  }
});
