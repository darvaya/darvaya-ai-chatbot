import { Redis } from "ioredis";
import { Redis as UpstashRedis } from "@upstash/redis";
import { logger } from "./logger";

// Initialize Redis client based on environment
const getRedisClient = () => {
  if (
    process.env.UPSTASH_REDIS_REST_URL &&
    process.env.UPSTASH_REDIS_REST_TOKEN
  ) {
    // Use Upstash Redis for serverless environments
    return new UpstashRedis({
      url: process.env.UPSTASH_REDIS_REST_URL,
      token: process.env.UPSTASH_REDIS_REST_TOKEN,
    });
  }

  // Use regular Redis client for development or non-serverless environments
  const redisUrl = process.env.REDIS_URL || "redis://localhost:6379";
  const client = new Redis(redisUrl, {
    maxRetriesPerRequest: 3,
    retryStrategy: (times) => {
      if (times > 3) {
        return null; // stop retrying
      }
      return Math.min(times * 50, 2000); // exponential backoff
    },
  });

  // Add event handlers for regular Redis client
  client.on("error", (err: Error) => {
    console.error("Redis Client Error:", err);
  });

  client.on("connect", () => {
    console.log("Redis Client Connected");
  });

  return client;
};

// Create a type that combines both Redis clients
type RedisClient = Redis | UpstashRedis;

// Export the Redis client instance
export const redis: RedisClient = getRedisClient();

// Handle Redis events
redis.on("connect", () => {
  logger.info("Redis client connected");
});

redis.on("error", (error) => {
  logger.error("Redis client error:", error);
});

redis.on("ready", () => {
  logger.info("Redis client ready");
});

redis.on("close", () => {
  logger.warn("Redis client closed connection");
});

redis.on("reconnecting", () => {
  logger.info("Redis client reconnecting");
});

// Cache wrapper with error handling
export class Cache {
  static async get<T>(key: string): Promise<T | null> {
    try {
      const value = await redis.get(key);
      return value ? JSON.parse(value) : null;
    } catch (error) {
      logger.error("Cache get error:", error);
      return null;
    }
  }

  static async set(
    key: string,
    value: any,
    ttlSeconds?: number,
  ): Promise<boolean> {
    try {
      if (ttlSeconds) {
        await redis.setex(key, ttlSeconds, JSON.stringify(value));
      } else {
        await redis.set(key, JSON.stringify(value));
      }
      return true;
    } catch (error) {
      logger.error("Cache set error:", error);
      return false;
    }
  }

  static async del(key: string): Promise<boolean> {
    try {
      await redis.del(key);
      return true;
    } catch (error) {
      logger.error("Cache delete error:", error);
      return false;
    }
  }

  static async exists(key: string): Promise<boolean> {
    try {
      return (await redis.exists(key)) === 1;
    } catch (error) {
      logger.error("Cache exists error:", error);
      return false;
    }
  }

  static async clear(): Promise<boolean> {
    try {
      await redis.flushdb();
      return true;
    } catch (error) {
      logger.error("Cache clear error:", error);
      return false;
    }
  }

  // Batch operations
  static async mget<T>(keys: string[]): Promise<(T | null)[]> {
    try {
      const values = await redis.mget(keys);
      return values.map((value) => (value ? JSON.parse(value) : null));
    } catch (error) {
      logger.error("Cache mget error:", error);
      return keys.map(() => null);
    }
  }

  static async mset(entries: { key: string; value: any }[]): Promise<boolean> {
    try {
      const args = entries.flatMap(({ key, value }) => [
        key,
        JSON.stringify(value),
      ]);
      await redis.mset(args);
      return true;
    } catch (error) {
      logger.error("Cache mset error:", error);
      return false;
    }
  }
}
