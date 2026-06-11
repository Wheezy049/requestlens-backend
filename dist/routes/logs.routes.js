import { Router } from "express";
import { logResponseController } from "../controllers/logs.controller.js";
import { apiKeyMiddleware } from "../middlewares/apiKey.middleware.js";
const logRouter = Router();
logRouter.post("/", apiKeyMiddleware, logResponseController);
export default logRouter;
