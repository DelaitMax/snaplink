import { boolean, index, integer, pgTable, serial, text, timestamp, varchar } from "drizzle-orm/pg-core";
import { users } from "./users";

export const links = pgTable(
  "links",
  {
    id: serial("id").primaryKey(),

    // Public code used for the redirect: /:shortCode. Either generated, or
    // set by the user as a custom alias.
    shortCode: varchar("short_code", { length: 32 }).notNull().unique(),

    // Separate secret token for viewing link stats.
    // Not exposed, and not derived from shortCode's spelling.
    statsToken: varchar("stats_token", { length: 32 }).notNull().unique(),

    originalUrl: text("original_url").notNull(),

    isCustomAlias: boolean("is_custom_alias").notNull().default(false),

    // Manual deactivation (independent of TTL).
    isActive: boolean("is_active").notNull().default(true),

    // TTL: if set and the time has passed, the link is considered expired.
    expiresAt: timestamp("expires_at", { withTimezone: true }),

    // Owner is optional: anonymous link creation is supported, stats access
    // for everyone still goes through statsToken, and userId is a separate
    // access layer on top of it. If the user is deleted, the link is not
    // deleted with them — it just stops appearing in anyone's "my links".
    userId: integer("user_id").references(() => users.id, { onDelete: "set null" }),

    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [index("links_user_id_idx").on(table.userId)],
);

export type Link = typeof links.$inferSelect;
export type NewLink = typeof links.$inferInsert;
