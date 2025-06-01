'use client';

import { useState, useEffect } from 'react';
import type { User } from 'next-auth';
import type {
  Organization,
  Subscription,
  Billing,
  BusinessMetrics,
} from '@/lib/db/schema';
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

interface BusinessDashboardProps {
  organization: Organization;
  currentUser: User;
}

interface MetricsData {
  date: string;
  metrics: {
    activeUsers?: number;
    mrr?: number;
    userGrowth?: number;
  };
}

export function BusinessDashboard({
  organization,
  currentUser,
}: BusinessDashboardProps) {
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [billingHistory, setBillingHistory] = useState<Billing[]>([]);
  const [metrics, setMetrics] = useState<MetricsData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdatingPlan, setIsUpdatingPlan] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState('');
  const [selectedBillingCycle, setSelectedBillingCycle] = useState('');

  useEffect(() => {
    fetchBusinessData();
  }, []);

  const fetchBusinessData = async () => {
    try {
      const [subscriptionRes, billingRes, metricsRes] = await Promise.all([
        fetch('/api/organizations/business/subscription'),
        fetch('/api/organizations/business/billing'),
        fetch('/api/organizations/business/metrics'),
      ]);

      if (!subscriptionRes.ok || !billingRes.ok || !metricsRes.ok) {
        throw new Error('Failed to fetch business data');
      }

      const [subscriptionData, billingData, metricsData] = await Promise.all([
        subscriptionRes.json(),
        billingRes.json(),
        metricsRes.json(),
      ]);

      setSubscription(subscriptionData);
      setBillingHistory(billingData);
      setMetrics(metricsData);
    } catch (error) {
      console.error('Error fetching business data:', error);
      toast({
        type: 'error',
        description: 'Failed to load business data',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdatePlan = async () => {
    try {
      const response = await fetch('/api/organizations/business/subscription', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          plan: selectedPlan,
          billingCycle: selectedBillingCycle,
        }),
      });

      if (!response.ok) throw new Error('Failed to update subscription');

      toast({
        type: 'success',
        description: 'Subscription updated successfully',
      });

      setIsUpdatingPlan(false);
      fetchBusinessData();
    } catch (error) {
      console.error('Error updating subscription:', error);
      toast({
        type: 'error',
        description: 'Failed to update subscription',
      });
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount / 100); // Convert cents to dollars
  };

  const formatDate = (date: string | Date | null): string => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString();
  };

  if (!['admin', 'manager'].includes(currentUser.role)) {
    return (
      <div className="text-center py-6 text-gray-500">
        Only administrators and managers can access business settings
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Subscription Overview */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Subscription</CardTitle>
            <Dialog open={isUpdatingPlan} onOpenChange={setIsUpdatingPlan}>
              <DialogTrigger asChild>
                <Button>Change Plan</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Change Subscription Plan</DialogTitle>
                  <DialogDescription>
                    Choose a new plan and billing cycle
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label>Plan</Label>
                    <Select
                      value={selectedPlan}
                      onValueChange={setSelectedPlan}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select plan" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="starter">Starter</SelectItem>
                        <SelectItem value="professional">
                          Professional
                        </SelectItem>
                        <SelectItem value="enterprise">Enterprise</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Billing Cycle</Label>
                    <Select
                      value={selectedBillingCycle}
                      onValueChange={setSelectedBillingCycle}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select billing cycle" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="monthly">Monthly</SelectItem>
                        <SelectItem value="annual">
                          Annual (Save 20%)
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <DialogFooter>
                  <Button
                    variant="outline"
                    onClick={() => setIsUpdatingPlan(false)}
                  >
                    Cancel
                  </Button>
                  <Button onClick={handleUpdatePlan}>Update Plan</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <Label>Current Plan</Label>
              <p className="text-2xl font-bold capitalize">
                {subscription?.plan || 'Free'}
              </p>
            </div>
            <div>
              <Label>Billing Cycle</Label>
              <p className="text-2xl font-bold capitalize">
                {subscription?.billingCycle || 'N/A'}
              </p>
            </div>
            <div>
              <Label>Next Payment</Label>
              <p className="text-2xl font-bold">
                {formatDate(subscription?.currentPeriodEnd)}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Business Metrics */}
      <Card>
        <CardHeader>
          <CardTitle>Business Metrics</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[400px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={metrics}
                margin={{
                  top: 5,
                  right: 30,
                  left: 20,
                  bottom: 5,
                }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" tickFormatter={formatDate} />
                <YAxis />
                <Tooltip labelFormatter={formatDate} />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="metrics.activeUsers"
                  name="Active Users"
                  stroke="#8884d8"
                />
                <Line
                  type="monotone"
                  dataKey="metrics.mrr"
                  name="MRR"
                  stroke="#82ca9d"
                />
                <Line
                  type="monotone"
                  dataKey="metrics.userGrowth"
                  name="User Growth"
                  stroke="#ffc658"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Billing History */}
      <Card>
        <CardHeader>
          <CardTitle>Billing History</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Invoice</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {billingHistory.map((bill) => (
                <TableRow key={bill.id}>
                  <TableCell>{formatDate(bill.createdAt)}</TableCell>
                  <TableCell>{formatCurrency(bill.amount)}</TableCell>
                  <TableCell>
                    <span
                      className={`px-2 py-1 rounded text-sm ${
                        bill.status === 'completed'
                          ? 'bg-green-100 text-green-800'
                          : bill.status === 'pending'
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-red-100 text-red-800'
                      }`}
                    >
                      {bill.status}
                    </span>
                  </TableCell>
                  <TableCell>
                    {bill.invoiceUrl && (
                      <a
                        href={bill.invoiceUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:underline"
                      >
                        View Invoice
                      </a>
                    )}
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
