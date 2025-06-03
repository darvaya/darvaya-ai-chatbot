import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { env } from "@/lib/env";

// Parse DATABASE_URL for SSL configuration
const databaseUrl = new URL(env.DATABASE_URL);
const isLocalhost =
  databaseUrl.hostname === "localhost" || databaseUrl.hostname === "127.0.0.1";

// Configure SSL based on environment
const sslConfig = isLocalhost
  ? false
  : {
      rejectUnauthorized: false, // For self-signed certificates in production
    };

// Configure connection pool
const connectionString = env.DATABASE_URL;

// Create a single reusable connection pool
const client = postgres(connectionString, {
  ssl: sslConfig,
  max: 10, // Maximum number of connections in the pool
  idle_timeout: 20, // Max idle time in seconds
  max_lifetime: 60 * 30, // Max lifetime in seconds (30 minutes)
  connect_timeout: 10, // Connection timeout in seconds
});

// Export the database client for direct operations
export { client };

// Export the Drizzle instance
export const db = drizzle(client, {
  logger: process.env.NODE_ENV === "development",
});

// Handle clean up on process termination
process.on("SIGTERM", () => {
  console.log("SIGTERM received. Closing database connections...");
  client.end();
  process.exit(0);
});

process.on("SIGINT", () => {
  console.log("SIGINT received. Closing database connections...");
  client.end();
  process.exit(0);
});
