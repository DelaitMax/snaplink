import { boolean, pgTable, serial, text, timestamp, varchar } from "drizzle-orm/pg-core";

export const links = pgTable("links", {
  id: serial("id").primaryKey(),

  // Публичный код для редиректа: /:shortCode. Либо сгенерирован, либо задан
  // пользователем как кастомный алиас.
  shortCode: varchar("short_code", { length: 32 }).notNull().unique(),

  // Отдельный секретный токен для просмотра статистики по ссылке.
  // Не выводится и не связан по написанию с shortCode.
  statsToken: varchar("stats_token", { length: 32 }).notNull().unique(),

  originalUrl: text("original_url").notNull(),

  isCustomAlias: boolean("is_custom_alias").notNull().default(false),

  // Ручная деактивация (независимо от TTL).
  isActive: boolean("is_active").notNull().default(true),

  // TTL: если задано и время прошло — ссылка считается истёкшей.
  expiresAt: timestamp("expires_at", { withTimezone: true }),

  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export type Link = typeof links.$inferSelect;
export type NewLink = typeof links.$inferInsert;
