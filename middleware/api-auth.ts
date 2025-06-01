import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { createHash } from 'node:crypto';
import { db } from '@/lib/db';
import { eq } from 'drizzle-orm';
import { apiKey } from '@/lib/db/schema';

export async function apiAuth(request: NextRequest) {
  // Skip API auth for non-API routes
  if (!request.nextUrl.pathname.startsWith('/api/')) {
    return NextResponse.next();
  }

  // Skip API auth for auth routes and webhook routes
  if (
    request.nextUrl.pathname.startsWith('/api/auth') ||
    request.nextUrl.pathname.startsWith('/api/webhooks')
  ) {
    return NextResponse.next();
  }

  const apiKeyHeader = request.headers.get('x-api-key');

  // If no API key is provided, continue to next middleware
  // This allows the route handler to handle authentication
  if (!apiKeyHeader) {
    return NextResponse.next();
  }

  try {
    // Hash the provided API key
    const hashedKey = createHash('sha256').update(apiKeyHeader).digest('hex');

    // Look up the API key
    const [foundKey] = await db
      .select()
      .from(apiKey)
      .where(eq(apiKey.hashedKey, hashedKey));

    if (!foundKey || !foundKey.isActive) {
      return new NextResponse(
        JSON.stringify({
          error: 'Invalid or inactive API key',
        }),
        {
          status: 401,
          headers: {
            'Content-Type': 'application/json',
          },
        },
      );
    }

    // Update last used timestamp
    await db
      .update(apiKey)
      .set({ lastUsedAt: new Date() })
      .where(eq(apiKey.id, foundKey.id));

    // Add organization context to the request
    const requestHeaders = new Headers(request.headers);
    requestHeaders.set('x-organization-id', foundKey.organizationId);

    // Create a new request with the modified headers
    const modifiedRequest = new NextRequest(request.url, {
      headers: requestHeaders,
      method: request.method,
      body: request.body,
      cache: request.cache,
      credentials: request.credentials,
      integrity: request.integrity,
      keepalive: request.keepalive,
      mode: request.mode,
      redirect: request.redirect,
      referrer: request.referrer,
      referrerPolicy: request.referrerPolicy,
      signal: request.signal,
    });

    return NextResponse.next({
      request: modifiedRequest,
    });
  } catch (error) {
    console.error('Error authenticating API key:', error);
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
