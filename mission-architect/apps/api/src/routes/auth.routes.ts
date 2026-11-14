import { Router } from "express";
import { z } from "zod";
import { authService } from "../services/auth.service";

export const authRoutes = Router();

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
authRoutes.post("/login", (req, res, next) => {
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

// POST /api/auth/logout
authRoutes.post("/logout", (req, res, next) => {
  try {
    const result = authService.logout(req.headers.authorization);
    res.json(result);
  } catch (err) {
    next(err);
  }
});
