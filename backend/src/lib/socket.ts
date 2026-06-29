import { Server as HTTPServer } from "http";
import { Server, type Socket } from "socket.io";
import { Env } from "../config/env.config";
import { supabaseWithAuth } from "../utils/supabase";
import { validateChannelMembership } from "../services/message.service";
import logger from "../utils/logger";

interface AuthenticatedSocket extends Socket {
  userId?: string;
}

let io: Server | null = null;
const onlineUsers = new Map<string, string>();

export const initializeSocket = (httpServer: HTTPServer) => {
  io = new Server(httpServer, {
    cors: {
      origin: Env.FRONTEND_ORIGIN,
      methods: ["GET", "POST"],
      credentials: true,
    },
  });

  // Supabase Auth Middleware for Socket.io
  io.use(async (socket: AuthenticatedSocket, next) => {
    try {
      const authHeader = socket.handshake.headers.authorization;

      if (!authHeader?.startsWith("Bearer ")) {
        return next(new Error("Authorization token required"));
      }

      const accessToken = authHeader.split(" ")[1];
      const client = supabaseWithAuth(accessToken);

      const {
        data: { user },
        error,
      } = await client.auth.getUser();

      if (error || !user) {
        return next(new Error("Invalid or expired token"));
      }

      // Successfully authenticated
      socket.userId = user.id;
      next();
    } catch (error) {
      logger.error(`Socket auth middleware error: ${(error as Error).message}`);
      next(new Error("Authentication failed"));
    }
  });

  io.on("connection", (socket: AuthenticatedSocket) => {
    const userId = socket.userId!;
    const newSocketId = socket.id;

    if (!socket.userId) {
      socket.disconnect(true);
      return;
    }

    // Register user to online list
    onlineUsers.set(userId, newSocketId);
    io?.emit("online:users", Array.from(onlineUsers.keys()));
    
    // Create personal notification room for the user
    socket.join(`user:${userId}`);

    // Join a Channel View Context
    socket.on("channel:join", async (channelId: string, callback?: (err?: string) => void) => {
      try {
        await validateChannelMembership(channelId, userId);
        socket.join(`channel:${channelId}`);
        callback?.();
      } catch (error) {
        callback?.("Error joining channel room: Access Denied");
      }
    });

    socket.on("channel:leave", (channelId: string) => {
      if (channelId) {
        socket.leave(`channel:${channelId}`);
      }
    });

    socket.on("disconnect", () => {
      if (onlineUsers.get(userId) === newSocketId) {
        onlineUsers.delete(userId);
        io?.emit("online:users", Array.from(onlineUsers.keys()));
      }
    });
  });
};

function getIO() {
  if (!io) throw new Error("Socket.IO not initialized");
  return io;
}

// Broadcasts a message

export const emitNewMessageToRoom = (senderId: string, roomTarget: string, message: any) => {
  const io = getIO();
  const senderSocketId = onlineUsers.get(senderId.toString());

  if (senderSocketId) {
    io.to(roomTarget).except(senderSocketId).emit("message:new", message);
  } else {
    io.to(roomTarget).emit("message:new", message);
  }
};