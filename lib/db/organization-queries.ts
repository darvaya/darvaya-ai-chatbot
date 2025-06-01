import { and, eq } from 'drizzle-orm';
import { db } from './client';
import {
  organization,
  team,
  user,
  userTeam,
  organizationInvitation,
  type Organization,
  type Team,
  type User,
  type UserTeam,
  type OrganizationInvitation,
} from './schema';

export async function createOrganization({
  name,
  userId,
  settings = {},
  maxUsers = 5,
}: {
  name: string;
  userId: string;
  settings?: Record<string, unknown>;
  maxUsers?: number;
}): Promise<Organization> {
  const [newOrg] = await db
    .insert(organization)
    .values({
      name,
      settings,
      maxUsers,
      createdAt: new Date(),
      updatedAt: new Date(),
    })
    .returning();

  // Update the creating user to be an admin of the organization
  await db
    .update(user)
    .set({
      organizationId: newOrg.id,
      role: 'admin',
      updatedAt: new Date(),
    })
    .where(eq(user.id, userId));

  return newOrg;
}

export async function getOrganizationById(
  id: string,
): Promise<Organization | null> {
  const [org] = await db
    .select()
    .from(organization)
    .where(eq(organization.id, id));
  return org || null;
}

export async function updateOrganization({
  id,
  name,
  settings,
  maxUsers,
}: {
  id: string;
  name?: string;
  settings?: Record<string, unknown>;
  maxUsers?: number;
}): Promise<Organization | null> {
  const updates: Partial<Organization> = {
    updatedAt: new Date(),
  };

  if (name !== undefined) updates.name = name;
  if (settings !== undefined) updates.settings = settings;
  if (maxUsers !== undefined) updates.maxUsers = maxUsers;

  const [updatedOrg] = await db
    .update(organization)
    .set(updates)
    .where(eq(organization.id, id))
    .returning();

  return updatedOrg || null;
}

export async function createTeam({
  name,
  organizationId,
}: {
  name: string;
  organizationId: string;
}): Promise<Team> {
  const [newTeam] = await db
    .insert(team)
    .values({
      name,
      organizationId,
      createdAt: new Date(),
      updatedAt: new Date(),
    })
    .returning();

  return newTeam;
}

export async function addUserToTeam({
  userId,
  teamId,
}: {
  userId: string;
  teamId: string;
}): Promise<UserTeam> {
  const [userTeamRelation] = await db
    .insert(userTeam)
    .values({
      userId,
      teamId,
      assignedAt: new Date(),
    })
    .returning();

  return userTeamRelation;
}

export async function removeUserFromTeam({
  userId,
  teamId,
}: {
  userId: string;
  teamId: string;
}): Promise<void> {
  await db
    .delete(userTeam)
    .where(and(eq(userTeam.userId, userId), eq(userTeam.teamId, teamId)));
}

export async function createOrganizationInvitation({
  email,
  organizationId,
  role,
  createdBy,
}: {
  email: string;
  organizationId: string;
  role: 'admin' | 'manager' | 'user';
  createdBy: string;
}): Promise<OrganizationInvitation> {
  const token = generateInvitationToken();
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 7); // Invitation expires in 7 days

  const [invitation] = await db
    .insert(organizationInvitation)
    .values({
      email,
      organizationId,
      role,
      token,
      expiresAt,
      createdBy,
      createdAt: new Date(),
    })
    .returning();

  return invitation;
}

export async function getOrganizationInvitation(
  token: string,
): Promise<OrganizationInvitation | null> {
  const [invitation] = await db
    .select()
    .from(organizationInvitation)
    .where(eq(organizationInvitation.token, token));

  return invitation || null;
}

export async function acceptOrganizationInvitation({
  token,
  userId,
}: {
  token: string;
  userId: string;
}): Promise<boolean> {
  const invitation = await getOrganizationInvitation(token);

  if (!invitation || invitation.expiresAt < new Date()) {
    return false;
  }

  // Update user with organization details
  await db
    .update(user)
    .set({
      organizationId: invitation.organizationId,
      role: invitation.role,
      updatedAt: new Date(),
    })
    .where(eq(user.id, userId));

  // Delete the invitation
  await db
    .delete(organizationInvitation)
    .where(eq(organizationInvitation.token, token));

  return true;
}

function generateInvitationToken(): string {
  return (
    Math.random().toString(36).substring(2, 15) +
    Math.random().toString(36).substring(2, 15)
  );
}

export async function getOrganizationUsers(
  organizationId: string,
): Promise<User[]> {
  return db.select().from(user).where(eq(user.organizationId, organizationId));
}

export async function getOrganizationTeams(
  organizationId: string,
): Promise<Team[]> {
  return db.select().from(team).where(eq(team.organizationId, organizationId));
}

export async function getUserTeams(userId: string): Promise<Team[]> {
  return db
    .select()
    .from(team)
    .innerJoin(userTeam, eq(team.id, userTeam.teamId))
    .where(eq(userTeam.userId, userId));
}

export async function updateUserRole({
  userId,
  role,
}: {
  userId: string;
  role: 'admin' | 'manager' | 'user';
}): Promise<User | null> {
  const [updatedUser] = await db
    .update(user)
    .set({
      role,
      updatedAt: new Date(),
    })
    .where(eq(user.id, userId))
    .returning();

  return updatedUser || null;
}
