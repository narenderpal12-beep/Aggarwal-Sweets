import { randomUUID } from "node:crypto";
import { Router } from "express";
import { asc, eq } from "drizzle-orm";
import { db, deliveryAreasTable, ordersTable } from "@workspace/db";
import { requireSession } from "../lib/session.js";

const router = Router();

function readAreaName(value: unknown) {
  if (typeof value !== "string") return null;
  const name = value.trim().replace(/\s+/g, " ");
  return name.length > 0 && name.length <= 120 ? name : null;
}

async function nameIsTaken(name: string, exceptId?: string) {
  const areas = await db.select({ id: deliveryAreasTable.id, name: deliveryAreasTable.name }).from(deliveryAreasTable);
  const normalized = name.toLocaleLowerCase();
  return areas.some(area => area.id !== exceptId && area.name.trim().toLocaleLowerCase() === normalized);
}

// Serviceable areas are public so checkout can load the active master.
router.get("/delivery-areas", async (_req, res) => {
  res.set("Cache-Control", "no-store");
  const areas = await db
    .select({ id: deliveryAreasTable.id, name: deliveryAreasTable.name, active: deliveryAreasTable.active, sortOrder: deliveryAreasTable.sortOrder })
    .from(deliveryAreasTable)
    .where(eq(deliveryAreasTable.active, true))
    .orderBy(asc(deliveryAreasTable.sortOrder), asc(deliveryAreasTable.name));
  res.json(areas);
});

router.get("/delivery-areas/admin", async (req, res) => {
  if (!requireSession(req, res, "admin")) return;
  res.set("Cache-Control", "no-store");
  const areas = await db.select().from(deliveryAreasTable)
    .orderBy(asc(deliveryAreasTable.sortOrder), asc(deliveryAreasTable.name));
  res.json(areas);
});

router.post("/delivery-areas", async (req, res) => {
  if (!requireSession(req, res, "admin")) return;
  const name = readAreaName(req.body?.name);
  if (!name) {
    res.status(400).json({ error: "Enter a Delivery Area name up to 120 characters." });
    return;
  }
  if (await nameIsTaken(name)) {
    res.status(409).json({ error: "A Delivery Area with this name already exists." });
    return;
  }
  const [area] = await db.insert(deliveryAreasTable).values({
    id: randomUUID(),
    name,
    active: req.body?.active !== false,
  }).returning();
  res.status(201).json(area);
});

router.put("/delivery-areas/:id", async (req, res) => {
  if (!requireSession(req, res, "admin")) return;
  const id = req.params.id;
  if (typeof id !== "string" || !id) {
    res.status(400).json({ error: "A Delivery Area ID is required." });
    return;
  }
  const hasName = Object.prototype.hasOwnProperty.call(req.body ?? {}, "name");
  const hasActive = Object.prototype.hasOwnProperty.call(req.body ?? {}, "active");
  const name = hasName ? readAreaName(req.body.name) : undefined;
  if ((hasName && !name) || (hasActive && typeof req.body.active !== "boolean") || (!hasName && !hasActive)) {
    res.status(400).json({ error: "Enter a valid Delivery Area name or active status." });
    return;
  }
  const [existing] = await db.select().from(deliveryAreasTable).where(eq(deliveryAreasTable.id, id)).limit(1);
  if (!existing) {
    res.status(404).json({ error: "Delivery Area not found." });
    return;
  }
  if (name && await nameIsTaken(name, id)) {
    res.status(409).json({ error: "A Delivery Area with this name already exists." });
    return;
  }
  const [updated] = await db.update(deliveryAreasTable)
    .set({
      ...(name ? { name } : {}),
      ...(hasActive ? { active: req.body.active as boolean } : {}),
    })
    .where(eq(deliveryAreasTable.id, id))
    .returning();
  res.json(updated);
});

router.delete("/delivery-areas/:id", async (req, res) => {
  if (!requireSession(req, res, "admin")) return;
  const id = req.params.id;
  if (typeof id !== "string" || !id) {
    res.status(400).json({ error: "A Delivery Area ID is required." });
    return;
  }
  const [usedByOrder] = await db.select({ id: ordersTable.id })
    .from(ordersTable).where(eq(ordersTable.deliveryAreaId, id)).limit(1);
  if (usedByOrder) {
    res.status(409).json({ error: "This area is saved on existing orders. Deactivate it instead of deleting it." });
    return;
  }
  const [deleted] = await db.delete(deliveryAreasTable)
    .where(eq(deliveryAreasTable.id, id))
    .returning({ id: deliveryAreasTable.id });
  if (!deleted) {
    res.status(404).json({ error: "Delivery Area not found." });
    return;
  }
  res.json({ deleted: true });
});

export default router;