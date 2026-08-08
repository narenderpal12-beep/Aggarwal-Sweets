import { Router } from "express";
import { db, customersTable } from "@workspace/db";

const router = Router();

router.get("/customers", async (_req, res) => {
  const customers = await db
    .select()
    .from(customersTable)
    .orderBy(customersTable.joinedAt);
  res.json(customers);
});

// Upsert — idempotent registration on first login
router.post("/customers", async (req, res) => {
  const { email, name } = req.body as { email: string; name?: string };
  if (!email) { res.status(400).json({ error: "email required" }); return; }
  const [customer] = await db
    .insert(customersTable)
    .values({ email, name })
    .onConflictDoNothing()
    .returning();
  res.status(201).json(customer ?? { email, name });
});

// Danger zone — admin only
router.delete("/customers/clear", async (_req, res) => {
  await db.delete(customersTable);
  res.json({ cleared: true });
});

export default router;
