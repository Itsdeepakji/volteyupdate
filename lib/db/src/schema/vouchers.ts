import { pgTable, text, uuid, integer, boolean, timestamp, numeric } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const vouchersTable = pgTable("vouchers", {
  id: uuid("id").primaryKey().defaultRandom(),
  code: text("code").notNull().unique(),
  description: text("description"),
  discountType: text("discount_type").notNull().default("percentage"),
  discountValue: numeric("discount_value", { precision: 10, scale: 2 }).notNull(),
  status: text("status").notNull().default("active"),
  minPurchaseAmount: numeric("min_purchase_amount", { precision: 10, scale: 2 }).notNull().default("0"),
  maxDiscountCap: numeric("max_discount_cap", { precision: 10, scale: 2 }),
  totalUsageLimit: integer("total_usage_limit"),
  perUserLimit: integer("per_user_limit").notNull().default(1),
  validFrom: timestamp("valid_from", { withTimezone: true }).notNull(),
  validUntil: timestamp("valid_until", { withTimezone: true }).notNull(),
  firstTimeOnly: boolean("first_time_only").notNull().default(false),
  stackable: boolean("stackable").notNull().default(false),
  usageCount: integer("usage_count").notNull().default(0),
  totalDiscountGiven: numeric("total_discount_given", { precision: 10, scale: 2 }).notNull().default("0"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const insertVoucherSchema = createInsertSchema(vouchersTable).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  usageCount: true,
  totalDiscountGiven: true,
});

export type InsertVoucher = z.infer<typeof insertVoucherSchema>;
export type Voucher = typeof vouchersTable.$inferSelect;
