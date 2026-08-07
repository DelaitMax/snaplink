import { CLICK_EXPORT_MAX_ROWS, STATS_WINDOW_DAYS, TOP_LINKS_LIMIT } from "@/constants";
import {
  getGlobalStats as getGlobalStatsRow,
  getLinkStatsAggregates as getLinkStatsAggregatesRow,
  insertClick,
  listClicksByLink,
  listClicksForExport as listClicksForExportRows,
  listClicksForLinkExport as listClicksForLinkExportRows,
  type ClickListRow,
} from "@/repositories/clicks.repository";
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

    let geo = null;
    if (input.ip && !bot) {
      const result = await lookupGeo(input.ip);
      if (result.ok) {
        geo = result.geo;
      } else if (result.reason === "provider_error") {
        // Provider is down/erroring — record the click anyway, just without
        // geo data, but make the degradation visible instead of silently
        // treating it the same as "no geo data available".
        logger.warn("Geo provider unavailable, recording click without geo data", { linkId: input.linkId });
      }
      // reason === "not_found": expected (e.g. private IP), nothing to log.
    }

    await insertClick({
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

export type ClickListItem = ClickListRow;

export async function listClicksForLink(
  linkId: number,
  page: number,
  pageSize: number,
): Promise<PaginatedResult<ClickListItem>> {
  const { items, total } = await listClicksByLink(linkId, pageSize, (page - 1) * pageSize);
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

export interface BrowserBreakdown {
  browser: string | null;
  count: number;
}

export interface OsBreakdown {
  os: string | null;
  count: number;
}

export interface LinkStatsAggregates {
  totalClicks: number;
  clicksByDay: ClickByDay[];
  deviceBreakdown: DeviceBreakdown[];
  browserBreakdown: BrowserBreakdown[];
  osBreakdown: OsBreakdown[];
}

export async function getLinkStatsAggregates(
  linkId: number,
  sinceDays: number = STATS_WINDOW_DAYS,
): Promise<LinkStatsAggregates> {
  const since = new Date(Date.now() - sinceDays * 24 * 60 * 60 * 1000);
  return getLinkStatsAggregatesRow(linkId, since);
}

export interface GlobalStats {
  totalLinks: number;
  totalClicks: number;
  clicksByDay: ClickByDay[];
  deviceBreakdown: DeviceBreakdown[];
  browserBreakdown: BrowserBreakdown[];
  osBreakdown: OsBreakdown[];
  topLinks: Array<{ shortCode: string; originalUrl: string; clicks: number }>;
}

export async function getGlobalStats(
  sinceDays: number = STATS_WINDOW_DAYS,
  topLinksLimit: number = TOP_LINKS_LIMIT,
): Promise<GlobalStats> {
  const since = new Date(Date.now() - sinceDays * 24 * 60 * 60 * 1000);
  return getGlobalStatsRow(since, topLinksLimit);
}

export interface ClickExportRow extends ClickListItem {
  shortCode: string;
}

export async function listClicksForExport(maxRows: number = CLICK_EXPORT_MAX_ROWS): Promise<ClickExportRow[]> {
  return listClicksForExportRows(maxRows);
}

export async function listClicksForLinkExport(
  linkId: number,
  maxRows: number = CLICK_EXPORT_MAX_ROWS,
): Promise<ClickListItem[]> {
  return listClicksForLinkExportRows(linkId, maxRows);
}
