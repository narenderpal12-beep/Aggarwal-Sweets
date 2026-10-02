import { Router } from "express";
import { randomUUID } from "node:crypto";
import { db, ordersTable, orderPaymentsTable, productsTable, adminSettingsTable, couponCodesTable, deliveryAreasTable } from "@workspace/db";
import { and, desc, eq, like, ne, sql } from "drizzle-orm";
import { sendDeliveredOrderEmail, sendOrderEmails } from "../lib/email.js";
import { createGatewayOrder, razorpayAvailable, razorpayKeyId, type GatewayOrder } from "../lib/razorpay.js";
import {
  generateThermalOrderBillPdf, generateOrderReportPdf,
  type BillItem, type BillOrder, type BillPricing, type OrderReportPdfData, type OrderReportPdfRow,
} from "../lib/order-bill.js";
import { generateA4OrderBillPdf } from "../lib/order-bill-a4.js";
import { requireSession } from "../lib/session.js";
import { formatDeliveryAddress } from "../lib/delivery-address.js";

const router = Router();

class DeliveryAreaUnavailableError extends Error {}

function normalizeVariantLabel(value: unknown): string | null {
  if (typeof value !== "string") return null;
  return value.trim().replace(/\s+/g, " ").toLowerCase();
}

type Window = { day: number; start: string; end: string };
function isAvailable(active: boolean | undefined, schedule: Window[] | null | undefined, now: Date) {
  if (active === false) return false;
  if (schedule == null) return true;
  if (!Array.isArray(schedule)) return false;
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Kolkata", weekday: "short", hour: "2-digit", minute: "2-digit", hourCycle: "h23",
  }).formatToParts(now);
  const value = (type: string) => parts.find(part => part.type === type)?.value ?? "";
  const day = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].indexOf(value("weekday"));
  const time = `${value("hour")}:${value("minute")}`;
  return schedule.some(window => window.day === day && /^\d{2}:\d{2}$/.test(window.start) &&
    /^\d{2}:\d{2}$/.test(window.end) && window.start <= time && time < window.end);
}

function getIndiaOrderTimestamp(date: Date) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kolkata",
    year: "numeric", month: "2-digit", day: "2-digit",
    hour: "2-digit", minute: "2-digit", second: "2-digit", hourCycle: "h23",
  }).formatToParts(date);
  const value = (type: string) => parts.find(part => part.type === type)?.value ?? "00";
  const dateKey = `${value("year")}-${value("month")}-${value("day")}`;
  const timeKey = `${value("hour")}-${value("minute")}-${value("second")}`;
  return { dateKey, timeKey };
}

function newestFirst<T extends { id: string; date: string }>(orders: T[]) {
  return [...orders].sort((a, b) => {
    const aTime = Date.parse(a.date);
    const bTime = Date.parse(b.date);
    if (Number.isFinite(aTime) && Number.isFinite(bTime) && aTime !== bTime) return bTime - aTime;
    return b.id.localeCompare(a.id);
  });
}

function isOrderReportPdfData(value: unknown): value is OrderReportPdfData {
  if (!value || typeof value !== "object") return false;
  const report = value as Record<string, unknown>;
  const reportTextFields = ["title", "fromDate", "toDate", "status", "category"];
  if (!reportTextFields.every(key => typeof report[key] === "string" && (report[key] as string).length <= 200) ||
      !Number.isInteger(report.orders) || (report.orders as number) < 0 ||
      !Number.isInteger(report.items) || (report.items as number) < 0 ||
      typeof report.revenue !== "number" || !Number.isFinite(report.revenue) || report.revenue < 0 ||
      !Array.isArray(report.rows) || report.rows.length > 10000) return false;

  const rowTextFields: (keyof Omit<OrderReportPdfRow, "quantity" | "lineTotal" | "items">)[] = [
    "orderId", "date", "status", "customer", "email", "phone", "address",
    "paymentMethod", "paymentStatus",
  ];
  const itemTextFields = ["category", "product", "variant"] as const;
  return report.rows.every((value: unknown) => {
    if (!value || typeof value !== "object") return false;
    const row = value as Record<string, unknown>;
    if (!rowTextFields.every(key => typeof row[key] === "string" && (row[key] as string).length <= 2000) ||
        !Number.isInteger(row.quantity) || (row.quantity as number) < 0 ||
        typeof row.lineTotal !== "number" || !Number.isFinite(row.lineTotal) || row.lineTotal < 0 ||
        !Array.isArray(row.items) || row.items.length > 1000) return false;
    const items = row.items as unknown[];
    const validItems = items.every((itemValue: unknown) => {
      if (!itemValue || typeof itemValue !== "object") return false;
      const item = itemValue as Record<string, unknown>;
      return itemTextFields.every(key => typeof item[key] === "string" && (item[key] as string).length <= 2000) &&
        Number.isInteger(item.quantity) && (item.quantity as number) > 0 &&
        typeof item.unitPrice === "number" && Number.isFinite(item.unitPrice) && item.unitPrice >= 0 &&
        typeof item.lineTotal === "number" && Number.isFinite(item.lineTotal) && item.lineTotal >= 0;
    });
    const typedItems = items as { quantity: number; lineTotal: number }[];
    return validItems &&
      (row.quantity as number) === typedItems.reduce((sum, item) => sum + item.quantity, 0) &&
      Math.round((row.lineTotal as number) * 100) ===
        Math.round(typedItems.reduce((sum, item) => sum + item.lineTotal, 0) * 100);
  });
}

function isBillableOrder(order: {
  status: string;
  paymentMethod: string | null;
  paymentStatus: string | null;
}) {
  const confirmedStatus = ["Confirmed", "Packing", "Out for delivery", "Delivered"].includes(order.status);
  if (!confirmedStatus) return false;
  if (order.paymentMethod === "razorpay") {
    return order.paymentStatus === "paid" || order.paymentStatus === "refunded";
  }
  return order.paymentMethod === "cod" &&
    ["pending", "paid", "refunded"].includes(order.paymentStatus ?? "pending");
}

router.get("/orders/:id/bill.pdf", async (req, res) => {
  const session = requireSession(req, res);
  if (!session) return;
  const [order] = await db
    .select()
    .from(ordersTable)
    .where(eq(ordersTable.id, req.params.id))
    .limit(1);
  if (!order || (session.role !== "admin" &&
      (session.role !== "customer" || order.customerEmail?.toLowerCase() !== session.email.toLowerCase()))) {
    res.status(404).json({ error: "Order not found." });
    return;
  }
  if (!isBillableOrder({
    status: order.status,
    paymentMethod: order.paymentMethod,
    paymentStatus: order.paymentStatus,
  })) {
    res.status(409).json({ error: "A bill is available only for confirmed orders with a valid payment state." });
    return;
  }
  if (!Array.isArray(order.items) || !order.pricing || !order.address || !order.date || !order.phone) {
    res.status(409).json({ error: "This order does not have the saved details required to generate a bill." });
    return;
  }

  try {
    const [logoSetting] = await db
      .select({ value: adminSettingsTable.value })
      .from(adminSettingsTable)
      .where(eq(adminSettingsTable.key, "logo_url"))
      .limit(1);
    const bill: BillOrder = {
      id: order.id,
      date: order.date,
      customerName: order.customerName ?? undefined,
      customerEmail: order.customerEmail ?? undefined,
      phone: order.phone,
      address: formatDeliveryAddress(order.address, order.deliveryAreaName),
      items: order.items as BillItem[],
      pricing: order.pricing as BillPricing,
      subtotal: Number(order.subtotal),
      paymentMethod: order.paymentMethod === "razorpay" ? "razorpay" : "cod",
      paymentReference: order.paidPaymentId ?? undefined,
      paymentStatus: order.paymentStatus ?? "pending",
      orderStatus: order.status,
    };
    const pdf = session.role === "admin"
      ? await generateThermalOrderBillPdf(bill)
      : await generateA4OrderBillPdf(bill, logoSetting?.value);
    const safeOrderId = order.id.replace(/[^a-z0-9_-]/gi, "-");
    res.status(200)
      .setHeader("Content-Type", "application/pdf")
      .setHeader("Content-Disposition", `attachment; filename="Aggarwal-Sweets-Bill-${safeOrderId}.pdf"`)
      .setHeader("Cache-Control", "no-store")
      .send(pdf);
  } catch (error) {
    console.error("Could not generate order bill PDF:", error);
    res.status(500).json({ error: "The bill could not be generated. Please try again." });
  }
});

router.post("/orders/report.pdf", async (req, res) => {
  if (!requireSession(req, res, "admin")) return;
  if (!isOrderReportPdfData(req.body)) {
    res.status(400).json({ error: "Order report data is invalid. Review the selected filters and try again." });
    return;
  }
  try {
    const pdf = await generateOrderReportPdf(req.body);
    res.status(200)
      .setHeader("Content-Type", "application/pdf")
      .setHeader("Content-Disposition", 'attachment; filename="orders-report.pdf"')
      .setHeader("Cache-Control", "no-store")
      .send(pdf);
  } catch {
    res.status(500).json({ error: "The order PDF could not be generated. Please try again." });
  }
});

router.get("/orders", async (_req, res) => {
  if (!requireSession(_req, res, "admin")) return;
  const orders = await db
    .select()
    .from(ordersTable)
    .orderBy(desc(ordersTable.id));
  res.json(newestFirst(orders));
});

router.get("/orders/mine", async (req, res) => {
  const session = requireSession(req, res, "customer");
  if (!session) return;
  const orders = await db
    .select()
    .from(ordersTable)
    .where(eq(ordersTable.customerEmail, session.email))
    .orderBy(desc(ordersTable.id));
  res.json(newestFirst(orders));
});

router.post("/orders", async (req, res) => {
  const session = requireSession(req, res, "customer");
  if (!session) return;
  const { phone, address, items, customerName } = req.body;
  const deliveryAreaId = typeof req.body.deliveryAreaId === "string" ? req.body.deliveryAreaId.trim() : "";
  const paymentMethod = req.body.paymentMethod ?? "cod";
  if (paymentMethod !== "cod" && paymentMethod !== "razorpay") {
    res.status(400).json({ error: "Choose a valid payment method." });
    return;
  }
  if (paymentMethod === "razorpay" && !razorpayAvailable()) {
    res.status(503).json({ error: "Online payment is not currently available. Please try again later." });
    return;
  }
  if (typeof phone !== "string" || !/^\d{10}$/.test(phone.trim()) ||
      typeof address !== "string" || !address.trim() || address.length > 1000 ||
      typeof customerName !== "string" || !customerName.trim() || customerName.length > 120) {
    res.status(400).json({ error: "Please enter your name, 10-digit phone number and delivery address." });
    return;
  }
  if (!deliveryAreaId || deliveryAreaId.length > 120) {
    res.status(400).json({ error: "Please select a Delivery Area before placing your order." });
    return;
  }
  const [selectedDeliveryArea] = await db.select().from(deliveryAreasTable)
    .where(eq(deliveryAreasTable.id, deliveryAreaId)).limit(1);
  if (!selectedDeliveryArea || !selectedDeliveryArea.active) {
    res.status(400).json({ error: "That Delivery Area is no longer serviceable. Please select an active area." });
    return;
  }
  if (!Array.isArray(items) || !items.length || items.some((line: any) =>
    !line?.product?.id || !Number.isInteger(line.quantity) || line.quantity < 1)) {
    res.status(400).json({ error: "Please add valid items to your order." });
    return;
  }
  const [products, categorySetting, pricingSetting, codSetting] = await Promise.all([
    db.select().from(productsTable),
    db.select().from(adminSettingsTable).where(eq(adminSettingsTable.key, "categories_master")).limit(1),
    db.select().from(adminSettingsTable).where(eq(adminSettingsTable.key, "additional_settings")).limit(1),
    db.select().from(adminSettingsTable).where(eq(adminSettingsTable.key, "cod_enabled")).limit(1),
  ]);
  if (paymentMethod === "cod" && codSetting[0]?.value === "false") {
    res.status(409).json({ error: "Cash on delivery is currently disabled. Please choose online payment." });
    return;
  }
  let categories: Array<{ label: string; active?: boolean; schedule?: Window[] | null }> = [];
  if (categorySetting[0]?.value) {
    try {
      const parsed: unknown = JSON.parse(categorySetting[0].value);
      if (Array.isArray(parsed)) categories = parsed;
    } catch {
      res.status(503).json({ error: "Category availability could not be checked. Please try again." });
      return;
    }
  }
  const defaults: {
    minimumOrderValue: number; gstEnabled: boolean; gstPercent: number;
    deliveryEnabled: boolean; deliveryCharge: number; deliveryWaiveMinimum: number;
    handlingEnabled: boolean; handlingCharge: number;
  } = {
    minimumOrderValue: 0, gstEnabled: false, gstPercent: 0,
    deliveryEnabled: false, deliveryCharge: 0, deliveryWaiveMinimum: 0,
    handlingEnabled: false, handlingCharge: 0,
  };
  let additional = defaults;
  if (pricingSetting[0]?.value) {
    try {
      const parsed = JSON.parse(pricingSetting[0].value);
      const amount = (key: keyof typeof defaults) => {
        const value = parsed[key];
        return typeof value === "number" && Number.isFinite(value) && value >= 0 ? value : defaults[key] as number;
      };
      additional = {
        minimumOrderValue: amount("minimumOrderValue"),
        gstEnabled: parsed.gstEnabled === true,
        gstPercent: Math.min(100, amount("gstPercent")),
        deliveryEnabled: parsed.deliveryEnabled === true,
        deliveryCharge: amount("deliveryCharge"),
        deliveryWaiveMinimum: amount("deliveryWaiveMinimum"),
        handlingEnabled: parsed.handlingEnabled === true,
        handlingCharge: amount("handlingCharge"),
      };
    } catch {
      res.status(503).json({ error: "Order charges could not be checked. Please try again." });
      return;
    }
  }
  const now = new Date();
  let itemsSubtotal = 0;
  const verifiedItems: Array<{
    product: (typeof products)[number];
    variant: { material: string; weight: string; price: number };
    quantity: number;
  }> = [];
  for (const line of items) {
    const product = products.find(item => item.id === line.product.id);
    if (!product) {
      res.status(409).json({ error: "An item in your box is no longer available. Please remove it and try again." });
      return;
    }
    const requestedMaterial = normalizeVariantLabel(line.variant?.material);
    const requestedWeight = normalizeVariantLabel(line.variant?.weight);
    const variant = requestedMaterial && requestedWeight
      ? product.variants.find(item =>
          normalizeVariantLabel(item.material) === requestedMaterial &&
          normalizeVariantLabel(item.weight) === requestedWeight)
      : undefined;
    if (!variant) {
      const selectedVariant = [line.variant?.material, line.variant?.weight]
        .filter((value): value is string => typeof value === "string" && value.trim().length > 0)
        .join(" · ");
      res.status(409).json({
        error: `${product.name}${selectedVariant ? ` (${selectedVariant})` : ""} has changed. Remove it from your cart and add the current option before trying again.`,
      });
      return;
    }
    const category = categories.find(item => item.label?.toLowerCase() === product.category.toLowerCase());
    if (!isAvailable(product.active, product.schedule, now) || !isAvailable(category?.active, category?.schedule, now)) {
      res.status(409).json({ error: `${product.name} is currently unavailable. Please try again during its available hours or remove it from your box.` });
      return;
    }
    itemsSubtotal += variant.price * line.quantity;
    verifiedItems.push({ product, variant, quantity: line.quantity });
  }
  if (itemsSubtotal < additional.minimumOrderValue) {
    res.status(400).json({ error: `The minimum order value is ₹${additional.minimumOrderValue}. Add more items to continue.` });
    return;
  }
  let discount = 0;
  const rawCouponCode = req.body.couponCode ?? req.body.pricing?.couponCode;
  const couponCode = typeof rawCouponCode === "string" ? rawCouponCode.trim().toUpperCase() : "";
  if (couponCode) {
    const [coupon] = await db.select().from(couponCodesTable).where(eq(couponCodesTable.code, couponCode)).limit(1);
    if (!coupon || !coupon.active) {
      res.status(400).json({ error: "This coupon is no longer valid. Remove it and try again." });
      return;
    }
    if (itemsSubtotal < coupon.minOrder) {
      res.status(400).json({ error: `This coupon requires a minimum product subtotal of ₹${coupon.minOrder}.` });
      return;
    }
    discount = coupon.type === "percent"
      ? Math.round(itemsSubtotal * coupon.value / 100)
      : Math.min(coupon.value, itemsSubtotal);
  }
  const taxableSubtotal = Math.max(0, itemsSubtotal - discount);
  const gstPercent = additional.gstEnabled ? additional.gstPercent : 0;
  const gst = Math.round(taxableSubtotal * gstPercent / 100);
  const deliveryWaived = additional.deliveryEnabled && additional.deliveryCharge > 0 &&
    additional.deliveryWaiveMinimum > 0 && itemsSubtotal >= additional.deliveryWaiveMinimum;
  const deliveryCharge = additional.deliveryEnabled && !deliveryWaived ? additional.deliveryCharge : 0;
  const handlingCharge = additional.handlingEnabled ? additional.handlingCharge : 0;
  const pricing = {
    itemsSubtotal, discount, gstPercent, gst, deliveryCharge, deliveryWaived, handlingCharge,
    total: taxableSubtotal + gst + deliveryCharge + handlingCharge,
    ...(couponCode ? { couponCode } : {}),
  };
  const submittedPricing = req.body.pricing;
  const priceFields = ["itemsSubtotal", "discount", "gstPercent", "gst", "deliveryCharge", "handlingCharge", "total"] as const;
  const pricingMatches = submittedPricing && priceFields.every(key =>
    typeof submittedPricing[key] === "number" && submittedPricing[key] === pricing[key]) &&
    submittedPricing.deliveryWaived === pricing.deliveryWaived &&
    (submittedPricing.couponCode ?? "") === (pricing.couponCode ?? "");
  if (!pricingMatches) {
    res.status(409).json({ error: "Your order total changed. Please close checkout and review your cart before placing the order." });
    return;
  }
  const amountPaise = pricing.total * 100;
  if (!Number.isSafeInteger(amountPaise) || amountPaise < 0 || amountPaise > 2147483647 ||
      (paymentMethod === "razorpay" && amountPaise < 100)) {
    res.status(400).json({ error: "This order total cannot be paid online. Please review your cart." });
    return;
  }
  let gatewayOrder: GatewayOrder | undefined;
  if (paymentMethod === "razorpay") {
    try {
      gatewayOrder = await createGatewayOrder(amountPaise);
    } catch (error) {
      console.error("Could not create Razorpay order:", error);
      res.status(502).json({ error: "Could not start the secure payment. No order was placed; please try again." });
      return;
    }
  }
  const { dateKey, timeKey } = getIndiaOrderTimestamp(now);
  let order: typeof ordersTable.$inferSelect;
  try {
    order = await db.transaction(async transaction => {
    const [currentDeliveryArea] = await transaction.select().from(deliveryAreasTable)
      .where(eq(deliveryAreasTable.id, deliveryAreaId)).limit(1).for("share");
    if (!currentDeliveryArea || !currentDeliveryArea.active) throw new DeliveryAreaUnavailableError();
    await transaction.execute(sql`select pg_advisory_xact_lock(hashtext(${dateKey}))`);
    const todaysOrders = await transaction
      .select({ id: ordersTable.id })
      .from(ordersTable)
      .where(like(ordersTable.id, `${dateKey}-%`));
    const lastSerial = todaysOrders.reduce((highest, order) => {
      const match = order.id.match(/-(\d+)$/);
      return match ? Math.max(highest, Number(match[1]) || 0) : highest;
    }, 0);
    const serial = lastSerial + 1;
    const id = `${dateKey}-${timeKey}-${String(serial).padStart(5, "0")}`;
    const [savedOrder] = await transaction.insert(ordersTable).values({
      id,
      date: now.toISOString(),
      phone: phone.trim(),
      address: address.trim(),
      deliveryAreaId: currentDeliveryArea.id,
      deliveryAreaName: currentDeliveryArea.name,
      subtotal: pricing.total,
      items: verifiedItems,
      pricing,
      customerName: customerName.trim(),
      status: paymentMethod === "razorpay" ? "Awaiting payment" : "Confirmed",
      paymentMethod,
      paymentStatus: "pending",
      customerEmail: session.email,
    }).returning();
    await transaction.insert(orderPaymentsTable).values({
      id: randomUUID(),
      orderId: id,
      customerEmail: session.email,
      method: paymentMethod,
      status: paymentMethod === "razorpay" ? "created" : "pending",
      amountPaise,
      gatewayOrderId: gatewayOrder?.id ?? null,
    });
    return savedOrder;
    });
  } catch (error) {
    if (error instanceof DeliveryAreaUnavailableError) {
      res.status(409).json({ error: "That Delivery Area is no longer serviceable. Please select an active area." });
      return;
    }
    throw error;
  }
  if (gatewayOrder) {
    res.status(201).json({
      order,
      checkout: {
        keyId: razorpayKeyId(),
        gatewayOrderId: gatewayOrder.id,
        amountPaise: gatewayOrder.amount,
        currency: gatewayOrder.currency,
      },
    });
    return;
  }
  res.status(201).json(order);

  // Send confirmation emails asynchronously (non-blocking)
  sendOrderEmails({
    items: verifiedItems,
    id: order.id,
    date: order.date,
    phone: order.phone,
    address: formatDeliveryAddress(order.address, order.deliveryAreaName),
    subtotal: order.subtotal,
    pricing,
    status: order.status,
    customerName: order.customerName ?? undefined,
    customerEmail: order.customerEmail ?? undefined,
  }).catch((err) =>
    console.error("Failed to send order emails:", err)
  );
});

router.put("/orders/:id/status", async (req, res) => {
  if (!requireSession(req, res, "admin")) return;
  const { id } = req.params;
  const body = req.body as Record<string, unknown>;
  const status = typeof body.status === "string" ? body.status : undefined;
  const receiverName = typeof body.receiverName === "string" ? body.receiverName.trim() : undefined;
  const deliveryRemarks = typeof body.deliveryRemarks === "string" ? body.deliveryRemarks.trim() : undefined;
  const deliveryContact = typeof body.deliveryContact === "string" ? body.deliveryContact.trim() : undefined;
  const validStatuses = ["Confirmed", "Packing", "Out for delivery", "Delivered"];
  if (!status || !validStatuses.includes(status)) {
    res.status(400).json({ error: "Invalid order status" });
    return;
  }
  const [existing] = await db
    .select()
    .from(ordersTable)
    .where(eq(ordersTable.id, id))
    .limit(1);
  if (!existing) { res.status(404).json({ error: "Not found" }); return; }
  if (existing.paymentMethod === "razorpay" && existing.paymentStatus !== "paid") {
    res.status(409).json({ error: "This online order cannot be fulfilled until payment is confirmed." });
    return;
  }

  const needsDeliveryDetails = status === "Delivered" && existing.status !== "Delivered";
  const deliveryValues = status === "Delivered"
    ? {
        receiverName,
        deliveryRemarks,
        deliveryContact,
      }
    : {};
  if (
    needsDeliveryDetails &&
    (!deliveryValues.receiverName || !deliveryValues.deliveryRemarks || !deliveryValues.deliveryContact)
  ) {
    res.status(400).json({ error: "Receiver name, contact number, and delivery remarks are required" });
    return;
  }
  if (
    needsDeliveryDetails &&
    (
      deliveryValues.receiverName!.length > 100 ||
      deliveryValues.deliveryRemarks!.length > 1000 ||
      deliveryValues.deliveryContact!.length > 30 ||
      deliveryValues.deliveryContact!.replace(/\D/g, "").length < 7
    )
  ) {
    res.status(400).json({ error: "Please enter valid delivery details and contact number" });
    return;
  }

  let updated;
  let shouldSendDeliveryEmail = false;
  if (status === "Delivered") {
    [updated] = await db
      .update(ordersTable)
      .set({ status, ...deliveryValues })
      .where(and(eq(ordersTable.id, id), ne(ordersTable.status, "Delivered")))
      .returning();
    shouldSendDeliveryEmail = Boolean(updated);

    if (!updated) {
      [updated] = await db
        .select()
        .from(ordersTable)
        .where(eq(ordersTable.id, id))
        .limit(1);
    }
  } else {
    [updated] = await db
      .update(ordersTable)
      .set({ status })
      .where(eq(ordersTable.id, id))
      .returning();
  }
  if (!updated) { res.status(404).json({ error: "Not found" }); return; }

  if (shouldSendDeliveryEmail) {
    sendDeliveredOrderEmail({
      id: updated.id,
      date: updated.date,
      phone: updated.phone,
      address: formatDeliveryAddress(updated.address, updated.deliveryAreaName),
      subtotal: updated.subtotal,
      status: updated.status,
      customerEmail: updated.customerEmail ?? undefined,
      items: updated.items as any,
      customerName: updated.customerName ?? undefined,
      receiverName: updated.receiverName ?? undefined,
      deliveryRemarks: updated.deliveryRemarks ?? undefined,
      deliveryContact: updated.deliveryContact ?? undefined,
    }).catch((err) => console.error("Failed to send delivered order email:", err));
  }
  res.json(updated);
});

// Danger zone — admin only
router.delete("/orders/clear", async (_req, res) => {
  if (!requireSession(_req, res, "admin")) return;
  const [payment] = await db.select({ id: orderPaymentsTable.id }).from(orderPaymentsTable).limit(1);
  if (payment) {
    res.status(409).json({ error: "Orders with payment history cannot be cleared. Financial records must be retained." });
    return;
  }
  await db.delete(ordersTable);
  res.json({ cleared: true });
});

export default router;
