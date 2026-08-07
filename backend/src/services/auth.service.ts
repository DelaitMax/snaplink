import { StatusCodes } from "http-status-codes";
import type { User } from "@/db/schema";
import { findUserByEmail, findUserById, insertUser } from "@/repositories/users.repository";
import { AppError } from "@/utils/AppError";
import { hashPassword, verifyPassword } from "@/utils/password";

export async function authenticate(email: string, password: string): Promise<User> {
  const user = await findUserByEmail(email.toLowerCase());

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
  return findUserById(id);
}

export async function registerUser(email: string, password: string): Promise<User> {
  const normalizedEmail = email.toLowerCase();

  const existing = await findUserByEmail(normalizedEmail);
  if (existing) {
    throw AppError.badRequest("A user with this email already exists", "EMAIL_TAKEN");
  }

  const passwordHash = await hashPassword(password);
  const created = await insertUser({ email: normalizedEmail, passwordHash, role: "user" });

  if (!created) {
    throw new AppError("Failed to register user", StatusCodes.INTERNAL_SERVER_ERROR);
  }

  return created;
}
