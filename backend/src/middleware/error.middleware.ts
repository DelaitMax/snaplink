import type { NextFunction, Request, Response } from "express";
import { ZodError } from "zod";
import { AppError } from "@/utils/AppError";
import { logger } from "@/utils/logger";

export function errorMiddleware(
  err: unknown,
  _req: Request,
  res: Response,

  _next: NextFunction,
): void {
  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      error: {
        message: err.message,
        code: err.code,
      },
    });
    return;
  }

  if (err instanceof ZodError) {
    res.status(400).json({
      error: {
        message: "Validation failed",
        details: err.flatten().fieldErrors,
      },
    });
    return;
  }

  logger.error("Unexpected error", {
    error: err instanceof Error ? { message: err.message, stack: err.stack } : err,
  });
  res.status(500).json({
    error: { message: "Internal server error" },
  });
}

export function notFoundMiddleware(req: Request, res: Response): void {
  res.status(404).json({
    error: { message: `Route ${req.method} ${req.path} not found` },
  });
}
