import { logResponse } from "../services/logs.service.js";
export const logResponseController = async (req, res) => {
    try {
        const { statusCode, responseTime, endpointId } = req.body;
        const projectId = req.projectId;
        await logResponse(endpointId, projectId, statusCode, responseTime);
        res.status(200).json({
            message: "Log recorded successfully",
        });
    }
    catch (error) {
        const status = error.message === "Endpoint not found" ? 404 : 400;
        return res.status(status).json({
            message: error.message || "Failed to record log",
        });
    }
};
