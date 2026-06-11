import { createProject, getProjects, getProjectById, deleteProject, getProjectLogs, } from "../services/project.service.js";
export const createProjectController = async (req, res) => {
    try {
        const userId = req.user.userId;
        const { name, description } = req.body;
        if (!name) {
            return res.status(400).json({
                message: "Project name is required",
            });
        }
        const { project, apiKey } = await createProject(userId, name, description);
        res.status(201).json({
            message: "Project created successfully",
            project,
            apiKey,
        });
    }
    catch (error) {
        const status = error.message.includes("already exists") ? 409 : 400;
        res.status(status).json({
            message: error.message,
        });
    }
};
export const getProjectsController = async (req, res) => {
    try {
        const userId = req.user.userId;
        const projects = await getProjects(userId);
        res.status(200).json({
            message: "Projects retrieved successfully",
            projects,
        });
    }
    catch (error) {
        res.status(500).json({
            message: "Failed to fetch projects",
        });
    }
};
export const getProjectByIdController = async (req, res) => {
    try {
        const projectId = req.params.id;
        const userId = req.user.userId;
        const project = await getProjectById(projectId, userId);
        res.status(200).json({
            message: "Project retrieved successfully",
            project,
        });
    }
    catch (error) {
        res.status(404).json({
            message: error.message,
        });
    }
};
export const deleteProjectController = async (req, res) => {
    try {
        const projectId = req.params.id;
        const userId = req.user.userId;
        const project = await deleteProject(projectId, userId);
        res.status(200).json({
            message: "Project deleted successfully",
            project,
        });
    }
    catch (error) {
        res.status(404).json({
            message: error.message,
        });
    }
};
export const getProjectLogsController = async (req, res) => {
    try {
        const projectId = req.params.id;
        const userId = req.user.userId;
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const result = await getProjectLogs(projectId, userId, page, limit);
        res.status(200).json({
            message: "Project logs retrieved successfully",
            data: result,
        });
    }
    catch (error) {
        const status = error.message === "Project not found" ? 404 : 400;
        res.status(status).json({
            message: error.message || "Failed to fetch project logs",
        });
    }
};
