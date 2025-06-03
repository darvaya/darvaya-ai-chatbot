import { NextResponse } from "next/server";
import { db, client } from "@/lib/db";
import { redis } from "@/lib/redis";
import { openai } from "@/lib/openai";

type HealthCheck = {
  name: string;
  status: "healthy" | "degraded" | "unhealthy";
  message: string;
  timestamp: string;
};

export async function GET() {
  const checks: Record<string, HealthCheck> = {};
  const timestamp = new Date().toISOString();

  // Database check
  try {
    await client`SELECT 1`;
    checks.database = {
      name: "Database",
      status: "healthy",
      message: "Database connection successful",
      timestamp,
    };
  } catch (error) {
    console.error("Database health check failed:", error);
    checks.database = {
      name: "Database",
      status: "unhealthy",
      message:
        error instanceof Error ? error.message : "Database connection failed",
      timestamp,
    };
  }

  // Redis check
  try {
    await redis.ping();
    checks.redis = {
      name: "Redis",
      status: "healthy",
      message: "Redis connection successful",
      timestamp,
    };
  } catch (error) {
    console.error("Redis health check failed:", error);
    checks.redis = {
      name: "Redis",
      status: "degraded",
      message:
        error instanceof Error ? error.message : "Redis connection failed",
      timestamp,
    };
  }

  // OpenAI check
  try {
    await openai.models.list();
    checks.openai = {
      name: "OpenAI",
      status: "healthy",
      message: "OpenAI API connection successful",
      timestamp,
    };
  } catch (error) {
    console.error("OpenAI health check failed:", error);
    checks.openai = {
      name: "OpenAI",
      status: "degraded",
      message:
        error instanceof Error ? error.message : "OpenAI API connection failed",
      timestamp,
    };
  }

  // Determine overall status
  const allChecks = Object.values(checks);
  const isHealthy = allChecks.every((check) => check.status === "healthy");
  const isDegraded = allChecks.some((check) => check.status === "degraded");

  const status = isHealthy ? "healthy" : isDegraded ? "degraded" : "unhealthy";
  const statusCode = isHealthy ? 200 : isDegraded ? 206 : 500;

  return NextResponse.json(
    {
      status,
      timestamp,
      checks,
    },
    { status: statusCode },
  );
}
