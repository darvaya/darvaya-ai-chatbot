import { auth } from '@/app/(auth)/auth';
import { ChatSDKError } from '@/lib/errors';
import { z } from 'zod';
import {
  createOrganizationInvitation,
  getOrganizationInvitation,
  acceptOrganizationInvitation,
} from '@/lib/db/organization-queries';

// Schema for creating an invitation
const createInvitationSchema = z.object({
  email: z.string().email(),
  role: z.enum(['admin', 'manager', 'user']),
});

// Schema for accepting an invitation
const acceptInvitationSchema = z.object({
  token: z.string(),
});

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

    // Only admins can send invitations
    if (session.user.role !== 'admin') {
      return new ChatSDKError(
        'forbidden:organization',
        'Only admins can send invitations',
      ).toResponse();
    }

    const json = await request.json();
    const validatedData = createInvitationSchema.parse(json);

    const invitation = await createOrganizationInvitation({
      email: validatedData.email,
      role: validatedData.role,
      organizationId: session.user.organizationId,
      createdBy: session.user.id,
    });

    return Response.json(invitation, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return new ChatSDKError(
        'bad_request:organization',
        'Invalid request data',
      ).toResponse();
    }

    return new ChatSDKError('internal_server_error:organization').toResponse();
  }
}

export async function PUT(request: Request) {
  try {
    const session = await auth();

    if (!session?.user) {
      return new ChatSDKError('unauthorized:organization').toResponse();
    }

    // Check if user already belongs to an organization
    if (session.user.organizationId) {
      return new ChatSDKError(
        'forbidden:organization',
        'User already belongs to an organization',
      ).toResponse();
    }

    const json = await request.json();
    const validatedData = acceptInvitationSchema.parse(json);

    // Verify invitation exists and is valid
    const invitation = await getOrganizationInvitation(validatedData.token);
    if (!invitation) {
      return new ChatSDKError(
        'not_found:organization',
        'Invalid or expired invitation',
      ).toResponse();
    }

    // Check if invitation is expired
    if (invitation.expiresAt < new Date()) {
      return new ChatSDKError(
        'forbidden:organization',
        'Invitation has expired',
      ).toResponse();
    }

    // Check if invitation email matches user email
    if (invitation.email !== session.user.email) {
      return new ChatSDKError(
        'forbidden:organization',
        'Invitation email does not match user email',
      ).toResponse();
    }

    const success = await acceptOrganizationInvitation({
      token: validatedData.token,
      userId: session.user.id,
    });

    if (!success) {
      return new ChatSDKError(
        'internal_server_error:organization',
        'Failed to accept invitation',
      ).toResponse();
    }

    return new Response(null, { status: 204 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return new ChatSDKError(
        'bad_request:organization',
        'Invalid request data',
      ).toResponse();
    }

    return new ChatSDKError('internal_server_error:organization').toResponse();
  }
}
