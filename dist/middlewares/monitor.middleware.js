import { prisma } from "../utils/prisma.js";
// Cache the resolved projectId in memory to avoid database query overhead on every request
let cachedProjectId = null;
// Helper to look up Project ID associated with the Self-Monitoring API Key
async function getSelfProjectId() {
    if (cachedProjectId)
        return cachedProjectId;
    const key = process.env.SELF_MONITORING_API_KEY;
    if (!key) {
        console.warn("Self-monitoring warning: SELF_MONITORING_API_KEY not configured in environment.");
        return null;
    }
    try {
        const apiKeyRecord = await prisma.apiKey.findUnique({
            where: { key },
            select: { projectId: true },
        });
        if (apiKeyRecord) {
            cachedProjectId = apiKeyRecord.projectId;
            return cachedProjectId;
        }
        else {
            console.warn("Self-monitoring warning: Configured API Key is invalid in the database.");
            return null;
        }
    }
    catch (error) {
        console.error("Self-monitoring error: Failed to look up API Key in database", error);
        return null;
    }
}
export const monitorMiddleware = async (req, res, next) => {
    console.log(`[Monitor] Incoming: ${req.method} ${req.path}`);
    // 1. Exclude the logging endpoint itself to prevent infinite loops
    // Also exclude Swagger UI docs, basic root health checks, or favicon requests
    if (req.path.startsWith("/api-docs") || req.path === "/api/logs" || req.path === "/favicon.ico" || req.path === "/") {
        console.log(`[Monitor] Skipping path: ${req.path}`);
        return next();
    }
    const start = Date.now();
    res.on("finish", async () => {
        const duration = Date.now() - start;
        console.log(`[Monitor] Response finished: ${req.method} ${req.path} with status ${res.statusCode} in ${duration}ms`);
        // Resolve our monitoring project ID
        const projectId = await getSelfProjectId();
        console.log(`[Monitor] Resolved project ID: ${projectId}`);
        if (!projectId)
            return;
        // Determine path template
        // Using req.baseUrl + req.route.path represents the Express template (e.g. /api/projects/:projectId/stats)
        // If the request resulted in a 404, req.route will be undefined, so fall back to req.path
        let pathTemplate = req.path;
        if (req.route) {
            pathTemplate = req.baseUrl + req.route.path;
        }
        // Normalize trailing slash (e.g. /api/projects/ -> /api/projects)
        if (pathTemplate.length > 1 && pathTemplate.endsWith("/")) {
            pathTemplate = pathTemplate.slice(0, -1);
        }
        const method = req.method.toUpperCase();
        // Only log standard REST methods supported by our HttpMethod database enum
        const validMethods = ["GET", "POST", "PUT", "PATCH", "DELETE"];
        if (!validMethods.includes(method))
            return;
        try {
            // Check if endpoint exists under the monitoring project
            let endpoint = await prisma.endpoint.findFirst({
                where: {
                    projectId,
                    path: pathTemplate,
                    method: method,
                },
            });
            // If not found, auto-discover and create it!
            if (!endpoint) {
                // Generate a friendly name, e.g. "Get Projects List" or "Post Auth Login"
                let friendlyName = `${method} ${pathTemplate}`;
                if (pathTemplate === "/api/auth/login")
                    friendlyName = "User Login";
                else if (pathTemplate === "/api/auth/register")
                    friendlyName = "User Register";
                else if (pathTemplate === "/api/projects")
                    friendlyName = "Projects List/Create";
                else if (pathTemplate === "/api/projects/:id")
                    friendlyName = "Project Detail/Delete";
                else if (pathTemplate === "/api/projects/:projectId/stats")
                    friendlyName = "Get Dashboard Stats";
                else if (pathTemplate === "/api/projects/:id/logs")
                    friendlyName = "Get Project Logs";
                endpoint = await prisma.endpoint.create({
                    data: {
                        projectId,
                        path: pathTemplate,
                        method: method,
                        name: friendlyName,
                    },
                });
            }
            // Create log record
            await prisma.apiLog.create({
                data: {
                    endpointId: endpoint.id,
                    statusCode: res.statusCode,
                    responseTime: duration,
                },
            });
        }
        catch (error) {
            console.error("Self-monitoring error: Failed to record telemetry log", error);
        }
    });
    next();
};
