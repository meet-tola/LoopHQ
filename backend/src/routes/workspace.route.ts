import { Router } from "express";
import {
    createWorkspace,
    listWorkspace,
    addMember,
    sendInvite,
    verifyInvite,
    acceptInvite,
    listWorkspaceMembers,
    updateRole,
    updateCustomPermissions,
    removeUser,
    createInviteCode,
    joinWithCode
} from "../controllers/workspace.controller";
import { requireAuth, requireWorkspaceRole } from "../middlewares/auth.middleware";
import { WorkspaceRole } from "@prisma/client";

const workspaceRoutes = Router();
workspaceRoutes.use(requireAuth);

// --- Core Workspace ---
workspaceRoutes.post("/create", requireAuth, createWorkspace);

// Any authenticated user can join a workspace if they have a valid code
workspaceRoutes.post("/join/code", joinWithCode);

// Any member can view the workspace
workspaceRoutes.get(
    "/",
    listWorkspace
);

// Only Admins or Owners can generate/rotate a unique invite code for the workspace
workspaceRoutes.post(
    "/:workspaceId/code",
    requireWorkspaceRole(WorkspaceRole.OWNER, WorkspaceRole.ADMIN),
    createInviteCode
);

// Any member can view the team
workspaceRoutes.get(
    "/:workspaceId/members",
    requireWorkspaceRole(WorkspaceRole.OWNER, WorkspaceRole.ADMIN, WorkspaceRole.MEMBER),
    listWorkspaceMembers
);

// Only Admins or Owners can modify roles, permissions, or add/invite members
workspaceRoutes.patch(
    "/:workspaceId/members/role",
    requireWorkspaceRole(WorkspaceRole.OWNER, WorkspaceRole.ADMIN),
    updateRole
);

workspaceRoutes.patch(
    "/:workspaceId/members/permissions",
    requireWorkspaceRole(WorkspaceRole.OWNER, WorkspaceRole.ADMIN),
    updateCustomPermissions
);

workspaceRoutes.delete(
    "/:workspaceId/members/remove",
    requireWorkspaceRole(WorkspaceRole.OWNER, WorkspaceRole.ADMIN),
    removeUser
);

workspaceRoutes.post(
    "/:workspaceId/members/add",
    requireWorkspaceRole(WorkspaceRole.OWNER, WorkspaceRole.ADMIN),
    addMember
);

workspaceRoutes.post(
    "/:workspaceId/members/invite",
    requireWorkspaceRole(WorkspaceRole.OWNER, WorkspaceRole.ADMIN),
    sendInvite
);

// --- Invite Validation  ---
workspaceRoutes.get("/invites/verify", verifyInvite);
workspaceRoutes.post("/invites/accept", requireAuth, acceptInvite);

export default workspaceRoutes;