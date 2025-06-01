import { Redis } from '@upstash/redis';
import { headers } from 'next/headers';
import { auth } from '@/app/(auth)/auth';
import { getClientIp } from '@/lib/security/audit-logger';

// Initialize Redis client
const redisUrl = process.env.UPSTASH_REDIS_REST_URL;
const redisToken = process.env.UPSTASH_REDIS_REST_TOKEN;

if (!redisUrl || !redisToken) {
  throw new Error('Redis configuration is missing');
}

const redis = new Redis({
  url: redisUrl,
  token: redisToken,
});

interface RateLimitConfig {
  window: number; // in seconds
  limit: number;
}

interface RateLimitTier {
  name: string;
  config: RateLimitConfig;
}

// Define rate limit tiers
export const rateLimitTiers: Record<string, RateLimitTier> = {
  auth: {
    name: 'Authentication',
    config: { window: 300, limit: 10 }, // 10 requests per 5 minutes
  },
  api: {
    name: 'API',
    config: { window: 60, limit: 100 }, // 100 requests per minute
  },
  public: {
    name: 'Public',
    config: { window: 60, limit: 30 }, // 30 requests per minute
  },
};

interface RateLimitInfo {
  limit: number;
  remaining: number;
  reset: number;
}

export async function getRateLimiter(tier: string) {
  const headersList = headers();
  const session = await auth();

  // Get client identifier (user ID or IP address)
  const identifier = session?.user?.id || getClientIp(headersList);

  // Get rate limit config for the tier
  const { config } = rateLimitTiers[tier] || rateLimitTiers.public;

  return new RateLimiter(identifier, config);
}

class RateLimiter {
  private readonly identifier: string;
  private readonly window: number;
  private readonly limit: number;

  constructor(identifier: string, config: RateLimitConfig) {
    this.identifier = identifier;
    this.window = config.window;
    this.limit = config.limit;
  }

  private getKey(action?: string): string {
    const base = `rate_limit:${this.identifier}`;
    return action ? `${base}:${action}` : base;
  }

  async increment(action?: string): Promise<RateLimitInfo> {
    const key = this.getKey(action);
    const now = Math.floor(Date.now() / 1000);
    const windowStart = now - (now % this.window);
    const windowEnd = windowStart + this.window;

    // Use Redis transaction to ensure atomicity
    const multi = redis.multi();
    multi.incr(key);
    multi.expireat(key, windowEnd);

    const [count] = await multi.exec<[number]>();

    return {
      limit: this.limit,
      remaining: Math.max(0, this.limit - count),
      reset: windowEnd,
    };
  }

  async check(action?: string): Promise<RateLimitInfo> {
    const key = this.getKey(action);
    const now = Math.floor(Date.now() / 1000);
    const windowStart = now - (now % this.window);
    const windowEnd = windowStart + this.window;

    const count = (await redis.get<number>(key)) || 0;

    return {
      limit: this.limit,
      remaining: Math.max(0, this.limit - count),
      reset: windowEnd,
    };
  }
}
