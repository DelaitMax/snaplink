import type { NextFunction, Request, Response } from "express";
import * as linksService from "@/services/links.service";
import * as clicksService from "@/services/clicks.service";
import { parsePagination } from "@/utils/pagination";
import { toCsv } from "@/utils/csv";

export async function listLinks(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { page, pageSize } = parsePagination(req.query);
    const result = await linksService.listAllLinks(page, pageSize);
    res.json(result);
  } catch (err) {
    next(err);
  }
}

export async function globalStats(_req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const stats = await clicksService.getGlobalStats();
    res.json(stats);
  } catch (err) {
    next(err);
  }
}

export async function exportGlobalClicks(_req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const rows = await clicksService.listClicksForExport();
    const csv = toCsv(rows, [
      "shortCode",
      "clickedAt",
      "country",
      "region",
      "city",
      "browser",
      "browserVersion",
      "os",
      "osVersion",
      "deviceType",
    ]);

    res.setHeader("Content-Type", "text/csv; charset=utf-8");
    res.setHeader("Content-Disposition", 'attachment; filename="clicks-export.csv"');
    res.send(csv);
  } catch (err) {
    next(err);
  }
}
