import { boolean, index, integer, pgTable, serial, text, timestamp, varchar } from "drizzle-orm/pg-core";
import { links } from "./links";

export const clicks = pgTable(
  "clicks",
  {
    id: serial("id").primaryKey(),
    linkId: integer("link_id")
      .notNull()
      .references(() => links.id, { onDelete: "cascade" }),

    clickedAt: timestamp("clicked_at", { withTimezone: true }).notNull().defaultNow(),

    // IP уже "очищен" через getClientIp — либо реальный внешний IP, либо null.
    ip: varchar("ip", { length: 45 }),

    // Geo (ip-api.com или аналог). Нет данных/lookup не удался -> null.
    country: varchar("country", { length: 2 }),
    region: varchar("region", { length: 120 }),
    city: varchar("city", { length: 120 }),

    // ua-parser-js.
    browser: varchar("browser", { length: 60 }),
    browserVersion: varchar("browser_version", { length: 30 }),
    os: varchar("os", { length: 60 }),
    osVersion: varchar("os_version", { length: 30 }),
    // "desktop" | "mobile" | "tablet" | "other" — desktop не определяется ua-parser-js явно,
    // поэтому нормализуем в services/clicks.service.ts.
    deviceType: varchar("device_type", { length: 20 }).notNull().default("desktop"),

    // Бот/краулер по UA — не участвует в агрегированной статистике,
    // чтобы не искажать реальные показатели переходов.
    isBot: boolean("is_bot").notNull().default(false),

    userAgent: text("user_agent"),
  },
  (table) => [index("clicks_link_id_idx").on(table.linkId), index("clicks_clicked_at_idx").on(table.clickedAt)],
);

export type Click = typeof clicks.$inferSelect;
export type NewClick = typeof clicks.$inferInsert;
