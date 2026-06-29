import { Router } from "express";
import authRoutes from "./auth.route";
import workspaceRoutes from "./workspace.route";
import channelRoutes from "./channel.route"
import dmRoutes from "./dm.route";
import messageRoutes from "./message.route";

const router = Router();
router.use("/auth", authRoutes);
router.use("/workspaces", workspaceRoutes);
router.use("/channels", channelRoutes);
router.use("/dms", dmRoutes);
router.use("/messages", messageRoutes);


export default router;