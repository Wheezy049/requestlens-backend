import { prisma } from "./utils/prisma.js";
async function main() {
    console.log("Checking alert logs and project owner details...");
    // 1. Fetch all alert rules
    const rules = await prisma.alertRule.findMany({
        include: {
            project: {
                include: {
                    user: {
                        select: {
                            email: true
                        }
                    }
                }
            },
            logs: {
                orderBy: {
                    triggeredAt: 'desc'
                },
                take: 5
            }
        }
    });
    console.log("Alert Rules and logs in DB:", JSON.stringify(rules, null, 2));
    // 2. Count recent API logs for last 5 minutes to verify calculations
    const windowMinutes = 5;
    const windowStart = new Date();
    windowStart.setMinutes(windowStart.getMinutes() - windowMinutes);
    const totalLogs = await prisma.apiLog.count({
        where: {
            timestamp: {
                gte: windowStart
            }
        }
    });
    const errorLogs = await prisma.apiLog.count({
        where: {
            statusCode: {
                gte: 500
            },
            timestamp: {
                gte: windowStart
            }
        }
    });
    console.log(`Logs in the last 5 minutes: Total = ${totalLogs}, 5xx Errors = ${errorLogs}`);
}
main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
