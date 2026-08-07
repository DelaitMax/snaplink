import "dotenv/config";
import path from "node:path";
import { env } from "@/config/env";
import { checkMigrationsApplied } from "@/db/migrationStatus";

async function run(): Promise<void> {
  const migrationsFolder = path.join(__dirname, "migrations");
  const status = await checkMigrationsApplied(env.DATABASE_URL, migrationsFolder);

  // eslint-disable-next-line no-console
  console.log(`Migrations in repo: ${status.expectedCount}, applied in DB: ${status.appliedCount}`);

  if (!status.upToDate) {
    console.error(
      `Migration check FAILED: database is missing ${status.expectedCount - status.appliedCount} ` +
        `migration(s) from ${migrationsFolder}. Did db:migrate run against the right DATABASE_URL?`,
    );
    process.exitCode = 1;
    return;
  }

  // eslint-disable-next-line no-console
  console.log("Migration check OK: database is up to date with all migrations in the repo.");
}

run().catch((err) => {
  console.error("Migration check errored:", err);
  process.exit(1);
});
