import "@tests/setupEnv";
import path from "node:path";
import { sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/postgres-js";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import postgres from "postgres";
import { db, queryClient } from "@/db/client";
import { env } from "@/config/env";
import { redis } from "@/lib/redis";

export async function runMigrations(): Promise<void> {
  const migrationClient = postgres(env.DATABASE_URL, { max: 1 });
  const migrationDb = drizzle(migrationClient);
  await migrate(migrationDb, { migrationsFolder: path.join(process.cwd(), "src/db/migrations") });
  await migrationClient.end();
  await flushCache();
}

export async function truncateAll(): Promise<void> {
  await db.execute(sql`TRUNCATE TABLE clicks, links, users RESTART IDENTITY CASCADE`);
  await flushCache();
}

async function flushCache(): Promise<void> {
  try {
    await redis.flushdb();
  } catch {
		// no-op
  }
}

export async function closeDb(): Promise<void> {
  await queryClient.end();
  redis.disconnect();
}
