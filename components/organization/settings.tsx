'use client';

import { useState } from 'react';
import { User } from 'next-auth';
import { Organization } from '@/lib/db/schema';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from '@/components/toast';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

interface OrganizationSettingsProps {
  organization: Organization;
  currentUser: User;
}

export function OrganizationSettings({
  organization,
  currentUser,
}: OrganizationSettingsProps) {
  const [isUpdating, setIsUpdating] = useState(false);
  const [name, setName] = useState(organization.name);
  const [maxUsers, setMaxUsers] = useState(organization.maxUsers);

  const handleUpdateSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsUpdating(true);

    try {
      const response = await fetch('/api/organizations', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          maxUsers,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(
          error.message || 'Failed to update organization settings',
        );
      }

      toast({
        type: 'success',
        description: 'Organization settings updated successfully!',
      });
    } catch (error) {
      toast({
        type: 'error',
        description:
          error instanceof Error ? error.message : 'Failed to update settings',
      });
    } finally {
      setIsUpdating(false);
    }
  };

  if (currentUser.role !== 'admin') {
    return (
      <div className="text-center py-6 text-gray-500">
        Only administrators can manage organization settings
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Organization Settings</CardTitle>
          <CardDescription>
            Manage your organization's settings and preferences
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleUpdateSettings} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Organization Name</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter organization name"
                disabled={isUpdating}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="maxUsers">Maximum Users</Label>
              <Input
                id="maxUsers"
                type="number"
                min={1}
                max={1000}
                value={maxUsers}
                onChange={(e) => setMaxUsers(parseInt(e.target.value, 10))}
                placeholder="Enter maximum number of users"
                disabled={isUpdating}
              />
              <p className="text-sm text-gray-500">
                Maximum number of users that can be added to the organization
              </p>
            </div>
            <Button type="submit" disabled={isUpdating}>
              {isUpdating ? 'Updating...' : 'Update Settings'}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Danger Zone</CardTitle>
          <CardDescription>
            Actions that can have serious consequences
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button
            variant="destructive"
            onClick={() => {
              // TODO: Implement organization deletion
              toast({
                type: 'info',
                description: 'Organization deletion is not yet implemented',
              });
            }}
          >
            Delete Organization
          </Button>
          <p className="mt-2 text-sm text-gray-500">
            This action cannot be undone. All data will be permanently deleted.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
