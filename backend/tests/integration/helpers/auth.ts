import { db } from "@/db/client";
import { users } from "@/db/schema";
import { env } from "@/config/env";
import { hashPassword } from "@/utils/password";

export interface SeededAdmin {
  email: string;
  password: string;
}

export async function seedAdminUser(): Promise<SeededAdmin> {
  const email = (env.ADMIN_EMAIL ?? "admin@example.com").toLowerCase();
  const password = env.ADMIN_PASSWORD ?? "TestPassword123";

  await db.insert(users).values({ email, passwordHash: await hashPassword(password), role: "admin" });

  return { email, password };
}

export function extractSetCookie(res: { headers: Record<string, string | string[] | undefined> }): string {
  const raw = res.headers["set-cookie"];
  const cookie = Array.isArray(raw) ? raw[0] : raw;
  if (!cookie) {
    throw new Error("Expected a Set-Cookie header in the response, got none");
  }
  return cookie;
}
