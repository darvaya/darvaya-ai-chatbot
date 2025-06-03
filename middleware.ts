import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { apiAuth } from "./middleware/api-auth";
import { securityMiddleware } from "./middleware/security";
import { csrfMiddleware } from "./middleware/csrf";
import { databaseMiddleware } from "./middleware/database";
import { authMiddleware } from "./middleware/auth";
import { getRateLimiter } from "@/lib/security/rate-limit";
import { rateLimit } from "./middleware/rate-limit";

// Configuration
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
const ALLOWED_ORIGINS = [
  APP_URL,
  "https://*.railway.app",
  "https://*.openai.com",
  "https://*.google.com",
  "https://*.googleapis.com",
].filter(Boolean);

// Helper to check if origin is allowed
const isAllowedOrigin = (origin: string): boolean => {
  try {
    const url = new URL(origin);
    return ALLOWED_ORIGINS.some((allowed) => {
      if (allowed.startsWith("*")) {
        const domain = allowed.substring(2); // Remove '*.'
        return url.hostname.endsWith(domain);
      }
      return url.origin === allowed;
    });
  } catch {
    return false;
  }
};

// Define paths and their rate limit tiers
const pathTiers: Record<string, string> = {
  "/api/auth": "auth",
  "/api": "api",
};

export async function middleware(request: NextRequest) {
  try {
    // Skip rate limiting for static assets and non-API routes
    if (!request.nextUrl.pathname.startsWith("/api/")) {
      return NextResponse.next();
    }

    // Apply database security middleware first
    const dbResponse = await databaseMiddleware(request);
    if (dbResponse.status !== 200) {
      return dbResponse;
    }

    // Apply enhanced auth middleware
    const authResponse = await authMiddleware(request);
    if (authResponse.status !== 200) {
      return authResponse;
    }

    // Apply API authentication middleware
    const apiAuthResponse = await apiAuth(request);
    if (apiAuthResponse.status !== 200) {
      return apiAuthResponse;
    }

    // Apply CSRF middleware
    const csrfResponse = await csrfMiddleware(request);
    if (csrfResponse.status !== 200) {
      return csrfResponse;
    }

    // Apply security middleware
    const securityResponse = await securityMiddleware(request);
    if (securityResponse.status !== 200) {
      return securityResponse;
    }

    // Apply rate limiting
    const rateLimitResponse = await rateLimit(request);
    if (rateLimitResponse) {
      return rateLimitResponse;
    }

    // Determine the rate limit tier based on the path
    const path = request.nextUrl.pathname;
    let tier = "public";

    // Check for specific path matches
    for (const [pathPrefix, pathTier] of Object.entries(pathTiers)) {
      if (path.startsWith(pathPrefix)) {
        tier = pathTier;
        break;
      }
    }

    // Get rate limiter for the determined tier
    const rateLimiter = await getRateLimiter(tier);
    const rateLimitInfo = await rateLimiter.increment();

    // If rate limit exceeded, return 429 Too Many Requests
    if (rateLimitInfo.remaining <= 0) {
      return new NextResponse("Too Many Requests", {
        status: 429,
        headers: {
          "Retry-After": String(
            Math.ceil(rateLimitInfo.reset - Date.now() / 1000),
          ),
          "X-RateLimit-Limit": String(rateLimitInfo.limit),
          "X-RateLimit-Remaining": "0",
          "X-RateLimit-Reset": String(rateLimitInfo.reset),
        },
      });
    }

    // Continue with the request
    const response = NextResponse.next();

    // Add rate limit headers
    response.headers.set("X-RateLimit-Limit", String(rateLimitInfo.limit));
    response.headers.set(
      "X-RateLimit-Remaining",
      String(rateLimitInfo.remaining),
    );
    response.headers.set("X-RateLimit-Reset", String(rateLimitInfo.reset));

    // Get the origin from the request
    const origin = request.headers.get("origin") || "";
    const allowedOrigin = isAllowedOrigin(origin) ? origin : APP_URL;

    // CORS Headers
    response.headers.set("Access-Control-Allow-Origin", allowedOrigin);
    response.headers.set(
      "Access-Control-Allow-Methods",
      "GET, POST, PUT, DELETE, OPTIONS",
    );
    response.headers.set(
      "Access-Control-Allow-Headers",
      "Content-Type, Authorization, X-CSRF-Token",
    );
    response.headers.set("Access-Control-Allow-Credentials", "true");
    response.headers.set("Access-Control-Max-Age", "86400"); // 24 hours

    // Security Headers
    response.headers.set("X-DNS-Prefetch-Control", "on");
    response.headers.set(
      "Strict-Transport-Security",
      "max-age=63072000; includeSubDomains; preload",
    );
    response.headers.set("X-XSS-Protection", "1; mode=block");
    response.headers.set("X-Frame-Options", "SAMEORIGIN");
    response.headers.set("X-Content-Type-Options", "nosniff");
    response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
    response.headers.set(
      "Permissions-Policy",
      "camera=(), microphone=(), geolocation=()",
    );

    // Content Security Policy
    const csp = [
      "default-src 'self'",
      "script-src 'self' 'unsafe-eval' 'unsafe-inline' https: http:",
      "style-src 'self' 'unsafe-inline' https: http:",
      "img-src 'self' blob: data: https: http:",
      "font-src 'self' data: https: http:",
      `connect-src 'self' ${ALLOWED_ORIGINS.join(" ")}`,
      "frame-ancestors 'self'",
      "form-action 'self'",
      "base-uri 'self'",
    ].join("; ");

    response.headers.set("Content-Security-Policy", csp);

    return response;
  } catch (error) {
    console.error("Error in middleware chain:", error);
    return new NextResponse(
      JSON.stringify({
        error: "Internal server error",
      }),
      {
        status: 500,
        headers: {
          "Content-Type": "application/json",
        },
      },
    );
  }
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    "/((?!_next/static|_next/image|favicon.ico|public/).*)",
  ],
};
