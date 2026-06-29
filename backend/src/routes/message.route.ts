import { Router } from "express";
import { handleCreateMessage, handleGetChannelMessages, handleStartThread } from "../controllers/message.controller";
import { requireAuth } from "../middlewares/auth.middleware";

const messageRoutes = Router();

messageRoutes.use(requireAuth);

messageRoutes.post("/", handleCreateMessage);
messageRoutes.get("/channel/:channelId", handleGetChannelMessages);
messageRoutes.post("/:messageId/thread", handleStartThread);

export default messageRoutes;