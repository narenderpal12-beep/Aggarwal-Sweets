import { pgTable, text, integer, real, jsonb, timestamp, boolean, serial } from "drizzle-orm/pg-core";

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
  active:      boolean("active").notNull().default(true),
  schedule:    jsonb("schedule").$type<Array<{ day: number; start: string; end: string }> | null>(),
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
  customerName:  text("customer_name"),
  receiverName:  text("receiver_name"),
  deliveryRemarks: text("delivery_remarks"),
  deliveryContact: text("delivery_contact"),
  items:         jsonb("items").notNull().default([]),
  pricing:       jsonb("pricing").$type<Record<string, number | string | boolean | undefined> | null>(),
  paymentMethod: text("payment_method").notNull().default("cod"),
  paymentStatus: text("payment_status").notNull().default("pending"),
  paidPaymentId: text("paid_payment_id"),
});

// Each Razorpay attempt has a separate provider order; COD has one cash entry.
// Restrict deletion so the admin's "clear orders" action cannot erase financial history.
export const orderPaymentsTable = pgTable("order_payments", {
  id:               text("id").primaryKey(),
  orderId:          text("order_id").notNull().references(() => ordersTable.id, { onDelete: "restrict" }),
  customerEmail:    text("customer_email").notNull(),
  method:           text("method").notNull(),
  status:           text("status").notNull().default("created"),
  amountPaise:      integer("amount_paise").notNull(),
  currency:         text("currency").notNull().default("INR"),
  gatewayOrderId:   text("gateway_order_id").unique(),
  gatewayPaymentId: text("gateway_payment_id").unique(),
  refundedPaise:    integer("refunded_paise").notNull().default(0),
  failureReason:    text("failure_reason"),
  createdAt:        timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt:        timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
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

// ─── OTP Codes ────────────────────────────────────────────────────────────────
export const otpCodesTable = pgTable("otp_codes", {
  id:        text("id").primaryKey(),
  email:     text("email").notNull(),
  code:      text("code").notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  used:      boolean("used").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export type DbProduct       = typeof productsTable.$inferSelect;
export type DbOrder         = typeof ordersTable.$inferSelect;
export type DbCustomer      = typeof customersTable.$inferSelect;
export type DbBlogPost      = typeof blogPostsTable.$inferSelect;
export type DbCoupon        = typeof couponCodesTable.$inferSelect;
export type DbProductReview = typeof productReviewsTable.$inferSelect;
export type DbOtpCode       = typeof otpCodesTable.$inferSelect;
export type DbOrderPayment  = typeof orderPaymentsTable.$inferSelect;
