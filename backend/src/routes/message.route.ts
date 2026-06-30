import { Router } from "express";
import { handleCreateMessage, handleGetChannelMessages, handleStartThread, threadReplies } from "../controllers/message.controller";
import { requireAuth } from "../middlewares/auth.middleware";

const messageRoutes = Router();

messageRoutes.use(requireAuth);

messageRoutes.post("/", handleCreateMessage);
messageRoutes.get("/channel/:channelId", handleGetChannelMessages);
messageRoutes.get("/:channelId/:threadId", threadReplies);


export default messageRoutes;