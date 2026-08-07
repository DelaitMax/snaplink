import Redis from "ioredis";
import { env } from "@/config/env";
import { logger } from "@/utils/logger";

const redis = new Redis(env.REDIS_URL, {
  lazyConnect: true,
  maxRetriesPerRequest: 1,
  retryStrategy: (times) => Math.min(times * 200, 2000),
});

let hasWarnedUnavailable = false;

redis.on("error", (err) => {
  if (!hasWarnedUnavailable) {
    logger.warn("Redis unavailable, falling back to direct DB reads", { error: err.message });
    hasWarnedUnavailable = true;
  }
});

redis.on("connect", () => {
  hasWarnedUnavailable = false;
  logger.info("Redis connected");
});

redis.connect().catch(() => {
  /* handled via on("error") above */
});

export async function cacheGet(key: string): Promise<string | null> {
  try {
    return await redis.get(key);
  } catch {
    return null;
  }
}

export async function cacheSet(key: string, value: string, ttlSeconds: number): Promise<void> {
  try {
    await redis.set(key, value, "EX", ttlSeconds);
  } catch {
    // no-op: cache is unavailable, continue without it
  }
}

export async function cacheDel(key: string): Promise<void> {
  try {
    await redis.del(key);
  } catch {
    // no-op
  }
}

export { redis };
