import { Request, Response } from "express";
import * as DmService from "../services/dm.service";
import { HTTPSTATUS } from "../config/http.config";
import { asyncHandler } from "../middlewares/asyncHandler.middleware";

export const handleGetOrCreate1to1DM = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const { recipientId } = req.body as { recipientId: string };

  if (!recipientId) {
    return res.status(HTTPSTATUS.BAD_REQUEST).json({ message: "Recipient user ID is required." });
  }

  try {
    const dmGroup = await DmService.getOrCreate1to1DM(userId, recipientId);
    return res.status(HTTPSTATUS.OK).json({ success: true, data: dmGroup });
  } catch (error) {
    return res.status(HTTPSTATUS.BAD_REQUEST).json({ success: false, message: (error as Error).message });
  }
});

export const handleCreateGroupDM = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const { memberIds } = req.body as { memberIds: string[] };

  if (!memberIds || !Array.isArray(memberIds)) {
    return res.status(HTTPSTATUS.BAD_REQUEST).json({ message: "An array of participant user IDs is required." });
  }

  try {
    const dmGroup = await DmService.createGroupDM({ creatorId: userId, memberIds });
    return res.status(HTTPSTATUS.CREATED).json({ success: true, data: dmGroup });
  } catch (error) {
    return res.status(HTTPSTATUS.BAD_REQUEST).json({ success: false, message: (error as Error).message });
  }
});

export const handleGetUserDMs = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user!.id;

  try {
    const dms = await DmService.getUserDMs(userId);
    return res.status(HTTPSTATUS.OK).json({ success: true, data: dms });
  } catch (error) {
    return res.status(HTTPSTATUS.BAD_REQUEST).json({ success: false, message: (error as Error).message });
  }
});