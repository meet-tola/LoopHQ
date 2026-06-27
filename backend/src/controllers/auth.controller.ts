import { Request, Response } from "express";
import { CookieOptions } from "express-serve-static-core";
import * as AuthService from "../services/auth.service";
import {
  googleAuthSchema,
  registerSchema,
  loginSchema,
} from "../validators/auth.validator";
import logger from "../utils/logger";
import { HTTPSTATUS } from "../config/http.config";
import { asyncHandler } from "../middlewares/asyncHandler.middleware";

// --- Utility Constants & Helpers ---
const COOKIE_NAME = "loop_hq";

const getCookieOptions = (): CookieOptions => ({
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "strict",
  path: "/",
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
});

const setRefreshCookie = (res: Response, token: string): void => {
  res.cookie(COOKIE_NAME, token, getCookieOptions());
};

const extractBearerToken = (req: Request): string | null => {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith("Bearer ")) return null;
  return authHeader.split(" ")[1];
};

// --- All Controllers ---

export const googleSignIn = asyncHandler(async (req: Request, res: Response) => {
  const parsed = googleAuthSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(HTTPSTATUS.UNAUTHORIZED).json({
      message: "Validation failed",
      errors: parsed.error.flatten().fieldErrors,
    });
  }

  try {
    const { user, dbUser, session } = await AuthService.syncGoogleAuthUser(parsed.data.id_token);

    if (session?.refresh_token) {
      setRefreshCookie(res, session.refresh_token);
    }

    return res.status(HTTPSTATUS.OK).json({
      success: true,
      message: "OAuth Authentication Successful",
      user: dbUser,
      access_token: session?.access_token ?? null,
    });
  } catch (error: any) {
    logger.error(`googleSignIn error: ${error.message}`);
    return res.status(HTTPSTATUS.UNAUTHORIZED).json({ success: false, message: "Invalid or expired provider token" });
  }
});

export const register = asyncHandler(async (req: Request, res: Response) => {
  const parsed = registerSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(HTTPSTATUS.BAD_REQUEST).json({
      message: "Validation failed",
      errors: parsed.error.flatten().fieldErrors,
    });
  }

  try {
    const registerPayload = {
      email: parsed.data.email,
      password: parsed.data.password,
      username: parsed.data.username,
      inviteToken: parsed.data.inviteToken,
    };

    await AuthService.registerUser(registerPayload);
    return res.status(HTTPSTATUS.CREATED).json({
      success: true,
      message: "Account created successfully. Please verify your email.",
      email_confirmation_required: true,
    });
  } catch (error: any) {
    if (error.message?.includes("already registered")) {
      return res.status(HTTPSTATUS.IN_USE).json({ message: "Email already in use" });
    }
    logger.error(`register controller error: ${error.message}`);
    return res.status(HTTPSTATUS.INTERNAL_SERVER_ERROR).json({ success: false, message: "Registration failed" });
  }
});

export const verifyEmail = asyncHandler(async (req: Request, res: Response) => {
  const { access_token } = req.body;
  if (!access_token) {
    return res.status(HTTPSTATUS.BAD_REQUEST).json({ success: false, message: "Missing access token" });
  }

  try {
    const { user, dbUser, session } = await AuthService.verifyEmail(access_token);

    if (session?.refresh_token) {
      setRefreshCookie(res, session.refresh_token);
    }

    return res.status(HTTPSTATUS.OK).json({
      success: true,
      message: "Email verified successfully",
      user: dbUser,
      access_token: session?.access_token || access_token,
      email_confirmation_required: false,
    });
  } catch (error: any) {
    logger.error(`verifyEmail controller error: ${error.message}`);
    return res.status(HTTPSTATUS.BAD_REQUEST).json({
      success: false,
      message: error.message || "Invalid or expired verification link",
    });
  }
});

export const login = asyncHandler(async (req: Request, res: Response) => {
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(HTTPSTATUS.BAD_REQUEST).json({
      message: "Validation failed",
      errors: parsed.error.flatten().fieldErrors,
    });
  }

  try {
    const { session, user, dbUser } = await AuthService.loginUser(parsed.data);
    setRefreshCookie(res, session.refresh_token);

    return res.status(HTTPSTATUS.OK).json({
      success: true,
      message: "Login successful",
      user: dbUser,
      access_token: session.access_token,
    });
  } catch (error: any) {
    if (error.message?.includes("Invalid login credentials")) {
      return res.status(HTTPSTATUS.UNAUTHORIZED).json({ success: false, message: "Invalid email or password" });
    }
    logger.error(`login controller error: ${error.message}`);
    return res.status(HTTPSTATUS.INTERNAL_SERVER_ERROR).json({ success: false, message: "Login failed" });
  }
});

export const logout = asyncHandler(async (req: Request, res: Response) => {
  const accessToken = extractBearerToken(req);
  if (!accessToken) {
    return res.status(HTTPSTATUS.UNAUTHORIZED).json({ success: false, message: "No token provided" });
  }

  try {
    await AuthService.logoutUser(accessToken);
    res.clearCookie(COOKIE_NAME);
    return res.status(HTTPSTATUS.OK).json({ success: true, message: "Logged out successfully" });
  } catch (error: any) {
    logger.error(`logout controller error: ${error.message}`);
    return res.status(HTTPSTATUS.INTERNAL_SERVER_ERROR).json({ success: false, message: "Logout failed" });
  }
});

export const refresh = asyncHandler(async (req: Request, res: Response) => {
  const refreshToken = req.cookies?.[COOKIE_NAME] || req.body?.refresh_token;
  if (!refreshToken) {
    return res.status(HTTPSTATUS.UNAUTHORIZED).json({ message: "No refresh token provided" });
  }

  try {
    const session = await AuthService.refreshSession(refreshToken);
    setRefreshCookie(res, session.refresh_token);

    return res.status(HTTPSTATUS.OK).json({
      access_token: session.access_token,
      expires_at: session.expires_at,
    });
  } catch (error: any) {
    res.clearCookie(COOKIE_NAME);
    logger.error(`refresh controller error: ${error.message}`);
    return res.status(HTTPSTATUS.UNAUTHORIZED).json({ message: "Invalid or expired refresh token" });
  }
});

export const resendVerification = asyncHandler(async (req: Request, res: Response) => {
  const { email } = req.body;
  if (!email || typeof email !== "string") {
    return res.status(HTTPSTATUS.UNAUTHORIZED).json({ success: false, message: "A valid email is required" });
  }

  try {
    await AuthService.resendVerificationToken(email);
    return res.status(HTTPSTATUS.OK).json({
      success: true,
      message: "A fresh email verification link has been sent.",
    });
  } catch (error: any) {
    logger.error(`resendVerification controller error: ${error.message}`);
    const statusCode = error.message === "User not found" ? 404 : 400;
    return res.status(statusCode).json({ success: false, message: error.message });
  }
});

export const forgotPassword = asyncHandler(async (req: Request, res: Response) => {
  const { email } = req.body;
  if (!email || typeof email !== "string") {
    return res.status(HTTPSTATUS.UNAUTHORIZED).json({ success: false, message: "A valid email is required" });
  }

  try {
    await AuthService.initiatePasswordReset(email);
    return res.status(HTTPSTATUS.OK).json({
      success: true,
      message: "Password reset instructions have been sent to your email.",
    });
  } catch (error: any) {
    logger.error(`forgotPassword controller error: ${error.message}`);
    if (error.message === "User not found") {
      return res.status(HTTPSTATUS.NOT_FOUND).json({ success: false, message: error.message });
    }
    return res.status(HTTPSTATUS.INTERNAL_SERVER_ERROR).json({ success: false, message: "Failed to send recovery email" });
  }
});

export const resetPassword = asyncHandler(async (req: Request, res: Response) => {
  const { access_token, password } = req.body;
  const accessToken = access_token || extractBearerToken(req);

  if (!accessToken) {
    return res.status(HTTPSTATUS.UNAUTHORIZED).json({ success: false, message: "Authorization token missing" });
  }
  if (!password || typeof password !== "string") {
    return res.status(HTTPSTATUS.UNAUTHORIZED).json({ success: false, message: "New password is required" });
  }

  try {
    await AuthService.finalizePasswordReset(accessToken, password);
    return res.status(HTTPSTATUS.OK).json({
      success: true,
      message: "Password updated successfully. You can now log in with your new password.",
    });
  } catch (error: any) {
    logger.error(`resetPassword controller error: ${error.message}`);
    return res.status(HTTPSTATUS.BAD_REQUEST).json({
      success: false,
      message: error.message || "Failed to update password.",
    });
  }
});

export const getMe = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user?.id;

  if (!userId) {
    return res.status(HTTPSTATUS.UNAUTHORIZED).json({ message: "User not found" });
  }

  try {
    const user = await AuthService.getUserById(userId);
    return res.status(HTTPSTATUS.OK).json({ success: true, data: user });
  } catch (error) {
    logger.error(`getMe controller error: ${(error as Error).message}`);
    return res.status(HTTPSTATUS.NOT_FOUND).json({
      success: false,
      message: (error as Error).message,
    });
  }
});