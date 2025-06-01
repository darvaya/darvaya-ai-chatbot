'use client';

import { useState, useEffect } from 'react';
import type { User } from 'next-auth';
import type { Organization, User as DBUser } from '@/lib/db/schema';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface MetricCard {
  title: string;
  value: string | number;
  change?: string;
  trend?: 'up' | 'down' | 'neutral';
  id: string;
}

interface AnalyticsDashboardProps {
  organization: Organization;
  users: DBUser[];
  currentUser: User;
}

export function AnalyticsDashboard({
  organization,
  users,
  currentUser,
}: AnalyticsDashboardProps) {
  const [timeRange, setTimeRange] = useState<'day' | 'week' | 'month'>('week');
  const [metrics, setMetrics] = useState<MetricCard[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchAnalytics();
  }, [timeRange]);

  const fetchAnalytics = async () => {
    setIsLoading(true);
    try {
      // Calculate basic metrics
      const activeUsers = users.filter((user) => user.isActive).length;
      const totalUsers = users.length;
      const activePercentage = Math.round((activeUsers / totalUsers) * 100);

      const roleDistribution = users.reduce(
        (acc: Record<string, number>, user) => {
          acc[user.role] = (acc[user.role] || 0) + 1;
          return acc;
        },
        {},
      );

      // Set metrics
      setMetrics([
        {
          id: 'active-users',
          title: 'Active Users',
          value: activeUsers,
          change: '+5%',
          trend: 'up',
        },
        {
          id: 'user-engagement',
          title: 'User Engagement',
          value: `${activePercentage}%`,
          change: '+2%',
          trend: 'up',
        },
        {
          id: 'team-utilization',
          title: 'Team Utilization',
          value: '85%',
          change: '-3%',
          trend: 'down',
        },
        {
          id: 'resource-usage',
          title: 'Resource Usage',
          value: '72%',
          change: '+8%',
          trend: 'up',
        },
      ]);

      // Additional role-based metrics
      const roleMetrics = Object.entries(roleDistribution).map(
        ([role, count]) => ({
          id: `role-${role}`,
          title: `${role.charAt(0).toUpperCase() + role.slice(1)}s`,
          value: count,
        }),
      );

      setMetrics((prev) => [...prev, ...roleMetrics]);
    } catch (error) {
      console.error('Error fetching analytics:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (!['admin', 'manager'].includes(currentUser.role)) {
    return (
      <div className="text-center py-6 text-gray-500">
        Only administrators and managers can access analytics
      </div>
    );
  }

  const recentActivities = [
    { id: 'activity-1', text: 'New team created: Development' },
    { id: 'activity-2', text: 'User John Doe joined the organization' },
    { id: 'activity-3', text: 'Project milestone achieved' },
    { id: 'activity-4', text: 'Resource allocation updated' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Organization Analytics</h2>
        <div className="flex items-center gap-4">
          <Select
            value={timeRange}
            onValueChange={(value: typeof timeRange) => setTimeRange(value)}
          >
            <SelectTrigger className="w-32">
              <SelectValue placeholder="Select range" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="day">Last 24h</SelectItem>
              <SelectItem value="week">Last Week</SelectItem>
              <SelectItem value="month">Last Month</SelectItem>
            </SelectContent>
          </Select>
          <Button
            variant="outline"
            onClick={fetchAnalytics}
            disabled={isLoading}
          >
            Refresh
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {metrics.map((metric) => (
          <Card key={metric.id}>
            <CardHeader className="p-4">
              <CardTitle className="text-sm font-medium text-gray-500">
                {metric.title}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-0">
              <div className="text-2xl font-bold">{metric.value}</div>
              {metric.change && (
                <div
                  className={`text-sm ${
                    metric.trend === 'up'
                      ? 'text-green-600'
                      : metric.trend === 'down'
                        ? 'text-red-600'
                        : 'text-gray-600'
                  }`}
                >
                  {metric.change} from last {timeRange}
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Activity Timeline */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {recentActivities.map((activity) => (
              <div
                key={activity.id}
                className="flex items-center gap-2 text-sm text-gray-600"
              >
                <div className="w-2 h-2 rounded-full bg-blue-500" />
                <span>{activity.text}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
