import { Server } from "socket.io";
import http from "http";
import jwt from "jsonwebtoken";
import { prisma } from "./prisma.js";

const JWT_SECRET = process.env.JWT_SECRET || "secret";

let io: Server | null = null;

export function initSocket(server: http.Server) {
  io = new Server(server, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"],
    },
  });

  // Socket authentication middleware using JWT handshake
  io.use((socket, next) => {
    const token = socket.handshake.auth.token;
    if (!token) {
      return next(new Error("Authentication error: No token provided"));
    }

    try {
      const decoded = jwt.verify(token, JWT_SECRET) as { userId: string };
      socket.data.userId = decoded.userId;
      next();
    } catch (err) {
      return next(new Error("Authentication error: Invalid or expired token"));
    }
  });

  io.on("connection", (socket) => {
    const userId = socket.data.userId;
    console.log(`[Socket] Client connected: User ${userId} (Socket ID: ${socket.id})`);

    // Handle joining a project room with authorization check
    socket.on("join_project", async (projectId: string) => {
      try {
        if (!projectId) {
          socket.emit("error_msg", "Project ID is required");
          return;
        }

        // Verify the user owns the project they are trying to monitor
        const project = await prisma.project.findFirst({
          where: {
            id: projectId,
            userId: userId,
          },
        });

        if (!project) {
          socket.emit("error_msg", "Project not found or unauthorized");
          return;
        }

        socket.join(projectId);
        console.log(`[Socket] User ${userId} joined room: ${projectId}`);
        socket.emit("joined", projectId);
      } catch (error) {
        console.error(`[Socket] Error joining project room ${projectId}:`, error);
        socket.emit("error_msg", "Failed to join project channel");
      }
    });

    // Handle leaving a project room
    socket.on("leave_project", (projectId: string) => {
      if (projectId) {
        socket.leave(projectId);
        console.log(`[Socket] User ${userId} left room: ${projectId}`);
        socket.emit("left", projectId);
      }
    });

    socket.on("disconnect", () => {
      console.log(`[Socket] Client disconnected: Socket ID ${socket.id}`);
    });
  });

  return io;
}

export function getIO() {
  if (!io) {
    throw new Error("Socket.io is not initialized yet!");
  }
  return io;
}

export function emitNewLog(projectId: string, logData: any) {
  if (io) {
    io.to(projectId).emit("new_log", logData);
    console.log(`[Socket] Emitted new_log event for project ${projectId}`);
  }
}