import { auth } from '@/app/(auth)/auth';
import { ChatSDKError } from '@/lib/errors';
import { z } from 'zod';
import {
  createOrganization,
  getOrganizationById,
  updateOrganization,
  getOrganizationUsers,
} from '@/lib/db/organization-queries';

// Schema for creating an organization
const createOrgSchema = z.object({
  name: z.string().min(1).max(100),
  settings: z.record(z.unknown()).optional(),
  maxUsers: z.number().min(1).max(1000).optional(),
});

// Schema for updating an organization
const updateOrgSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  settings: z.record(z.unknown()).optional(),
  maxUsers: z.number().min(1).max(1000).optional(),
});

export async function POST(request: Request) {
  try {
    const session = await auth();

    if (!session?.user) {
      return new ChatSDKError('unauthorized:organization').toResponse();
    }

    const json = await request.json();
    const validatedData = createOrgSchema.parse(json);

    // Check if user already belongs to an organization
    if (session.user.organizationId) {
      return new ChatSDKError(
        'forbidden:organization',
        'User already belongs to an organization',
      ).toResponse();
    }

    const organization = await createOrganization({
      ...validatedData,
      userId: session.user.id,
    });

    return Response.json(organization, { status: 201 });
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

    const organization = await getOrganizationById(session.user.organizationId);

    if (!organization) {
      return new ChatSDKError('not_found:organization').toResponse();
    }

    // Get organization users
    const users = await getOrganizationUsers(organization.id);

    return Response.json(
      {
        ...organization,
        users: users.map(({ password: _, ...user }) => user),
      },
      { status: 200 },
    );
  } catch (error) {
    return new ChatSDKError('internal_server_error:organization').toResponse();
  }
}

export async function PATCH(request: Request) {
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

    if (session.user.role !== 'admin') {
      return new ChatSDKError(
        'forbidden:organization',
        'Only admins can update organization settings',
      ).toResponse();
    }

    const json = await request.json();
    const validatedData = updateOrgSchema.parse(json);

    const organization = await updateOrganization({
      id: session.user.organizationId,
      ...validatedData,
    });

    if (!organization) {
      return new ChatSDKError('not_found:organization').toResponse();
    }

    return Response.json(organization, { status: 200 });
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
