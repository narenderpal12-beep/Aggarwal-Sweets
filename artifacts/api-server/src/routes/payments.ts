import { randomUUID } from "node:crypto";
import { Router, type Request, type Response } from "express";
import { db, adminSettingsTable, orderPaymentsTable, ordersTable, type DbOrderPayment } from "@workspace/db";
import { and, desc, eq, sql } from "drizzle-orm";
import { requireSession } from "../lib/session.js";
import {
  createGatewayOrder, fetchGatewayOrderPayments, fetchGatewayPayment,
  razorpayAvailable, razorpayKeyId, verifyCheckoutSignature, verifyWebhookSignature,
  type GatewayPayment,
} from "../lib/razorpay.js";
import { markPaymentFailed, reconcileGatewayPayment, recordGatewayRefund } from "../lib/payment-service.js";

const router = Router();

function publicPayment(row: DbOrderPayment) {
  return {
    id: row.id,
    orderId: row.orderId,
    customerEmail: row.customerEmail,
    method: row.method,
    status: row.status,
    amountPaise: row.amountPaise,
    refundedPaise: row.refundedPaise,
    currency: row.currency,
    gatewayPaymentId: row.gatewayPaymentId,
    failureReason: row.failureReason,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

function checkoutPayload(gatewayOrderId: string, amountPaise: number) {
  return { keyId: razorpayKeyId(), gatewayOrderId, amountPaise, currency: "INR" };
}

router.get("/payments/availability", async (_req, res) => {
  const [codSetting] = await db.select({ value: adminSettingsTable.value }).from(adminSettingsTable)
    .where(eq(adminSettingsTable.key, "cod_enabled")).limit(1);
  res.json({ razorpay: razorpayAvailable(), cod: codSetting?.value !== "false" });
});

router.get("/payments/mine", async (req, res) => {
  const session = requireSession(req, res, "customer");
  if (!session) return;
  const rows = await db.select().from(orderPaymentsTable)
    .where(eq(orderPaymentsTable.customerEmail, session.email))
    .orderBy(desc(orderPaymentsTable.createdAt));
  res.json(rows.map(publicPayment));
});

router.get("/payments", async (req, res) => {
  if (!requireSession(req, res, "admin")) return;
  const rows = await db.select().from(orderPaymentsTable).orderBy(desc(orderPaymentsTable.createdAt));
  res.json(rows.map(publicPayment));
});

router.post("/payments/razorpay/verify", async (req, res) => {
  const session = requireSession(req, res, "customer");
  if (!session) return;
  const { razorpay_order_id: orderId, razorpay_payment_id: paymentId, razorpay_signature: signature } = req.body ?? {};
  if (typeof orderId !== "string" || typeof paymentId !== "string" || typeof signature !== "string" ||
      !/^order_[\w-]+$/.test(orderId) || !/^pay_[\w-]+$/.test(paymentId)) {
    res.status(400).json({ error: "Invalid payment response." });
    return;
  }
  const [attempt] = await db.select().from(orderPaymentsTable).where(and(
    eq(orderPaymentsTable.gatewayOrderId, orderId),
    eq(orderPaymentsTable.customerEmail, session.email),
    eq(orderPaymentsTable.method, "razorpay"),
  )).limit(1);
  if (!attempt || !verifyCheckoutSignature(attempt.gatewayOrderId!, paymentId, signature)) {
    res.status(400).json({ error: "Payment verification failed. Your order has not been confirmed." });
    return;
  }
  try {
    const gatewayPayment = await fetchGatewayPayment(paymentId);
    const order = await reconcileGatewayPayment(attempt, gatewayPayment);
    const [updatedAttempt] = await db.select({ status: orderPaymentsTable.status }).from(orderPaymentsTable)
      .where(eq(orderPaymentsTable.id, attempt.id)).limit(1);
    if (updatedAttempt?.status === "duplicate_capture") {
      res.status(409).json({ error: "An extra payment was captured for this order. Do not pay again; contact the store for a refund." });
      return;
    }
    if (!order || order.paymentStatus !== "paid") {
      res.status(409).json({ error: "Payment has not been captured yet. Check My Orders before paying again." });
      return;
    }
    res.json({ order });
  } catch (error) {
    console.error("Could not verify Razorpay payment:", error);
    res.status(502).json({ error: "Payment could not be confirmed yet. Please check My Orders before paying again." });
  }
});

// Reuse a provider order only if no payment was attempted. Razorpay requires a
// fresh provider order for every new payment attempt after a failure.
router.post("/payments/orders/:id/checkout", async (req, res) => {
  const session = requireSession(req, res, "customer");
  if (!session) return;
  if (!razorpayAvailable()) {
    res.status(503).json({ error: "Online payments are currently unavailable." });
    return;
  }
  const [order] = await db.select().from(ordersTable).where(and(
    eq(ordersTable.id, req.params.id),
    eq(ordersTable.customerEmail, session.email),
    eq(ordersTable.paymentMethod, "razorpay"),
  )).limit(1);
  if (!order) { res.status(404).json({ error: "Payment order not found." }); return; }
  if (order.paymentStatus === "paid") { res.json({ order, alreadyPaid: true }); return; }
  if (order.paymentStatus === "refunded") {
    res.status(409).json({ error: "This payment was refunded and cannot be paid again." });
    return;
  }
  const attempts = await db.select().from(orderPaymentsTable)
    .where(eq(orderPaymentsTable.orderId, order.id))
    .orderBy(desc(orderPaymentsTable.createdAt));
  const last = attempts[0];
  let racePayment: { attempt: DbOrderPayment; payment: GatewayPayment } | null = null;
  let raceProcessing = false;
  try {
    let reuseLast = false;
    // Check older attempts too: a delayed capture must never be followed by
    // another checkout for the same order.
    for (const attempt of attempts) {
      if (!attempt.gatewayOrderId) continue;
      const providerPayments = await fetchGatewayOrderPayments(attempt.gatewayOrderId);
      const successful = providerPayments.find(payment => payment.status === "captured" || payment.status === "authorized");
      if (successful) {
        const reconciled = await reconcileGatewayPayment(attempt, successful);
        if (reconciled?.paymentStatus === "paid") {
          res.json({ order: reconciled, alreadyPaid: true });
          return;
        }
        res.status(409).json({ error: "Payment is processing. Please check My Orders shortly." });
        return;
      }
      if (providerPayments.some(payment => payment.status !== "failed")) {
        res.status(409).json({ error: "A payment is still processing. Please check My Orders shortly." });
        return;
      }
      if (attempt.id === last?.id && providerPayments.length === 0 && last.status === "created") reuseLast = true;
    }
    if (reuseLast && last?.gatewayOrderId) {
      res.json({ order, checkout: checkoutPayload(last.gatewayOrderId, last.amountPaise) });
      return;
    }
    const providerOrder = await createGatewayOrder(order.subtotal * 100);
    await db.transaction(async tx => {
      await tx.execute(sql`select pg_advisory_xact_lock(hashtext(${order.id}))`);
      const [freshOrder] = await tx.select().from(ordersTable).where(eq(ordersTable.id, order.id)).limit(1);
      const [latest] = await tx.select().from(orderPaymentsTable)
        .where(eq(orderPaymentsTable.orderId, order.id))
        .orderBy(desc(orderPaymentsTable.createdAt)).limit(1);
      if (!freshOrder || freshOrder.paymentStatus === "paid" || latest?.id !== last?.id) {
        throw new Error("Order was already updated");
      }
      // Recheck while holding the same per-order lock used by payment capture.
      // A charge can settle between the first gateway scan and this transaction.
      for (const previous of attempts) {
        if (!previous.gatewayOrderId) continue;
        const providerPayments = await fetchGatewayOrderPayments(previous.gatewayOrderId);
        const successful = providerPayments.find(payment =>
          payment.status === "captured" || payment.status === "authorized");
        if (successful) {
          racePayment = { attempt: previous, payment: successful };
          throw new Error("Payment settled during checkout retry");
        }
        if (providerPayments.some(payment => payment.status !== "failed")) {
          raceProcessing = true;
          throw new Error("Payment processing during checkout retry");
        }
      }
      await tx.insert(orderPaymentsTable).values({
        id: randomUUID(),
        orderId: order.id,
        customerEmail: session.email,
        method: "razorpay",
        status: "created",
        amountPaise: providerOrder.amount,
        gatewayOrderId: providerOrder.id,
      });
      await tx.update(ordersTable).set({ status: "Awaiting payment", paymentStatus: "pending" })
        .where(eq(ordersTable.id, order.id));
    });
    res.json({ order: { ...order, status: "Awaiting payment", paymentStatus: "pending" },
      checkout: checkoutPayload(providerOrder.id, providerOrder.amount) });
  } catch (error) {
    if (racePayment) {
      try {
        const { attempt, payment } = racePayment as { attempt: DbOrderPayment; payment: GatewayPayment };
        const reconciled = await reconcileGatewayPayment(attempt, payment);
        if (reconciled?.paymentStatus === "paid") {
          res.json({ order: reconciled, alreadyPaid: true });
          return;
        }
      } catch (reconcileError) {
        console.error("Could not reconcile a payment during retry:", reconcileError);
      }
      res.status(409).json({ error: "Payment is processing. Please check My Orders before paying again." });
      return;
    }
    if (raceProcessing) {
      res.status(409).json({ error: "A payment is still processing. Please check My Orders shortly." });
      return;
    }
    const [current] = await db.select().from(ordersTable).where(eq(ordersTable.id, order.id)).limit(1);
    if (current?.paymentStatus === "paid") {
      res.json({ order: current, alreadyPaid: true });
      return;
    }
    console.error("Could not reopen Razorpay checkout:", error);
    res.status(502).json({ error: "Could not reopen secure checkout. Please try again shortly." });
  }
});

router.put("/payments/cod/:id/received", async (req, res) => {
  if (!requireSession(req, res, "admin")) return;
  const [order] = await db.select().from(ordersTable).where(and(
    eq(ordersTable.id, req.params.id), eq(ordersTable.paymentMethod, "cod"),
  )).limit(1);
  if (!order) { res.status(404).json({ error: "Cash order not found." }); return; }
  if (order.status !== "Delivered") {
    res.status(409).json({ error: "Cash can only be marked received after delivery." });
    return;
  }
  if (order.paymentStatus !== "paid") {
    await db.transaction(async tx => {
      const [changed] = await tx.update(ordersTable).set({ paymentStatus: "paid" })
        .where(and(
          eq(ordersTable.id, order.id),
          eq(ordersTable.status, "Delivered"),
          eq(ordersTable.paymentStatus, "pending"),
        )).returning();
      if (!changed) return;
      const [payment] = await tx.select().from(orderPaymentsTable)
        .where(and(eq(orderPaymentsTable.orderId, order.id), eq(orderPaymentsTable.method, "cod"))).limit(1);
      if (payment) {
        await tx.update(orderPaymentsTable).set({ status: "received", updatedAt: new Date() })
          .where(eq(orderPaymentsTable.id, payment.id));
      } else {
        // Historical COD orders predate the payment table.
        await tx.insert(orderPaymentsTable).values({
          id: randomUUID(), orderId: order.id, customerEmail: order.customerEmail ?? "",
          method: "cod", status: "received", amountPaise: order.subtotal * 100,
        });
      }
    });
  }
  const [updated] = await db.select().from(ordersTable).where(eq(ordersTable.id, order.id)).limit(1);
  if (updated.paymentStatus !== "paid") {
    res.status(409).json({ error: "This order changed before cash collection could be recorded. Refresh and try again." });
    return;
  }
  res.json(updated);
});

export async function handleRazorpayWebhook(req: Request, res: Response) {
  if (!Buffer.isBuffer(req.body) || !razorpayAvailable()) {
    res.status(503).json({ error: "Razorpay webhook unavailable." });
    return;
  }
  if (!verifyWebhookSignature(req.body, req.get("x-razorpay-signature") ?? "")) {
    res.status(401).json({ error: "Invalid webhook signature." });
    return;
  }
  try {
    const event = JSON.parse(req.body.toString("utf8")) as {
      event?: string;
      payload?: { payment?: { entity?: GatewayPayment }; refund?: { entity?: { payment_id?: string } } };
    };
    const payment = event.payload?.payment?.entity;
    if (payment && ["payment.authorized", "payment.captured", "payment.failed", "payment.refunded"].includes(event.event ?? "")) {
      const [attempt] = await db.select().from(orderPaymentsTable)
        .where(eq(orderPaymentsTable.gatewayOrderId, payment.order_id)).limit(1);
      if (attempt && payment.amount === attempt.amountPaise && payment.currency === "INR") {
        if (event.event === "payment.failed") await markPaymentFailed(attempt, payment.error_description);
        else if (event.event === "payment.refunded") {
          await recordGatewayRefund(attempt, await fetchGatewayPayment(payment.id));
        } else {
          await reconcileGatewayPayment(attempt, payment);
        }
      }
    } else if (event.event === "refund.processed" && event.payload?.refund?.entity?.payment_id) {
      const gatewayPayment = await fetchGatewayPayment(event.payload.refund.entity.payment_id);
      const [attempt] = await db.select().from(orderPaymentsTable)
        .where(eq(orderPaymentsTable.gatewayPaymentId, gatewayPayment.id)).limit(1);
      if (attempt) await recordGatewayRefund(attempt, gatewayPayment);
    }
    res.status(200).json({ received: true });
  } catch (error) {
    console.error("Could not process Razorpay webhook:", error);
    res.status(500).json({ error: "Webhook processing failed." });
  }
}

export default router;