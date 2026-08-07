import { and, count, desc, eq } from "drizzle-orm";
import { db } from "@/db/client";
import { clicks as clicksTable, links } from "@/db/schema";
import type { Link, NewLink } from "@/db/schema";

export async function findLinkByShortCode(shortCode: string): Promise<Link | null> {
  return (await db.query.links.findFirst({ where: eq(links.shortCode, shortCode) })) ?? null;
}

export async function findLinkByStatsToken(statsToken: string): Promise<Link | null> {
  return (await db.query.links.findFirst({ where: eq(links.statsToken, statsToken) })) ?? null;
}

export async function insertLink(values: NewLink): Promise<Link | null> {
  const [created] = await db.insert(links).values(values).returning();
  return created ?? null;
}

export async function deactivateLink(id: number): Promise<Link | null> {
  const [updated] = await db
    .update(links)
    .set({ isActive: false, updatedAt: new Date() })
    .where(eq(links.id, id))
    .returning();
  return updated ?? null;
}

const LINK_LIST_BASE_COLUMNS = {
  id: links.id,
  shortCode: links.shortCode,
  originalUrl: links.originalUrl,
  isActive: links.isActive,
  isCustomAlias: links.isCustomAlias,
  expiresAt: links.expiresAt,
  createdAt: links.createdAt,
  clicks: count(clicksTable.id),
} as const;

const MY_LINK_LIST_COLUMNS = {
  ...LINK_LIST_BASE_COLUMNS,
  statsToken: links.statsToken,
} as const;

export interface LinkListRow {
  id: number;
  shortCode: string;
  originalUrl: string;
  isActive: boolean;
  isCustomAlias: boolean;
  expiresAt: Date | null;
  createdAt: Date;
  clicks: number;
}

export interface MyLinkListRow extends LinkListRow {
  statsToken: string;
}

export async function listLinksByUser(
  userId: number,
  limit: number,
  offset: number,
): Promise<{ items: MyLinkListRow[]; total: number }> {
  const where = eq(links.userId, userId);

  const [items, totalRow] = await Promise.all([
    db
      .select(MY_LINK_LIST_COLUMNS)
      .from(links)
      .leftJoin(clicksTable, and(eq(clicksTable.linkId, links.id), eq(clicksTable.isBot, false)))
      .where(where)
      .groupBy(links.id)
      .orderBy(desc(links.id))
      .limit(limit)
      .offset(offset),
    db.select({ total: count() }).from(links).where(where),
  ]);

  return { items, total: totalRow[0]?.total ?? 0 };
}

export async function listAllLinksPage(
  limit: number,
  offset: number,
): Promise<{ items: LinkListRow[]; total: number }> {
  const [items, totalRow] = await Promise.all([
    db
      .select(LINK_LIST_BASE_COLUMNS)
      .from(links)
      .leftJoin(clicksTable, and(eq(clicksTable.linkId, links.id), eq(clicksTable.isBot, false)))
      .groupBy(links.id)
      .orderBy(desc(links.id))
      .limit(limit)
      .offset(offset),
    db.select({ total: count() }).from(links),
  ]);

  return { items, total: totalRow[0]?.total ?? 0 };
}
