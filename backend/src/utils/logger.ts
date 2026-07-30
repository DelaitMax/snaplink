import pino from "pino";
import { env } from "@/config/env";

type LogMeta = Record<string, unknown>;

const pinoLogger = pino({
  level: env.LOG_LEVEL,
  ...(env.NODE_ENV === "development"
    ? {
        transport: {
          target: "pino-pretty",
          options: { colorize: true, translateTime: "HH:MM:ss", ignore: "pid,hostname" },
        },
      }
    : {}),
});

export const logger = {
  info: (message: string, meta?: LogMeta): void => pinoLogger.info(meta ?? {}, message),
  warn: (message: string, meta?: LogMeta): void => pinoLogger.warn(meta ?? {}, message),
  error: (message: string, meta?: LogMeta): void => pinoLogger.error(meta ?? {}, message),
};
