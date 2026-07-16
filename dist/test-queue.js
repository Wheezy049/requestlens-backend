import dotenv from "dotenv";
dotenv.config();
import { enqueueAlertEmail } from "./queues/alertQueue.js";
async function test() {
    console.log("Enqueuing a mock alert job into BullMQ...");
    await enqueueAlertEmail({
        toEmail: "olatoyesefaruq@gmail.com",
        projectName: "Test Docker Project",
        rule: {
            name: "High 5xx Error rate",
            thresholdPercentage: 5.0,
            windowMinutes: 5,
            cooldownMinutes: 30,
        },
        errorRate: 15.5,
        errorCount: 3,
        totalCount: 20,
        failureSummary: [
            { method: "GET", path: "/api/checkout", count: 2 },
            { method: "POST", path: "/api/login", count: 1 },
        ],
    });
    console.log("Job successfully enqueued!");
    process.exit(0);
}
test().catch(console.error);
