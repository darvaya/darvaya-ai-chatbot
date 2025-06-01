import { auth } from '@/app/(auth)/auth';
import { ChatSDKError } from '@/lib/errors';
import { db } from '@/lib/db';
import { z } from 'zod';
import { and, eq, gte } from 'drizzle-orm';
import { user, team, organizationInvitation } from '@/lib/db/schema';
import type { User } from '@/lib/db/schema';

// Schema for analytics request
const analyticsRequestSchema = z.object({
  timeRange: z.enum(['day', 'week', 'month']),
  organizationId: z.string(),
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

    // Only admins and managers can access analytics
    if (!['admin', 'manager'].includes(session.user.role)) {
      return new ChatSDKError(
        'forbidden:organization',
        'Only admins and managers can access analytics',
      ).toResponse();
    }

    // Get URL parameters
    const url = new URL(request.url);
    const timeRange = url.searchParams.get('timeRange') || 'week';
    const organizationId = session.user.organizationId;

    // Validate request
    const { timeRange: validatedTimeRange } = analyticsRequestSchema.parse({
      timeRange,
      organizationId,
    });

    // Calculate date range
    const now = new Date();
    const startDate = new Date();
    switch (validatedTimeRange) {
      case 'day':
        startDate.setDate(now.getDate() - 1);
        break;
      case 'week':
        startDate.setDate(now.getDate() - 7);
        break;
      case 'month':
        startDate.setMonth(now.getMonth() - 1);
        break;
    }

    // Fetch analytics data
    const [organizationUsers, activeTeams, pendingInvitations] =
      await Promise.all([
        // Get users in organization
        db
          .select()
          .from(user)
          .where(eq(user.organizationId, organizationId)),
        // Get active teams
        db
          .select()
          .from(team)
          .where(eq(team.organizationId, organizationId)),
        // Get pending invitations
        db
          .select()
          .from(organizationInvitation)
          .where(
            and(
              eq(organizationInvitation.organizationId, organizationId),
              gte(organizationInvitation.createdAt, startDate),
            ),
          ),
      ]);

    // Calculate metrics
    const activeUsers = organizationUsers.filter(
      (user) => user.isActive,
    ).length;
    const totalUsers = organizationUsers.length;
    const activePercentage = Math.round((activeUsers / totalUsers) * 100);

    const roleDistribution = organizationUsers.reduce<Record<string, number>>(
      (acc, user: User) => {
        acc[user.role] = (acc[user.role] || 0) + 1;
        return acc;
      },
      {},
    );

    // Prepare response
    const analyticsData = {
      overview: {
        activeUsers,
        totalUsers,
        activePercentage,
        totalTeams: activeTeams.length,
        pendingInvites: pendingInvitations.length,
      },
      roleDistribution,
      timeRange: validatedTimeRange,
      lastUpdated: new Date().toISOString(),
    };

    return Response.json(analyticsData, { status: 200 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return new ChatSDKError(
        'bad_request:organization',
        'Invalid request parameters',
      ).toResponse();
    }

    return new ChatSDKError('internal_server_error:organization').toResponse();
  }
}
