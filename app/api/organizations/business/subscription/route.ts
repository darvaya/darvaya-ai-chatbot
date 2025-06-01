import { auth } from '@/app/(auth)/auth';
import { ChatSDKError } from '@/lib/errors';
import { db } from '@/lib/db';
import { z } from 'zod';
import { eq } from 'drizzle-orm';
import { subscription } from '@/lib/db/schema';

// Schema for updating subscription
const updateSubscriptionSchema = z.object({
  plan: z.enum(['free', 'starter', 'professional', 'enterprise']),
  billingCycle: z.enum(['monthly', 'annual']),
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

    // Only admins and managers can view subscription details
    if (!['admin', 'manager'].includes(session.user.role)) {
      return new ChatSDKError(
        'forbidden:organization',
        'Only administrators and managers can view subscription details',
      ).toResponse();
    }

    // Fetch subscription
    const [currentSubscription] = await db
      .select()
      .from(subscription)
      .where(eq(subscription.organizationId, session.user.organizationId));

    return Response.json(currentSubscription || null);
  } catch (error) {
    console.error('Error fetching subscription:', error);
    return new ChatSDKError('internal_server_error:organization').toResponse();
  }
}

export async function PUT(request: Request) {
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

    // Only admins can update subscription
    if (!['admin'].includes(session.user.role)) {
      return new ChatSDKError(
        'forbidden:organization',
        'Only administrators can update subscription',
      ).toResponse();
    }

    const json = await request.json();
    const { plan, billingCycle } = updateSubscriptionSchema.parse(json);

    // Calculate period dates
    const startDate = new Date();
    const currentPeriodStart = startDate;
    const currentPeriodEnd = new Date(startDate);
    if (billingCycle === 'monthly') {
      currentPeriodEnd.setMonth(currentPeriodEnd.getMonth() + 1);
    } else {
      currentPeriodEnd.setFullYear(currentPeriodEnd.getFullYear() + 1);
    }

    // Update or create subscription
    const [updatedSubscription] = await db
      .insert(subscription)
      .values({
        organizationId: session.user.organizationId,
        plan,
        billingCycle,
        startDate,
        currentPeriodStart,
        currentPeriodEnd,
        status: 'active',
      })
      .onConflictDoUpdate({
        target: [subscription.organizationId],
        set: {
          plan,
          billingCycle,
          currentPeriodStart,
          currentPeriodEnd,
          updatedAt: new Date(),
        },
      })
      .returning();

    return Response.json(updatedSubscription);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return new ChatSDKError(
        'bad_request:organization',
        'Invalid subscription data',
      ).toResponse();
    }

    console.error('Error updating subscription:', error);
    return new ChatSDKError('internal_server_error:organization').toResponse();
  }
}
