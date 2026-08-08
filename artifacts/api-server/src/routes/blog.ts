import { Router } from "express";
import { db, blogPostsTable } from "@workspace/db";
import { eq } from "drizzle-orm";

const router = Router();

router.get("/blog", async (_req, res) => {
  const posts = await db.select().from(blogPostsTable).orderBy(blogPostsTable.id);
  res.json(posts);
});

router.post("/blog", async (req, res) => {
  const [post] = await db.insert(blogPostsTable).values(req.body).returning();
  res.status(201).json(post);
});

router.put("/blog/:id", async (req, res) => {
  const { id } = req.params;
  const [updated] = await db
    .update(blogPostsTable)
    .set(req.body)
    .where(eq(blogPostsTable.id, id))
    .returning();
  if (!updated) { res.status(404).json({ error: "Not found" }); return; }
  res.json(updated);
});

router.delete("/blog/:id", async (req, res) => {
  const { id } = req.params;
  await db.delete(blogPostsTable).where(eq(blogPostsTable.id, id));
  res.status(204).send();
});

export default router;
