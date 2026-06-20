import { prisma } from "../utils/prisma.js";
import { emitNewLog } from "../utils/socket.js";

export const logResponse = async (endpointId: string, projectId: string, statusCode: number, responseTime: number) => {

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

    return log;
}