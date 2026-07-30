import { Router } from "express";
import { requireAdmin, requireAuth } from "@/middleware/auth.middleware";
import { exportGlobalClicks, globalStats, listLinks } from "@/controllers/admin.controller";

export const adminRouter = Router();

adminRouter.use(requireAuth, requireAdmin);

adminRouter.get("/links", listLinks);
adminRouter.get("/stats", globalStats);
adminRouter.get("/stats/export", exportGlobalClicks);
