import { auth } from '@/app/(auth)/auth';
import { ChatSDKError } from '@/lib/errors';
import { db } from '@/lib/db';
import { z } from 'zod';
import { eq, desc, sql, and, gte, lte } from 'drizzle-orm';
import { businessMetrics } from '@/lib/db/schema';
import {
  validateDateRange,
  validatePagination,
  validateSortParams,
} from '@/lib/security/database';

// Schema for filtering metrics
const metricsFilterSchema = z.object({
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  page: z.number().min(1).optional(),
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

    // Only admins and managers can view business metrics
    if (!['admin', 'manager'].includes(session.user.role)) {
      return new ChatSDKError(
        'forbidden:organization',
        'Only administrators and managers can view business metrics',
      ).toResponse();
    }

    // Parse and validate query parameters
    const url = new URL(request.url);
    const filters = metricsFilterSchema.parse({
      startDate: url.searchParams.get('startDate'),
      endDate: url.searchParams.get('endDate'),
      page: url.searchParams.get('page')
        ? Number(url.searchParams.get('page'))
        : undefined,
      limit: url.searchParams.get('limit')
        ? Number(url.searchParams.get('limit'))
        : undefined,
    });

    // Build query conditions
    const conditions = [
      eq(businessMetrics.organizationId, session.user.organizationId),
    ];

    // Apply date range filters
    if (filters.startDate && filters.endDate) {
      const { startDate, endDate } = validateDateRange(
        filters.startDate,
        filters.endDate,
      );
      conditions.push(
        gte(businessMetrics.date, new Date(startDate)),
        lte(businessMetrics.date, new Date(endDate)),
      );
    }

    // Execute query with pagination
    const metrics = await db
      .select()
      .from(businessMetrics)
      .where(and(...conditions))
      .orderBy(desc(businessMetrics.date))
      .limit(filters.limit || 100)
      .offset(filters.page ? (filters.page - 1) * (filters.limit || 100) : 0);

    // Get total count for pagination
    const [{ count }] = await db
      .select({ count: sql`count(*)`.mapWith(Number) })
      .from(businessMetrics)
      .where(and(...conditions));

    return Response.json(
      {
        data: metrics,
        pagination: filters.page
          ? {
              page: filters.page,
              limit: filters.limit || 100,
              total: count,
              totalPages: Math.ceil(count / (filters.limit || 100)),
            }
          : null,
      },
      { status: 200 },
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return new ChatSDKError(
        'bad_request:organization',
        'Invalid filter parameters',
      ).toResponse();
    }

    console.error('Error fetching business metrics:', error);
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

    // Only admins can update business metrics
    if (!['admin'].includes(session.user.role)) {
      return new ChatSDKError(
        'forbidden:organization',
        'Only administrators can update business metrics',
      ).toResponse();
    }

    const json = await request.json();
    const { metrics } = json;

    // Create metrics entry
    const [newMetrics] = await db
      .insert(businessMetrics)
      .values({
        organizationId: session.user.organizationId,
        date: new Date(),
        metrics,
      })
      .returning();

    return Response.json(newMetrics);
  } catch (error) {
    console.error('Error creating business metrics:', error);
    return new ChatSDKError('internal_server_error:organization').toResponse();
  }
}
