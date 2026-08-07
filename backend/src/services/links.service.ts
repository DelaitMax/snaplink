import { StatusCodes } from "http-status-codes";
import { env } from "@/config/env";
import type { Link } from "@/db/schema";
import { cacheDel, cacheGet, cacheSet } from "@/lib/redis";
import {
  deactivateLink,
  findLinkByShortCode,
  findLinkByStatsToken,
  insertLink,
  listAllLinksPage,
  listLinksByUser,
  type LinkListRow,
  type MyLinkListRow,
} from "@/repositories/links.repository";
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

    const existing = await findLinkByShortCode(input.alias);
    if (existing) {
      throw AppError.conflict("This alias is already taken", "ALIAS_TAKEN");
    }

    shortCode = input.alias;
    isCustomAlias = true;
  } else {
    shortCode = await generateUniqueShortCode();
  }

  const expiresAt = input.ttlSeconds ? new Date(Date.now() + input.ttlSeconds * 1000) : null;

  const created = await insertLink({
    shortCode,
    statsToken: createStatsToken(),
    originalUrl: validatedUrl.toString(),
    isCustomAlias,
    expiresAt,
    ...(input.userId !== undefined ? { userId: input.userId } : {}),
  });

  if (!created) {
    throw new AppError("Failed to create link", StatusCodes.INTERNAL_SERVER_ERROR);
  }

  return created;
}

async function generateUniqueShortCode(): Promise<string> {
  for (let attempt = 0; attempt < MAX_SHORT_CODE_GENERATION_ATTEMPTS; attempt++) {
    const candidate = createShortCode();
    const existing = await findLinkByShortCode(candidate);
    if (!existing) return candidate;
  }
  throw new AppError("Could not generate a unique short code, please try again", StatusCodes.INTERNAL_SERVER_ERROR);
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
    const row = await findLinkByShortCode(shortCode);
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

    await cacheLinkForRedirect(cacheKey, link);
  }

  if (!isLinkUsable({ isActive: link.isActive, expiresAt: link.expiresAt ? new Date(link.expiresAt) : null })) {
    throw AppError.gone("This link is no longer active", "LINK_INACTIVE");
  }

  return link;
}

async function cacheLinkForRedirect(cacheKey: string, link: RedirectLink): Promise<void> {
  const expiresAt = link.expiresAt ? new Date(link.expiresAt) : null;

  if (!isLinkUsable({ isActive: link.isActive, expiresAt })) {
    return;
  }

  let ttlSeconds = env.REDIS_LINK_CACHE_TTL_SECONDS;
  if (expiresAt) {
    const secondsUntilExpiry = Math.floor((expiresAt.getTime() - Date.now()) / 1000);
    ttlSeconds = Math.max(1, Math.min(ttlSeconds, secondsUntilExpiry));
  }

  await cacheSet(cacheKey, JSON.stringify(link), ttlSeconds);
}

export async function getLinkByStatsToken(statsToken: string): Promise<Link> {
  const link = await findLinkByStatsToken(statsToken);
  if (!link) {
    throw AppError.notFound("Link not found", "LINK_NOT_FOUND");
  }
  return link;
}

export async function deactivateLinkByStatsToken(statsToken: string): Promise<Link> {
  const link = await getLinkByStatsToken(statsToken);

  const updated = await deactivateLink(link.id);
  if (!updated) {
    throw new AppError("Failed to deactivate link", StatusCodes.INTERNAL_SERVER_ERROR);
  }

  await cacheDel(redirectCacheKey(updated.shortCode));

  return updated;
}

export type LinkListItem = LinkListRow;
export type MyLinkListItem = MyLinkListRow;

export async function listMyLinks(
  userId: number,
  page: number,
  pageSize: number,
): Promise<PaginatedResult<MyLinkListItem>> {
  const { items, total } = await listLinksByUser(userId, pageSize, (page - 1) * pageSize);
  return buildPaginatedResult(items, total, page, pageSize);
}

export async function listAllLinks(page: number, pageSize: number): Promise<PaginatedResult<LinkListItem>> {
  const { items, total } = await listAllLinksPage(pageSize, (page - 1) * pageSize);
  return buildPaginatedResult(items, total, page, pageSize);
}
