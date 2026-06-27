import { NextFunction, Request, Response } from "express";
import { HTTPSTATUS } from "../config/http.config";
import { supabaseWithAuth } from "../utils/supabase";
import prisma from "../utils/prisma";
import logger from "../utils/logger";
import { WorkspaceRole } from "@prisma/client";


/**
 * Validates the Supabase JWT token
 */
export const requireAuth = async (
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> => {
    const authHeader = req.headers.authorization;

    if (!authHeader?.startsWith("Bearer ")) {
        res.status(HTTPSTATUS.NOT_FOUND).json({ message: "Authorization token required" });
        return;
    }

    const accessToken = authHeader.split(" ")[1];

    try {
        const client = supabaseWithAuth(accessToken);

        const {
            data: { user },
            error,
        } = await client.auth.getUser();

        if (error || !user) {
            res.status(HTTPSTATUS.UNAUTHORIZED).json({ message: "Invalid or expired token" });
            return;
        }

        req.user = user;
        req.accessToken = accessToken;

        next();
    } catch (error) {
        logger.error(`requireAuth middleware error: ${(error as Error).message}`);
        res.status(HTTPSTATUS.UNAUTHORIZED).json({ message: "Authentication failed" });
    }
};

/**
 * Validates that the user has an allowed WorkspaceRole for a specific workspace.
 */
export const requireWorkspaceRole = (...allowedRoles: WorkspaceRole[]) => {
    return async (
        req: Request,
        res: Response,
        next: NextFunction
    ): Promise<void> => {
        if (!req.user) {
            res.status(HTTPSTATUS.UNAUTHORIZED).json({ message: "Unauthorized: Missing authentication context" });
            return;
        }

        // Try to discover workspaceId from standard route locations
        const workspaceId = req.params.workspaceId || req.body.workspaceId || req.query.workspaceId;

        if (!workspaceId || typeof workspaceId !== "string") {
            res.status(HTTPSTATUS.BAD_REQUEST).json({
                message: "Bad Request: Workspace is required."
            });
            return;
        }

        try {
            const member = await prisma.workspaceMember.findUnique({
                where: {
                    workspaceId_userId: {
                        workspaceId,
                        userId: req.user.id,
                    },
                },
            });

            if (!member) {
                res.status(HTTPSTATUS.FORBIDDEN).json({ message: "Access Denied: You are not a member of this workspace" });
                return;
            }

            // Check if the user's workspace role satisfies the required endpoints
            if (!allowedRoles.includes(member.role)) {
                res.status(HTTPSTATUS.FORBIDDEN).json({
                    message: `Access denied. Required workspace level: ${allowedRoles.join(" or ")}`,
                });
                return;
            }

            // Attach the workspace member details 
            req.workspaceMember = {
                workspaceId: member.workspaceId,
                role: member.role,
                permissions: member.permissions,
            };

            next();
        } catch (error) {
            logger.error(`requireWorkspaceRole middleware error: ${(error as Error).message}`);
            res.status(HTTPSTATUS.INTERNAL_SERVER_ERROR).json({ message: "Internal server validation fault" });
        }
    };
};