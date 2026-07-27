import { Router } from "express";
import { redirectToOriginalUrl } from "@/controllers/redirect.controller";

export const redirectRouter = Router();

redirectRouter.get("/:code", redirectToOriginalUrl);
