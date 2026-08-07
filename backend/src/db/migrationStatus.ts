import fs from "node:fs";
import path from "node:path";
import postgres from "postgres";

interface JournalEntry {
  idx: number;
  tag: string;
}

interface Journal {
  entries: JournalEntry[];
}

export interface MigrationStatus {
  migrationsFolder: string;
  expectedCount: number;
  appliedCount: number;
  upToDate: boolean;
}

export function readExpectedMigrationCount(migrationsFolder: string): number {
  const journalPath = path.join(migrationsFolder, "meta", "_journal.json");
  const journal = JSON.parse(fs.readFileSync(journalPath, "utf-8")) as Journal;
  return journal.entries.length;
}

export async function checkMigrationsApplied(databaseUrl: string, migrationsFolder: string): Promise<MigrationStatus> {
  const expectedCount = readExpectedMigrationCount(migrationsFolder);

  const sql = postgres(databaseUrl, { max: 1 });
  try {
    const rows = await sql<{ count: string }[]>`
      SELECT count(*)::text AS count FROM drizzle.__drizzle_migrations
    `;
    const appliedCount = Number(rows[0]?.count ?? 0);

    return {
      migrationsFolder,
      expectedCount,
      appliedCount,
      upToDate: appliedCount >= expectedCount,
    };
  } finally {
    await sql.end();
  }
}
