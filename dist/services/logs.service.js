import { prisma } from "../utils/prisma.js";
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
    return await prisma.apiLog.create({
        data: {
            endpointId,
            statusCode,
            responseTime,
        }
    });
};
