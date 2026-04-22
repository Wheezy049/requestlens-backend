import { Request, Response } from "express";
import { createEndpoint, deleteEndpoint, getEndpointById, getEndpoints } from "../services/endpoint.service.js";

export const createEndpointController = async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user.userId;

        const projectId = req.params.projectId as string;

        const { name, method, path } = req.body;

        if (!name || !method || !path) {
            return res.status(400).json({
                message: "Name, method, and path are required",
            })
        }

        const endpoint = await createEndpoint(userId, projectId, name, path, method);

        res.status(201).json({
            message: "Endpoint created successfully",
            endpoint,
        });
    } catch (error: any) {
        const status = error.message === "Project not found" ? 404 : 400;
        return res.status(status).json({
            message: error.message,
        })
    }
}

export const getEndpointsController = async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user.userId;

        const projectId = req.params.projectId as string;

        const endpoints = await getEndpoints(projectId, userId);

        res.status(200).json({
            message: "Endpoints retrieved successfully",
            endpoints,
        })
    } catch (error: any) {
        const status = error.message === "Project not found" ? 404 : 400;
        return res.status(status).json({
            message: error.message || "Failed to fetch endpoints",
        })
    }
}

export const getEndpointByIdController = async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user.userId;

        const endpointId = req.params.endpointId as string;

        const endpoint = await getEndpointById(endpointId, userId);
        res.status(200).json({
            message: "Endpoint retrieved successfully",
            endpoint,
        })
    } catch (error: any) {
        const status = error.message === "Endpoint not found" ? 404 : 400;
        return res.status(status).json({
            message: error.message || "Failed to fetch endpoint",
        })
    }
}

export const deleteEndpointController = async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user.userId;

        const endpointId = req.params.endpointId as string;

        const endpoint = await deleteEndpoint(endpointId, userId);
        res.status(200).json({
            message: "Endpoint deleted successfully",
            endpoint,
        })
    } catch (error: any) {
        const status = error.message === "Endpoint not found" ? 404 : 400;
        return res.status(status).json({
            message: error.message || "Failed to delete endpoint",
        })
    }
}