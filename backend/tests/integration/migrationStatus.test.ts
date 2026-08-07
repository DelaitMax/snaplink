import "@tests/setupEnv";
import { beforeAll, describe, expect, it } from "vitest";
import path from "node:path";
import postgres from "postgres";
import { env } from "@/config/env";
import { checkMigrationsApplied, readExpectedMigrationCount } from "@/db/migrationStatus";
import { runMigrations } from "./helpers/db";

const migrationsFolder = path.join(process.cwd(), "src/db/migrations");

describe("checkMigrationsApplied", () => {
  beforeAll(async () => {
    await runMigrations();
  });

  it("reports the database as up to date once all migrations have been applied", async () => {
    const status = await checkMigrationsApplied(env.DATABASE_URL, migrationsFolder);

    expect(status.expectedCount).toBe(readExpectedMigrationCount(migrationsFolder));
    expect(status.appliedCount).toBeGreaterThanOrEqual(status.expectedCount);
    expect(status.upToDate).toBe(true);
  });

  it("flags a database that is missing the most recently applied migration", async () => {
    const sql = postgres(env.DATABASE_URL, { max: 1 });

    try {
      const [lastRow] = await sql<{ id: number; hash: string; created_at: string }[]>`
        SELECT id, hash, created_at FROM drizzle.__drizzle_migrations ORDER BY id DESC LIMIT 1
      `;
      if (!lastRow) {
        throw new Error("Expected at least one applied migration in drizzle.__drizzle_migrations");
      }

      await sql`DELETE FROM drizzle.__drizzle_migrations WHERE id = ${lastRow.id}`;

      try {
        const status = await checkMigrationsApplied(env.DATABASE_URL, migrationsFolder);
        expect(status.upToDate).toBe(false);
        expect(status.appliedCount).toBe(status.expectedCount - 1);
      } finally {
        await sql`
          INSERT INTO drizzle.__drizzle_migrations (id, hash, created_at)
          VALUES (${lastRow.id}, ${lastRow.hash}, ${lastRow.created_at})
        `;
      }
    } finally {
      await sql.end();
    }
  });
});
