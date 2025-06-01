import { auth } from '@/app/(auth)/auth';
import { ChatSDKError } from '@/lib/errors';
import { db } from '@/lib/db';
import { z } from 'zod';
import { eq, and } from 'drizzle-orm';
import { messageReaction } from '@/lib/db/schema';

// Schema for reaction request
const reactionSchema = z.object({
  messageId: z.string().uuid(),
  emoji: z.string().min(1),
});

export async function POST(request: Request) {
  try {
    const session = await auth();

    if (!session?.user) {
      return new ChatSDKError('unauthorized:reaction').toResponse();
    }

    const json = await request.json();
    const { messageId, emoji } = reactionSchema.parse(json);

    // Add reaction
    const [reaction] = await db
      .insert(messageReaction)
      .values({
        messageId,
        userId: session.user.id,
        emoji,
      })
      .returning();

    return Response.json(reaction);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return new ChatSDKError(
        'bad_request:reaction',
        'Invalid reaction data',
      ).toResponse();
    }

    console.error('Error adding reaction:', error);
    return new ChatSDKError('internal_server_error:reaction').toResponse();
  }
}

export async function DELETE(request: Request) {
  try {
    const session = await auth();

    if (!session?.user) {
      return new ChatSDKError('unauthorized:reaction').toResponse();
    }

    const json = await request.json();
    const { messageId, emoji } = reactionSchema.parse(json);

    // Remove reaction
    await db
      .delete(messageReaction)
      .where(
        and(
          eq(messageReaction.messageId, messageId),
          eq(messageReaction.userId, session.user.id),
          eq(messageReaction.emoji, emoji),
        ),
      );

    return new Response(null, { status: 204 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return new ChatSDKError(
        'bad_request:reaction',
        'Invalid reaction data',
      ).toResponse();
    }

    console.error('Error removing reaction:', error);
    return new ChatSDKError('internal_server_error:reaction').toResponse();
  }
}

export async function GET(request: Request) {
  try {
    const session = await auth();

    if (!session?.user) {
      return new ChatSDKError('unauthorized:reaction').toResponse();
    }

    const url = new URL(request.url);
    const messageId = url.searchParams.get('messageId');

    if (!messageId) {
      return new ChatSDKError(
        'bad_request:reaction',
        'Message ID is required',
      ).toResponse();
    }

    // Get reactions for message
    const reactions = await db
      .select()
      .from(messageReaction)
      .where(eq(messageReaction.messageId, messageId));

    return Response.json(reactions);
  } catch (error) {
    console.error('Error getting reactions:', error);
    return new ChatSDKError('internal_server_error:reaction').toResponse();
  }
}
