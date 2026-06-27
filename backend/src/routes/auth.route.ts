import { Router } from "express";
import {
    googleSignIn,
    register,
    verifyEmail,
    login,
    logout,
    refresh,
    forgotPassword,
    resendVerification,
    resetPassword,
    getMe
} from "../controllers/auth.controller";
import { requireAuth } from "../middlewares/auth.middleware";

const authRoutes = Router()
    // Public routes (no token required)
    .post("/register", register)
    .post("/verify-email", verifyEmail)
    .post("/resend-verification", resendVerification)
    .post("/google-sign-in", googleSignIn)
    .post("/login", login)
    .post("/refresh", refresh)
    .post("/forgot-password", forgotPassword)

    // Protected routes (Bearer token required)
    .get("/user", requireAuth, getMe)
    .post("/reset-password", requireAuth, resetPassword)
    .post("/logout", requireAuth, logout)

export default authRoutes;