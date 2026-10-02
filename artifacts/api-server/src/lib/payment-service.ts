import { db, orderPaymentsTable, ordersTable, type DbOrder, type DbOrderPayment } from "@workspace/db";
import { and, desc, eq, notInArray, sql } from "drizzle-orm";
import { sendOrderEmails } from "./email.js";
import type { BillItem, BillPricing } from "./order-bill.js";
import { captureGatewayPayment, type GatewayPayment } from "./razorpay.js";
import { formatDeliveryAddress } from "./delivery-address.js";

function sendConfirmation(order: DbOrder, paymentReference: string) {
  sendOrderEmails({
    id: order.id,
    date: order.date,
    phone: order.phone,
    address: formatDeliveryAddress(order.address, order.deliveryAreaName),
    subtotal: order.subtotal,
    items: order.items as BillItem[],
    pricing: order.pricing as BillPricing,
    status: order.status,
    customerName: order.customerName ?? undefined,
    customerEmail: order.customerEmail ?? undefined,
    paymentMethod: "razorpay",
    paymentReference,
  }).catch(error => console.error("Failed to send paid order emails:", error));
}

function matchesAttempt(attempt: DbOrderPayment, payment: GatewayPayment) {
  return payment.id.startsWith("pay_") &&
    attempt.gatewayOrderId === payment.order_id &&
    payment.amount === attempt.amountPaise &&
    payment.currency === attempt.currency;
}

export async function markPaymentFailed(attempt: DbOrderPayment, reason?: string | null) {
  await db.transaction(async tx => {
    const [changed] = await tx.update(orderPaymentsTable).set({
      status: "failed",
      failureReason: reason?.slice(0, 500) ?? null,
      updatedAt: new Date(),
    }).where(and(
      eq(orderPaymentsTable.id, attempt.id),
      notInArray(orderPaymentsTable.status, ["captured", "duplicate_capture", "refunded", "partially_refunded"]),
    )).returning();
    const [latest] = await tx.select({ id: orderPaymentsTable.id }).from(orderPaymentsTable)
      .where(eq(orderPaymentsTable.orderId, attempt.orderId))
      .orderBy(desc(orderPaymentsTable.createdAt)).limit(1);
    if (changed && latest?.id === attempt.id) {
      await tx.update(ordersTable).set({ status: "Payment failed", paymentStatus: "failed" })
        .where(and(eq(ordersTable.id, attempt.orderId), eq(ordersTable.paymentStatus, "pending")));
    }
  });
}

export async function reconcileGatewayPayment(attempt: DbOrderPayment, initial: GatewayPayment): Promise<DbOrder | null> {
  if (!matchesAttempt(attempt, initial)) throw new Error("Razorpay payment does not match this order");
  if (attempt.status === "refunded" || attempt.status === "partially_refunded") {
    const [order] = await db.select().from(ordersTable).where(eq(ordersTable.id, attempt.orderId)).limit(1);
    return order ?? null;
  }
  let payment = initial;
  if (payment.status === "authorized") {
    try {
      payment = await captureGatewayPayment(payment.id, attempt.amountPaise);
    } catch {
      // Auto-capture may win the race with this explicit capture request.
      const { fetchGatewayPayment } = await import("./razorpay.js");
      payment = await fetchGatewayPayment(payment.id);
    }
    if (!matchesAttempt(attempt, payment)) throw new Error("Captured payment does not match this order");
  }
  if (payment.status === "failed") {
    await markPaymentFailed(attempt, payment.error_description);
    return null;
  }
  if (payment.status !== "captured") return null;

  const result = await db.transaction(async tx => {
    await tx.execute(sql`select pg_advisory_xact_lock(hashtext(${attempt.orderId}))`);
    const [before] = await tx.select().from(ordersTable).where(eq(ordersTable.id, attempt.orderId)).limit(1);
    if (!before) throw new Error("Payment order is missing");
    const duplicate = Boolean(before.paidPaymentId && before.paidPaymentId !== payment.id);
    await tx.update(orderPaymentsTable).set({
      status: duplicate ? "duplicate_capture" : "captured",
      gatewayPaymentId: payment.id,
      failureReason: null,
      updatedAt: new Date(),
    }).where(and(
      eq(orderPaymentsTable.id, attempt.id),
      notInArray(orderPaymentsTable.status, ["refunded", "partially_refunded"]),
    ));
    const [confirmed] = await tx.update(ordersTable).set({
      status: "Confirmed", paymentStatus: "paid", paidPaymentId: payment.id,
    }).where(and(
      eq(ordersTable.id, attempt.orderId),
      eq(ordersTable.paymentMethod, "razorpay"),
      eq(ordersTable.paymentStatus, "pending"),
      sql`${ordersTable.paidPaymentId} is null`,
    )).returning();
    // A failed checkout can be recovered by a later valid capture/webhook.
    const [recovered] = confirmed ? [confirmed] : await tx.update(ordersTable).set({
      status: "Confirmed", paymentStatus: "paid", paidPaymentId: payment.id,
    }).where(and(
      eq(ordersTable.id, attempt.orderId),
      eq(ordersTable.paymentMethod, "razorpay"),
      eq(ordersTable.paymentStatus, "failed"),
      sql`${ordersTable.paidPaymentId} is null`,
    )).returning();
    const [order] = recovered ? [recovered] : await tx.select().from(ordersTable)
      .where(eq(ordersTable.id, attempt.orderId)).limit(1);
    return { order, newlyConfirmed: Boolean(recovered), duplicate };
  });
  if (!result.order) throw new Error("Payment order is missing");
  if (result.duplicate && attempt.status !== "duplicate_capture") {
    console.error("Duplicate Razorpay capture requires a manual refund:", {
      orderId: attempt.orderId, paymentId: payment.id,
    });
  }
  if (result.newlyConfirmed) sendConfirmation(result.order, payment.id);
  return result.order;
}

export async function recordGatewayRefund(attempt: DbOrderPayment, payment: GatewayPayment) {
  if (!matchesAttempt(attempt, payment)) throw new Error("Refund does not match this order");
  const refunded = Math.min(attempt.amountPaise, Math.max(0, payment.amount_refunded ?? 0));
  if (!refunded) return;
  await db.transaction(async tx => {
    await tx.execute(sql`select pg_advisory_xact_lock(hashtext(${attempt.orderId}))`);
    await tx.update(orderPaymentsTable).set({
      status: refunded >= attempt.amountPaise ? "refunded" : "partially_refunded",
      refundedPaise: refunded,
      gatewayPaymentId: payment.id,
      updatedAt: new Date(),
    }).where(eq(orderPaymentsTable.id, attempt.id));
    const payments = await tx.select().from(orderPaymentsTable)
      .where(and(eq(orderPaymentsTable.orderId, attempt.orderId), eq(orderPaymentsTable.method, "razorpay")));
    const outstandingPaise = payments.reduce((sum, row) =>
      ["captured", "duplicate_capture", "partially_refunded"].includes(row.status)
        ? sum + Math.max(0, row.amountPaise - row.refundedPaise) : sum, 0);
    await tx.update(ordersTable).set({ paymentStatus: outstandingPaise > 0 ? "paid" : "refunded" })
      .where(and(eq(ordersTable.id, attempt.orderId), sql`${ordersTable.paidPaymentId} is not null`));
  });
}