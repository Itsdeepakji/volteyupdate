import { pgTable, text, jsonb, timestamp } from "drizzle-orm/pg-core";

export const contentSectionsTable = pgTable("content_sections", {
  key: text("key").primaryKey(),
  value: jsonb("value").notNull().default({}),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export type ContentSection = typeof contentSectionsTable.$inferSelect;
