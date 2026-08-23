import { Router } from "express";
import { db, customersTable } from "@workspace/db";
import { requireSession } from "../lib/session.js";

const router = Router();

router.get("/customers", async (_req, res) => {
  if (!requireSession(_req, res, "admin")) return;
  const customers = await db
    .select()
    .from(customersTable)
    .orderBy(customersTable.joinedAt);
  res.json(customers);
});

// Upsert — idempotent registration on first login
router.post("/customers", async (req, res) => {
  const session = requireSession(req, res, "customer");
  if (!session) return;
  const { name } = req.body as { name?: string };
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
