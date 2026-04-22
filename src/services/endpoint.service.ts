import { HttpMethod } from "@prisma/client";
import { prisma } from "../utils/prisma.js";

export const createEndpoint = async (
  userId: string,
  projectId: string,
  name: string,
  path: string,
  method: HttpMethod
) => {
  const project = await prisma.project.findFirst({
    where: { id: projectId, userId },
  });

  if (!project) {
    throw new Error("Project not found");
  }

  return await prisma.endpoint.create({
    data: {
      projectId,
      name,
      path,
      method,
    },
  });
}

export const getEndpoints = async (projectId: string, userId: string) => {
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

export const getEndpointById = async (
  endpointId: string,
  userId: string
) => {
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

export const deleteEndpoint = async (
  endpointId: string,
  userId: string
) => {
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