import { auth } from '@/app/(auth)/auth';
import { ChatSDKError } from '@/lib/errors';
import { db } from '@/lib/db';
import { z } from 'zod';
import { eq } from 'drizzle-orm';
import { integration } from '@/lib/db/schema';

// Schema for creating/updating integrations
const integrationSchema = z.object({
  type: z.enum([
    'slack',
    'github',
    'jira',
    'google_workspace',
    'microsoft_365',
    'zoom',
    'custom',
  ]),
  name: z.string().min(1),
  config: z.record(z.unknown()).optional(),
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

    // Only admins and managers can manage integrations
    if (!['admin', 'manager'].includes(session.user.role)) {
      return new ChatSDKError(
        'forbidden:organization',
        'Only admins and managers can manage integrations',
      ).toResponse();
    }

    // Fetch integrations for the organization
    const integrations = await db
      .select()
      .from(integration)
      .where(eq(integration.organizationId, session.user.organizationId));

    return Response.json(integrations);
  } catch (error) {
    console.error('Error fetching integrations:', error);
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

    // Only admins and managers can manage integrations
    if (!['admin', 'manager'].includes(session.user.role)) {
      return new ChatSDKError(
        'forbidden:organization',
        'Only admins and managers can manage integrations',
      ).toResponse();
    }

    const json = await request.json();
    const { type, name, config } = integrationSchema.parse(json);

    // Create new integration
    const newIntegration = await db.insert(integration).values({
      type,
      name,
      config,
      organizationId: session.user.organizationId,
      status: 'pending',
    });

    return Response.json(newIntegration);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return new ChatSDKError(
        'bad_request:organization',
        'Invalid integration data',
      ).toResponse();
    }

    console.error('Error creating integration:', error);
    return new ChatSDKError('internal_server_error:organization').toResponse();
  }
}
