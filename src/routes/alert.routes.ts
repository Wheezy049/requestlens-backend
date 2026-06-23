import { Router } from "express";
import { authMiddleware } from "../middlewares/auth.middleware.js";
import {
  createAlertRuleController,
  getAlertRulesController,
  deleteAlertRuleController,
  toggleAlertRuleController,
} from "../controllers/alert.controller.js";

// we use this cos the params are in the parent router
const alertRouter = Router({ mergeParams: true });

// to avoid using authMiddlewares in all request so this run first 
alertRouter.use(authMiddleware);

alertRouter.get("/", getAlertRulesController);
alertRouter.post("/", createAlertRuleController);
alertRouter.patch("/:ruleId", toggleAlertRuleController);
alertRouter.delete("/:ruleId", deleteAlertRuleController);

export default alertRouter;