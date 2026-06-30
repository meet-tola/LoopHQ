import { Request, Response } from "express";
import * as MessageService from "../services/message.service";
import { HTTPSTATUS } from "../config/http.config";
import { asyncHandler } from "../middlewares/asyncHandler.middleware";
import { emitNewMessageToRoom } from "../lib/socket";

interface CreateMessageBody {
    content: string;
    channelId?: string;
    dmGroupId?: string;
    threadId?: string;
}

export const handleCreateMessage = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.id;
    const { content, channelId, dmGroupId, threadId } = req.body as CreateMessageBody;

    if (!content?.trim()) {
        return res.status(HTTPSTATUS.BAD_REQUEST).json({ message: "Message content cannot be empty." });
    }

    try {
        const message = await MessageService.createMessage({
            content,
            userId,
            channelId,
            dmGroupId,
            threadId,
        });
        if (channelId) {
            emitNewMessageToRoom(userId, `channel:${channelId}`, message);
        } else if (dmGroupId) {
            emitNewMessageToRoom(userId, `dm:${dmGroupId}`, message);
        }

        return res.status(HTTPSTATUS.CREATED).json({ success: true, data: message });
    } catch (error) {
        return res.status(HTTPSTATUS.BAD_REQUEST).json({ success: false, message: (error as Error).message });
    }
});

export const handleGetChannelMessages = asyncHandler(async (req: Request, res: Response) => {
    const { channelId } = req.params as { channelId: string };
    const userId = req.user!.id;
    const { limit, cursor } = req.query;

    try {
        const messages = await MessageService.getChannelMessages(
            channelId,
            userId,
            limit ? parseInt(limit as string) : undefined,
            cursor as string
        );
        return res.status(HTTPSTATUS.OK).json({ success: true, data: messages });
    } catch (error) {
        return res.status(HTTPSTATUS.BAD_REQUEST).json({ success: false, message: (error as Error).message });
    }
});

export const handleStartThread = asyncHandler(async (req: Request, res: Response) => {
    const { messageId } = req.params as { messageId: string };

    try {
        const thread = await MessageService.createThread(messageId);
        return res.status(HTTPSTATUS.CREATED).json({ success: true, data: thread });
    } catch (error) {
        return res.status(HTTPSTATUS.BAD_REQUEST).json({ success: false, message: (error as Error).message });
    }
});

export const threadReplies = asyncHandler(async (req: Request, res: Response) => {
    const { threadId, channelId } = req.params as { threadId: string, channelId: string };
    const userId = req.user!.id;

    try {
        const replies = await MessageService.getThreadReplies(threadId, channelId, userId);
        return res.status(HTTPSTATUS.OK).json({ success: true, data: replies });
    } catch (error) {
        return res.status(HTTPSTATUS.BAD_REQUEST).json({ success: false, message: (error as Error).message });
    }
});