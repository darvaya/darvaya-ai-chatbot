import { z } from "zod";

// Helper function to get environment variable with fallback
const getEnv = (key: string, fallback?: string) => {
  const value = process.env[key] ?? fallback;
  if (value === undefined) {
    throw new Error(`Missing environment variable: ${key}`);
  }
  return value;
};

// Base schema for all environments
const baseSchema = z.object({
  // App
  NODE_ENV: z.enum(["development", "test", "production"]).default("production"),
  PORT: z.string().default("3000"),
  NEXT_PUBLIC_APP_URL: z.string().url().default("http://localhost:3000"),

  // NextAuth
  NEXTAUTH_URL: z.string().url().optional(),
  NEXTAUTH_SECRET: z.string().min(1),
  NEXTAUTH_URL_INTERNAL: z.string().url().optional(),

  // Google OAuth
  GOOGLE_CLIENT_ID: z.string().min(1),
  GOOGLE_CLIENT_SECRET: z.string().min(1),

  // OpenAI
  OPENAI_API_KEY: z.string().min(1),

  // Database
  DATABASE_URL: z.string().min(1),

  // Redis (optional)
  REDIS_URL: z.string().url().optional(),

  // Analytics
  NEXT_PUBLIC_GA_MEASUREMENT_ID: z.string().optional(),

  // PostHog
  NEXT_PUBLIC_POSTHOG_KEY: z.string().min(1).optional(),
  NEXT_PUBLIC_POSTHOG_HOST: z.string().url().optional(),

  // Sentry (optional)
  SENTRY_DSN: z.string().url().optional(),
  SENTRY_AUTH_TOKEN: z.string().optional(),

  // Deployment
  RAILWAY_ENVIRONMENT: z
    .enum(["production", "preview", "development"])
    .optional(),
  RAILWAY_GIT_COMMIT_SHA: z.string().optional(),
  RAILWAY_SERVICE_NAME: z.string().optional(),
  RAILWAY_GIT_BRANCH: z.string().optional(),
  RAILWAY_GIT_REPO_OWNER: z.string().optional(),
  RAILWAY_GIT_REPO_NAME: z.string().optional(),
  RAILWAY_GIT_COMMIT_MESSAGE: z.string().optional(),
  RAILWAY_GIT_COMMIT_AUTHOR: z.string().optional(),
  RAILWAY_GIT_COMMIT_AUTHOR_EMAIL: z.string().optional(),
  RAILWAY_GIT_COMMIT_TIMESTAMP: z.string().optional(),
  RAILWAY_GIT_REPO_URL: z.string().url().optional(),
});

// Schema for production environment
const productionSchema = baseSchema.extend({
  NODE_ENV: z.literal("production"),
  // Add production-specific validations here
});

// Schema for development environment
const developmentSchema = baseSchema.extend({
  NODE_ENV: z.literal("development"),
  // Add development-specific validations here
});

// Schema for test environment
const testSchema = baseSchema.extend({
  NODE_ENV: z.literal("test"),
  // Add test-specific validations here
});

// Merged schema
const envSchema = z.union([productionSchema, developmentSchema, testSchema]);

// Parse environment variables
export const env = (() => {
  try {
    // Create a copy of process.env to avoid modifying the original
    const envVars = { ...process.env };

    // Set default NODE_ENV if not set
    if (!envVars.NODE_ENV) {
      envVars.NODE_ENV = (
        envVars.RAILWAY_ENVIRONMENT === "production"
          ? "production"
          : envVars.RAILWAY_ENVIRONMENT === "preview"
            ? "development"
            : "development"
      ) as "development" | "production" | "test";
    }

    // Set default NEXTAUTH_URL if not set
    if (!envVars.NEXTAUTH_URL) {
      envVars.NEXTAUTH_URL =
        envVars.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    }

    // Set default PORT for Railway
    if (!envVars.PORT) {
      envVars.PORT = "3000";
    }

    // Set default NEXTAUTH_URL for production
    if (envVars.NODE_ENV === "production" && !envVars.NEXTAUTH_URL) {
      // For Railway deployments, use the RAILWAY_PUBLIC_DOMAIN if available
      if (envVars.RAILWAY_PUBLIC_DOMAIN) {
        envVars.NEXTAUTH_URL = `https://${envVars.RAILWAY_PUBLIC_DOMAIN}`;
      } else if (envVars.RAILWAY_STATIC_URL) {
        envVars.NEXTAUTH_URL = envVars.RAILWAY_STATIC_URL;
      } else if (envVars.RAILWAY_SERVICE_NAME) {
        // Fallback to Railway's service name if no domain is set
        envVars.NEXTAUTH_URL = `https://${envVars.RAILWAY_SERVICE_NAME}.up.railway.app`;
      }
    }

    // Set default PORT if not set
    if (!envVars.PORT) {
      envVars.PORT = "3000";
    }

    // Parse and validate
    const parsed = envSchema.safeParse(envVars);

    if (!parsed.success) {
      console.error(
        "❌ Invalid environment variables:",
        parsed.error.flatten().fieldErrors,
      );
      throw new Error("Invalid environment variables");
    }

    return parsed.data;
  } catch (error) {
    console.error("❌ Failed to load environment variables:", error);
    throw error;
  }
})();

// Export type for TypeScript
export type Env = z.infer<typeof baseSchema>;
