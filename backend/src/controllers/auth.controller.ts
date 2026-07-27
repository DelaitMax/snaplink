import type { CookieOptions, NextFunction, Request, Response } from "express";
import { env } from "@/config/env";
import * as authService from "@/services/auth.service";
import { AppError } from "@/utils/AppError";
import { signAuthToken } from "@/utils/jwt";
import { loginSchema } from "@/schemas/auth.schema";

function cookieOptions(): CookieOptions {
  return {
    httpOnly: true,
    secure: env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: env.JWT_EXPIRES_IN_SECONDS * 1000,
  };
}

export async function login(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { email, password } = loginSchema.parse(req.body);
    const user = await authService.authenticate(email, password);

    const token = signAuthToken({ sub: user.id, email: user.email });
    res.cookie(env.JWT_COOKIE_NAME, token, cookieOptions());

    res.json({ id: user.id, email: user.email });
  } catch (err) {
    next(err);
  }
}

export function logout(_req: Request, res: Response): void {
  res.clearCookie(env.JWT_COOKIE_NAME, { path: "/" });
  res.status(204).send();
}

export async function me(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    if (!req.user) {
      throw AppError.unauthorized("Authentication required", "NOT_AUTHENTICATED");
    }

    const user = await authService.getUserById(req.user.id);
    if (!user) {
      throw AppError.unauthorized("User no longer exists", "USER_NOT_FOUND");
    }

    res.json({ id: user.id, email: user.email });
  } catch (err) {
    next(err);
  }
}
