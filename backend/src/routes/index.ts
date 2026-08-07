import type { Express } from "express";
import { adminRouter } from "./admin.routes";
import { authRouter } from "./auth.routes";
import { healthRouter } from "./health.routes";
import { linksRouter } from "./links.routes";
import { redirectRouter } from "./redirect.routes";
import { authRateLimiter, globalRateLimiter } from "@/middleware/rateLimit.middleware";

export function registerRoutes(app: Express): void {
  app.use("/health", healthRouter);

  app.use(globalRateLimiter);

  app.use("/api/links", linksRouter);
  app.use("/api/admin", adminRouter);
  app.use("/auth", authRateLimiter, authRouter);
  app.use("/", redirectRouter);
}
