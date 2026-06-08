import { Request, Response } from "express";
import { getProjectStats } from "../services/stats.service.js";

export const getProjectStatsController = async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user.userId;
        const projectId = req.params.projectId as string;

        const stats = await getProjectStats(projectId, userId);

        res.status(200).json({
            message: "Project stats retrieved successfully",
            stats,
        });
    } catch (error: any) {
        let status = 400;
        if (error.message === "Project not found") status = 404;

        res.status(status).json({
            message: error.message || "Failed to fetch project stats",
        });
    }
};