import { Router } from "express";
import { createProjectController, getProjectsController, getProjectByIdController, deleteProjectController, getProjectLogsController } from "../controllers/project.controller.js";
import { authMiddleware } from "../middlewares/auth.middleware.js";

const projectRouter = Router();

projectRouter.post("/", authMiddleware, createProjectController);
projectRouter.get("/", authMiddleware, getProjectsController);
projectRouter.get("/:id", authMiddleware, getProjectByIdController);
projectRouter.get("/:id/logs", authMiddleware, getProjectLogsController);
projectRouter.delete("/:id", authMiddleware, deleteProjectController);

export default projectRouter;