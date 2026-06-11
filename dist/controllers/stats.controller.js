import { getProjectStats } from "../services/stats.service.js";
export const getProjectStatsController = async (req, res) => {
    try {
        const userId = req.user.userId;
        const projectId = req.params.projectId;
        const stats = await getProjectStats(projectId, userId);
        res.status(200).json({
            message: "Project stats retrieved successfully",
            stats,
        });
    }
    catch (error) {
        let status = 400;
        if (error.message === "Project not found")
            status = 404;
        res.status(status).json({
            message: error.message || "Failed to fetch project stats",
        });
    }
};
