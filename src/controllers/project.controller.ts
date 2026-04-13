import { Request, Response } from "express";
import {
  createProject,
  getProjects,
  getProjectById,
  deleteProject,
} from "../services/project.service.js";

export const createProjectController = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.userId;
    const { name, description } = req.body;

    if (!name) {
      return res.status(400).json({
        message: "Project name is required",
      });
    }

    const project = await createProject(userId, name, description);

    res.status(201).json({
      message: "Project created successfully",
      project,
    });
  } catch (error: any) {
    res.status(400).json({
      message: error.message,
    });
  }
};

export const getProjectsController = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.userId;

    const projects = await getProjects(userId);

    res.status(200).json({
      message: "Projects retrieved successfully",
      projects,
    });
  } catch (error: any) {
    res.status(500).json({
      message: "Failed to fetch projects",
    });
  }
};

export const getProjectByIdController = async (
  req: Request<{ id: string }>,
  res: Response
) => {
  try {
    const projectId = req.params.id;
    const userId = (req as any).user.userId;

    const project = await getProjectById(projectId, userId);

    res.status(200).json({
      message: "Project retrieved successfully",
      project,
    });
  } catch (error: any) {
    res.status(404).json({
      message: error.message,
    });
  }
};

export const deleteProjectController = async (
  req: Request<{ id: string }>,
  res: Response
) => {
  try {
    const projectId = req.params.id;
    const userId = (req as any).user.userId;

    const project = await deleteProject(projectId, userId);

    res.status(200).json({
      message: "Project deleted successfully",
      project,
    });
  } catch (error: any) {
    res.status(404).json({
      message: error.message,
    });
  }
};