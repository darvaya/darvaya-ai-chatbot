'use client';

import { useState, useEffect } from 'react';
import type { User } from 'next-auth';
import type {
  Organization,
  SecuritySettings,
  SecurityAuditLog,
  ApiKey,
} from '@/lib/db/schema';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

interface SecurityDashboardProps {
  organization: Organization;
  currentUser: User;
}

export function SecurityDashboard({
  organization,
  currentUser,
}: SecurityDashboardProps) {
  const [settings, setSettings] = useState<SecuritySettings | null>(null);
  const [auditLogs, setAuditLogs] = useState<SecurityAuditLog[]>([]);
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAddingApiKey, setIsAddingApiKey] = useState(false);
  const [newApiKey, setNewApiKey] = useState({
    name: '',
    scopes: [] as string[],
  });

  useEffect(() => {
    fetchSecurityData();
  }, []);

  const fetchSecurityData = async () => {
    try {
      const [settingsRes, logsRes, keysRes] = await Promise.all([
        fetch('/api/organizations/security/settings'),
        fetch('/api/organizations/security/audit-logs'),
        fetch('/api/organizations/security/api-keys'),
      ]);

      if (!settingsRes.ok || !logsRes.ok || !keysRes.ok) {
        throw new Error('Failed to fetch security data');
      }

      const [settingsData, logsData, keysData] = await Promise.all([
        settingsRes.json(),
        logsRes.json(),
        keysRes.json(),
      ]);

      setSettings(settingsData);
      setAuditLogs(logsData);
      setApiKeys(keysData);
    } catch (error) {
      console.error('Error fetching security data:', error);
      toast({
        type: 'error',
        description: 'Failed to load security data',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateSettings = async (updates: Partial<SecuritySettings>) => {
    try {
      const response = await fetch('/api/organizations/security/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });

      if (!response.ok) throw new Error('Failed to update security settings');

      toast({
        type: 'success',
        description: 'Security settings updated successfully',
      });

      fetchSecurityData();
    } catch (error) {
      console.error('Error updating security settings:', error);
      toast({
        type: 'error',
        description: 'Failed to update security settings',
      });
    }
  };

  const handleCreateApiKey = async () => {
    try {
      const response = await fetch('/api/organizations/security/api-keys', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newApiKey),
      });

      if (!response.ok) throw new Error('Failed to create API key');

      const data = await response.json();
      toast({
        type: 'success',
        description: 'API key created successfully',
      });

      // Show the API key to the user (only time it will be visible)
      toast({
        type: 'info',
        description: `Your API key: ${data.key}`,
        duration: 10000,
      });

      setIsAddingApiKey(false);
      fetchSecurityData();
    } catch (error) {
      console.error('Error creating API key:', error);
      toast({
        type: 'error',
        description: 'Failed to create API key',
      });
    }
  };

  const handleRevokeApiKey = async (keyId: string) => {
    try {
      const response = await fetch(
        `/api/organizations/security/api-keys/${keyId}`,
        {
          method: 'DELETE',
        },
      );

      if (!response.ok) throw new Error('Failed to revoke API key');

      toast({
        type: 'success',
        description: 'API key revoked successfully',
      });

      fetchSecurityData();
    } catch (error) {
      console.error('Error revoking API key:', error);
      toast({
        type: 'error',
        description: 'Failed to revoke API key',
      });
    }
  };

  if (!['admin'].includes(currentUser.role)) {
    return (
      <div className="text-center py-6 text-gray-500">
        Only administrators can access security settings
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Security Settings */}
      <Card>
        <CardHeader>
          <CardTitle>Security Settings</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label>Require MFA</Label>
              <p className="text-sm text-gray-500">
                Enforce multi-factor authentication for all users
              </p>
            </div>
            <Switch
              checked={settings?.mfaRequired}
              onCheckedChange={(checked) =>
                handleUpdateSettings({ mfaRequired: checked })
              }
            />
          </div>

          <div className="space-y-2">
            <Label>Session Timeout (hours)</Label>
            <Input
              type="number"
              value={settings?.sessionTimeout}
              onChange={(e) =>
                handleUpdateSettings({
                  sessionTimeout: Number.parseInt(e.target.value, 10),
                })
              }
              min={1}
              max={72}
            />
          </div>

          <div className="space-y-2">
            <Label>Maximum Login Attempts</Label>
            <Input
              type="number"
              value={settings?.maxLoginAttempts}
              onChange={(e) =>
                handleUpdateSettings({
                  maxLoginAttempts: Number.parseInt(e.target.value, 10),
                })
              }
              min={1}
              max={10}
            />
          </div>
        </CardContent>
      </Card>

      {/* API Keys */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>API Keys</CardTitle>
            <Dialog open={isAddingApiKey} onOpenChange={setIsAddingApiKey}>
              <DialogTrigger asChild>
                <Button>Create API Key</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create New API Key</DialogTitle>
                  <DialogDescription>
                    API keys allow secure access to the organization's resources
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="api-key-name">Name</Label>
                    <Input
                      id="api-key-name"
                      value={newApiKey.name}
                      onChange={(e) =>
                        setNewApiKey({ ...newApiKey, name: e.target.value })
                      }
                      placeholder="Enter API key name"
                    />
                  </div>
                  <div>
                    <Label htmlFor="api-key-scopes">Scopes</Label>
                    <Select
                      value={newApiKey.scopes.join(',')}
                      onValueChange={(value) =>
                        setNewApiKey({
                          ...newApiKey,
                          scopes: value.split(',').filter(Boolean),
                        })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select scopes" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="read">Read</SelectItem>
                        <SelectItem value="write">Write</SelectItem>
                        <SelectItem value="admin">Admin</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <DialogFooter>
                  <Button
                    variant="outline"
                    onClick={() => setIsAddingApiKey(false)}
                  >
                    Cancel
                  </Button>
                  <Button onClick={handleCreateApiKey}>Create API Key</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Created</TableHead>
                <TableHead>Last Used</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {apiKeys.map((key) => (
                <TableRow key={key.id}>
                  <TableCell>{key.name}</TableCell>
                  <TableCell>
                    {new Date(key.createdAt).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    {key.lastUsedAt
                      ? new Date(key.lastUsedAt).toLocaleDateString()
                      : 'Never'}
                  </TableCell>
                  <TableCell>
                    <span
                      className={`px-2 py-1 rounded text-sm ${
                        key.isActive
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                      }`}
                    >
                      {key.isActive ? 'Active' : 'Revoked'}
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleRevokeApiKey(key.id)}
                      disabled={!key.isActive}
                    >
                      Revoke
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Audit Logs */}
      <Card>
        <CardHeader>
          <CardTitle>Security Audit Logs</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Time</TableHead>
                <TableHead>Event</TableHead>
                <TableHead>User</TableHead>
                <TableHead>IP Address</TableHead>
                <TableHead>Severity</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {auditLogs.map((log) => (
                <TableRow key={log.id}>
                  <TableCell>
                    {new Date(log.createdAt).toLocaleString()}
                  </TableCell>
                  <TableCell>{log.eventType}</TableCell>
                  <TableCell>{log.userId}</TableCell>
                  <TableCell>{log.ipAddress}</TableCell>
                  <TableCell>
                    <span
                      className={`px-2 py-1 rounded text-sm ${
                        log.severity === 'critical'
                          ? 'bg-red-100 text-red-800'
                          : log.severity === 'high'
                            ? 'bg-orange-100 text-orange-800'
                            : log.severity === 'medium'
                              ? 'bg-yellow-100 text-yellow-800'
                              : 'bg-green-100 text-green-800'
                      }`}
                    >
                      {log.severity}
                    </span>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
