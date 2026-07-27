import { and, count, desc, eq, gte, sql } from "drizzle-orm";
import { db } from "@/db/client";
import { clicks, links } from "@/db/schema";
import { lookupGeo } from "./geo.service";
import { parseUserAgent } from "@/utils/userAgent";
import { logger } from "@/utils/logger";
import { buildPaginatedResult, type PaginatedResult } from "@/utils/pagination";

export interface RecordClickInput {
  linkId: number;
  ip: string | null;
  userAgent: string | undefined;
}

export async function recordClick(input: RecordClickInput): Promise<void> {
  try {
    const ua = input.userAgent ? parseUserAgent(input.userAgent) : null;
    const bot = ua?.isBot ?? false;

    const geo = input.ip && !bot ? await lookupGeo(input.ip) : null;

    await db.insert(clicks).values({
      linkId: input.linkId,
      ip: input.ip,
      country: geo?.countryCode ?? null,
      region: geo?.region ?? null,
      city: geo?.city ?? null,
      browser: ua?.browser ?? null,
      browserVersion: ua?.browserVersion ?? null,
      os: ua?.os ?? null,
      osVersion: ua?.osVersion ?? null,
      deviceType: ua?.deviceType ?? "desktop",
      isBot: bot,
      userAgent: input.userAgent ?? null,
    });
  } catch (err) {
    logger.error("Failed to record click", { error: err instanceof Error ? err.message : String(err) });
  }
}

export interface ClickListItem {
  clickedAt: Date;
  country: string | null;
  region: string | null;
  city: string | null;
  browser: string | null;
  browserVersion: string | null;
  os: string | null;
  osVersion: string | null;
  deviceType: string;
}

const CLICK_LIST_COLUMNS = {
  clickedAt: clicks.clickedAt,
  country: clicks.country,
  region: clicks.region,
  city: clicks.city,
  browser: clicks.browser,
  browserVersion: clicks.browserVersion,
  os: clicks.os,
  osVersion: clicks.osVersion,
  deviceType: clicks.deviceType,
} as const;

export async function listClicksForLink(
  linkId: number,
  page: number,
  pageSize: number,
): Promise<PaginatedResult<ClickListItem>> {
  const where = and(eq(clicks.linkId, linkId), eq(clicks.isBot, false));

  const [items, [{ total }]] = await Promise.all([
    db
      .select(CLICK_LIST_COLUMNS)
      .from(clicks)
      .where(where)
      .orderBy(desc(clicks.clickedAt))
      .limit(pageSize)
      .offset((page - 1) * pageSize),
    db.select({ total: count() }).from(clicks).where(where),
  ]);

  return buildPaginatedResult(items, total, page, pageSize);
}

export interface ClickByDay {
  day: string;
  count: number;
}

export interface DeviceBreakdown {
  deviceType: string;
  count: number;
}

export interface LinkStatsAggregates {
  totalClicks: number;
  clicksByDay: ClickByDay[];
  deviceBreakdown: DeviceBreakdown[];
}

const DAY_TRUNC = sql`date_trunc('day', ${clicks.clickedAt})`;

export async function getLinkStatsAggregates(linkId: number, sinceDays = 30): Promise<LinkStatsAggregates> {
  const since = new Date(Date.now() - sinceDays * 24 * 60 * 60 * 1000);
  const baseWhere = and(eq(clicks.linkId, linkId), eq(clicks.isBot, false));

  const [totalRow, byDayRows, deviceRows] = await Promise.all([
    db.select({ total: count() }).from(clicks).where(baseWhere),
    db
      .select({ day: sql<string>`to_char(${DAY_TRUNC}, 'YYYY-MM-DD')`, count: count() })
      .from(clicks)
      .where(and(baseWhere, gte(clicks.clickedAt, since)))
      .groupBy(DAY_TRUNC)
      .orderBy(DAY_TRUNC),
    db
      .select({ deviceType: clicks.deviceType, count: count() })
      .from(clicks)
      .where(baseWhere)
      .groupBy(clicks.deviceType),
  ]);

  return {
    totalClicks: totalRow[0].total,
    clicksByDay: byDayRows,
    deviceBreakdown: deviceRows,
  };
}

export interface GlobalStats {
  totalLinks: number;
  totalClicks: number;
  clicksByDay: ClickByDay[];
  deviceBreakdown: DeviceBreakdown[];
  topLinks: Array<{ shortCode: string; originalUrl: string; clicks: number }>;
}

export async function getGlobalStats(sinceDays = 30, topLinksLimit = 10): Promise<GlobalStats> {
  const since = new Date(Date.now() - sinceDays * 24 * 60 * 60 * 1000);
  const nonBot = eq(clicks.isBot, false);

  const [totalLinksRow, totalClicksRow, byDayRows, deviceRows, topLinksRows] = await Promise.all([
    db.select({ total: count() }).from(links),
    db.select({ total: count() }).from(clicks).where(nonBot),
    db
      .select({ day: sql<string>`to_char(${DAY_TRUNC}, 'YYYY-MM-DD')`, count: count() })
      .from(clicks)
      .where(and(nonBot, gte(clicks.clickedAt, since)))
      .groupBy(DAY_TRUNC)
      .orderBy(DAY_TRUNC),
    db.select({ deviceType: clicks.deviceType, count: count() }).from(clicks).where(nonBot).groupBy(clicks.deviceType),
    db
      .select({
        shortCode: links.shortCode,
        originalUrl: links.originalUrl,
        clicks: count(clicks.id),
      })
      .from(links)
      .leftJoin(clicks, and(eq(clicks.linkId, links.id), nonBot))
      .groupBy(links.id, links.shortCode, links.originalUrl)
      .orderBy(desc(count(clicks.id)))
      .limit(topLinksLimit),
  ]);

  return {
    totalLinks: totalLinksRow[0].total,
    totalClicks: totalClicksRow[0].total,
    clicksByDay: byDayRows,
    deviceBreakdown: deviceRows,
    topLinks: topLinksRows,
  };
}

export interface ClickExportRow extends ClickListItem {
  shortCode: string;
}

export async function listClicksForExport(maxRows = 50_000): Promise<ClickExportRow[]> {
  return db
    .select({ ...CLICK_LIST_COLUMNS, shortCode: links.shortCode })
    .from(clicks)
    .innerJoin(links, eq(clicks.linkId, links.id))
    .where(eq(clicks.isBot, false))
    .orderBy(desc(clicks.clickedAt))
    .limit(maxRows);
}

export async function listClicksForLinkExport(linkId: number, maxRows = 50_000): Promise<ClickListItem[]> {
  return db
    .select(CLICK_LIST_COLUMNS)
    .from(clicks)
    .where(and(eq(clicks.linkId, linkId), eq(clicks.isBot, false)))
    .orderBy(desc(clicks.clickedAt))
    .limit(maxRows);
}
