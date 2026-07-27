import type { NextFunction, Request, Response } from "express";
import { getClientIp } from "@/utils/getClientIp";
import { logger } from "@/utils/logger";

export function requestLoggerMiddleware(req: Request, res: Response, next: NextFunction): void {
  const startedAt = process.hrtime.bigint();

  res.on("finish", () => {
    const durationMs = Number(process.hrtime.bigint() - startedAt) / 1_000_000;

    const meta = {
      method: req.method,
      path: req.originalUrl,
      statusCode: res.statusCode,
      durationMs: Math.round(durationMs * 100) / 100,
      ip: getClientIp(req),
    };

    const message = `${req.method} ${req.originalUrl} ${res.statusCode}`;

    if (res.statusCode >= 500) {
      logger.error(message, meta);
    } else if (res.statusCode >= 400) {
      logger.warn(message, meta);
    } else {
      logger.info(message, meta);
    }
  });

  next();
}
