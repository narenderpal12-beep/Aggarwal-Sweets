import { Router } from "express";
import { randomUUID } from "node:crypto";
import { db, ordersTable } from "@workspace/db";
import { eq, desc } from "drizzle-orm";
import { sendOrderEmails } from "../lib/email.js";
import { requireSession } from "../lib/session.js";

const router = Router();

router.get("/orders", async (_req, res) => {
  if (!requireSession(_req, res, "admin")) return;
  const orders = await db
    .select()
    .from(ordersTable)
    .orderBy(desc(ordersTable.id));
  res.json(orders);
});

router.get("/orders/mine", async (req, res) => {
  const session = requireSession(req, res, "customer");
  if (!session) return;
  const orders = await db
    .select()
    .from(ordersTable)
    .where(eq(ordersTable.customerEmail, session.email))
    .orderBy(desc(ordersTable.id));
  res.json(orders);
});

router.post("/orders", async (req, res) => {
  const session = requireSession(req, res, "customer");
  if (!session) return;
  const { id: _clientOrderId, ...orderData } = req.body;
  const [order] = await db.insert(ordersTable).values({
    ...orderData,
    id: `AGS-${randomUUID()}`,
    customerEmail: session.email,
  }).returning();
  res.status(201).json(order);

  // Send confirmation emails asynchronously (non-blocking)
  sendOrderEmails({ ...req.body, id: order.id, customerEmail: order.customerEmail ?? undefined }).catch((err) =>
    console.error("Failed to send order emails:", err)
  );
});

router.put("/orders/:id/status", async (req, res) => {
  if (!requireSession(req, res, "admin")) return;
  const { id } = req.params;
  const { status } = req.body;
  const [updated] = await db
    .update(ordersTable)
    .set({ status })
    .where(eq(ordersTable.id, id))
    .returning();
  if (!updated) { res.status(404).json({ error: "Not found" }); return; }
  res.json(updated);
});

// Danger zone — admin only
router.delete("/orders/clear", async (_req, res) => {
  if (!requireSession(_req, res, "admin")) return;
  await db.delete(ordersTable);
  res.json({ cleared: true });
});

export default router;
