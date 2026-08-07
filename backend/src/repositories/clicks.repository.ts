import { and, count, desc, eq, gte, sql } from "drizzle-orm";
import { db } from "@/db/client";
import { clicks, links } from "@/db/schema";
import type { NewClick } from "@/db/schema";

export async function insertClick(values: NewClick): Promise<void> {
  await db.insert(clicks).values(values);
}

export interface ClickListRow {
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

// COUNT(*) with no GROUP BY always returns exactly one row, but with
// noUncheckedIndexedAccess array indexing is typed as T | undefined —
// this helper reads the value instead of an unsafe rows[0].total.
function totalOf(rows: Array<{ total: number }>): number {
  return rows[0]?.total ?? 0;
}

export async function listClicksByLink(
  linkId: number,
  limit: number,
  offset: number,
): Promise<{ items: ClickListRow[]; total: number }> {
  const where = and(eq(clicks.linkId, linkId), eq(clicks.isBot, false));

  const [items, totalRow] = await Promise.all([
    db
      .select(CLICK_LIST_COLUMNS)
      .from(clicks)
      .where(where)
      .orderBy(desc(clicks.clickedAt))
      .limit(limit)
      .offset(offset),
    db.select({ total: count() }).from(clicks).where(where),
  ]);

  return { items, total: totalOf(totalRow) };
}

export interface ClickByDayRow {
  day: string;
  count: number;
}

export interface DeviceBreakdownRow {
  deviceType: string;
  count: number;
}

export interface BrowserBreakdownRow {
  browser: string | null;
  count: number;
}

export interface OsBreakdownRow {
  os: string | null;
  count: number;
}

export interface ClickAggregatesRow {
  totalClicks: number;
  clicksByDay: ClickByDayRow[];
  deviceBreakdown: DeviceBreakdownRow[];
  browserBreakdown: BrowserBreakdownRow[];
  osBreakdown: OsBreakdownRow[];
}

const DAY_TRUNC = sql`date_trunc('day', ${clicks.clickedAt})`;

export async function getLinkStatsAggregates(linkId: number, since: Date): Promise<ClickAggregatesRow> {
  const baseWhere = and(eq(clicks.linkId, linkId), eq(clicks.isBot, false));

  const [totalRow, byDayRows, deviceRows, browserRows, osRows] = await Promise.all([
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
    db
      .select({ browser: clicks.browser, count: count() })
      .from(clicks)
      .where(baseWhere)
      .groupBy(clicks.browser)
      .orderBy(desc(count())),
    db
      .select({ os: clicks.os, count: count() })
      .from(clicks)
      .where(baseWhere)
      .groupBy(clicks.os)
      .orderBy(desc(count())),
  ]);

  return {
    totalClicks: totalOf(totalRow),
    clicksByDay: byDayRows,
    deviceBreakdown: deviceRows,
    browserBreakdown: browserRows,
    osBreakdown: osRows,
  };
}

export interface GlobalStatsRow extends ClickAggregatesRow {
  totalLinks: number;
  topLinks: Array<{ shortCode: string; originalUrl: string; clicks: number }>;
}

export async function getGlobalStats(since: Date, topLinksLimit: number): Promise<GlobalStatsRow> {
  const nonBot = eq(clicks.isBot, false);

  const [totalLinksRow, totalClicksRow, byDayRows, deviceRows, browserRows, osRows, topLinksRows] = await Promise.all(
    [
      db.select({ total: count() }).from(links),
      db.select({ total: count() }).from(clicks).where(nonBot),
      db
        .select({ day: sql<string>`to_char(${DAY_TRUNC}, 'YYYY-MM-DD')`, count: count() })
        .from(clicks)
        .where(and(nonBot, gte(clicks.clickedAt, since)))
        .groupBy(DAY_TRUNC)
        .orderBy(DAY_TRUNC),
      db
        .select({ deviceType: clicks.deviceType, count: count() })
        .from(clicks)
        .where(nonBot)
        .groupBy(clicks.deviceType),
      db
        .select({ browser: clicks.browser, count: count() })
        .from(clicks)
        .where(nonBot)
        .groupBy(clicks.browser)
        .orderBy(desc(count())),
      db.select({ os: clicks.os, count: count() }).from(clicks).where(nonBot).groupBy(clicks.os).orderBy(desc(count())),
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
    ],
  );

  return {
    totalLinks: totalOf(totalLinksRow),
    totalClicks: totalOf(totalClicksRow),
    clicksByDay: byDayRows,
    deviceBreakdown: deviceRows,
    browserBreakdown: browserRows,
    osBreakdown: osRows,
    topLinks: topLinksRows,
  };
}

export interface ClickExportRow extends ClickListRow {
  shortCode: string;
}

export async function listClicksForExport(maxRows: number): Promise<ClickExportRow[]> {
  return db
    .select({ ...CLICK_LIST_COLUMNS, shortCode: links.shortCode })
    .from(clicks)
    .innerJoin(links, eq(clicks.linkId, links.id))
    .where(eq(clicks.isBot, false))
    .orderBy(desc(clicks.clickedAt))
    .limit(maxRows);
}

export async function listClicksForLinkExport(linkId: number, maxRows: number): Promise<ClickListRow[]> {
  return db
    .select(CLICK_LIST_COLUMNS)
    .from(clicks)
    .where(and(eq(clicks.linkId, linkId), eq(clicks.isBot, false)))
    .orderBy(desc(clicks.clickedAt))
    .limit(maxRows);
}
