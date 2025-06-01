import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { ChatSDKError } from '@/lib/errors';
import {
  validateIpAddress,
  validateUserAgent,
  securityHeaders,
} from '@/lib/security/auth';
import { db } from '@/lib/db';
import { eq } from 'drizzle-orm';
import { securitySettings } from '@/lib/db/schema';

export async function authMiddleware(request: NextRequest) {
  try {
    // Skip non-API routes and public routes
    if (
      !request.nextUrl.pathname.startsWith('/api/') ||
      request.nextUrl.pathname.startsWith('/api/auth')
    ) {
      return NextResponse.next();
    }

    // Get the session token
    const token = await getToken({
      req: request,
      secret: process.env.AUTH_SECRET,
    });

    if (!token) {
      return new ChatSDKError('unauthorized:auth').toResponse();
    }

    // Get organization security settings if user belongs to an organization
    let settings = null;
    if (token.organizationId) {
      const [orgSettings] = await db
        .select()
        .from(securitySettings)
        .where(eq(securitySettings.organizationId, token.organizationId));
      settings = orgSettings;
    }

    // Validate IP address if allowlist is configured
    if (settings?.ipAllowlist?.length > 0) {
      const clientIp =
        request.ip || request.headers.get('x-forwarded-for')?.split(',')[0];
      if (!clientIp || !validateIpAddress(clientIp, settings.ipAllowlist)) {
        return new ChatSDKError(
          'forbidden:auth',
          'IP address not allowed',
        ).toResponse();
      }
    }

    // Validate user agent
    const userAgent = request.headers.get('user-agent');
    if (!validateUserAgent(userAgent || '')) {
      return new ChatSDKError(
        'forbidden:auth',
        'Invalid user agent',
      ).toResponse();
    }

    // Add security headers to response
    const response = NextResponse.next();
    Object.entries(securityHeaders).forEach(([key, value]) => {
      response.headers.set(key, value);
    });

    return response;
  } catch (error) {
    console.error('Error in auth middleware:', error);
    return new ChatSDKError('internal_server_error:auth').toResponse();
  }
}
