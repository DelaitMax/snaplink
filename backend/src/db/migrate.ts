import "dotenv/config";
import path from "node:path";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { env } from "@/config/env";

async function run(): Promise<void> {
  const migrationClient = postgres(env.DATABASE_URL, { max: 1 });
  const db = drizzle(migrationClient);

  const migrationsFolder = path.join(__dirname, "migrations");

  // eslint-disable-next-line no-console
  console.log(`Running migrations from ${migrationsFolder} ...`);
  await migrate(db, { migrationsFolder });
  // eslint-disable-next-line no-console
  console.log("Migrations applied.");

  await migrationClient.end();
}

run().catch((err) => {
  console.error("Migration failed:", err);
  process.exit(1);
});
