import { Router } from "express";
import { db, couponCodesTable } from "@workspace/db";
import { eq } from "drizzle-orm";

const router = Router();

router.get("/coupons", async (_req, res) => {
  const coupons = await db.select().from(couponCodesTable);
  res.json(coupons);
});

router.post("/coupons", async (req, res) => {
  const { code, type, value, minOrder, description, active } = req.body;
  const [coupon] = await db
    .insert(couponCodesTable)
    .values({ code: code.toUpperCase(), type, value, minOrder: minOrder ?? 0, description: description ?? "", active: active ?? true })
    .returning();
  res.status(201).json(coupon);
});

router.delete("/coupons/:code", async (req, res) => {
  await db.delete(couponCodesTable).where(eq(couponCodesTable.code, req.params.code.toUpperCase()));
  res.status(204).send();
});

router.put("/coupons/:code/toggle", async (req, res) => {
  const code = req.params.code.toUpperCase();
  const [existing] = await db.select().from(couponCodesTable).where(eq(couponCodesTable.code, code));
  if (!existing) { res.status(404).json({ error: "Not found" }); return; }
  const [updated] = await db.update(couponCodesTable).set({ active: !existing.active }).where(eq(couponCodesTable.code, code)).returning();
  res.json(updated);
});

// Validate a coupon code against a cart subtotal and return discount amount
router.post("/coupons/validate", async (req, res) => {
  const { code, subtotal } = req.body as { code: string; subtotal: number };
  if (!code) { res.status(400).json({ error: "code required" }); return; }
  const [coupon] = await db.select().from(couponCodesTable).where(eq(couponCodesTable.code, code.toUpperCase()));
  if (!coupon) { res.status(404).json({ error: "Invalid coupon code" }); return; }
  if (!coupon.active) { res.status(400).json({ error: "This coupon is no longer active" }); return; }
  if (subtotal < coupon.minOrder) {
    res.status(400).json({ error: `Minimum order of ${coupon.minOrder} required for this coupon` }); return;
  }
  const discount = coupon.type === 'percent'
    ? Math.round((subtotal * coupon.value) / 100)
    : Math.min(coupon.value, subtotal);
  res.json({ valid: true, discount, coupon });
});

export default router;
