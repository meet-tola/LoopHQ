import { Request, Response } from "express";
import { WorkspaceRole } from "@prisma/client";
import * as WorkspaceService from "../services/workspace.service";
import logger from "../utils/logger";
import { HTTPSTATUS } from "../config/http.config";

interface CreateWorkspaceBody { name: string; slug: string; }
interface AddMemberBody { email: string; }
interface UpdateRoleBody { targetUserId: string; role: WorkspaceRole; }
interface UpdatePermissionsBody { targetUserId: string; permissions: Record<string, boolean>; }
interface RemoveUserBody { targetUserId: string; }
interface SendInviteBody { email: string; }

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

    if (!email) {
        res.status(HTTPSTATUS.BAD_REQUEST).json({ message: "Target user email is required" });
        return;
    }

    try {
        const newMembership = await WorkspaceService.addMemberToWorkspace(workspaceId, email);
        res.status(HTTPSTATUS.OK).json({ success: true, data: newMembership });
    } catch (error) {
        res.status(HTTPSTATUS.BAD_REQUEST).json({ success: false, message: (error as Error).message });
    }
};

export const sendInvite = async (req: Request, res: Response): Promise<void> => {
    const workspaceId = req.params.workspaceId as string;
    const { email } = req.body as SendInviteBody;
    const requestedByUserId = req.user!.id;

    if (!email) {
        res.status(HTTPSTATUS.BAD_REQUEST).json({ message: "Email parameter missing" });
        return;
    }

    try {
        await WorkspaceService.sendWorkspaceInvite(workspaceId, email, requestedByUserId);
        res.status(HTTPSTATUS.OK).json({ success: true, message: "Workspace invitation sent successfully." });
    } catch (error) {
        logger.error(`sendInvite controller error: ${(error as Error).message}`);
        res.status(HTTPSTATUS.BAD_REQUEST).json({ success: false, message: (error as Error).message });
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
            invite: { email: inviteDetails.email, workspaceName: inviteDetails.workspace.name },
        });
    } catch (error) {
        res.status(HTTPSTATUS.BAD_REQUEST).json({ success: false, message: (error as Error).message });
    }
};

export const acceptInvite = async (req: Request, res: Response): Promise<void> => {
    const { token } = req.body;
    const requestedByUserId = req.user!.id;

    if (!token) {
        res.status(HTTPSTATUS.BAD_REQUEST).json({ success: false, message: "Missing required invitation token." });
        return;
    }

    try {
        const membership = await WorkspaceService.acceptWorkspaceInvite(token, requestedByUserId);
        res.status(HTTPSTATUS.OK).json({ success: true, message: "Successfully joined workspace.", data: membership });
    } catch (error) {
        res.status(HTTPSTATUS.FORBIDDEN).json({ success: false, message: (error as Error).message });
    }
};

export const listWorkspaceMembers = async (req: Request, res: Response): Promise<void> => {
    const workspaceId = req.params.workspaceId as string;

    try {
        const members = await WorkspaceService.getWorkspaceMembers(workspaceId);
        res.status(HTTPSTATUS.OK).json({ success: true, data: members });
    } catch (error) {
        res.status(HTTPSTATUS.FORBIDDEN).json({ success: false, message: (error as Error).message });
    }
};

export const updateRole = async (req: Request, res: Response): Promise<void> => {
    const workspaceId = req.params.workspaceId as string;
    const { targetUserId, role } = req.body as UpdateRoleBody;
    const requesterRole = req.workspaceMember!.role;

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
            requesterRole,
        });
        res.status(HTTPSTATUS.OK).json({ success: true, data: updatedMembership });
    } catch (error) {
        logger.error(`updateRole controller error: ${(error as Error).message}`);
        res.status(HTTPSTATUS.BAD_REQUEST).json({ success: false, message: (error as Error).message });
    }
};

export const updateCustomPermissions = async (req: Request, res: Response): Promise<void> => {
    const workspaceId = req.params.workspaceId as string;
    const { targetUserId, permissions } = req.body as UpdatePermissionsBody;

    if (!targetUserId || !permissions) {
        res.status(HTTPSTATUS.BAD_REQUEST).json({ message: "Missing required body parameters" });
        return;
    }

    try {
        const updatedMembership = await WorkspaceService.updateWorkspaceUserPermissions({ workspaceId, targetUserId, permissions });
        res.status(HTTPSTATUS.OK).json({ success: true, data: updatedMembership });
    } catch (error) {
        res.status(HTTPSTATUS.BAD_REQUEST).json({ success: false, message: (error as Error).message });
    }
};

export const removeUser = async (req: Request, res: Response): Promise<void> => {
    const workspaceId = req.params.workspaceId as string;
    const { targetUserId } = req.body as RemoveUserBody;

    if (!targetUserId) {
        res.status(HTTPSTATUS.BAD_REQUEST).json({ message: "Target data missing" });
        return;
    }

    try {
        await WorkspaceService.removeUserFromWorkspace(workspaceId, targetUserId);
        res.status(HTTPSTATUS.OK).json({ success: true, message: "User was removed successfully" });
    } catch (error) {
        logger.error(`removeUser controller error: ${(error as Error).message}`);
        res.status(HTTPSTATUS.BAD_REQUEST).json({ success: false, message: (error as Error).message });
    }
};