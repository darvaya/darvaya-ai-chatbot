import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { eq } from 'drizzle-orm';
import { securitySettings } from '@/lib/db/schema';
import { getClientIp } from '@/lib/security/audit-logger';

export async function securityMiddleware(request: NextRequest) {
  try {
    // Get organization ID from request context
    const organizationId = request.headers.get('x-organization-id');
    if (!organizationId) {
      return NextResponse.next();
    }

    // Fetch security settings for the organization
    const [settings] = await db
      .select()
      .from(securitySettings)
      .where(eq(securitySettings.organizationId, organizationId));

    if (!settings) {
      return NextResponse.next();
    }

    // Check IP allowlist
    if (settings.ipAllowlist?.length > 0) {
      const clientIp = getClientIp(request.headers);
      if (!settings.ipAllowlist.includes(clientIp)) {
        return new NextResponse(
          JSON.stringify({
            error: 'Access denied: IP not in allowlist',
          }),
          {
            status: 403,
            headers: {
              'Content-Type': 'application/json',
            },
          },
        );
      }
    }

    // Add security headers
    const response = NextResponse.next();
    const headers = response.headers;

    // Security headers
    headers.set('X-Content-Type-Options', 'nosniff');
    headers.set('X-Frame-Options', 'DENY');
    headers.set('X-XSS-Protection', '1; mode=block');
    headers.set(
      'Content-Security-Policy',
      "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline';",
    );
    headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
    headers.set(
      'Permissions-Policy',
      'camera=(), microphone=(), geolocation=(), interest-cohort=()',
    );

    // HSTS (only in production)
    if (process.env.NODE_ENV === 'production') {
      headers.set(
        'Strict-Transport-Security',
        'max-age=31536000; includeSubDomains',
      );
    }

    return response;
  } catch (error) {
    console.error('Error in security middleware:', error);
    return NextResponse.next();
  }
}
