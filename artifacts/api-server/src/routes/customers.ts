import { Router } from "express";
import { db, customersTable, deliveryAreasTable, ordersTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { requireSession } from "../lib/session.js";
import { formatDeliveryAddress } from "../lib/delivery-address.js";

const router = Router();
class DeliveryAreaUnavailableError extends Error {}

function normalizeEmail(email: string | null | undefined) {
  return email?.trim().toLowerCase() ?? "";
}

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
  const customersByEmail = new Map<string, (typeof customers)[number]>();
  for (const customer of customers) {
    const emailKey = normalizeEmail(customer.email);
    if (!emailKey) continue;
    const existing = customersByEmail.get(emailKey);
    if (!existing) {
      customersByEmail.set(emailKey, { ...customer, email: emailKey });
      continue;
    }
    customersByEmail.set(emailKey, {
      ...existing,
      email: emailKey,
      name: existing.name?.trim() ? existing.name : customer.name?.trim() ? customer.name : null,
      deliveryAddress: existing.deliveryAddress?.trim() ? existing.deliveryAddress : customer.deliveryAddress,
      deliveryAreaId: existing.deliveryAreaId ?? customer.deliveryAreaId,
      deliveryAreaName: existing.deliveryAreaName?.trim() ? existing.deliveryAreaName : customer.deliveryAreaName,
      joinedAt: existing.joinedAt.getTime() <= customer.joinedAt.getTime() ? existing.joinedAt : customer.joinedAt,
    });
  }

  const byEmail = new Map<string, { orderCount: number; totalSpent: number; lastOrderAt?: string; phone?: string; address?: string }>();
  const firstOrderByEmail = new Map<string, (typeof orders)[number]>();
  for (const order of orders) {
    const emailKey = normalizeEmail(order.customerEmail);
    if (!emailKey) continue;
    const current = byEmail.get(emailKey) ?? { orderCount: 0, totalSpent: 0 };
    current.orderCount += 1;
    current.totalSpent += Number(order.subtotal) || 0;
    const currentDate = current.lastOrderAt ? Date.parse(current.lastOrderAt) : 0;
    const orderDate = Date.parse(order.date);
    if (!current.lastOrderAt || (!Number.isNaN(orderDate) && orderDate >= currentDate)) current.lastOrderAt = order.date;
    current.phone = current.phone ?? order.phone;
    current.address = current.address ?? formatDeliveryAddress(order.address, order.deliveryAreaName);
    byEmail.set(emailKey, current);

    const firstOrder = firstOrderByEmail.get(emailKey);
    if (!firstOrder || Date.parse(order.date) < Date.parse(firstOrder.date)) {
      firstOrderByEmail.set(emailKey, order);
    }
  }

  for (const [emailKey, order] of firstOrderByEmail) {
    if (customersByEmail.has(emailKey)) continue;
    const orderDate = new Date(order.date);
    customersByEmail.set(emailKey, {
      email: emailKey,
      name: order.customerName,
      deliveryAddress: null,
      deliveryAreaId: null,
      deliveryAreaName: null,
      joinedAt: Number.isNaN(orderDate.getTime()) ? new Date() : orderDate,
    });
  }

  const customerList = [...customersByEmail.entries()].map(([emailKey, customer]) => {
    const orderStats = byEmail.get(emailKey);
    return {
      ...customer,
      email: emailKey,
      joinedAt: customer.joinedAt.toISOString(),
      orderCount: orderStats?.orderCount ?? 0,
      totalSpent: orderStats?.totalSpent ?? 0,
      lastOrderAt: orderStats?.lastOrderAt,
      phone: orderStats?.phone,
      address: orderStats?.address ?? formatDeliveryAddress(customer.deliveryAddress, customer.deliveryAreaName),
    };
  }).sort((first, second) => Date.parse(first.joinedAt) - Date.parse(second.joinedAt));

  res.json(customerList);
});

router.get("/customers/me", async (req, res) => {
  const session = requireSession(req, res, "customer");
  if (!session) return;
  const [customer] = await db
    .select()
    .from(customersTable)
    .where(eq(customersTable.email, session.email))
    .limit(1);
  res.json(customer ?? { email: session.email, name: null, deliveryAddress: null, deliveryAreaId: null, deliveryAreaName: null });
});

router.put("/customers/me/address", async (req, res) => {
  const session = requireSession(req, res, "customer");
  if (!session) return;
  const address = typeof req.body?.address === "string" ? req.body.address.trim() : "";
  const deliveryAreaId = typeof req.body?.deliveryAreaId === "string" ? req.body.deliveryAreaId.trim() : "";
  if (!address || address.length > 1000 || !deliveryAreaId) {
    res.status(400).json({ error: "Enter a delivery address and select a Delivery Area." });
    return;
  }
  let customer;
  try {
    customer = await db.transaction(async transaction => {
      const [area] = await transaction.select().from(deliveryAreasTable)
        .where(eq(deliveryAreasTable.id, deliveryAreaId)).limit(1).for("share");
      if (!area || !area.active) throw new DeliveryAreaUnavailableError();
      const [savedCustomer] = await transaction.insert(customersTable).values({
        email: normalizeEmail(session.email),
        deliveryAddress: address,
        deliveryAreaId: area.id,
        deliveryAreaName: area.name,
      }).onConflictDoUpdate({
        target: customersTable.email,
        set: {
          deliveryAddress: address,
          deliveryAreaId: area.id,
          deliveryAreaName: area.name,
        },
      }).returning();
      return savedCustomer;
    });
  } catch (error) {
    if (error instanceof DeliveryAreaUnavailableError) {
      res.status(400).json({ error: "Select an active Delivery Area." });
      return;
    }
    throw error;
  }
  res.json(customer);
});

// Upsert — idempotent registration on first login
router.post("/customers", async (req, res) => {
  const session = requireSession(req, res, "customer");
  if (!session) return;
  const name = typeof req.body?.name === "string" ? req.body.name : undefined;
  const email = normalizeEmail(session.email);
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
