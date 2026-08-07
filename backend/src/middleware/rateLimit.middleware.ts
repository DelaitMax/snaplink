import rateLimit from "express-rate-limit";
import {
  AUTH_RATE_LIMIT_MAX,
  AUTH_RATE_LIMIT_WINDOW_MS,
  GLOBAL_RATE_LIMIT_MAX,
  GLOBAL_RATE_LIMIT_WINDOW_MS,
} from "@/constants";
import { getClientIp } from "@/utils/getClientIp";

export function ipKeyGenerator(req: Parameters<typeof getClientIp>[0]): string {
  return getClientIp(req) ?? req.socket.remoteAddress ?? "unknown";
}

export const globalRateLimiter = rateLimit({
  windowMs: GLOBAL_RATE_LIMIT_WINDOW_MS,
  limit: GLOBAL_RATE_LIMIT_MAX,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: ipKeyGenerator,
  message: { error: { message: "Too many requests, please try again later" } },
});

export const authRateLimiter = rateLimit({
  windowMs: AUTH_RATE_LIMIT_WINDOW_MS,
  limit: AUTH_RATE_LIMIT_MAX,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: ipKeyGenerator,
  message: { error: { message: "Too many attempts, please try again later" } },
});
