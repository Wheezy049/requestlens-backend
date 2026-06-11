import { prisma } from "../utils/prisma.js";
export const createEndpoint = async (userId, projectId, name, path, method) => {
    const project = await prisma.project.findFirst({
        where: { id: projectId, userId },
    });
    if (!project) {
        throw new Error("Project not found");
    }
    const existingEndpoint = await prisma.endpoint.findFirst({
        where: {
            projectId,
            path,
            method,
        },
    });
    if (existingEndpoint) {
        throw new Error("Endpoint with this path and method already exists in this project");
    }
    return await prisma.endpoint.create({
        data: {
            projectId,
            name,
            path,
            method,
        },
    });
};
export const getEndpoints = async (projectId, userId) => {
    const project = await prisma.project.findFirst({
        where: { id: projectId, userId },
    });
    if (!project) {
        throw new Error("Project not found");
    }
    return await prisma.endpoint.findMany({
        where: { projectId },
    });
};
export const getEndpointById = async (endpointId, userId) => {
    const endpoint = await prisma.endpoint.findFirst({
        where: {
            id: endpointId,
            project: {
                userId,
            },
        },
        include: {
            project: true,
        },
    });
    if (!endpoint) {
        throw new Error("Endpoint not found");
    }
    return endpoint;
};
export const deleteEndpoint = async (endpointId, userId) => {
    const endpoint = await prisma.endpoint.findFirst({
        where: {
            id: endpointId,
            project: {
                userId,
            },
        },
    });
    if (!endpoint) {
        throw new Error("Endpoint not found");
    }
    return await prisma.endpoint.delete({
        where: {
            id: endpointId,
        },
    });
};
