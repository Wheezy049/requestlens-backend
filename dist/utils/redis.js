import { Redis } from "ioredis";
const REDIS_URL = process.env.REDIS_URL || "redis://localhost:6379";
console.log(`[Redis] Initializing connection to: ${REDIS_URL}`);
export const redisConnection = new Redis(REDIS_URL, {
    maxRetriesPerRequest: null, // Required by BullMQ workers and queues
});
redisConnection.on("connect", () => {
    console.log("[Redis] Connected to Redis server successfully.");
});
redisConnection.on("error", (err) => {
    console.error("[Redis] Connection error:", err);
});
