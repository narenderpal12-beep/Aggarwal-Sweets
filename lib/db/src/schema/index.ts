import { pgTable, text, integer, real, jsonb, timestamp, boolean } from "drizzle-orm/pg-core";

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

// ─── Blog Posts ───────────────────────────────────────────────────────────────
export const blogPostsTable = pgTable("blog_posts", {
  id:       text("id").primaryKey(),
  slug:     text("slug").notNull(),
  title:    text("title").notNull(),
  excerpt:  text("excerpt").notNull().default(""),
  date:     text("date").notNull(),
  readTime: text("read_time").notNull().default("3 min"),
  category: text("category").notNull().default("General"),
  image:    text("image").notNull().default("/hero-mithai.jpg"),
  body:     jsonb("body").$type<string[]>().notNull().default([]),
});

// ─── Coupon Codes ─────────────────────────────────────────────────────────────
export const couponCodesTable = pgTable("coupon_codes", {
  code:        text("code").primaryKey(),
  type:        text("type").notNull().default("percent"),   // 'percent' | 'amount'
  value:       integer("value").notNull(),
  minOrder:    integer("min_order").notNull().default(0),
  active:      boolean("active").notNull().default(true),
  description: text("description").notNull().default(""),
});

// ─── Product Reviews ──────────────────────────────────────────────────────────
export const productReviewsTable = pgTable("product_reviews", {
  id:           text("id").primaryKey(),
  productId:    text("product_id").notNull(),
  customerName: text("customer_name").notNull(),
  rating:       integer("rating").notNull().default(5),
  comment:      text("comment").notNull().default(""),
  approved:     boolean("approved").notNull().default(false),
  createdAt:    timestamp("created_at").notNull().defaultNow(),
});

export type DbProduct       = typeof productsTable.$inferSelect;
export type DbOrder         = typeof ordersTable.$inferSelect;
export type DbCustomer      = typeof customersTable.$inferSelect;
export type DbBlogPost      = typeof blogPostsTable.$inferSelect;
export type DbCoupon        = typeof couponCodesTable.$inferSelect;
export type DbProductReview = typeof productReviewsTable.$inferSelect;
