import { auth } from '@/app/(auth)/auth';
import { ChatSDKError } from '@/lib/errors';
import { db } from '@/lib/db';
import { z } from 'zod';
import { eq, desc } from 'drizzle-orm';
import { securityAuditLog } from '@/lib/db/schema';

// Schema for filtering audit logs
const auditLogFilterSchema = z.object({
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  eventType: z.string().optional(),
  severity: z.string().optional(),
  userId: z.string().optional(),
  limit: z.number().min(1).max(100).optional(),
});

export async function GET(request: Request) {
  try {
    const session = await auth();

    if (!session?.user) {
      return new ChatSDKError('unauthorized:organization').toResponse();
    }

    if (!session.user.organizationId) {
      return new ChatSDKError(
        'not_found:organization',
        'User does not belong to an organization',
      ).toResponse();
    }

    // Only admins can view audit logs
    if (!['admin'].includes(session.user.role)) {
      return new ChatSDKError(
        'forbidden:organization',
        'Only administrators can view audit logs',
      ).toResponse();
    }

    // Parse query parameters
    const url = new URL(request.url);
    const filters = auditLogFilterSchema.parse({
      startDate: url.searchParams.get('startDate'),
      endDate: url.searchParams.get('endDate'),
      eventType: url.searchParams.get('eventType'),
      severity: url.searchParams.get('severity'),
      userId: url.searchParams.get('userId'),
      limit: url.searchParams.get('limit')
        ? Number(url.searchParams.get('limit'))
        : undefined,
    });

    // Build query
    let query = db
      .select()
      .from(securityAuditLog)
      .where(eq(securityAuditLog.organizationId, session.user.organizationId))
      .orderBy(desc(securityAuditLog.createdAt));

    // Apply filters
    if (filters.startDate) {
      query = query.where('createdAt', '>=', new Date(filters.startDate));
    }
    if (filters.endDate) {
      query = query.where('createdAt', '<=', new Date(filters.endDate));
    }
    if (filters.eventType) {
      query = query.where(eq(securityAuditLog.eventType, filters.eventType));
    }
    if (filters.severity) {
      query = query.where(eq(securityAuditLog.severity, filters.severity));
    }
    if (filters.userId) {
      query = query.where(eq(securityAuditLog.userId, filters.userId));
    }
    if (filters.limit) {
      query = query.limit(filters.limit);
    }

    // Execute query
    const logs = await query;

    return Response.json(logs);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return new ChatSDKError(
        'bad_request:organization',
        'Invalid filter parameters',
      ).toResponse();
    }

    console.error('Error fetching audit logs:', error);
    return new ChatSDKError('internal_server_error:organization').toResponse();
  }
}

export async function POST(request: Request) {
  try {
    const session = await auth();

    if (!session?.user) {
      return new ChatSDKError('unauthorized:organization').toResponse();
    }

    if (!session.user.organizationId) {
      return new ChatSDKError(
        'not_found:organization',
        'User does not belong to an organization',
      ).toResponse();
    }

    const json = await request.json();
    const { eventType, severity, details } = json;

    // Create audit log entry
    const [log] = await db
      .insert(securityAuditLog)
      .values({
        organizationId: session.user.organizationId,
        userId: session.user.id,
        eventType,
        severity,
        details,
        ipAddress:
          request.headers.get('x-forwarded-for') ||
          request.headers.get('x-real-ip'),
        userAgent: request.headers.get('user-agent'),
      })
      .returning();

    return Response.json(log);
  } catch (error) {
    console.error('Error creating audit log:', error);
    return new ChatSDKError('internal_server_error:organization').toResponse();
  }
}
