import { auth } from '@/app/(auth)/auth';
import { redirect } from 'next/navigation';
import {
  getOrganizationById,
  getOrganizationUsers,
} from '@/lib/db/organization-queries';
import { OrganizationDashboard } from '@/components/organization/dashboard';
import { CreateOrganization } from '@/components/organization/create-organization';

export default async function OrganizationPage() {
  const session = await auth();

  if (!session?.user) {
    redirect('/login');
  }

  if (!session.user.organizationId) {
    return <CreateOrganization />;
  }

  const organization = await getOrganizationById(session.user.organizationId);
  if (!organization) {
    redirect('/');
  }

  const users = await getOrganizationUsers(organization.id);

  return (
    <div className="flex min-h-screen flex-col">
      <OrganizationDashboard
        organization={organization}
        users={users}
        currentUser={session.user}
      />
    </div>
  );
}
