import { eq } from "drizzle-orm";
import { db } from "@/db/client";
import { users } from "@/db/schema";
import type { NewUser, User } from "@/db/schema";

export async function findUserByEmail(email: string): Promise<User | null> {
  return (await db.query.users.findFirst({ where: eq(users.email, email) })) ?? null;
}

export async function findUserById(id: number): Promise<User | null> {
  return (await db.query.users.findFirst({ where: eq(users.id, id) })) ?? null;
}

export async function insertUser(values: NewUser): Promise<User | null> {
  const [created] = await db.insert(users).values(values).returning();
  return created ?? null;
}
