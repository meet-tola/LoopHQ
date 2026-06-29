import { Router } from "express";
import {
    handleGetUserDMs,
    handleGetOrCreate1to1DM,
    handleCreateGroupDM,
} from "../controllers/dm.controller";
import { requireAuth } from "../middlewares/auth.middleware";

const dmRoutes = Router();

// Secure all DM routes
dmRoutes.use(requireAuth);

dmRoutes.get("/", handleGetUserDMs);
dmRoutes.post("/1to1", handleGetOrCreate1to1DM);
dmRoutes.post("/group", handleCreateGroupDM);

export default dmRoutes;