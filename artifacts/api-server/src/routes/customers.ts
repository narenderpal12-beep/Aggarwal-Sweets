import { Router } from "express";
import { db, customersTable, ordersTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { requireSession } from "../lib/session.js";

const router = Router();

router.get("/customers", async (_req, res) => {
  if (!requireSession(_req, res, "admin")) return;
  res.set("Cache-Control", "no-store");
  const [customers, orders] = await Promise.all([
    db
    .select()
    .from(customersTable)
    .orderBy(customersTable.joinedAt),
    db.select().from(ordersTable),
  ]);
  const byEmail = new Map<string, { orderCount: number; totalSpent: number; lastOrderAt?: string; phone?: string; address?: string }>();
  for (const order of orders) {
    if (!order.customerEmail) continue;
    const emailKey = order.customerEmail.trim().toLowerCase();
    const current = byEmail.get(emailKey) ?? { orderCount: 0, totalSpent: 0 };
    current.orderCount += 1;
    current.totalSpent += Number(order.subtotal) || 0;
    const currentDate = current.lastOrderAt ? Date.parse(current.lastOrderAt) : 0;
    const orderDate = Date.parse(order.date);
    if (!current.lastOrderAt || (!Number.isNaN(orderDate) && orderDate >= currentDate)) current.lastOrderAt = order.date;
    current.phone = current.phone ?? order.phone;
    current.address = current.address ?? order.address;
    byEmail.set(emailKey, current);
  }
  res.json(customers.map(customer => ({
    ...customer,
    orderCount: byEmail.get(customer.email.trim().toLowerCase())?.orderCount ?? 0,
    totalSpent: byEmail.get(customer.email.trim().toLowerCase())?.totalSpent ?? 0,
    lastOrderAt: byEmail.get(customer.email.trim().toLowerCase())?.lastOrderAt,
    phone: byEmail.get(customer.email.trim().toLowerCase())?.phone,
    address: byEmail.get(customer.email.trim().toLowerCase())?.address,
  })));
});

router.get("/customers/me", async (req, res) => {
  const session = requireSession(req, res, "customer");
  if (!session) return;
  const [customer] = await db
    .select()
    .from(customersTable)
    .where(eq(customersTable.email, session.email))
    .limit(1);
  res.json(customer ?? { email: session.email, name: null });
});

// Upsert — idempotent registration on first login
router.post("/customers", async (req, res) => {
  const session = requireSession(req, res, "customer");
  if (!session) return;
  const name = typeof req.body?.name === "string" ? req.body.name : undefined;
  const email = session.email;
  const normalizedName = name?.trim();
  const query = db
    .insert(customersTable)
    .values({ email, name: normalizedName ?? null });
  const [customer] = normalizedName
    ? await query.onConflictDoUpdate({
        target: customersTable.email,
        set: { name: normalizedName },
      }).returning()
    : await query.onConflictDoNothing().returning();
  res.status(201).json(customer ?? { email, name });
});

// Danger zone — admin only
router.delete("/customers/clear", async (_req, res) => {
  if (!requireSession(_req, res, "admin")) return;
  await db.delete(customersTable);
  res.json({ cleared: true });
});

export default router;
