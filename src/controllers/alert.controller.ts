import { Request, Response } from "express";
import { prisma } from "../utils/prisma.js";

export const createAlertRuleController = async (req: Request, res: Response) => {
  try {
    const { projectId } = req.params as { projectId: string };
    const { name, thresholdPercentage, windowMinutes, cooldownMinutes, minRequests } = req.body;
    const userId = (req as any).user.userId;

    const project = await prisma.project.findFirst({
      where: {
        id: projectId,
        userId,
      },
    });

    if (!project) {
      return res.status(404).json({ message: "Project not found" });
    }

    if (!name || thresholdPercentage === undefined) {
      return res.status(400).json({ message: "Name and threshold percentage are required" });
    }

    const alertRule = await prisma.alertRule.create({
      data: {
        projectId,
        name,
        thresholdPercentage: parseFloat(thresholdPercentage),
        windowMinutes: windowMinutes ? parseInt(windowMinutes) : 5,
        cooldownMinutes: cooldownMinutes ? parseInt(cooldownMinutes) : 30,
        minRequests: minRequests ? parseInt(minRequests) : 10,
      },
    });

    res.status(201).json({
      message: "Alert rule created successfully",
      alertRule,
    });
  } catch (error: any) {
    res.status(500).json({ message: error.message || "Failed to create alert rule" });
  }
};

export const getAlertRulesController = async (req: Request, res: Response) => {
  try {
    const { projectId } = req.params as { projectId: string };
    const userId = (req as any).user.userId;

    const project = await prisma.project.findFirst({
      where: {
        id: projectId,
        userId,
      },
    });

    if (!project) {
      return res.status(404).json({ message: "Project not found" });
    }

    const alertRules = await prisma.alertRule.findMany({
      where: {
        projectId,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    res.status(200).json({
      message: "Alert rules retrieved successfully",
      alertRules,
    });
  } catch (error: any) {
    res.status(500).json({ message: error.message || "Failed to fetch alert rules" });
  }
};

export const toggleAlertRuleController = async (req: Request, res: Response) => {
  try {
    const { projectId, ruleId } = req.params as { projectId: string; ruleId: string };
    const { active } = req.body;
    const userId = (req as any).user.userId;

    const project = await prisma.project.findFirst({
      where: {
        id: projectId,
        userId,
      },
    });

    if (!project) {
      return res.status(404).json({ message: "Project not found" });
    }

    const rule = await prisma.alertRule.findFirst({
      where: {
        id: ruleId,
        projectId,
      },
    });

    if (!rule) {
      return res.status(404).json({ message: "Alert rule not found" });
    }

    const updatedRule = await prisma.alertRule.update({
      where: { id: ruleId },
      data: {
        active: active === undefined ? !rule.active : !!active,
      },
    });

    res.status(200).json({
      message: "Alert rule updated successfully",
      alertRule: updatedRule,
    });
  } catch (error: any) {
    res.status(500).json({ message: error.message || "Failed to update alert rule" });
  }
};

export const deleteAlertRuleController = async (req: Request, res: Response) => {
  try {
    const { projectId, ruleId } = req.params as { projectId: string; ruleId: string };
    const userId = (req as any).user.userId;

    const project = await prisma.project.findFirst({
      where: {
        id: projectId,
        userId,
      },
    });

    if (!project) {
      return res.status(404).json({ message: "Project not found" });
    }

    const rule = await prisma.alertRule.findFirst({
      where: {
        id: ruleId,
        projectId,
      },
    });

    if (!rule) {
      return res.status(404).json({ message: "Alert rule not found" });
    }

    await prisma.alertRule.delete({
      where: { id: ruleId },
    });

    res.status(200).json({
      message: "Alert rule deleted successfully",
    });
  } catch (error: any) {
    res.status(500).json({ message: error.message || "Failed to delete alert rule" });
  }
};
