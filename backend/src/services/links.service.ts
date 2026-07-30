import { and, count, desc, eq } from "drizzle-orm";
import { db } from "@/db/client";
import { clicks as clicksTable, links } from "@/db/schema";
import type { Link } from "@/db/schema";
import { env } from "@/config/env";
import { cacheDel, cacheGet, cacheSet } from "@/lib/redis";
import { AppError } from "@/utils/AppError";
import { buildPaginatedResult, type PaginatedResult } from "@/utils/pagination";
import { createShortCode, createStatsToken, isReservedAlias, isValidAlias } from "@/utils/shortCode";
import { assertSafeUrl, UnsafeUrlError } from "@/utils/urlSafety";

export interface CreateLinkInput {
  url: string;
  alias?: string;
  ttlSeconds?: number;
  userId?: number;
}

export interface CreateLinkResult {
  shortCode: string;
  statsToken: string;
  originalUrl: string;
  expiresAt: Date | null;
  createdAt: Date;
}

const MAX_SHORT_CODE_GENERATION_ATTEMPTS = 5;

export async function createLink(input: CreateLinkInput): Promise<CreateLinkResult> {
  let validatedUrl: URL;
  try {
    validatedUrl = await assertSafeUrl(input.url);
  } catch (err) {
    if (err instanceof UnsafeUrlError) {
      throw AppError.badRequest(err.message, "INVALID_URL");
    }
    throw err;
  }

  let shortCode: string;
  let isCustomAlias = false;

  if (input.alias) {
    if (isReservedAlias(input.alias)) {
      throw AppError.badRequest("This alias is reserved and cannot be used", "RESERVED_ALIAS");
    }
    if (!isValidAlias(input.alias)) {
      throw AppError.badRequest(
        "Alias must be 3-32 characters long and contain only letters, digits, '_' or '-'",
        "INVALID_ALIAS",
      );
    }

    const existing = await db.query.links.findFirst({
      where: eq(links.shortCode, input.alias),
    });
    if (existing) {
      throw AppError.conflict("This alias is already taken", "ALIAS_TAKEN");
    }

    shortCode = input.alias;
    isCustomAlias = true;
  } else {
    shortCode = await generateUniqueShortCode();
  }

  const expiresAt = input.ttlSeconds ? new Date(Date.now() + input.ttlSeconds * 1000) : null;

  const [created] = await db
    .insert(links)
    .values({
      shortCode,
      statsToken: createStatsToken(),
      originalUrl: validatedUrl.toString(),
      isCustomAlias,
      expiresAt,
      ...(input.userId !== undefined ? { userId: input.userId } : {}),
    })
    .returning();

  if (!created) {
    throw new AppError("Failed to create link", 500);
  }

  return created;
}

async function generateUniqueShortCode(): Promise<string> {
  for (let attempt = 0; attempt < MAX_SHORT_CODE_GENERATION_ATTEMPTS; attempt++) {
    const candidate = createShortCode();
    const existing = await db.query.links.findFirst({
      where: eq(links.shortCode, candidate),
    });
    if (!existing) return candidate;
  }
  throw new AppError("Could not generate a unique short code, please try again", 500);
}

function isLinkUsable(link: Pick<Link, "isActive" | "expiresAt">): boolean {
  if (!link.isActive) return false;
  if (link.expiresAt && link.expiresAt.getTime() <= Date.now()) return false;
  return true;
}

export interface RedirectLink {
  id: number;
  shortCode: string;
  originalUrl: string;
  isActive: boolean;
  expiresAt: string | null;
}

export function redirectCacheKey(shortCode: string): string {
  return `link:redirect:${shortCode}`;
}

export async function resolveLinkForRedirect(shortCode: string): Promise<RedirectLink> {
  const cacheKey = redirectCacheKey(shortCode);
  const cached = await cacheGet(cacheKey);

  let link: RedirectLink | null = null;

  if (cached) {
    try {
      link = JSON.parse(cached) as RedirectLink;
    } catch {
      link = null;
    }
  }

  if (!link) {
    const row = await db.query.links.findFirst({ where: eq(links.shortCode, shortCode) });
    if (!row) {
      throw AppError.notFound("Short link not found", "LINK_NOT_FOUND");
    }

    link = {
      id: row.id,
      shortCode: row.shortCode,
      originalUrl: row.originalUrl,
      isActive: row.isActive,
      expiresAt: row.expiresAt ? row.expiresAt.toISOString() : null,
    };

    await cacheSet(cacheKey, JSON.stringify(link), env.REDIS_LINK_CACHE_TTL_SECONDS);
  }

  if (!isLinkUsable({ isActive: link.isActive, expiresAt: link.expiresAt ? new Date(link.expiresAt) : null })) {
    throw AppError.gone("This link is no longer active", "LINK_INACTIVE");
  }

  return link;
}

export async function getLinkByStatsToken(statsToken: string): Promise<Link> {
  const link = await db.query.links.findFirst({ where: eq(links.statsToken, statsToken) });
  if (!link) {
    throw AppError.notFound("Link not found", "LINK_NOT_FOUND");
  }
  return link;
}

export async function deactivateLinkByStatsToken(statsToken: string): Promise<Link> {
  const link = await getLinkByStatsToken(statsToken);

  const [updated] = await db
    .update(links)
    .set({ isActive: false, updatedAt: new Date() })
    .where(eq(links.id, link.id))
    .returning();

  if (!updated) {
    throw new AppError("Failed to deactivate link", 500);
  }

  await cacheDel(redirectCacheKey(updated.shortCode));

  return updated;
}

export interface LinkListItem {
  id: number;
  shortCode: string;
  originalUrl: string;
  isActive: boolean;
  isCustomAlias: boolean;
  expiresAt: Date | null;
  createdAt: Date;
  clicks: number;
}

export interface MyLinkListItem extends LinkListItem {
  statsToken: string;
}

export async function listMyLinks(
  userId: number,
  page: number,
  pageSize: number,
): Promise<PaginatedResult<MyLinkListItem>> {
  const where = eq(links.userId, userId);

  const [items, totalRow] = await Promise.all([
    db
      .select({
        id: links.id,
        shortCode: links.shortCode,
        statsToken: links.statsToken,
        originalUrl: links.originalUrl,
        isActive: links.isActive,
        isCustomAlias: links.isCustomAlias,
        expiresAt: links.expiresAt,
        createdAt: links.createdAt,
        clicks: count(clicksTable.id),
      })
      .from(links)
      .leftJoin(clicksTable, and(eq(clicksTable.linkId, links.id), eq(clicksTable.isBot, false)))
      .where(where)
      .groupBy(links.id)
      .orderBy(desc(links.id))
      .limit(pageSize)
      .offset((page - 1) * pageSize),
    db.select({ total: count() }).from(links).where(where),
  ]);

  return buildPaginatedResult(items, totalRow[0]?.total ?? 0, page, pageSize);
}

export async function listAllLinks(page: number, pageSize: number): Promise<PaginatedResult<LinkListItem>> {
  const [items, totalRow] = await Promise.all([
    db
      .select({
        id: links.id,
        shortCode: links.shortCode,
        originalUrl: links.originalUrl,
        isActive: links.isActive,
        isCustomAlias: links.isCustomAlias,
        expiresAt: links.expiresAt,
        createdAt: links.createdAt,
        clicks: count(clicksTable.id),
      })
      .from(links)
      .leftJoin(clicksTable, and(eq(clicksTable.linkId, links.id), eq(clicksTable.isBot, false)))
      .groupBy(links.id)
      .orderBy(desc(links.id))
      .limit(pageSize)
      .offset((page - 1) * pageSize),
    db.select({ total: count() }).from(links),
  ]);

  return buildPaginatedResult(items, totalRow[0]?.total ?? 0, page, pageSize);
}
