import { prisma } from "../utils/prisma.js";

export const createProject = async (userId: string, name: string, description: string) => {

    const existingProject = await prisma.project.findFirst({
        where: {
            userId: userId,
            name,
        }
    })

    if (existingProject) {
        throw new Error("Project with the same name already exists for this user");
    }

    return await prisma.project.create({
        data: {
            userId: userId,
            name,
            description,
        }
    });
};

export const getProjects = async (userId: string) => {
    return await prisma.project.findMany({
        where: {
            userId: userId,
        }
    })
}

export const getProjectById = async (projectId: string, userId: string) => {
    const project = await prisma.project.findFirst({
        where: {
            id: projectId,
            userId,
        },
    });

    if (!project) {
        throw new Error("Project not found");
    }

    return project;
};

export const deleteProject = async (projectId: string, userId: string) => {
    const project = await prisma.project.findFirst({
        where: {
            id: projectId,
            userId,
        },
    });

    if (!project) {
        throw new Error("Project not found");
    }

    return await prisma.project.delete({
        where: {
            id: projectId,
        },
    });
};