import { Router } from "express";
import { db, productsTable } from "@workspace/db";
import { eq } from "drizzle-orm";

const router = Router();

router.get("/products", async (_req, res) => {
  const products = await db.select().from(productsTable);
  res.json(products);
});

router.post("/products", async (req, res) => {
  const body = req.body;
  const [inserted] = await db.insert(productsTable).values(body).returning();
  res.status(201).json(inserted);
});

router.put("/products/:id", async (req, res) => {
  const { id } = req.params;
  const [updated] = await db
    .update(productsTable)
    .set(req.body)
    .where(eq(productsTable.id, id))
    .returning();
  if (!updated) { res.status(404).json({ error: "Not found" }); return; }
  res.json(updated);
});

router.delete("/products/:id", async (req, res) => {
  const { id } = req.params;
  await db.delete(productsTable).where(eq(productsTable.id, id));
  res.status(204).send();
});

// Danger zone — reset to default seed data
router.post("/products/reset", async (_req, res) => {
  const defaultProducts = [
    { id: 'kaju-katli', name: 'Kaju Katli', category: 'Mithai', price: 340, unit: '250 gm', badge: 'Best seller', image: '/hero-mithai.jpg', rating: 4.9, reviews: 126, description: 'Silky cashew fudge finished with a whisper of silver leaf.', tags: ['kaju-sweets','barfi-halwa','festive-specials'], variants: [{material:'Pure desi ghee',weight:'250 gm',price:340},{material:'Pure desi ghee',weight:'500 gm',price:680},{material:'Pure desi ghee',weight:'1 kg',price:1320}] },
    { id: 'motichoor-ladoo', name: 'Motichoor Ladoo', category: 'Mithai', price: 220, unit: '250 gm', badge: 'Festive favourite', image: '/ladoo-plate.jpg', rating: 4.8, reviews: 89, description: 'Tiny saffron-hued boondi pearls, slow-cooked and hand-rolled.', tags: ['ladoo-laddus','festive-specials'], variants: [{material:'Desi ghee',weight:'250 gm',price:220},{material:'Desi ghee',weight:'500 gm',price:420},{material:'Desi ghee',weight:'1 kg',price:800}] },
    { id: 'pista-barfi', name: 'Pista Barfi', category: 'Mithai', price: 280, unit: '250 gm', badge: null, image: '/hero-mithai.jpg', rating: 4.7, reviews: 54, description: 'Pistachio, khoya and cardamom layered into a delicate barfi.', tags: ['barfi-halwa','milk-sweets'], variants: [{material:'Pure desi ghee',weight:'250 gm',price:280},{material:'Pure desi ghee',weight:'500 gm',price:560},{material:'Pure desi ghee',weight:'1 kg',price:1080}] },
    { id: 'desi-ghee-jalebi', name: 'Desi Ghee Jalebi', category: 'Mithai', price: 150, unit: '250 gm', badge: 'Made today', image: '/ladoo-plate.jpg', rating: 4.9, reviews: 72, description: 'Crisp spirals soaked in warm saffron syrup.', tags: ['ghee-sweets','festive-specials'], variants: [{material:'Desi ghee',weight:'250 gm',price:150},{material:'Desi ghee',weight:'500 gm',price:290}] },
    { id: 'aloo-bhujia', name: 'Aloo Bhujia', category: 'Namkeen', price: 95, unit: '200 gm', badge: 'Tea-time hero', image: '/namkeen-bowl.jpg', rating: 4.8, reviews: 108, description: 'Crunchy potato sev with a bright, savoury masala blend.', tags: ['bhujia-sev'], variants: [{material:'Groundnut oil',weight:'200 gm',price:95},{material:'Groundnut oil',weight:'400 gm',price:180},{material:'Groundnut oil',weight:'800 gm',price:340}] },
    { id: 'masala-kaju', name: 'Masala Kaju', category: 'Namkeen', price: 190, unit: '150 gm', badge: null, image: '/namkeen-bowl.jpg', rating: 4.7, reviews: 43, description: 'Roasted cashews tossed in house chilli, pepper and amchur.', tags: ['roasted-nuts'], variants: [{material:'Roasted & spiced',weight:'150 gm',price:190},{material:'Roasted & spiced',weight:'250 gm',price:360},{material:'Roasted & spiced',weight:'500 gm',price:700}] },
    { id: 'mathri', name: 'Ajwain Mathri', category: 'Snacks', price: 120, unit: '250 gm', badge: null, image: '/namkeen-bowl.jpg', rating: 4.6, reviews: 38, description: 'Flaky, savoury and gently spiced with ajwain.', tags: ['mathri-crackers','tea-time-snacks','spiced-snacks'], variants: [{material:'Traditional',weight:'250 gm',price:120},{material:'Traditional',weight:'500 gm',price:220},{material:'Traditional',weight:'1 kg',price:420}] },
    { id: 'shagun-box', name: 'Shagun Box · Golden Edit', category: 'Gifting', price: 690, unit: '750 gm', badge: 'Gift ready', image: '/hero-mithai.jpg', rating: 4.9, reviews: 31, description: 'A celebration-ready assortment of kaju katli, ladoo, pista barfi.', tags: ['festival-boxes','corporate-gifts','personal-gifts'], variants: [{material:'Classic assortment',weight:'750 gm',price:690},{material:'Classic assortment',weight:'1.25 kg',price:1290},{material:'Classic assortment',weight:'2 kg',price:1980}] },
  ];
  await db.delete(productsTable);
  for (const p of defaultProducts) {
    await db.insert(productsTable).values(p as any);
  }
  res.json({ reset: true, count: defaultProducts.length });
});

export default router;
