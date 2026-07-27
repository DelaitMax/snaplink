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
  // process.cwd() — корень backend/ (там, откуда запускается `npm test`),
  // так надёжнее, чем считать "../.." от текущего файла.
  await migrate(migrationDb, { migrationsFolder: path.join(process.cwd(), "src/db/migrations") });
  await migrationClient.end();
  await flushCache();
}

/**
 * Полностью очищает данные между тестами, сохраняя схему (миграции гоняются один раз).
 * Redis тоже чистим: он не участвует в TRUNCATE, а закэшированные redirect-записи
 * из одного прогона иначе переживают его и "протекают" в следующий (тот же shortCode,
 * старое закэшированное значение) — это ломает детерминированность тестов.
 */
export async function truncateAll(): Promise<void> {
  await db.execute(sql`TRUNCATE TABLE clicks, links, users RESTART IDENTITY CASCADE`);
  await flushCache();
}

async function flushCache(): Promise<void> {
  try {
    await redis.flushdb();
  } catch {
    // Redis недоступен — тесты и так не полагаются на кэш для корректности
    // (см. graceful degradation в src/lib/redis.ts), просто нечего чистить.
  }
}

export async function closeDb(): Promise<void> {
  await queryClient.end();
  redis.disconnect();
}
