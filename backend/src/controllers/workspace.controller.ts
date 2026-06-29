import { Request, Response } from "express";
import { WorkspaceRole } from "@prisma/client";
import * as WorkspaceService from "../services/workspace.service";
import logger from "../utils/logger";
import { HTTPSTATUS } from "../config/http.config";
import { asyncHandler } from "../middlewares/asyncHandler.middleware";

interface CreateWorkspaceBody { name: string; slug: string; image?: string; }
interface AddMemberBody { email: string; }
interface UpdateRoleBody { targetUserId: string; role: WorkspaceRole; }
interface UpdatePermissionsBody { targetUserId: string; permissions: Record<string, boolean>; }
interface RemoveUserBody { targetUserId: string; }
interface SendInviteBody { email: string; }
interface JoinWithCodeBody { inviteCode: string; }

export const createWorkspace = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user?.id;
    const { name, slug, image } = req.body as CreateWorkspaceBody;

    if (!userId) {
        return res.status(HTTPSTATUS.UNAUTHORIZED).json({ message: "User not found" });
    }
    if (!name || !slug) {
        return res.status(HTTPSTATUS.BAD_REQUEST).json({ message: "Missing required fields: name and slug" });
    }

    try {
        const workspace = await WorkspaceService.createWorkspace({ name, slug, image, userId });
        return res.status(HTTPSTATUS.CREATED).json({ success: true, data: workspace });
    } catch (error) {
        logger.error(`createWorkspace controller error: ${(error as Error).message}`);
        return res.status(HTTPSTATUS.BAD_REQUEST).json({ success: false, message: (error as Error).message });
    }
});

export const listWorkspace = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user?.id;

    if (!userId) {
        return res.status(HTTPSTATUS.UNAUTHORIZED).json({ message: "User not authenticated" });
    }

    try {
        const workspaces = await WorkspaceService.getUserWorkspaces(userId);
        return res.status(HTTPSTATUS.OK).json({ success: true, data: workspaces });
    } catch (error) {
        logger.error(`listWorkspace controller error: ${(error as Error).message}`);
        return res.status(HTTPSTATUS.INTERNAL_SERVER_ERROR).json({ success: false, message: (error as Error).message });
    }
});

export const addMember = asyncHandler(async (req: Request, res: Response) => {
    const workspaceId = req.params.workspaceId as string;
    const { email } = req.body as AddMemberBody;

    if (!email) {
        return res.status(HTTPSTATUS.BAD_REQUEST).json({ message: "Target user email is required" });
    }

    try {
        const newMembership = await WorkspaceService.addMemberToWorkspace(workspaceId, email);
        return res.status(HTTPSTATUS.OK).json({ success: true, data: newMembership });
    } catch (error) {
        return res.status(HTTPSTATUS.BAD_REQUEST).json({ success: false, message: (error as Error).message });
    }
});

export const sendInvite = asyncHandler(async (req: Request, res: Response) => {
    const workspaceId = req.params.workspaceId as string;
    const { email } = req.body as SendInviteBody;
    const requestedByUserId = req.user!.id;

    if (!email) {
        return res.status(HTTPSTATUS.BAD_REQUEST).json({ message: "Email parameter missing" });
    }

    try {
        await WorkspaceService.sendWorkspaceInvite(workspaceId, email, requestedByUserId);
        return res.status(HTTPSTATUS.OK).json({ success: true, message: "Workspace invitation sent successfully." });
    } catch (error) {
        logger.error(`sendInvite controller error: ${(error as Error).message}`);
        return res.status(HTTPSTATUS.BAD_REQUEST).json({ success: false, message: (error as Error).message });
    }
});

export const verifyInvite = asyncHandler(async (req: Request, res: Response) => {
    const token = req.query.token as string;

    if (!token) {
        return res.status(HTTPSTATUS.BAD_REQUEST).json({ success: false, message: "Invitation token missing from request." });
    }

    try {
        const inviteDetails = await WorkspaceService.verifyInviteToken(token);
        return res.status(HTTPSTATUS.OK).json({
            success: true,
            invite: { email: inviteDetails.email, workspaceName: inviteDetails.workspace.name, workspaceSlug: inviteDetails.workspace.slug },
        });
    } catch (error) {
        return res.status(HTTPSTATUS.BAD_REQUEST).json({ success: false, message: (error as Error).message });
    }
});

export const acceptInvite = asyncHandler(async (req: Request, res: Response) => {
    const { token } = req.body;
    const requestedByUserId = req.user!.id;

    if (!token) {
        return res.status(HTTPSTATUS.BAD_REQUEST).json({ success: false, message: "Missing required invitation token." });
    }

    try {
        const membership = await WorkspaceService.acceptWorkspaceInvite(token, requestedByUserId);
        return res.status(HTTPSTATUS.OK).json({ success: true, message: "Successfully joined workspace.", data: membership });
    } catch (error) {
        return res.status(HTTPSTATUS.FORBIDDEN).json({ success: false, message: (error as Error).message });
    }
});

export const createInviteCode = asyncHandler(async (req: Request, res: Response) => {
    const workspaceId = req.params.workspaceId as string;
    try {
        const result = await WorkspaceService.generateWorkspaceInviteCode(workspaceId);
        return res.status(HTTPSTATUS.OK).json({ 
            success: true, 
            message: "Invite code generated successfully.", 
            data: result 
        });
    } catch (error) {
        logger.error(`createInviteCode controller error: ${(error as Error).message}`);
        return res.status(HTTPSTATUS.BAD_REQUEST).json({ success: false, message: (error as Error).message });
    }
});

export const joinWithCode = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.id;
    const { inviteCode } = req.body as JoinWithCodeBody;

    if (!inviteCode) {
        return res.status(HTTPSTATUS.BAD_REQUEST).json({ message: "Invite code is required." });
    }
    try {
        const membership = await WorkspaceService.joinWorkspaceWithCode(inviteCode, userId);
        return res.status(HTTPSTATUS.OK).json({ 
            success: true, 
            message: "Successfully joined the workspace via code.", 
            data: membership 
        });
    } catch (error) {
        return res.status(HTTPSTATUS.BAD_REQUEST).json({ success: false, message: (error as Error).message });
    }
});

export const listWorkspaceMembers = asyncHandler(async (req: Request, res: Response) => {
    const workspaceId = req.params.workspaceId as string;

    try {
        const members = await WorkspaceService.getWorkspaceMembers(workspaceId);
        return res.status(HTTPSTATUS.OK).json({ success: true, data: members });
    } catch (error) {
        return res.status(HTTPSTATUS.FORBIDDEN).json({ success: false, message: (error as Error).message });
    }
});

export const updateRole = asyncHandler(async (req: Request, res: Response) => {
    const workspaceId = req.params.workspaceId as string;
    const { targetUserId, role } = req.body as UpdateRoleBody;
    const requesterRole = req.workspaceMember!.role;

    if (!targetUserId || !role) {
        return res.status(HTTPSTATUS.BAD_REQUEST).json({ message: "Missing targetUserId or target role" });
    }
    if (!Object.values(WorkspaceRole).includes(role)) {
        return res.status(HTTPSTATUS.BAD_REQUEST).json({ message: "Invalid role value provided" });
    }

    try {
        const updatedMembership = await WorkspaceService.updateWorkspaceUserRole({
            workspaceId,
            targetUserId,
            newRole: role,
            requesterRole,
        });
        return res.status(HTTPSTATUS.OK).json({ success: true, data: updatedMembership });
    } catch (error) {
        logger.error(`updateRole controller error: ${(error as Error).message}`);
        return res.status(HTTPSTATUS.BAD_REQUEST).json({ success: false, message: (error as Error).message });
    }
});

export const updateCustomPermissions = asyncHandler(async (req: Request, res: Response) => {
    const workspaceId = req.params.workspaceId as string;
    const { targetUserId, permissions } = req.body as UpdatePermissionsBody;

    if (!targetUserId || !permissions) {
        return res.status(HTTPSTATUS.BAD_REQUEST).json({ message: "Missing required body parameters" });
    }

    try {
        const updatedMembership = await WorkspaceService.updateWorkspaceUserPermissions({ workspaceId, targetUserId, permissions });
        return res.status(HTTPSTATUS.OK).json({ success: true, data: updatedMembership });
    } catch (error) {
        return res.status(HTTPSTATUS.BAD_REQUEST).json({ success: false, message: (error as Error).message });
    }
});

export const removeUser = asyncHandler(async (req: Request, res: Response) => {
    const workspaceId = req.params.workspaceId as string;
    const { targetUserId } = req.body as RemoveUserBody;

    if (!targetUserId) {
        return res.status(HTTPSTATUS.BAD_REQUEST).json({ message: "Target data missing" });
    }

    try {
        await WorkspaceService.removeUserFromWorkspace(workspaceId, targetUserId);
        return res.status(HTTPSTATUS.OK).json({ success: true, message: "User was removed successfully" });
    } catch (error) {
        logger.error(`removeUser controller error: ${(error as Error).message}`);
        return res.status(HTTPSTATUS.BAD_REQUEST).json({ success: false, message: (error as Error).message });
    }
});