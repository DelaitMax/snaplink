import jwt from "jsonwebtoken";
import { env } from "@/config/env";

export interface AuthTokenPayload {
  sub: number;
  email: string;
}

export function signAuthToken(payload: AuthTokenPayload): string {
  return jwt.sign(payload, env.JWT_SECRET, { expiresIn: env.JWT_EXPIRES_IN_SECONDS });
}

export function verifyAuthToken(token: string): AuthTokenPayload | null {
  try {
    const decoded = jwt.verify(token, env.JWT_SECRET);
    if (typeof decoded === "string") return null;
    if (typeof decoded.sub !== "number" || typeof decoded.email !== "string") return null;
    return { sub: decoded.sub, email: decoded.email };
  } catch {
    return null;
  }
}
