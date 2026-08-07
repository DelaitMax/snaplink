import "dotenv/config";
import { createApp } from "./app";
import { env } from "./config/env";
import { logger } from "./utils/logger";

const app = createApp();

app.listen(env.PORT, "0.0.0.0", () => {
  logger.info("URL shortener API listening", { port: env.PORT, env: env.NODE_ENV });
});
