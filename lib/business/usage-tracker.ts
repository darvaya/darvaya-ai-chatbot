import { db, sql } from '@/lib/db';
import { usageTracking } from '@/lib/db/schema';

interface TrackUsageOptions {
  organizationId: string;
  feature: string;
  quantity: number;
  metadata?: {
    userId?: string;
    context?: Record<string, unknown>;
    details?: Record<string, unknown>;
  };
}

interface UsageTotal {
  total: number | null;
}

export async function trackUsage({
  organizationId,
  feature,
  quantity,
  metadata,
}: TrackUsageOptions) {
  try {
    const [usage] = await db
      .insert(usageTracking)
      .values({
        organizationId,
        feature,
        quantity,
        timestamp: new Date(),
        metadata,
      })
      .returning();

    return usage;
  } catch (error) {
    console.error('Error tracking usage:', error);
    // Don't throw - we don't want to break the application flow
    // if usage tracking fails
    return null;
  }
}

export async function getFeatureUsage(
  organizationId: string,
  feature: string,
  startDate: Date,
  endDate: Date,
) {
  try {
    const usage = await db
      .select()
      .from(usageTracking)
      .where(
        sql`organization_id = ${organizationId} 
        AND feature = ${feature}
        AND timestamp >= ${startDate}
        AND timestamp <= ${endDate}`,
      );

    return usage;
  } catch (error) {
    console.error('Error getting feature usage:', error);
    return [];
  }
}

export async function getTotalUsage(
  organizationId: string,
  startDate: Date,
  endDate: Date,
) {
  try {
    const usage = await db
      .select({
        feature: usageTracking.feature,
        totalQuantity: sql`SUM(quantity)::integer`,
      })
      .from(usageTracking)
      .where(
        sql`organization_id = ${organizationId}
        AND timestamp >= ${startDate}
        AND timestamp <= ${endDate}`,
      )
      .groupBy(usageTracking.feature);

    return usage;
  } catch (error) {
    console.error('Error getting total usage:', error);
    return [];
  }
}

export async function checkUsageLimit(
  organizationId: string,
  feature: string,
  limit: number,
) {
  try {
    const [result] = await db
      .select({
        total: sql<number>`COALESCE(SUM(quantity), 0)::integer`,
      })
      .from(usageTracking)
      .where(
        sql`organization_id = ${organizationId}
        AND feature = ${feature}
        AND timestamp >= DATE_TRUNC('month', CURRENT_DATE)`,
      );

    const total = result?.total ?? 0;

    return {
      currentUsage: total,
      limit,
      remaining: Math.max(0, limit - total),
      isOverLimit: total >= limit,
    };
  } catch (error) {
    console.error('Error checking usage limit:', error);
    return {
      currentUsage: 0,
      limit,
      remaining: limit,
      isOverLimit: false,
      error: 'Failed to check usage limit',
    };
  }
}
