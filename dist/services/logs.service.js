import { prisma } from "../utils/prisma.js";
import { emitNewLog } from "../utils/socket.js";
import { evaluateAlerts } from "./alert.service.js";
export const logResponse = async (endpointId, projectId, statusCode, responseTime) => {
    const endpoint = await prisma.endpoint.findFirst({
        where: {
            id: endpointId,
            projectId: projectId
        },
    });
    if (!endpoint) {
        throw new Error("Endpoint not found or does not belong to your project");
    }
    const log = await prisma.apiLog.create({
        data: {
            endpointId,
            statusCode,
            responseTime,
        },
        include: {
            endpoint: {
                select: {
                    name: true,
                    path: true,
                    method: true,
                }
            }
        }
    });
    emitNewLog(projectId, log);
    // Evaluate alerts asynchronously to prevent blocking log ingestion
    evaluateAlerts(projectId).catch((err) => {
        console.error(`[Alerts] Error in async evaluateAlerts for project ${projectId}:`, err);
    });
    return log;
};
