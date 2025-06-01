-- Create subscription plan enum
CREATE TYPE "subscription_plan" AS ENUM ('free', 'starter', 'professional', 'enterprise');

-- Create billing cycle enum
CREATE TYPE "billing_cycle" AS ENUM ('monthly', 'annual');

-- Create payment status enum
CREATE TYPE "payment_status" AS ENUM ('pending', 'completed', 'failed', 'refunded', 'cancelled');

-- Create subscription table
CREATE TABLE IF NOT EXISTS "Subscription" (
  "id" text PRIMARY KEY,
  "organizationId" text NOT NULL REFERENCES "Organization"("id"),
  "plan" subscription_plan NOT NULL,
  "status" text NOT NULL DEFAULT 'active',
  "billingCycle" billing_cycle NOT NULL,
  "startDate" timestamp NOT NULL,
  "endDate" timestamp,
  "trialEndsAt" timestamp,
  "cancelledAt" timestamp,
  "currentPeriodStart" timestamp NOT NULL,
  "currentPeriodEnd" timestamp NOT NULL,
  "createdAt" timestamp DEFAULT now(),
  "updatedAt" timestamp DEFAULT now(),
  "metadata" jsonb
);

-- Create billing table
CREATE TABLE IF NOT EXISTS "Billing" (
  "id" text PRIMARY KEY,
  "organizationId" text NOT NULL REFERENCES "Organization"("id"),
  "subscriptionId" text NOT NULL REFERENCES "Subscription"("id"),
  "amount" integer NOT NULL,
  "currency" text NOT NULL DEFAULT 'USD',
  "status" payment_status NOT NULL,
  "dueDate" timestamp NOT NULL,
  "paidAt" timestamp,
  "invoiceUrl" text,
  "paymentMethod" jsonb,
  "billingAddress" jsonb,
  "createdAt" timestamp DEFAULT now(),
  "updatedAt" timestamp DEFAULT now()
);

-- Create usage tracking table
CREATE TABLE IF NOT EXISTS "UsageTracking" (
  "id" text PRIMARY KEY,
  "organizationId" text NOT NULL REFERENCES "Organization"("id"),
  "feature" text NOT NULL,
  "quantity" integer NOT NULL,
  "timestamp" timestamp NOT NULL,
  "metadata" jsonb
);

-- Create business metrics table
CREATE TABLE IF NOT EXISTS "BusinessMetrics" (
  "id" text PRIMARY KEY,
  "organizationId" text NOT NULL REFERENCES "Organization"("id"),
  "date" timestamp NOT NULL,
  "metrics" jsonb,
  "createdAt" timestamp DEFAULT now(),
  "updatedAt" timestamp DEFAULT now()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS "subscription_organization_idx" ON "Subscription"("organizationId");
CREATE INDEX IF NOT EXISTS "billing_organization_idx" ON "Billing"("organizationId");
CREATE INDEX IF NOT EXISTS "billing_subscription_idx" ON "Billing"("subscriptionId");
CREATE INDEX IF NOT EXISTS "usage_organization_idx" ON "UsageTracking"("organizationId");
CREATE INDEX IF NOT EXISTS "usage_feature_idx" ON "UsageTracking"("feature");
CREATE INDEX IF NOT EXISTS "usage_timestamp_idx" ON "UsageTracking"("timestamp");
CREATE INDEX IF NOT EXISTS "metrics_organization_idx" ON "BusinessMetrics"("organizationId");
CREATE INDEX IF NOT EXISTS "metrics_date_idx" ON "BusinessMetrics"("date"); 