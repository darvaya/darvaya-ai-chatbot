import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { apiAuth } from './middleware/api-auth';
import { securityMiddleware } from './middleware/security';
import { csrfMiddleware } from './middleware/csrf';
import { databaseMiddleware } from './middleware/database';
import { authMiddleware } from './middleware/auth';
import { getRateLimiter } from '@/lib/security/rate-limit';

// Define paths and their rate limit tiers
const pathTiers: Record<string, string> = {
  '/api/auth': 'auth',
  '/api': 'api',
};

export async function middleware(request: NextRequest) {
  try {
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

    // Determine the rate limit tier based on the path
    const path = request.nextUrl.pathname;
    let tier = 'public';

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
      return new NextResponse('Too Many Requests', {
        status: 429,
        headers: {
          'Retry-After': String(
            Math.ceil(rateLimitInfo.reset - Date.now() / 1000),
          ),
          'X-RateLimit-Limit': String(rateLimitInfo.limit),
          'X-RateLimit-Remaining': '0',
          'X-RateLimit-Reset': String(rateLimitInfo.reset),
        },
      });
    }

    // Continue with the request
    const response = NextResponse.next();

    // Add rate limit headers
    response.headers.set('X-RateLimit-Limit', String(rateLimitInfo.limit));
    response.headers.set(
      'X-RateLimit-Remaining',
      String(rateLimitInfo.remaining),
    );
    response.headers.set('X-RateLimit-Reset', String(rateLimitInfo.reset));

    return response;
  } catch (error) {
    console.error('Error in middleware chain:', error);
    return new NextResponse(
      JSON.stringify({
        error: 'Internal server error',
      }),
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
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
     * - public (public files)
     */
    '/((?!_next/static|_next/image|favicon.ico|public).*)',
    // Add paths that should be rate limited
    '/api/:path*',
    '/auth/:path*',
  ],
};
