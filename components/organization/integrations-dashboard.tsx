'use client';

import { useState, useEffect } from 'react';
import type { User } from 'next-auth';
import type { Organization, Integration } from '@/lib/db/schema';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from '@/components/toast';

interface IntegrationsDashboardProps {
  organization: Organization;
  currentUser: User;
}

export function IntegrationsDashboard({
  organization,
  currentUser,
}: IntegrationsDashboardProps) {
  const [integrations, setIntegrations] = useState<Integration[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAddingIntegration, setIsAddingIntegration] = useState(false);
  const [newIntegration, setNewIntegration] = useState({
    type: '',
    name: '',
    config: {},
  });

  useEffect(() => {
    fetchIntegrations();
  }, []);

  const fetchIntegrations = async () => {
    try {
      const response = await fetch('/api/organizations/integrations');
      if (!response.ok) throw new Error('Failed to fetch integrations');
      const data = await response.json();
      setIntegrations(data);
    } catch (error) {
      console.error('Error fetching integrations:', error);
      toast({
        type: 'error',
        description: 'Failed to load integrations',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddIntegration = async () => {
    try {
      const response = await fetch('/api/organizations/integrations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newIntegration),
      });

      if (!response.ok) throw new Error('Failed to add integration');

      toast({
        type: 'success',
        description: 'Integration added successfully',
      });

      setIsAddingIntegration(false);
      fetchIntegrations();
    } catch (error) {
      console.error('Error adding integration:', error);
      toast({
        type: 'error',
        description: 'Failed to add integration',
      });
    }
  };

  const handleUpdateIntegration = async (integration: Integration) => {
    try {
      const response = await fetch(
        `/api/organizations/integrations/${integration.id}`,
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(integration),
        },
      );

      if (!response.ok) throw new Error('Failed to update integration');

      toast({
        type: 'success',
        description: 'Integration updated successfully',
      });

      fetchIntegrations();
    } catch (error) {
      console.error('Error updating integration:', error);
      toast({
        type: 'error',
        description: 'Failed to update integration',
      });
    }
  };

  const handleDeleteIntegration = async (integrationId: string) => {
    try {
      const response = await fetch(
        `/api/organizations/integrations/${integrationId}`,
        {
          method: 'DELETE',
        },
      );

      if (!response.ok) throw new Error('Failed to delete integration');

      toast({
        type: 'success',
        description: 'Integration deleted successfully',
      });

      fetchIntegrations();
    } catch (error) {
      console.error('Error deleting integration:', error);
      toast({
        type: 'error',
        description: 'Failed to delete integration',
      });
    }
  };

  if (!['admin', 'manager'].includes(currentUser.role)) {
    return (
      <div className="text-center py-6 text-gray-500">
        Only administrators and managers can manage integrations
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Integrations</h2>
        <Dialog
          open={isAddingIntegration}
          onOpenChange={setIsAddingIntegration}
        >
          <DialogTrigger asChild>
            <Button>Add Integration</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Integration</DialogTitle>
              <DialogDescription>
                Connect your organization with external services
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="integration-type">Integration Type</Label>
                <Select
                  value={newIntegration.type}
                  onValueChange={(value) =>
                    setNewIntegration({ ...newIntegration, type: value })
                  }
                >
                  <SelectTrigger id="integration-type">
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="slack">Slack</SelectItem>
                    <SelectItem value="github">GitHub</SelectItem>
                    <SelectItem value="jira">Jira</SelectItem>
                    <SelectItem value="google_workspace">
                      Google Workspace
                    </SelectItem>
                    <SelectItem value="microsoft_365">Microsoft 365</SelectItem>
                    <SelectItem value="zoom">Zoom</SelectItem>
                    <SelectItem value="custom">Custom</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="integration-name">Name</Label>
                <Input
                  id="integration-name"
                  value={newIntegration.name}
                  onChange={(e) =>
                    setNewIntegration({
                      ...newIntegration,
                      name: e.target.value,
                    })
                  }
                  placeholder="Enter integration name"
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setIsAddingIntegration(false)}
              >
                Cancel
              </Button>
              <Button onClick={handleAddIntegration}>Add Integration</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {integrations.map((integration) => (
          <Card key={integration.id}>
            <CardHeader>
              <CardTitle className="flex justify-between items-center">
                <span>{integration.name}</span>
                <span
                  className={`text-sm px-2 py-1 rounded ${
                    integration.status === 'active'
                      ? 'bg-green-100 text-green-800'
                      : integration.status === 'failed'
                        ? 'bg-red-100 text-red-800'
                        : 'bg-gray-100 text-gray-800'
                  }`}
                >
                  {integration.status}
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <Label>Type</Label>
                  <div className="text-sm">{integration.type}</div>
                </div>
                <div>
                  <Label>Last Synced</Label>
                  <div className="text-sm">
                    {integration.lastSyncedAt
                      ? new Date(integration.lastSyncedAt).toLocaleString()
                      : 'Never'}
                  </div>
                </div>
                <div className="flex justify-end space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleUpdateIntegration(integration)}
                  >
                    Configure
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => handleDeleteIntegration(integration.id)}
                  >
                    Remove
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
