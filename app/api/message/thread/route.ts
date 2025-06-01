import { auth } from '@/app/(auth)/auth';
import { ChatSDKError } from '@/lib/errors';
import { db } from '@/lib/db';
import { z } from 'zod';
import { eq, and } from 'drizzle-orm';
import { message } from '@/lib/db/schema';

// Schema for thread request
const threadSchema = z.object({
  messageId: z.string().uuid(),
  parentId: z.string().uuid(),
  content: z.string(),
});

export async function POST(request: Request) {
  try {
    const session = await auth();

    if (!session?.user) {
      return new ChatSDKError('unauthorized:chat').toResponse();
    }

    const json = await request.json();
    const { messageId, parentId, content } = threadSchema.parse(json);

    // Get parent message to verify it exists and get its chatId
    const [parentMessage] = await db
      .select()
      .from(message)
      .where(eq(message.id, parentId));

    if (!parentMessage) {
      return new ChatSDKError(
        'not_found:chat',
        'Parent message not found',
      ).toResponse();
    }

    // Create reply message
    const [reply] = await db
      .insert(message)
      .values({
        id: messageId,
        chatId: parentMessage.chatId,
        role: 'user',
        parts: [{ type: 'text', text: content }],
        attachments: [],
        createdAt: new Date(),
        parentId,
        threadId: parentMessage.threadId || parentId,
      })
      .returning();

    // Update parent message's reply count
    await db
      .update(message)
      .set({
        replyCount: (parentMessage.replyCount || 0) + 1,
      })
      .where(eq(message.id, parentId));

    return Response.json(reply);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return new ChatSDKError(
        'bad_request:chat',
        'Invalid thread data',
      ).toResponse();
    }

    console.error('Error creating thread:', error);
    return new ChatSDKError('internal_server_error:chat').toResponse();
  }
}

export async function GET(request: Request) {
  try {
    const session = await auth();

    if (!session?.user) {
      return new ChatSDKError('unauthorized:chat').toResponse();
    }

    const url = new URL(request.url);
    const messageId = url.searchParams.get('messageId');

    if (!messageId) {
      return new ChatSDKError(
        'bad_request:chat',
        'Message ID is required',
      ).toResponse();
    }

    // Get all messages in the thread
    const replies = await db
      .select()
      .from(message)
      .where(
        and(eq(message.parentId, messageId), eq(message.threadId, messageId)),
      );

    return Response.json(replies);
  } catch (error) {
    console.error('Error getting thread:', error);
    return new ChatSDKError('internal_server_error:chat').toResponse();
  }
}
