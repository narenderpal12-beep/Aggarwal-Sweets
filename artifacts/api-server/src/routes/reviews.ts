import { Router } from "express";
import { db, productReviewsTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";
import { randomUUID } from "crypto";

const router = Router();

// Admin: get ALL reviews (pending + approved) — must be before /:productId to avoid conflict
router.get("/reviews/admin/all", async (_req, res) => {
  const reviews = await db
    .select()
    .from(productReviewsTable)
    .orderBy(productReviewsTable.createdAt);
  res.json(reviews);
});

// Public: get approved reviews for a product
router.get("/reviews/:productId", async (req, res) => {
  const { productId } = req.params;
  const reviews = await db
    .select()
    .from(productReviewsTable)
    .where(
      and(
        eq(productReviewsTable.productId, productId),
        eq(productReviewsTable.approved, true),
      ),
    );
  res.json(reviews);
});

// Public: submit a review (pending approval)
router.post("/reviews", async (req, res) => {
  const { productId, customerName, rating, comment } = req.body;
  if (!productId || !customerName) {
    res.status(400).json({ error: "productId and customerName are required" });
    return;
  }
  const [review] = await db
    .insert(productReviewsTable)
    .values({
      id: randomUUID(),
      productId: String(productId),
      customerName: String(customerName).trim(),
      rating: Math.min(5, Math.max(1, Number(rating) || 5)),
      comment: String(comment || "").trim(),
      approved: false,
    })
    .returning();
  res.status(201).json(review);
});

// Admin: approve a review
router.put("/reviews/:id/approve", async (req, res) => {
  const { id } = req.params;
  const [updated] = await db
    .update(productReviewsTable)
    .set({ approved: true })
    .where(eq(productReviewsTable.id, id))
    .returning();
  if (!updated) { res.status(404).json({ error: "Not found" }); return; }
  res.json(updated);
});

// Admin: delete a review
router.delete("/reviews/:id", async (req, res) => {
  const { id } = req.params;
  await db.delete(productReviewsTable).where(eq(productReviewsTable.id, id));
  res.status(204).send();
});

export default router;
