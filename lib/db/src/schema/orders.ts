import { pgTable, text, serial, integer, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const ordersTable = pgTable("orders", {
  id: serial("id").primaryKey(),
  transactionId: text("transaction_id").notNull().unique(),
  orderNo: text("order_no"),
  customerEmail: text("customer_email").notNull(),
  packageCode: text("package_code").notNull(),
  packageName: text("package_name").notNull(),
  price: integer("price").notNull(),
  quantity: integer("quantity").notNull().default(1),
  status: text("status").notNull().default("pending"),
  esimProfiles: jsonb("esim_profiles").$type<EsimProfileData[]>().default([]),
  emailSent: text("email_sent").notNull().default("false"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export interface EsimProfileData {
  iccid: string;
  ac?: string;
  qrCodeUrl?: string;
  smdpAddress?: string;
  matchingId?: string;
}

export const insertOrderSchema = createInsertSchema(ordersTable).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type InsertOrder = z.infer<typeof insertOrderSchema>;
export type Order = typeof ordersTable.$inferSelect;
