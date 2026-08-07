import type { NextFunction, Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import { env } from "@/config/env";
import * as linksService from "@/services/links.service";
import * as clicksService from "@/services/clicks.service";
import { createLinkSchema, statsTokenParamSchema } from "@/schemas/links.schema";
import { parsePagination } from "@/utils/pagination";
import { toCsv } from "@/utils/csv";
import { AppError } from "@/utils/AppError";

function buildShareUrl(shortCode: string): string {
  return `${env.PUBLIC_BASE_URL.replace(/\/+$/, "")}/${shortCode}`;
}

function buildStatsUrl(statsToken: string): string {
  return `${env.PUBLIC_BASE_URL.replace(/\/+$/, "")}/api/links/${statsToken}/stats`;
}

export async function createLink(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const dto = createLinkSchema.parse(req.body);

    const ttlSeconds = dto.ttlSeconds ?? env.DEFAULT_LINK_TTL_SECONDS;

    const link = await linksService.createLink({
      url: dto.url,
      ...(dto.alias !== undefined ? { alias: dto.alias } : {}),
      ...(ttlSeconds !== undefined ? { ttlSeconds } : {}),
      ...(req.user !== undefined ? { userId: req.user.id } : {}),
    });

    res.status(StatusCodes.CREATED).json({
      shortCode: link.shortCode,
      shareUrl: buildShareUrl(link.shortCode),
      statsUrl: buildStatsUrl(link.statsToken),
      originalUrl: link.originalUrl,
      expiresAt: link.expiresAt,
      createdAt: link.createdAt,
    });
  } catch (err) {
    next(err);
  }
}

export async function myLinks(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    if (!req.user) {
      throw AppError.unauthorized("Authentication required", "NOT_AUTHENTICATED");
    }

    const { page, pageSize } = parsePagination(req.query);
    const result = await linksService.listMyLinks(req.user.id, page, pageSize);
    res.json(result);
  } catch (err) {
    next(err);
  }
}

export async function getLinkStats(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { token } = statsTokenParamSchema.parse(req.params);
    const link = await linksService.getLinkByStatsToken(token);
    const aggregates = await clicksService.getLinkStatsAggregates(link.id);

    res.json({
      shortCode: link.shortCode,
      shareUrl: buildShareUrl(link.shortCode),
      originalUrl: link.originalUrl,
      isActive: link.isActive,
      isCustomAlias: link.isCustomAlias,
      expiresAt: link.expiresAt,
      createdAt: link.createdAt,
      stats: {
        totalClicks: aggregates.totalClicks,
        clicksByDay: aggregates.clicksByDay,
        deviceBreakdown: aggregates.deviceBreakdown,
        browserBreakdown: aggregates.browserBreakdown,
        osBreakdown: aggregates.osBreakdown,
      },
    });
  } catch (err) {
    next(err);
  }
}

export async function deactivateLink(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { token } = statsTokenParamSchema.parse(req.params);
    const link = await linksService.deactivateLinkByStatsToken(token);

    res.json({
      shortCode: link.shortCode,
      isActive: link.isActive,
    });
  } catch (err) {
    next(err);
  }
}

export async function listClicks(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { token } = statsTokenParamSchema.parse(req.params);
    const { page, pageSize } = parsePagination(req.query);
    const link = await linksService.getLinkByStatsToken(token);

    const result = await clicksService.listClicksForLink(link.id, page, pageSize);
    res.json(result);
  } catch (err) {
    next(err);
  }
}

export async function exportClicks(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { token } = statsTokenParamSchema.parse(req.params);
    const link = await linksService.getLinkByStatsToken(token);

    const rows = await clicksService.listClicksForLinkExport(link.id);
    const csv = toCsv(rows, [
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
    res.setHeader("Content-Disposition", `attachment; filename="${link.shortCode}-clicks.csv"`);
    res.send(csv);
  } catch (err) {
    next(err);
  }
}
