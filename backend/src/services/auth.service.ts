import { eq } from "drizzle-orm";
import { db } from "@/db/client";
import { users } from "@/db/schema";
import type { User } from "@/db/schema";
import { AppError } from "@/utils/AppError";
import { hashPassword, verifyPassword } from "@/utils/password";

export async function authenticate(email: string, password: string): Promise<User> {
  const user = await db.query.users.findFirst({ where: eq(users.email, email.toLowerCase()) });

  if (!user) {
    throw AppError.unauthorized("Invalid email or password", "INVALID_CREDENTIALS");
  }

  const isValid = await verifyPassword(password, user.passwordHash);
  if (!isValid) {
    throw AppError.unauthorized("Invalid email or password", "INVALID_CREDENTIALS");
  }

  return user;
}

export async function getUserById(id: number): Promise<User | null> {
  const user = await db.query.users.findFirst({ where: eq(users.id, id) });
  return user ?? null;
}

export async function registerUser(email: string, password: string): Promise<User> {
  const normalizedEmail = email.toLowerCase();

  const existing = await db.query.users.findFirst({ where: eq(users.email, normalizedEmail) });
  if (existing) {
    throw AppError.badRequest("A user with this email already exists", "EMAIL_TAKEN");
  }

  const passwordHash = await hashPassword(password);
  const [created] = await db.insert(users).values({ email: normalizedEmail, passwordHash, role: "user" }).returning();

  if (!created) {
    throw new AppError("Failed to register user", 500);
  }

  return created;
}
