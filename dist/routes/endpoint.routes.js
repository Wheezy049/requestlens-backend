import { Router } from "express";
import { authMiddleware } from "../middlewares/auth.middleware.js";
import { createEndpointController, deleteEndpointController, getEndpointByIdController, getEndpointsController } from "../controllers/endpoint.controller.js";
const endpointRouter = Router();
endpointRouter.post("/:projectId/endpoints", authMiddleware, createEndpointController);
endpointRouter.get("/:projectId/endpoints", authMiddleware, getEndpointsController);
endpointRouter.get("/:projectId/endpoints/:endpointId", authMiddleware, getEndpointByIdController);
endpointRouter.delete("/:projectId/endpoints/:endpointId", authMiddleware, deleteEndpointController);
export default endpointRouter;
