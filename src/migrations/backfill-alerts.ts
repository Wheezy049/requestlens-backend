import { prisma } from "../utils/prisma.js";

async function main() {
  console.log("Starting backfill migration for alert rules...");

  const projects = await prisma.project.findMany({
    include: {
      alertRules: true
    }
  });

  console.log(`Found ${projects.length} existing projects in database.`);

  let createdCount = 0;

  for (const project of projects) {
    if (project.alertRules.length === 0) {
      console.log(`Project "${project.name}" (ID: ${project.id}) has no alert rules. Creating default rule...`);
      
      await prisma.alertRule.create({
        data: {
          projectId: project.id,
          name: "Default 5xx Error Alert",
          thresholdPercentage: 5.0,
          windowMinutes: 5,
          cooldownMinutes: 30,
          minRequests: 10
        }
      });
      createdCount++;
    } else {
      console.log(`Project "${project.name}" already has ${project.alertRules.length} rule(s). Skipping.`);
    }
  }

  console.log(`Backfill completed. Created default rules for ${createdCount} projects.`);
}

main()
  .catch((err) => {
    console.error("Backfill migration failed:", err);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
