import { auth } from '@/app/(auth)/auth';
import { ChatSDKError } from '@/lib/errors';
import { db } from '@/lib/db';
import { and, eq } from 'drizzle-orm';
import { apiKey } from '@/lib/db/schema';

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

    // Only admins can manage API keys
    if (!['admin'].includes(session.user.role)) {
      return new ChatSDKError(
        'forbidden:organization',
        'Only administrators can manage API keys',
      ).toResponse();
    }

    // Revoke API key
    const [revokedKey] = await db
      .update(apiKey)
      .set({
        isActive: false,
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(apiKey.id, params.id),
          eq(apiKey.organizationId, session.user.organizationId),
        ),
      )
      .returning();

    if (!revokedKey) {
      return new ChatSDKError('not_found:api_key').toResponse();
    }

    return Response.json({
      ...revokedKey,
      key: undefined,
      hashedKey: undefined,
    });
  } catch (error) {
    console.error('Error revoking API key:', error);
    return new ChatSDKError('internal_server_error:organization').toResponse();
  }
}
