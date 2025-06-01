-- Drop existing security settings table if it exists
DROP TABLE IF EXISTS "SecuritySettings";

-- Create security settings table with updated schema
CREATE TABLE IF NOT EXISTS "SecuritySettings" (
  "id" text PRIMARY KEY,
  "organization_id" text NOT NULL REFERENCES "Organization"("id"),
  "mfa_required" boolean DEFAULT false,
  "password_policy" jsonb DEFAULT '{"minLength":8,"maxLength":128,"requireUppercase":true,"requireLowercase":true,"requireNumbers":true,"requireSymbols":true,"preventReuseCount":3,"expiryDays":90}'::jsonb,
  "ip_allowlist" jsonb DEFAULT '[]'::jsonb,
  "session_timeout" integer DEFAULT 24,
  "max_login_attempts" integer DEFAULT 5,
  "lockout_duration" integer DEFAULT 15,
  "created_at" timestamp DEFAULT now(),
  "updated_at" timestamp DEFAULT now()
);

-- Create index for organization_id
CREATE INDEX IF NOT EXISTS "security_settings_organization_idx" ON "SecuritySettings"("organization_id"); 