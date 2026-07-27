import cookieParser from "cookie-parser";
import express, { type Express } from "express";
import { healthRouter } from "./routes/health.routes";
import { linksRouter } from "./routes/links.routes";
import { redirectRouter } from "./routes/redirect.routes";
import { authRouter } from "./routes/auth.routes";
import { adminRouter } from "./routes/admin.routes";
import { errorMiddleware, notFoundMiddleware } from "./middleware/error.middleware";
import { requestLoggerMiddleware } from "./middleware/logger.middleware";
import { authRateLimiter, globalRateLimiter } from "./middleware/rateLimit.middleware";

export function createApp(): Express {
  const app = express();

  app.disable("x-powered-by");

  app.set("trust proxy", 1);

  app.use(express.json());
  app.use(cookieParser());
  app.use(requestLoggerMiddleware);

  app.use("/health", healthRouter);

  app.use(globalRateLimiter);

  app.use("/api/links", linksRouter);
  app.use("/api/admin", adminRouter);
  app.use("/auth", authRateLimiter, authRouter);
  app.use("/", redirectRouter);

  app.use(notFoundMiddleware);
  app.use(errorMiddleware);

  return app;
}
