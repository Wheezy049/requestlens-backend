import { Request, Response, NextFunction } from "express";
import { prisma } from "../utils/prisma.js";

export const apiKeyMiddleware = async (req: Request, res: Response, next: NextFunction) => {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res.status(401).json({ message: "API Key required in Authorization header" });
    }

    const key = authHeader.split(" ")[1];

    try {
        const apiKey = await prisma.apiKey.findUnique({
            where: { key }
        });

        if (!apiKey) {
            return res.status(401).json({ message: "Invalid API Key" });
        }

        // Attach projectId to the request so controllers know which project this log is for
        (req as any).projectId = apiKey.projectId;
        next();
    } catch (error) {
        return res.status(500).json({ message: "Server error during API Key validation" });
    }
};