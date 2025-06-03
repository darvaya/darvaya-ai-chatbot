import { migrate } from "drizzle-orm/postgres-js/migrator";
import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";
import { logger } from "@/lib/logger";

async function main() {
  logger.info("Starting database migration...");

  try {
    // Initialize Postgres client
    const connectionString = process.env.DATABASE_URL;
    if (!connectionString) {
      throw new Error("DATABASE_URL environment variable is not set");
    }

    // Create a new connection
    const sql = postgres(connectionString, { max: 1 });
    const db = drizzle(sql);

    // Run migrations
    logger.info("Running migrations...");
    await migrate(db, { migrationsFolder: "drizzle/migrations" });
    logger.info("Migrations completed successfully");

    // Close the connection
    await sql.end();
    process.exit(0);
  } catch (error) {
    logger.error(error, "Migration failed");
    process.exit(1);
  }
}

main();
