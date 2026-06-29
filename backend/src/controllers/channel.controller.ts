import { Request, Response } from "express";
import { ChannelType } from "@prisma/client";
import * as ChannelService from "../services/channel.service";
import { HTTPSTATUS } from "../config/http.config";
import { asyncHandler } from "../middlewares/asyncHandler.middleware";

interface CreateChannelBody { name: string; type: ChannelType; }

export const handleCreateChannel = asyncHandler(async (req: Request, res: Response) => {
    const workspaceId = req.params.workspaceId as string;
    const userId = req.user!.id;
    const { name, type } = req.body as CreateChannelBody;

    if (!name || !type) {
        return res.status(HTTPSTATUS.BAD_REQUEST).json({ message: "Name and Type properties are required." });
    }

    try {
        const channel = await ChannelService.createChannel({ workspaceId, name, type, userId });
        return res.status(HTTPSTATUS.CREATED).json({ success: true, data: channel });
    } catch (error) {
        return res.status(HTTPSTATUS.BAD_REQUEST).json({ success: false, message: (error as Error).message });
    }
});

export const handleGetChannels = asyncHandler(async (req: Request, res: Response) => {
    const workspaceId = req.params.workspaceId as string;
    const userId = req.user!.id;

    try {
        const channels = await ChannelService.getWorkspaceChannels(workspaceId, userId);
        return res.status(HTTPSTATUS.OK).json({ success: true, data: channels });
    } catch (error) {
        return res.status(HTTPSTATUS.BAD_REQUEST).json({ success: false, message: (error as Error).message });
    }
});

export const handleJoinChannel = asyncHandler(async (req: Request, res: Response) => {
    const channelId = req.params.channelId as string;
    const userId = req.user!.id;

    try {
        const membership = await ChannelService.joinChannel(channelId, userId);
        return res.status(HTTPSTATUS.OK).json({ success: true, data: membership });
    } catch (error) {
        return res.status(HTTPSTATUS.BAD_REQUEST).json({ success: false, message: (error as Error).message });
    }
});

export const handleLeaveChannel = asyncHandler(async (req: Request, res: Response) => {
    const channelId = req.params.channelId as string;
    const userId = req.user!.id;

    try {
        await ChannelService.leaveChannel(channelId, userId);
        return res.status(HTTPSTATUS.OK).json({ success: true, message: "Successfully left channel." });
    } catch (error) {
        return res.status(HTTPSTATUS.BAD_REQUEST).json({ success: false, message: (error as Error).message });
    }
});

export const handleDeleteChannel = asyncHandler(async (req: Request, res: Response) => {
    const channelId = req.params.channelId as string;

    try {
        await ChannelService.deleteChannel(channelId);
        return res.status(HTTPSTATUS.OK).json({ success: true, message: "Channel dropped successfully." });
    } catch (error) {
        return res.status(HTTPSTATUS.BAD_REQUEST).json({ success: false, message: (error as Error).message });
    }
});