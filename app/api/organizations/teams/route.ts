import { auth } from '@/app/(auth)/auth';
import { ChatSDKError } from '@/lib/errors';
import { z } from 'zod';
import {
  createTeam,
  getOrganizationTeams,
  addUserToTeam,
  removeUserFromTeam,
  getUserTeams,
} from '@/lib/db/organization-queries';

// Schema for creating a team
const createTeamSchema = z.object({
  name: z.string().min(1).max(100),
});

// Schema for managing team members
const teamMemberSchema = z.object({
  userId: z.string().uuid(),
  teamId: z.string().uuid(),
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

    // Only admins and managers can create teams
    if (!['admin', 'manager'].includes(session.user.role)) {
      return new ChatSDKError(
        'forbidden:organization',
        'Only admins and managers can create teams',
      ).toResponse();
    }

    const json = await request.json();
    const validatedData = createTeamSchema.parse(json);

    const team = await createTeam({
      name: validatedData.name,
      organizationId: session.user.organizationId,
    });

    return Response.json(team, { status: 201 });
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

    // If admin or manager, get all teams in the organization
    // If regular user, get only teams they belong to
    const teams = ['admin', 'manager'].includes(session.user.role)
      ? await getOrganizationTeams(session.user.organizationId)
      : await getUserTeams(session.user.id);

    return Response.json(teams, { status: 200 });
  } catch (error) {
    return new ChatSDKError('internal_server_error:organization').toResponse();
  }
}

// Add user to team
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

    // Only admins and managers can manage team members
    if (!['admin', 'manager'].includes(session.user.role)) {
      return new ChatSDKError(
        'forbidden:organization',
        'Only admins and managers can manage team members',
      ).toResponse();
    }

    const json = await request.json();
    const validatedData = teamMemberSchema.parse(json);

    const userTeam = await addUserToTeam(validatedData);

    return Response.json(userTeam, { status: 200 });
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

// Remove user from team
export async function DELETE(request: Request) {
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

    // Only admins and managers can manage team members
    if (!['admin', 'manager'].includes(session.user.role)) {
      return new ChatSDKError(
        'forbidden:organization',
        'Only admins and managers can manage team members',
      ).toResponse();
    }

    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const teamId = searchParams.get('teamId');

    if (!userId || !teamId) {
      return new ChatSDKError(
        'bad_request:organization',
        'Missing userId or teamId',
      ).toResponse();
    }

    await removeUserFromTeam({ userId, teamId });

    return new Response(null, { status: 204 });
  } catch (error) {
    return new ChatSDKError('internal_server_error:organization').toResponse();
  }
}
