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
import { requireAuth } from "../middlewares/auth.middleware";

const workspaceRoutes = Router();

// --- Core Workspace ---
workspaceRoutes.post("/workspaces", requireAuth, createWorkspace);
workspaceRoutes.get("/workspaces/:workspaceId/members", requireAuth, listWorkspaceMembers);
workspaceRoutes.patch("/workspaces/:workspaceId/members/role", requireAuth, updateRole);
workspaceRoutes.patch("/workspaces/:workspaceId/members/permissions", requireAuth, updateCustomPermissions);
workspaceRoutes.delete("/workspaces/:workspaceId/members/remove", requireAuth, removeUser);

// --- Workspace Member Management & System Invites ---
workspaceRoutes.post("/workspaces/:workspaceId/members/add", requireAuth, addMember);
workspaceRoutes.post("/workspaces/:workspaceId/members/invite", requireAuth, sendInvite);
workspaceRoutes.get("/workspaces/invites/verify", verifyInvite); 
workspaceRoutes.post("/workspaces/invites/accept", requireAuth, acceptInvite);

export default workspaceRoutes;