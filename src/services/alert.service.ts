import { prisma } from "../utils/prisma.js";
import { enqueueAlertEmail } from "../queues/alertQueue.js";

export const evaluateAlerts = async (projectId: string) => {
  try {
    // Fetch active alert rules for this project
    const activeRules = await prisma.alertRule.findMany({
      where: {
        projectId,
        active: true,
      },
    });

    if (activeRules.length === 0) return;

    for (const rule of activeRules) {
      // Check if this rule is in cooldown and Look for any AlertLog created in the last cooldownMinutes.
      const cooldownStart = new Date();
      cooldownStart.setMinutes(cooldownStart.getMinutes() - rule.cooldownMinutes);

      const recentTrigger = await prisma.alertLog.findFirst({
        where: {
          alertRuleId: rule.id,
          triggeredAt: {
            gte: cooldownStart,
          },
        },
      });

      if (recentTrigger) {
        console.log(`[Alerts] Rule "${rule.name}" is in cooldown. Last alert triggered at ${recentTrigger.triggeredAt}. Skipping.`);
        continue;
      }

      // Evaluate error rate in the window
      const windowStart = new Date();
      windowStart.setMinutes(windowStart.getMinutes() - rule.windowMinutes);

      const totalRequests = await prisma.apiLog.count({
        where: {
          endpoint: {
            projectId,
          },
          timestamp: {
            gte: windowStart,
          },
        },
      });

      // Skip evaluation if request volume is lower than minRequests
      if (totalRequests < rule.minRequests) {
        continue;
      }

      // Count 5xx errors (statusCode >= 500)
      const errorRequests = await prisma.apiLog.count({
        where: {
          endpoint: {
            projectId,
          },
          statusCode: {
            gte: 500,
          },
          timestamp: {
            gte: windowStart,
          },
        },
      });

      const errorRate = (errorRequests / totalRequests) * 100;

      if (errorRate >= rule.thresholdPercentage) {
        console.log(`[Alerts] Rule "${rule.name}" breached! Error rate: ${errorRate.toFixed(2)}% (threshold: ${rule.thresholdPercentage}%)`);

        // Record log to activate cooldown
        await prisma.alertLog.create({
          data: {
            alertRuleId: rule.id,
            errorRate: parseFloat(errorRate.toFixed(2)),
            totalRequests,
          },
        });

        // Fetch project and owner details
        const project = await prisma.project.findUnique({
          where: { id: projectId },
          include: {
            user: {
              select: {
                email: true,
              },
            },
          },
        });

        if (project && project.user.email) {
          // Fetch failed API logs for this project in the window to summarize them
          const failedLogs = await prisma.apiLog.findMany({
            where: {
              endpoint: {
                projectId,
              },
              statusCode: {
                gte: 500,
              },
              timestamp: {
                gte: windowStart,
              },
            },
            include: {
              endpoint: {
                select: {
                  method: true,
                  path: true,
                },
              },
            },
          });

          // Group failures by endpoint method + path
          const failureSummaryMap = new Map<string, { method: string; path: string; count: number }>();
          for (const log of failedLogs) {
            const key = `${log.endpoint.method}:${log.endpoint.path}`;
            const existing = failureSummaryMap.get(key);
            if (existing) {
              existing.count += 1;
            } else {
              failureSummaryMap.set(key, {
                method: log.endpoint.method,
                path: log.endpoint.path,
                count: 1,
              });
            }
          }
          const failureSummary = Array.from(failureSummaryMap.values());

          await enqueueAlertEmail({
            toEmail: project.user.email,
            projectName: project.name,
            rule: {
              name: rule.name,
              thresholdPercentage: rule.thresholdPercentage,
              windowMinutes: rule.windowMinutes,
              cooldownMinutes: rule.cooldownMinutes,
            },
            errorRate: parseFloat(errorRate.toFixed(2)),
            errorCount: errorRequests,
            totalCount: totalRequests,
            failureSummary,
          });
        }
      }
    }
  } catch (error) {
    console.error("[Alerts] Error during alert evaluation:", error);
  }
};