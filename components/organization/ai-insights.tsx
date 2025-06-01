'use client';

import { useState } from 'react';
import type { User } from 'next-auth';
import type { Organization } from '@/lib/db/schema';
import { Button } from '@/components/ui/button';
import { toast } from '@/components/toast';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';

interface AIInsightsProps {
  organization: Organization;
  currentUser: User;
}

export function AIInsights({ organization, currentUser }: AIInsightsProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [analysisType, setAnalysisType] = useState<
    'team_optimization' | 'user_insights' | 'activity_analysis'
  >('team_optimization');
  const [result, setResult] = useState<string | null>(null);

  const handleAnalysis = async () => {
    setIsLoading(true);
    setResult(null);

    try {
      // Prepare data based on analysis type
      const data = {
        organizationId: organization.id,
        organizationName: organization.name,
        maxUsers: organization.maxUsers,
        settings: organization.settings,
        requestedBy: currentUser.email,
        timestamp: new Date().toISOString(),
      };

      const response = await fetch('/api/organizations/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: analysisType,
          data,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate AI insights');
      }

      const analysisResult = await response.json();
      setResult(
        analysisResult.recommendations ||
          analysisResult.insights ||
          analysisResult.analysis,
      );

      toast({
        type: 'success',
        description: 'AI analysis completed successfully!',
      });
    } catch (error) {
      toast({
        type: 'error',
        description:
          error instanceof Error
            ? error.message
            : 'Failed to generate insights',
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (!['admin', 'manager'].includes(currentUser.role)) {
    return (
      <div className="text-center py-6 text-gray-500">
        Only administrators and managers can access AI insights
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>AI Insights</CardTitle>
          <CardDescription>
            Get AI-powered insights and recommendations for your organization
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="analysis-type">Analysis Type</Label>
              <Select
                value={analysisType}
                onValueChange={(value: typeof analysisType) =>
                  setAnalysisType(value)
                }
              >
                <SelectTrigger id="analysis-type">
                  <SelectValue placeholder="Select analysis type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="team_optimization">
                    Team Optimization
                  </SelectItem>
                  <SelectItem value="user_insights">User Insights</SelectItem>
                  <SelectItem value="activity_analysis">
                    Activity Analysis
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Button
              onClick={handleAnalysis}
              disabled={isLoading}
              className="w-full"
            >
              {isLoading ? 'Generating Insights...' : 'Generate AI Insights'}
            </Button>

            {result && (
              <div className="mt-6 p-4 bg-muted rounded-lg">
                <h3 className="font-semibold mb-2">Analysis Results:</h3>
                <div className="whitespace-pre-wrap text-sm">{result}</div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
