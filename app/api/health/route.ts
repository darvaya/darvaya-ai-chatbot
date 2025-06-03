import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { redis } from "@/lib/redis";
import { openai } from "@/lib/openai";
import { sql } from "@vercel/postgres";

export async function GET() {
  try {
    // Check database connection
    await sql`SELECT 1`;

    // Check Redis connection
    await redis.ping();

    // Check OpenAI API
    await openai.models.list();

    return NextResponse.json(
      {
        status: "healthy",
        timestamp: new Date().toISOString(),
        services: {
          database: "up",
          redis: "up",
          openai: "up",
        },
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("Health check failed:", error);

    return NextResponse.json(
      {
        status: "unhealthy",
        timestamp: new Date().toISOString(),
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 503 },
    );
  }
}
