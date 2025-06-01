import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import {
  validateToken,
  CSRF_METHODS,
  CSRF_EXEMPT_PATHS,
  CSRF_HEADER_NAME,
} from '@/lib/security/csrf';

export async function csrfMiddleware(request: NextRequest) {
  try {
    // Skip CSRF check for exempt paths
    const requestPath = new URL(request.url).pathname;
    if (CSRF_EXEMPT_PATHS.includes(requestPath)) {
      return NextResponse.next();
    }

    // Only check CSRF token for mutating methods
    if (!CSRF_METHODS.includes(request.method)) {
      return NextResponse.next();
    }

    // Get CSRF token from header
    const csrfToken = request.headers.get(CSRF_HEADER_NAME);

    // Validate CSRF token
    const isValid = validateToken(csrfToken);
    if (!isValid) {
      return new NextResponse(
        JSON.stringify({
          error: 'Invalid CSRF token',
        }),
        {
          status: 403,
          headers: {
            'Content-Type': 'application/json',
          },
        },
      );
    }

    return NextResponse.next();
  } catch (error) {
    console.error('Error in CSRF middleware:', error);
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
