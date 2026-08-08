import { pgTable, text, integer, real, jsonb, timestamp } from "drizzle-orm/pg-core";

// ─── Products ─────────────────────────────────────────────────────────────────
export const productsTable = pgTable("products", {
  id:          text("id").primaryKey(),
  name:        text("name").notNull(),
  category:    text("category").notNull(),
  price:       integer("price").notNull(),
  unit:        text("unit").notNull(),
  badge:       text("badge"),
  description: text("description").notNull().default(""),
  image:       text("image").notNull().default("/hero-mithai.jpg"),
  rating:      real("rating").notNull().default(4.5),
  reviews:     integer("reviews").notNull().default(0),
  tags:        jsonb("tags").$type<string[]>().notNull().default([]),
  variants:    jsonb("variants").$type<Array<{ material: string; weight: string; price: number }>>().notNull().default([]),
});

// ─── Orders ───────────────────────────────────────────────────────────────────
export const ordersTable = pgTable("orders", {
  id:            text("id").primaryKey(),
  date:          text("date").notNull(),
  phone:         text("phone").notNull(),
  address:       text("address").notNull(),
  subtotal:      integer("subtotal").notNull(),
  status:        text("status").notNull().default("Confirmed"),
  customerEmail: text("customer_email"),
  items:         jsonb("items").notNull().default([]),
});

// ─── Customers ────────────────────────────────────────────────────────────────
export const customersTable = pgTable("customers", {
  email:    text("email").primaryKey(),
  name:     text("name"),
  joinedAt: timestamp("joined_at").notNull().defaultNow(),
});

// ─── Admin Settings ───────────────────────────────────────────────────────────
export const adminSettingsTable = pgTable("admin_settings", {
  key:   text("key").primaryKey(),
  value: text("value").notNull(),
});

export type DbProduct  = typeof productsTable.$inferSelect;
export type DbOrder    = typeof ordersTable.$inferSelect;
export type DbCustomer = typeof customersTable.$inferSelect;
