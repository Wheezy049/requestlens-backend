import { prisma } from "../utils/prisma.js";
import { getProjectById } from "./project.service.js";

export const getProjectStats = async (projectId: string, userId: string) => {

    await getProjectById(projectId, userId);

    const totalRequests = await prisma.apiLog.count({
        where: {
            endpoint: {
                projectId,
            },
        },
    });

    const failedRequests = await prisma.apiLog.count({
        where: {
            endpoint: {
                projectId,
            },
            statusCode: {
                gte: 400,
            },
        },
    });

    const successRate = totalRequests === 0 ? 0 : ((totalRequests - failedRequests) / totalRequests) * 100;

    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const recentLogs = await prisma.apiLog.findMany({
        where: {
            endpoint: {
                projectId,
            },
            timestamp: {
                gte: sevenDaysAgo,
            },
        },
        select: {
            timestamp: true,
            statusCode: true,
        },
    });

    const chartDataMap: Record<string, { date: string; total: number; failed: number; successful: number }> = {};

    // Initialize last 7 days in the map
    for (let i = 6; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const dateString = d.toISOString().split("T")[0];
        chartDataMap[dateString] = { date: dateString, total: 0, failed: 0, successful: 0 };
    }

    // Populate chart data
    recentLogs.forEach((log) => {
        const dateString = log.timestamp.toISOString().split("T")[0];
        if (chartDataMap[dateString]) {
            chartDataMap[dateString].total += 1;
            if (log.statusCode >= 400) {
                chartDataMap[dateString].failed += 1;
            } else {
                chartDataMap[dateString].successful += 1;
            }
        }
    });

    // Fetch endpoints for this project
    const endpoints = await prisma.endpoint.findMany({
        where: {
            projectId,
        },
    });

    // Group logs by endpointId to get request count and average response time
    const summaryStats = await prisma.apiLog.groupBy({
        by: ["endpointId"],
        where: {
            endpoint: {
                projectId,
            },
        },
        _count: {
            id: true,
        },
        _avg: {
            responseTime: true,
        },
    });

    // Group logs by endpointId to get failed request count (statusCode >= 400)
    const failureStats = await prisma.apiLog.groupBy({
        by: ["endpointId"],
        where: {
            endpoint: {
                projectId,
            },
            statusCode: {
                gte: 400,
            },
        },
        _count: {
            id: true,
        },
    });

    const summaryMap = new Map(summaryStats.map((s) => [s.endpointId, s]));
    const failureMap = new Map(failureStats.map((f) => [f.endpointId, f]));

    const endpointStats = endpoints.map((ep) => {
        const summary = summaryMap.get(ep.id);
        const failure = failureMap.get(ep.id);

        const epTotalRequests = summary?._count?.id || 0;
        const avgResponseTime = summary?._avg?.responseTime ? Math.round(summary._avg.responseTime) : 0;
        const epFailedRequests = failure?._count?.id || 0;
        const epSuccessRate = epTotalRequests === 0 ? 100 : parseFloat(((epTotalRequests - epFailedRequests) / epTotalRequests * 100).toFixed(2));

        return {
            id: ep.id,
            name: ep.name,
            path: ep.path,
            method: ep.method,
            totalRequests: epTotalRequests,
            failedRequests: epFailedRequests,
            successRate: epSuccessRate,
            avgResponseTime,
        };
    });

    return {
        totalRequests,
        failedRequests,
        successRate: parseFloat(successRate.toFixed(2)),
        chartData: Object.values(chartDataMap),
        endpointStats,
    };
};
