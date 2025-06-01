'use client';

import { useState } from 'react';
import type { User } from 'next-auth';
import type { Organization, User as DBUser } from '@/lib/db/schema';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { OrganizationSettings } from './settings';
import { TeamManagement } from './team-management';
import { UserManagement } from './user-management';
import { AIInsights } from './ai-insights';
import { AnalyticsDashboard } from './analytics-dashboard';
import { IntegrationsDashboard } from './integrations-dashboard';
import { SecurityDashboard } from './security-dashboard';
import { BusinessDashboard } from './business-dashboard';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

interface DashboardProps {
  organization: Organization;
  users: DBUser[];
  currentUser: User;
}

export function OrganizationDashboard({
  organization,
  users,
  currentUser,
}: DashboardProps) {
  const [activeTab, setActiveTab] = useState('overview');

  return (
    <div className="container mx-auto py-6">
      <Card>
        <CardHeader>
          <CardTitle>{organization.name}</CardTitle>
          <CardDescription>
            Manage your organization, teams, and members
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-8">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="teams">Teams</TabsTrigger>
              <TabsTrigger value="analytics">Analytics</TabsTrigger>
              <TabsTrigger value="integrations">Integrations</TabsTrigger>
              <TabsTrigger value="ai-insights">AI Insights</TabsTrigger>
              <TabsTrigger value="security">Security</TabsTrigger>
              <TabsTrigger value="business">Business</TabsTrigger>
              <TabsTrigger value="settings">Settings</TabsTrigger>
            </TabsList>

            <TabsContent value="overview">
              <UserManagement
                users={users}
                currentUser={currentUser}
                organization={organization}
              />
            </TabsContent>

            <TabsContent value="teams">
              <TeamManagement
                organization={organization}
                currentUser={currentUser}
              />
            </TabsContent>

            <TabsContent value="analytics">
              <AnalyticsDashboard
                organization={organization}
                users={users}
                currentUser={currentUser}
              />
            </TabsContent>

            <TabsContent value="integrations">
              <IntegrationsDashboard
                organization={organization}
                currentUser={currentUser}
              />
            </TabsContent>

            <TabsContent value="ai-insights">
              <AIInsights
                organization={organization}
                currentUser={currentUser}
              />
            </TabsContent>

            <TabsContent value="security">
              <SecurityDashboard
                organization={organization}
                currentUser={currentUser}
              />
            </TabsContent>

            <TabsContent value="business">
              <BusinessDashboard
                organization={organization}
                currentUser={currentUser}
              />
            </TabsContent>

            <TabsContent value="settings">
              <OrganizationSettings
                organization={organization}
                currentUser={currentUser}
              />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
