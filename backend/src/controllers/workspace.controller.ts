import { Request, Response } from "express";
import { WorkspaceRole } from "@prisma/client";
import * as WorkspaceService from "../services/workspace.service.js";
import logger from "../utils/logger.js";
import { HTTPSTATUS } from "../config/http.config.js";

interface CreateWorkspaceBody {
    name: string;
    slug: string;
}

interface AddMemberBody {
    email: string;
}

interface InviteBody {
    email: string;
}

interface UpdateRoleBody {
    targetUserId: string;
    role: WorkspaceRole;
}

interface UpdatePermissionsBody {
    targetUserId: string;
    permissions: Record<string, boolean>;
}

interface RemoveUserBody {
    targetUserId: string;
}

interface SendInviteBody {
    email: string;
}

export const createWorkspace = async (req: Request, res: Response): Promise<void> => {
    const userId = req.user?.id;
    const { name, slug } = req.body as CreateWorkspaceBody;

    if (!userId) {
        res.status(HTTPSTATUS.UNAUTHORIZED).json({ message: "User not found" });
        return;
    }
    if (!name || !slug) {
        res.status(HTTPSTATUS.BAD_REQUEST).json({ message: "Missing required fields: name and slug" });
        return;
    }

    try {
        const workspace = await WorkspaceService.createWorkspace({ name, slug, userId });
        res.status(HTTPSTATUS.CREATED).json({ success: true, data: workspace });
    } catch (error) {
        logger.error(`createWorkspace controller error: ${(error as Error).message}`);
        res.status(HTTPSTATUS.BAD_REQUEST).json({ success: false, message: (error as Error).message });
    }
};

export const addMember = async (req: Request, res: Response): Promise<void> => {
    const workspaceId = req.params.workspaceId as string;
    const { email } = req.body as AddMemberBody;
    const requestedByUserId = req.user?.id;

    if (!requestedByUserId) {
        res.status(HTTPSTATUS.UNAUTHORIZED).json({ message: "User not found" });
        return;
    }
    if (!email) {
        res.status(HTTPSTATUS.BAD_REQUEST).json({ message: "Target user email is required" });
        return;
    }

    try {
        const newMembership = await WorkspaceService.addMemberToWorkspace(workspaceId, email, requestedByUserId);
        res.status(HTTPSTATUS.OK).json({
            success: true,
            message: "User added to workspace successfully",
            data: newMembership,
        });
    } catch (error) {
        const msg = (error as Error).message;
        const status = msg.includes("Access denied") ? HTTPSTATUS.FORBIDDEN : HTTPSTATUS.BAD_REQUEST;
        res.status(status).json({ success: false, message: msg });
    }
};

export const sendInvite = async (req: Request, res: Response): Promise<void> => {
    const workspaceId = req.params.workspaceId as string;
    const { email } = req.body as SendInviteBody;
    const requestedByUserId = req.user?.id;

    if (!requestedByUserId) {
        res.status(HTTPSTATUS.UNAUTHORIZED).json({ message: "User not found" });
        return;
    }

    if (!workspaceId || !email) {
        res.status(HTTPSTATUS.BAD_REQUEST).json({ message: "Missing required parameters: workspaceId or email" });
        return;
    }

    try {
        await WorkspaceService.sendWorkspaceInvite(workspaceId, email, requestedByUserId);
        
        res.status(HTTPSTATUS.OK).json({
            success: true,
            message: "Workspace invitation sent successfully.",
        });
    } catch (error) {
        logger.error(`sendInvite controller error: ${(error as Error).message}`);
        const msg = (error as Error).message;
        const status = msg.includes("Access denied") ? HTTPSTATUS.FORBIDDEN : HTTPSTATUS.BAD_REQUEST;
        
        res.status(status).json({ success: false, message: msg });
    }
};

export const verifyInvite = async (req: Request, res: Response): Promise<void> => {
    const token = req.query.token as string;

    if (!token) {
        res.status(HTTPSTATUS.BAD_REQUEST).json({ success: false, message: "Invitation token missing from request." });
        return;
    }

    try {
        const inviteDetails = await WorkspaceService.verifyInviteToken(token);
        res.status(HTTPSTATUS.OK).json({
            success: true,
            invite: {
                email: inviteDetails.email,
                workspaceName: inviteDetails.workspace.name,
            },
        });
    } catch (error) {
        res.status(HTTPSTATUS.BAD_REQUEST).json({ success: false, message: (error as Error).message });
    }
};

export const acceptInvite = async (req: Request, res: Response): Promise<void> => {
    const { token } = req.body;
    const requestedByUserId = req.user?.id;

    if (!requestedByUserId) {
        res.status(HTTPSTATUS.UNAUTHORIZED).json({ message: "User not found" });
        return;
    }

    if (!token) {
        res.status(HTTPSTATUS.BAD_REQUEST).json({ success: false, message: "Missing required invitation token." });
        return;
    }

    try {
        const membership = await WorkspaceService.acceptWorkspaceInvite(token, requestedByUserId);
        res.status(HTTPSTATUS.OK).json({
            success: true,
            message: "Successfully joined workspace.",
            data: membership,
        });
    } catch (error) {
        res.status(HTTPSTATUS.FORBIDDEN).json({ success: false, message: (error as Error).message });
    }
};

export const listWorkspaceMembers = async (req: Request, res: Response): Promise<void> => {
    const workspaceId = req.params.workspaceId as string;
    const userId = req.user?.id;

    if (!userId) {
        res.status(HTTPSTATUS.UNAUTHORIZED).json({ message: "User not found" });
        return;
    }

    try {
        const members = await WorkspaceService.getWorkspaceMembers(workspaceId, userId);
        res.status(HTTPSTATUS.OK).json({ success: true, data: members });
    } catch (error) {
        res.status(HTTPSTATUS.FORBIDDEN).json({ success: false, message: (error as Error).message });
    }
};

export const updateRole = async (req: Request, res: Response): Promise<void> => {
    const workspaceId = req.params.workspaceId as string;
    const { targetUserId, role } = req.body as UpdateRoleBody;
    const requestedByUserId = req.user?.id;

    if (!requestedByUserId) {
        res.status(HTTPSTATUS.UNAUTHORIZED).json({ message: "User not found" });
        return;
    }
    if (!targetUserId || !role) {
        res.status(HTTPSTATUS.BAD_REQUEST).json({ message: "Missing targetUserId or target role" });
        return;
    }
    if (!Object.values(WorkspaceRole).includes(role)) {
        res.status(HTTPSTATUS.BAD_REQUEST).json({ message: "Invalid role value provided" });
        return;
    }

    try {
        const updatedMembership = await WorkspaceService.updateWorkspaceUserRole({
            workspaceId,
            targetUserId,
            newRole: role,
            requestedByUserId,
        });

        res.status(HTTPSTATUS.OK).json({
            success: true,
            message: "Workspace member role updated successfully",
            data: updatedMembership,
        });
    } catch (error) {
        logger.error(`updateRole controller error: ${(error as Error).message}`);
        const status = (error as Error).message.includes("Access denied") ? HTTPSTATUS.FORBIDDEN : HTTPSTATUS.BAD_REQUEST;
        res.status(status).json({ success: false, message: (error as Error).message });
    }
};

export const updateCustomPermissions = async (req: Request, res: Response): Promise<void> => {
    const workspaceId = req.params.workspaceId as string;
    const { targetUserId, permissions } = req.body as UpdatePermissionsBody;
    const requestedByUserId = req.user?.id;

    if (!requestedByUserId) {
        res.status(HTTPSTATUS.UNAUTHORIZED).json({ message: "User not found" });
        return;
    }
    if (!targetUserId || !permissions) {
        res.status(HTTPSTATUS.BAD_REQUEST).json({ message: "Missing required body object updates" });
        return;
    }

    try {
        const updatedMembership = await WorkspaceService.updateWorkspaceUserPermissions({
            workspaceId,
            targetUserId,
            permissions,
            requestedByUserId,
        });

        res.status(HTTPSTATUS.OK).json({
            success: true,
            message: "Update Permission successfully",
            data: updatedMembership,
        });
    } catch (error) {
        res.status(HTTPSTATUS.FORBIDDEN).json({ success: false, message: (error as Error).message });
    }
};

export const removeUser = async (req: Request, res: Response): Promise<void> => {
    const workspaceId = req.params.workspaceId as string;
    const { targetUserId } = req.body as RemoveUserBody;
    const requestedByUserId = req.user?.id;

    if (!requestedByUserId) {
        res.status(HTTPSTATUS.UNAUTHORIZED).json({ message: "User not found" });
        return;
    }
    if (!workspaceId || !targetUserId) {
        res.status(HTTPSTATUS.BAD_REQUEST).json({ message: "Parameters or member target data missing" });
        return;
    }

    try {
        await WorkspaceService.removeUserFromWorkspace(workspaceId, targetUserId, requestedByUserId);
        res.status(HTTPSTATUS.OK).json({ success: true, message: "User was removed successfully" });
    } catch (error) {
        logger.error(`removeUser controller error: ${(error as Error).message}`);
        res.status(HTTPSTATUS.FORBIDDEN).json({ success: false, message: (error as Error).message });
    }
};