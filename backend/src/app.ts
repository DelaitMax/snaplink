import cookieParser from "cookie-parser";
import express, { type Express } from "express";
import { errorMiddleware, notFoundMiddleware } from "./middleware/error.middleware";
import { requestLoggerMiddleware } from "./middleware/logger.middleware";
import { registerRoutes } from "./routes";

export function createApp(): Express {
  const app = express();

  app.disable("x-powered-by");

  app.set("trust proxy", 1);

  app.use(express.json());
  app.use(cookieParser());
  app.use(requestLoggerMiddleware);

  registerRoutes(app);

  app.use(notFoundMiddleware);
  app.use(errorMiddleware);

  return app;
}
