import "dotenv/config";
import { eq } from "drizzle-orm";
import { db } from "./client";
import { users } from "./schema";
import { env } from "@/config/env";
import { hashPassword } from "@/utils/password";

async function run(): Promise<void> {
  if (!env.ADMIN_EMAIL || !env.ADMIN_PASSWORD) {
    console.error("ADMIN_EMAIL and ADMIN_PASSWORD must be set in the environment to run this script.");
    process.exit(1);
  }

  const email = env.ADMIN_EMAIL.toLowerCase();
  const passwordHash = await hashPassword(env.ADMIN_PASSWORD);

  const existing = await db.query.users.findFirst({ where: eq(users.email, email) });

  if (existing) {
    await db.update(users).set({ passwordHash, role: "admin" }).where(eq(users.id, existing.id));
    // eslint-disable-next-line no-console
    console.log(`Updated password for existing user: ${email}`);
  } else {
    await db.insert(users).values({ email, passwordHash, role: "admin" });
    // eslint-disable-next-line no-console
    console.log(`Created user: ${email}`);
  }

  process.exit(0);
}

run().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
