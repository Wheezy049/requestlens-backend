import { prisma } from "./utils/prisma.js";

async function main() {
  const users = await prisma.user.count();
  const projects = await prisma.project.count();
  const endpoints = await prisma.endpoint.count();
  const logs = await prisma.apiLog.count();
  const apiKeys = await prisma.apiKey.count();
  
  console.log("DB Stats:", { users, projects, endpoints, logs, apiKeys });
  
  const recentLogs = await prisma.apiLog.findMany({
    take: 5,
    orderBy: {
      timestamp: 'desc'
    },
    include: {
      endpoint: {
        select: {
          path: true,
          method: true,
          projectId: true
        }
      }
    }
  });
  
  console.log("Recent logs in DB:", JSON.stringify(recentLogs, null, 2));

  const allKeys = await prisma.apiKey.findMany({
    include: {
      project: true
    }
  });
  console.log("All API Keys:", allKeys);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
