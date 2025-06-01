import { auth } from '@/app/(auth)/auth';
import { ChatSDKError } from '@/lib/errors';
import { db } from '@/lib/db';
import { z } from 'zod';
import { eq } from 'drizzle-orm';
import { securitySettings } from '@/lib/db/schema';

// Schema for updating security settings
const updateSecuritySettingsSchema = z.object({
  mfaRequired: z.boolean().optional(),
  passwordPolicy: z
    .object({
      minLength: z.number().min(8).max(128).optional(),
      requireNumbers: z.boolean().optional(),
      requireSymbols: z.boolean().optional(),
      requireUppercase: z.boolean().optional(),
      requireLowercase: z.boolean().optional(),
      preventReuseCount: z.number().min(1).max(24).optional(),
      expiryDays: z.number().min(1).max(365).optional(),
    })
    .optional(),
  ipAllowlist: z.array(z.string()).optional(),
  sessionTimeout: z.number().min(1).max(72).optional(),
  maxLoginAttempts: z.number().min(1).max(10).optional(),
  lockoutDuration: z.number().min(1).max(60).optional(),
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

    // Only admins can manage security settings
    if (!['admin'].includes(session.user.role)) {
      return new ChatSDKError(
        'forbidden:organization',
        'Only administrators can manage security settings',
      ).toResponse();
    }

    // Fetch security settings
    const [settings] = await db
      .select()
      .from(securitySettings)
      .where(eq(securitySettings.organizationId, session.user.organizationId));

    return Response.json(settings || {});
  } catch (error) {
    console.error('Error fetching security settings:', error);
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

    // Only admins can manage security settings
    if (!['admin'].includes(session.user.role)) {
      return new ChatSDKError(
        'forbidden:organization',
        'Only administrators can manage security settings',
      ).toResponse();
    }

    const json = await request.json();
    const updates = updateSecuritySettingsSchema.parse(json);

    // Update or create security settings
    const [settings] = await db
      .insert(securitySettings)
      .values({
        organizationId: session.user.organizationId,
        ...updates,
      })
      .onConflictDoUpdate({
        target: [securitySettings.organizationId],
        set: {
          ...updates,
          updatedAt: new Date(),
        },
      })
      .returning();

    return Response.json(settings);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return new ChatSDKError(
        'bad_request:organization',
        'Invalid security settings data',
      ).toResponse();
    }

    console.error('Error updating security settings:', error);
    return new ChatSDKError('internal_server_error:organization').toResponse();
  }
}
