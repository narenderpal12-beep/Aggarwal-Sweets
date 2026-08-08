import { Router } from "express";
import { db, adminSettingsTable } from "@workspace/db";
import { eq } from "drizzle-orm";

const router = Router();

router.get("/settings", async (_req, res) => {
  const rows = await db.select().from(adminSettingsTable);
  const result: Record<string, string> = {};
  rows.forEach(r => { result[r.key] = r.value; });
  res.json(result);
});

router.put("/settings/:key", async (req, res) => {
  const { key } = req.params;
  const { value } = req.body as { value: string };
  if (value === undefined) { res.status(400).json({ error: "value required" }); return; }
  const [setting] = await db
    .insert(adminSettingsTable)
    .values({ key, value })
    .onConflictDoUpdate({ target: adminSettingsTable.key, set: { value } })
    .returning();
  res.json(setting);
});

export default router;
