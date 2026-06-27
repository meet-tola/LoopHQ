import { Router } from "express";
import authRoutes from "./auth.route";
import workspaceRoutes from "./workspace.route";

const router = Router();
router.use("/auth", authRoutes);
router.use("/workspace", workspaceRoutes);

export default router;