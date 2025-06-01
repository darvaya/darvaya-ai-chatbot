import { db } from '@/lib/db';
import { securityAuditLog } from '@/lib/db/schema';
import type {
  SecurityEventTypeEnum,
  SecuritySeverityEnum,
} from '@/lib/db/schema';

interface AuditLogOptions {
  organizationId: string;
  userId: string;
  eventType: SecurityEventTypeEnum;
  severity?: SecuritySeverityEnum;
  details?: {
    action?: string;
    target?: string;
    changes?: Record<string, unknown>;
    metadata?: Record<string, unknown>;
  };
  ipAddress?: string;
  userAgent?: string;
}

export async function logSecurityEvent({
  organizationId,
  userId,
  eventType,
  severity = 'low',
  details,
  ipAddress,
  userAgent,
}: AuditLogOptions) {
  try {
    const [log] = await db
      .insert(securityAuditLog)
      .values({
        organizationId,
        userId,
        eventType,
        severity,
        details,
        ipAddress,
        userAgent,
      })
      .returning();

    return log;
  } catch (error) {
    console.error('Error logging security event:', error);
    // Don't throw - we don't want to break the application flow
    // if audit logging fails
    return null;
  }
}

// Helper function to get client IP from request headers
export function getClientIp(headers: Headers): string {
  return (
    headers.get('x-forwarded-for')?.split(',')[0].trim() ||
    headers.get('x-real-ip') ||
    'unknown'
  );
}

// Helper function to sanitize user agent string
export function sanitizeUserAgent(userAgent?: string | null): string {
  if (!userAgent) return 'unknown';
  // Basic sanitization - remove any suspicious characters
  return userAgent.replace(/[<>]/g, '').slice(0, 255);
}

// Helper function to create security event details
export function createEventDetails({
  action,
  target,
  changes,
  metadata,
}: {
  action?: string;
  target?: string;
  changes?: Record<string, unknown>;
  metadata?: Record<string, unknown>;
} = {}) {
  return {
    action,
    target,
    changes,
    metadata: {
      ...metadata,
      timestamp: new Date().toISOString(),
    },
  };
}
