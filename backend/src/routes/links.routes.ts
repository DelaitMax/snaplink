import { Router } from "express";
import { createLink, deactivateLink, exportClicks, getLinkStats, listClicks } from "@/controllers/links.controller";

export const linksRouter = Router();

linksRouter.post("/", createLink);
linksRouter.get("/:token/stats", getLinkStats);
linksRouter.get("/:token/clicks", listClicks);
linksRouter.get("/:token/clicks/export", exportClicks);
linksRouter.post("/:token/deactivate", deactivateLink);
