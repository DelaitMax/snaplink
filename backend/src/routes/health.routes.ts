import { Router } from "express";
import { StatusCodes } from "http-status-codes";

export const healthRouter = Router();

healthRouter.get("/", (_req, res) => {
  res.status(StatusCodes.OK).json({ status: "ok", timestamp: new Date().toISOString() });
});
