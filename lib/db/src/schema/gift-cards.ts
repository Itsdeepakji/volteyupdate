import { pgTable, text, uuid, timestamp, numeric } from "drizzle-orm/pg-core";
import { z } from "zod/v4";

export const giftCardsTable = pgTable("gift_cards", {
  id: uuid("id").primaryKey().defaultRandom(),
  code: text("code").notNull().unique(),
  amount: numeric("amount", { precision: 10, scale: 2 }).notNull(),
  balance: numeric("balance", { precision: 10, scale: 2 }).notNull(),
  theme: text("theme").notNull().default("Default"),
  recipientName: text("recipient_name"),
  recipientEmail: text("recipient_email"),
  personalMessage: text("personal_message"),
  status: text("status").notNull().default("active"),
  redeemedAt: timestamp("redeemed_at", { withTimezone: true }),
  sentAt: timestamp("sent_at", { withTimezone: true }),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export type GiftCard = typeof giftCardsTable.$inferSelect;
export type _z = typeof z;
