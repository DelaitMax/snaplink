import type { NextFunction, Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
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
    res.status(StatusCodes.BAD_REQUEST).json({
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
  res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
    error: { message: "Internal server error" },
  });
}

export function notFoundMiddleware(req: Request, res: Response): void {
  res.status(StatusCodes.NOT_FOUND).json({
    error: { message: `Route ${req.method} ${req.path} not found` },
  });
}
