import { auth } from '@/app/(auth)/auth';
import { ChatSDKError } from '@/lib/errors';
import { db } from '@/lib/db';
import { z } from 'zod';
import { eq, desc } from 'drizzle-orm';
import { billing } from '@/lib/db/schema';

// Schema for filtering billing history
const billingFilterSchema = z.object({
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  status: z
    .enum(['pending', 'completed', 'failed', 'refunded', 'cancelled'])
    .optional(),
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

    // Only admins and managers can view billing history
    if (!['admin', 'manager'].includes(session.user.role)) {
      return new ChatSDKError(
        'forbidden:organization',
        'Only administrators and managers can view billing history',
      ).toResponse();
    }

    // Parse query parameters
    const url = new URL(request.url);
    const filters = billingFilterSchema.parse({
      startDate: url.searchParams.get('startDate'),
      endDate: url.searchParams.get('endDate'),
      status: url.searchParams.get('status'),
      limit: url.searchParams.get('limit')
        ? Number(url.searchParams.get('limit'))
        : undefined,
    });

    // Build query
    let query = db
      .select()
      .from(billing)
      .where(eq(billing.organizationId, session.user.organizationId))
      .orderBy(desc(billing.createdAt));

    // Apply filters
    if (filters.startDate) {
      query = query.where('createdAt', '>=', new Date(filters.startDate));
    }
    if (filters.endDate) {
      query = query.where('createdAt', '<=', new Date(filters.endDate));
    }
    if (filters.status) {
      query = query.where(eq(billing.status, filters.status));
    }
    if (filters.limit) {
      query = query.limit(filters.limit);
    }

    // Execute query
    const billingHistory = await query;

    return Response.json(billingHistory);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return new ChatSDKError(
        'bad_request:organization',
        'Invalid filter parameters',
      ).toResponse();
    }

    console.error('Error fetching billing history:', error);
    return new ChatSDKError('internal_server_error:organization').toResponse();
  }
}
