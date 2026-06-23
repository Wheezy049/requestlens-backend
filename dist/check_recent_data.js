import { prisma } from "./utils/prisma.js";
async function main() {
    console.log("=== DB Diagnostic: Checking Recent API Logs and Alert Rules ===");
    // Get current time
    const now = new Date();
    console.log(`Current JS Server Time (UTC): ${now.toISOString()}`);
    // Fetch all projects
    const projects = await prisma.project.findMany({
        include: {
            user: true,
            endpoints: true,
            alertRules: {
                include: {
                    logs: {
                        orderBy: { triggeredAt: 'desc' }
                    }
                }
            }
        }
    });
    for (const project of projects) {
        console.log(`\nProject: "${project.name}" (ID: ${project.id})`);
        console.log(`Owner Email: ${project.user?.email}`);
        console.log(`Endpoints count: ${project.endpoints.length}`);
        // Alert rules
        console.log(`Alert Rules:`);
        for (const rule of project.alertRules) {
            console.log(` - Rule "${rule.name}" (ID: ${rule.id}):`);
            console.log(`   Threshold: ${rule.thresholdPercentage}%, Window: ${rule.windowMinutes}m, Cooldown: ${rule.cooldownMinutes}m, MinRequests: ${rule.minRequests}, Active: ${rule.active}`);
            console.log(`   Recent logs:`);
            for (const log of rule.logs.slice(0, 5)) {
                console.log(`     * Triggered at: ${log.triggeredAt.toISOString()}, ErrorRate: ${log.errorRate}%, TotalRequests: ${log.totalRequests}`);
            }
        }
        // Recent API logs in the last 15 minutes
        const windowStart = new Date(now.getTime() - 15 * 60 * 1000);
        const recentLogs = await prisma.apiLog.findMany({
            where: {
                endpoint: { projectId: project.id },
                timestamp: { gte: windowStart }
            },
            include: {
                endpoint: true
            },
            orderBy: { timestamp: 'desc' }
        });
        console.log(`API Logs in last 15 minutes: ${recentLogs.length}`);
        const failures = recentLogs.filter(l => l.statusCode >= 500);
        console.log(`Failures in last 15 minutes (5xx): ${failures.length}`);
        if (recentLogs.length > 0) {
            console.log("Recent logs detail (last 20):");
            recentLogs.slice(0, 20).forEach(log => {
                console.log(` - [${log.timestamp.toISOString()}] Method: ${log.endpoint?.method}, Path: ${log.endpoint?.path}, Code: ${log.statusCode}`);
            });
        }
    }
}
main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
