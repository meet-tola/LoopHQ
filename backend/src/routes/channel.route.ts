import { Router } from "express";
import {
    handleCreateChannel,
    handleGetChannels,
    handleJoinChannel,
    handleLeaveChannel,
    handleDeleteChannel
} from "../controllers/channel.controller";
import { requireAuth, requireWorkspaceRole } from "../middlewares/auth.middleware";
import { WorkspaceRole } from "@prisma/client";

const channelRoutes = Router();
channelRoutes.use(requireAuth);

// --- List & Create Channels inside a Workspace ---
channelRoutes.get(
    "/:workspaceId",
    requireWorkspaceRole(WorkspaceRole.OWNER, WorkspaceRole.ADMIN, WorkspaceRole.MEMBER),
    handleGetChannels
);

channelRoutes.post(
    "/:workspaceId",
    requireWorkspaceRole(WorkspaceRole.OWNER, WorkspaceRole.ADMIN),
    handleCreateChannel
);

// --- Individual Channel Membership & Administration Actions ---
channelRoutes.post(
    "/:workspaceId/:channelId/join",
    requireWorkspaceRole(WorkspaceRole.OWNER, WorkspaceRole.ADMIN, WorkspaceRole.MEMBER),
    handleJoinChannel
);

channelRoutes.post(
    "/:workspaceId/:channelId/leave",
    requireWorkspaceRole(WorkspaceRole.OWNER, WorkspaceRole.ADMIN, WorkspaceRole.MEMBER),
    handleLeaveChannel
);

channelRoutes.delete(
    "/:workspaceId/:channelId",
    requireWorkspaceRole(WorkspaceRole.OWNER, WorkspaceRole.ADMIN),
    handleDeleteChannel
);

export default channelRoutes;