import { Queue } from "bullmq";
import { redisConnection } from "../utils/redis.js";

// Initialize the queue using our shared Redis connection
export const alertEmailQueue = new Queue("alert-emails", {
  connection: redisConnection as any,
});

export interface AlertEmailJobData {
  toEmail: string;
  projectName: string;
  rule: {
    name: string;
    thresholdPercentage: number;
    windowMinutes: number;
    cooldownMinutes: number;
  };
  errorRate: number;
  errorCount: number;
  totalCount: number;
  failureSummary: Array<{
    method: string;
    path: string;
    count: number;
  }>;
}

/**
 * Enqueues an email alert job to be processed by background workers.
 */
export async function enqueueAlertEmail(data: AlertEmailJobData) {
  try {
    const job = await alertEmailQueue.add("send-alert-email", data, {
      attempts: 5, // Retry up to 5 times
      backoff: {
        type: "exponential",
        delay: 5000, // Wait 5s before first retry, then 10s, 20s, etc.
      },
      removeOnComplete: true, // Clean up successful jobs automatically
      removeOnFail: false, // Keep failed jobs for inspection
    });
    console.log(`[Queue] Enqueued alert email job ${job.id} for project "${data.projectName}"`);
    return job;
  } catch (error) {
    console.error("[Queue] Failed to enqueue alert email job:", error);
    throw error;
  }
}