import { auth } from '@/app/(auth)/auth';
import { ChatSDKError } from '@/lib/errors';
import { db } from '@/lib/db';
import { z } from 'zod';
import { and, eq } from 'drizzle-orm';
import { integration } from '@/lib/db/schema';

// Schema for updating integrations
const updateIntegrationSchema = z.object({
  name: z.string().min(1).optional(),
  config: z.record(z.unknown()).optional(),
  status: z.enum(['active', 'inactive', 'pending', 'failed']).optional(),
});

export async function GET(
  request: Request,
  { params }: { params: { id: string } },
) {
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

    // Only admins and managers can manage integrations
    if (!['admin', 'manager'].includes(session.user.role)) {
      return new ChatSDKError(
        'forbidden:organization',
        'Only admins and managers can manage integrations',
      ).toResponse();
    }

    // Fetch integration
    const [foundIntegration] = await db
      .select()
      .from(integration)
      .where(
        and(
          eq(integration.id, params.id),
          eq(integration.organizationId, session.user.organizationId),
        ),
      );

    if (!foundIntegration) {
      return new ChatSDKError('not_found:integration').toResponse();
    }

    return Response.json(foundIntegration);
  } catch (error) {
    console.error('Error fetching integration:', error);
    return new ChatSDKError('internal_server_error:organization').toResponse();
  }
}

export async function PUT(
  request: Request,
  { params }: { params: { id: string } },
) {
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

    // Only admins and managers can manage integrations
    if (!['admin', 'manager'].includes(session.user.role)) {
      return new ChatSDKError(
        'forbidden:organization',
        'Only admins and managers can manage integrations',
      ).toResponse();
    }

    const json = await request.json();
    const updates = updateIntegrationSchema.parse(json);

    // Update integration
    const [updatedIntegration] = await db
      .update(integration)
      .set({
        ...updates,
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(integration.id, params.id),
          eq(integration.organizationId, session.user.organizationId),
        ),
      )
      .returning();

    if (!updatedIntegration) {
      return new ChatSDKError('not_found:integration').toResponse();
    }

    return Response.json(updatedIntegration);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return new ChatSDKError(
        'bad_request:organization',
        'Invalid integration data',
      ).toResponse();
    }

    console.error('Error updating integration:', error);
    return new ChatSDKError('internal_server_error:organization').toResponse();
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } },
) {
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

    // Only admins and managers can manage integrations
    if (!['admin', 'manager'].includes(session.user.role)) {
      return new ChatSDKError(
        'forbidden:organization',
        'Only admins and managers can manage integrations',
      ).toResponse();
    }

    // Delete integration
    const [deletedIntegration] = await db
      .delete(integration)
      .where(
        and(
          eq(integration.id, params.id),
          eq(integration.organizationId, session.user.organizationId),
        ),
      )
      .returning();

    if (!deletedIntegration) {
      return new ChatSDKError('not_found:integration').toResponse();
    }

    return Response.json(deletedIntegration);
  } catch (error) {
    console.error('Error deleting integration:', error);
    return new ChatSDKError('internal_server_error:organization').toResponse();
  }
}
