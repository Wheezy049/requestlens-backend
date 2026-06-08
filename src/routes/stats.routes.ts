import { Router } from "express";
import { authMiddleware } from "../middlewares/auth.middleware.js";
import { getProjectStatsController } from "../controllers/stats.controller.js";

const statsRouter = Router();

statsRouter.get("/:projectId/stats", authMiddleware, getProjectStatsController);

export default statsRouter;