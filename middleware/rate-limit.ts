import { redis } from "@/lib/redis";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const RATE_LIMIT_REQUESTS = process.env.RATE_LIMIT_REQUESTS
  ? parseInt(process.env.RATE_LIMIT_REQUESTS)
  : 100;
const RATE_LIMIT_WINDOW_MS = process.env.RATE_LIMIT_WINDOW_MS
  ? parseInt(process.env.RATE_LIMIT_WINDOW_MS)
  : 60000;

export async function rateLimit(req: NextRequest) {
  const ip = req.ip ?? "127.0.0.1";
  const key = `rate-limit:${ip}`;

  try {
    const current = await redis.get(key);
    const count = current ? parseInt(current) : 0;

    if (count >= RATE_LIMIT_REQUESTS) {
      return new NextResponse("Too Many Requests", {
        status: 429,
        headers: {
          "Retry-After": Math.ceil(RATE_LIMIT_WINDOW_MS / 1000).toString(),
        },
      });
    }

    // Increment the counter
    if (count === 0) {
      await redis.setex(key, Math.ceil(RATE_LIMIT_WINDOW_MS / 1000), "1");
    } else {
      await redis.incr(key);
    }

    return null;
  } catch (error) {
    console.error("Rate limiting error:", error);
    // If Redis is down, allow the request to proceed
    return null;
  }
}
