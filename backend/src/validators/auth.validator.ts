import { z } from "zod";

export const registerSchema = z.object({
  email: z
    .string()
    .nonempty("Email is required")
    .email("Invalid email address"),

  username: z
    .string()
    .nonempty("username is required")
    .min(6, "username must be at least 6 characters long"),

  password: z
    .string()
    .nonempty("Password is required")
    .min(6, "Password must be at least 6 characters long"),

  inviteToken: z.string().optional(),
});

export const loginSchema = z.object({
  email: z
    .string()
    .nonempty("Email is required")
    .email("Invalid email address"),

  password: z.string().nonempty("Password is required"),
});


export const googleAuthSchema = z.object({
  id_token: z.string().nonempty("Google ID Token is required"),
});

export const refreshSchema = z
  .object({
    refresh_token: z
      .string()
      .min(10, "Refresh token must be at least 10 characters")
      .optional(),
  })
  .passthrough();
