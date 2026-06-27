import { Router } from "express";
import {
    createWorkspace,
    addMember,
    sendInvite,
    verifyInvite,
    acceptInvite,
    listWorkspaceMembers,
    updateRole,
    updateCustomPermissions,
    removeUser
} from "../controllers/workspace.controller";
import { requireAuth, requireWorkspaceRole } from "../middlewares/auth.middleware";
import { WorkspaceRole } from "@prisma/client";

const workspaceRoutes = Router();

// --- Core Workspace ---
workspaceRoutes.post("/create", requireAuth, createWorkspace);

// Any member can view the team
workspaceRoutes.get(
    "/:workspaceId/members",
    requireAuth,
    requireWorkspaceRole(WorkspaceRole.OWNER, WorkspaceRole.ADMIN, WorkspaceRole.MEMBER),
    listWorkspaceMembers
);

// Only Admins or Owners can modify roles, permissions, or add/invite members
workspaceRoutes.patch(
    "/:workspaceId/members/role",
    requireAuth,
    requireWorkspaceRole(WorkspaceRole.OWNER, WorkspaceRole.ADMIN),
    updateRole
);

workspaceRoutes.patch(
    "/:workspaceId/members/permissions",
    requireAuth,
    requireWorkspaceRole(WorkspaceRole.OWNER, WorkspaceRole.ADMIN),
    updateCustomPermissions
);

workspaceRoutes.delete(
    "/:workspaceId/members/remove",
    requireAuth,
    requireWorkspaceRole(WorkspaceRole.OWNER, WorkspaceRole.ADMIN),
    removeUser
);

workspaceRoutes.post(
    "/:workspaceId/members/add",
    requireAuth,
    requireWorkspaceRole(WorkspaceRole.OWNER, WorkspaceRole.ADMIN),
    addMember
);

workspaceRoutes.post(
    "/:workspaceId/members/invite",
    requireAuth,
    requireWorkspaceRole(WorkspaceRole.OWNER, WorkspaceRole.ADMIN),
    sendInvite
);

// --- Invite Validation  ---
workspaceRoutes.get("/invites/verify", verifyInvite);
workspaceRoutes.post("/invites/accept", requireAuth, acceptInvite);

export default workspaceRoutes;