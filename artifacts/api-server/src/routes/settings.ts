import { Router } from "express";
import { db, adminSettingsTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { requireSession } from "../lib/session.js";
import { razorpayAvailable } from "../lib/razorpay.js";

const router = Router();

router.get("/settings", async (_req, res) => {
  const rows = await db.select().from(adminSettingsTable);
  const result: Record<string, string> = {};
  rows.forEach(r => { result[r.key] = r.value; });
  res.json(result);
});

router.put("/settings/:key", async (req, res) => {
  const { key } = req.params;
  if (
    (key === "additional_settings" || key === "cod_enabled" || key === "admin_settings_visibility") &&
    !requireSession(req, res, "admin")
  ) return;
  const { value } = req.body as { value: string };
  if (value === undefined) { res.status(400).json({ error: "value required" }); return; }
  if (key === "cod_enabled") {
    if (value !== "true" && value !== "false") {
      res.status(400).json({ error: "Invalid cash on delivery setting." });
      return;
    }
    if (value === "false" && !razorpayAvailable()) {
      res.status(409).json({ error: "Set up Razorpay before disabling cash on delivery, or customers will have no payment option." });
      return;
    }
  }
  const [setting] = await db
    .insert(adminSettingsTable)
    .values({ key, value })
    .onConflictDoUpdate({ target: adminSettingsTable.key, set: { value } })
    .returning();
  res.json(setting);
});

export default router;
