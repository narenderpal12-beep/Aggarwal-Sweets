import { Router } from "express";
import { db, ordersTable } from "@workspace/db";
import { eq, desc } from "drizzle-orm";

const router = Router();

router.get("/orders", async (_req, res) => {
  const orders = await db
    .select()
    .from(ordersTable)
    .orderBy(desc(ordersTable.id));
  res.json(orders);
});

router.post("/orders", async (req, res) => {
  const [order] = await db.insert(ordersTable).values(req.body).returning();
  res.status(201).json(order);
});

router.put("/orders/:id/status", async (req, res) => {
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
  await db.delete(ordersTable);
  res.json({ cleared: true });
});

export default router;
