import { prisma } from "../utils/prisma.js";
import { Resend } from "resend";

const getResend = () => {
  const resendApiKey = process.env.RESEND_API_KEY;
  return resendApiKey ? new Resend(resendApiKey) : null;
};

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

          await sendAlertEmail(
            project.user.email,
            project.name,
            rule,
            errorRate,
            errorRequests,
            totalRequests,
            failureSummary
          );
        }
      }
    }
  } catch (error) {
    console.error("[Alerts] Error during alert evaluation:", error);
  }
};

const sendAlertEmail = async (
  toEmail: string,
  projectName: string,
  rule: any,
  errorRate: number,
  errorCount: number,
  totalCount: number,
  failureSummary: Array<{ method: string; path: string; count: number }>
) => {
  const resend = getResend();
  if (!resend) {
    console.warn("[Alerts] Warning: RESEND_API_KEY is not configured in environment variables. Email alert skipped.");
    return;
  }

  const subject = `🚨 RequestLens Alert: Server Errors (500+) detected on project "${projectName}"`;

  // Generate Failing Endpoints Summary Table HTML
  let endpointsSummaryHtml = "";
  if (failureSummary && failureSummary.length > 0) {
    endpointsSummaryHtml = `
      <div style="margin-bottom: 24px;">
        <h3 style="color: #374151; margin-top: 0; margin-bottom: 12px; font-size: 15px; font-weight: 600; border-bottom: 1px solid #e5e7eb; padding-bottom: 6px;">Failing Endpoints Summary</h3>
        <table style="width: 100%; font-size: 13px; border-collapse: collapse; text-align: left;">
          <thead>
            <tr style="background-color: #f9fafb; border-bottom: 1px solid #e5e7eb;">
              <th style="padding: 8px; color: #4b5563; font-weight: 600; width: 80px;">Method</th>
              <th style="padding: 8px; color: #4b5563; font-weight: 600;">Endpoint Path</th>
              <th style="padding: 8px; color: #4b5563; font-weight: 600; text-align: right; width: 80px;">Failures</th>
            </tr>
          </thead>
          <tbody>
            ${failureSummary.map(item => `
              <tr style="border-bottom: 1px solid #f3f4f6;">
                <td style="padding: 8px; vertical-align: middle;">
                  <span style="background-color: #fee2e2; color: #dc2626; padding: 2px 6px; border-radius: 4px; font-weight: bold; font-size: 11px; font-family: monospace; display: inline-block;">${item.method}</span>
                </td>
                <td style="padding: 8px; color: #1f2937; font-family: monospace; word-break: break-all; vertical-align: middle;">${item.path}</td>
                <td style="padding: 8px; color: #b91c1c; font-weight: bold; text-align: right; vertical-align: middle;">${item.count}</td>
              </tr>
            `).join("")}
          </tbody>
        </table>
      </div>
    `;
  }
  
  const htmlContent = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; padding: 24px; color: #1f2937; max-width: 600px; margin: 0 auto; border: 1px solid #e5e7eb; border-radius: 8px; background-color: #ffffff;">
      <div style="text-align: center; margin-bottom: 24px; border-bottom: 1px solid #f3f4f6; padding-bottom: 20px;">
        <span style="font-size: 48px;">🚨</span>
        <h1 style="color: #dc2626; margin-top: 12px; font-size: 24px; font-weight: bold; margin-bottom: 4px;">Telemetry Alert Triggered</h1>
        <p style="color: #4b5563; font-size: 14px; margin-top: 0;">Project: <strong>${projectName}</strong></p>
      </div>

      <div style="background-color: #fef2f2; border: 1px solid #fee2e2; padding: 20px; border-radius: 8px; margin-bottom: 24px;">
        <h3 style="color: #991b1b; margin-top: 0; margin-bottom: 12px; font-size: 16px; border-bottom: 1px solid #fca5a5; padding-bottom: 8px;">Breached Threshold Details</h3>
        <table style="width: 100%; font-size: 14px; border-collapse: collapse;">
          <tr>
            <td style="padding: 6px 0; color: #7f1d1d; font-weight: 500;">Alert Rule:</td>
            <td style="padding: 6px 0; color: #7f1d1d; font-weight: bold; text-align: right;">${rule.name}</td>
          </tr>
          <tr>
            <td style="padding: 6px 0; color: #7f1d1d; font-weight: 500;">Calculated Error Rate:</td>
            <td style="padding: 6px 0; color: #b91c1c; font-weight: bold; font-size: 16px; text-align: right;">${errorRate.toFixed(2)}%</td>
          </tr>
          <tr>
            <td style="padding: 6px 0; color: #7f1d1d; font-weight: 500;">Configured Threshold:</td>
            <td style="padding: 6px 0; color: #7f1d1d; font-weight: bold; text-align: right;">>= ${rule.thresholdPercentage}%</td>
          </tr>
          <tr>
            <td style="padding: 6px 0; color: #7f1d1d; font-weight: 500;">Failed Requests (500+):</td>
            <td style="padding: 6px 0; color: #7f1d1d; font-weight: bold; text-align: right;">${errorCount} failures</td>
          </tr>
          <tr>
            <td style="padding: 6px 0; color: #7f1d1d; font-weight: 500;">Total Traffic:</td>
            <td style="padding: 6px 0; color: #7f1d1d; font-weight: bold; text-align: right;">${totalCount} requests</td>
          </tr>
          <tr>
            <td style="padding: 6px 0; color: #7f1d1d; font-weight: 500;">Evaluation Window:</td>
            <td style="padding: 6px 0; color: #7f1d1d; font-weight: bold; text-align: right;">Last ${rule.windowMinutes} minutes</td>
          </tr>
        </table>
      </div>

      ${endpointsSummaryHtml}

      <div style="background-color: #f9fafb; border: 1px solid #e5e7eb; padding: 16px; border-radius: 8px; margin-bottom: 24px; font-size: 13px; color: #4b5563; line-height: 1.5;">
        <strong>🛡️ Cooldown Active:</strong> To prevent email flooding, this alert has entered a <strong>${rule.cooldownMinutes}-minute cooldown period</strong>. No additional emails will be sent for this rule until it expires.
      </div>

      <div style="text-align: center; border-top: 1px solid #e5e7eb; padding-top: 24px;">
        <p style="font-size: 11px; color: #9ca3af; margin-top: 0; margin-bottom: 0;">This is an automated notification from RequestLens.</p>
      </div>
    </div>
  `;

  try {
    const { data, error } = await resend.emails.send({
      from: "RequestLens Alerts <onboarding@resend.dev>",
      to: toEmail,
      subject,
      html: htmlContent,
    });

    if (error) {
      console.error("[Alerts] Failed to send email via Resend:", error);
    } else {
      console.log("[Alerts] Email alert sent successfully. Mail ID:", data?.id);
    }
  } catch (err) {
    console.error("[Alerts] Error sending email via Resend client:", err);
  }
};