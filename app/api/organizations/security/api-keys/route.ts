import { auth } from '@/app/(auth)/auth';
import { ChatSDKError } from '@/lib/errors';
import { db } from '@/lib/db';
import { z } from 'zod';
import { eq } from 'drizzle-orm';
import { apiKey } from '@/lib/db/schema';
import { createId } from '@paralleldrive/cuid2';
import { createHash } from 'crypto';

// Schema for creating API keys
const createApiKeySchema = z.object({
  name: z.string().min(1),
  scopes: z.array(z.string()),
});

function generateApiKey(): { key: string; hashedKey: string } {
  const key = `${createId()}.${createId()}`;
  const hashedKey = createHash('sha256').update(key).digest('hex');
  return { key, hashedKey };
}

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

    // Only admins can manage API keys
    if (!['admin'].includes(session.user.role)) {
      return new ChatSDKError(
        'forbidden:organization',
        'Only administrators can manage API keys',
      ).toResponse();
    }

    // Fetch API keys
    const keys = await db
      .select()
      .from(apiKey)
      .where(eq(apiKey.organizationId, session.user.organizationId));

    // Never return the actual keys or hashed keys
    return Response.json(
      keys.map((k) => ({
        ...k,
        key: undefined,
        hashedKey: undefined,
      })),
    );
  } catch (error) {
    console.error('Error fetching API keys:', error);
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

    // Only admins can manage API keys
    if (!['admin'].includes(session.user.role)) {
      return new ChatSDKError(
        'forbidden:organization',
        'Only administrators can manage API keys',
      ).toResponse();
    }

    const json = await request.json();
    const { name, scopes } = createApiKeySchema.parse(json);
    const { key, hashedKey } = generateApiKey();

    // Create new API key
    const [newKey] = await db
      .insert(apiKey)
      .values({
        name,
        scopes,
        key,
        hashedKey,
        organizationId: session.user.organizationId,
        createdBy: session.user.id,
      })
      .returning();

    // Return the API key only once - it won't be accessible again
    return Response.json({
      ...newKey,
      key,
      hashedKey: undefined,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return new ChatSDKError(
        'bad_request:organization',
        'Invalid API key data',
      ).toResponse();
    }

    console.error('Error creating API key:', error);
    return new ChatSDKError('internal_server_error:organization').toResponse();
  }
}
