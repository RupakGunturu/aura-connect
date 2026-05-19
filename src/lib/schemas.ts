import { z } from "zod";

export const signupSchema = z.object({
  email: z.string().trim().toLowerCase().email().max(255),
  password: z.string().min(8).max(72),
  handle: z
    .string()
    .trim()
    .toLowerCase()
    .regex(/^[a-z0-9_]{3,20}$/, "3–20 chars, lowercase letters, numbers, underscore"),
});

export const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email().max(255),
  password: z.string().min(1).max(72),
});

export const messageSchema = z.object({
  body: z.string().min(1).max(4000),
});

export const profileSchema = z.object({
  bio: z.string().max(280).optional(),
  avatarUrl: z.string().max(200_000).optional(),
});
