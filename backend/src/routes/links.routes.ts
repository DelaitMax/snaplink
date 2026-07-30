import { Router } from "express";
import {
  createLink,
  deactivateLink,
  exportClicks,
  getLinkStats,
  listClicks,
  myLinks,
} from "@/controllers/links.controller";
import { optionalAuth, requireAuth } from "@/middleware/auth.middleware";

export const linksRouter = Router();

linksRouter.post("/", optionalAuth, createLink);
linksRouter.get("/mine", requireAuth, myLinks);
linksRouter.get("/:token/stats", getLinkStats);
linksRouter.get("/:token/clicks", listClicks);
linksRouter.get("/:token/clicks/export", exportClicks);
linksRouter.post("/:token/deactivate", deactivateLink);
