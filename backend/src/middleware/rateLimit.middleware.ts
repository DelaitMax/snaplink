import rateLimit from "express-rate-limit";
import { getClientIp } from "@/utils/getClientIp";

function ipKeyGenerator(req: Parameters<typeof getClientIp>[0]): string {
  return getClientIp(req) ?? "unknown";
}

export const globalRateLimiter = rateLimit({
  windowMs: 60_000, // 1 минута
  limit: 100,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: ipKeyGenerator,
  message: { error: { message: "Too many requests, please try again later" } },
});

export const authRateLimiter = rateLimit({
  windowMs: 15 * 60_000, // 15 минут
  limit: 10,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: ipKeyGenerator,
  message: { error: { message: "Too many attempts, please try again later" } },
});
