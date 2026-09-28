import { createHmac, randomUUID, timingSafeEqual } from "node:crypto";

const endpoint = "https://api.razorpay.com/v1";

export type GatewayOrder = {
  id: string;
  amount: number;
  currency: string;
  status: string;
};

export type GatewayPayment = {
  id: string;
  order_id: string;
  amount: number;
  currency: string;
  status: string;
  amount_refunded?: number;
  error_description?: string | null;
};

export function razorpayAvailable(): boolean {
  return Boolean(process.env.RAZORPAY_KEY_ID?.trim() &&
    process.env.RAZORPAY_KEY_SECRET?.trim() && process.env.RAZORPAY_WEBHOOK_SECRET?.trim());
}

export function razorpayKeyId(): string {
  if (!razorpayAvailable()) throw new Error("Razorpay is not configured");
  return process.env.RAZORPAY_KEY_ID!.trim();
}

async function request<T>(path: string, method = "GET", body?: object): Promise<T> {
  if (!razorpayAvailable()) throw new Error("Razorpay is not configured");
  const credential = Buffer.from(
    `${process.env.RAZORPAY_KEY_ID!.trim()}:${process.env.RAZORPAY_KEY_SECRET!.trim()}`,
  ).toString("base64");
  const response = await fetch(`${endpoint}${path}`, {
    method,
    headers: {
      Authorization: `Basic ${credential}`,
      "Content-Type": "application/json",
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
    signal: AbortSignal.timeout(15000),
  });
  if (!response.ok) throw new Error(`Razorpay request failed (HTTP ${response.status})`);
  return response.json() as Promise<T>;
}

export async function createGatewayOrder(amountPaise: number): Promise<GatewayOrder> {
  if (!Number.isSafeInteger(amountPaise) || amountPaise < 100) throw new Error("Invalid payment amount");
  const receipt = `as-${randomUUID()}`;
  const order = await request<GatewayOrder>("/orders", "POST", {
    amount: amountPaise,
    currency: "INR",
    receipt,
  });
  if (!order.id?.startsWith("order_") || order.amount !== amountPaise || order.currency !== "INR") {
    throw new Error("Razorpay returned an unexpected order");
  }
  return order;
}

export async function fetchGatewayPayment(id: string): Promise<GatewayPayment> {
  return request<GatewayPayment>(`/payments/${encodeURIComponent(id)}`);
}

export async function captureGatewayPayment(id: string, amountPaise: number): Promise<GatewayPayment> {
  return request<GatewayPayment>(`/payments/${encodeURIComponent(id)}/capture`, "POST", {
    amount: amountPaise, currency: "INR",
  });
}

export async function fetchGatewayOrderPayments(orderId: string): Promise<GatewayPayment[]> {
  const result = await request<{ items: GatewayPayment[] }>(`/orders/${encodeURIComponent(orderId)}/payments`);
  if (!Array.isArray(result.items)) throw new Error("Razorpay returned an unexpected payment list");
  return result.items;
}

function matchesHmac(secret: string, message: string | Buffer, signature: string): boolean {
  if (!/^[a-f0-9]{64}$/i.test(signature)) return false;
  const expected = createHmac("sha256", secret).update(message).digest();
  const received = Buffer.from(signature, "hex");
  return received.length === expected.length && timingSafeEqual(expected, received);
}

export function verifyCheckoutSignature(orderId: string, paymentId: string, signature: string): boolean {
  const secret = process.env.RAZORPAY_KEY_SECRET?.trim();
  return Boolean(secret && matchesHmac(secret, `${orderId}|${paymentId}`, signature));
}

export function verifyWebhookSignature(rawBody: Buffer, signature: string): boolean {
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET?.trim();
  return Boolean(secret && matchesHmac(secret, rawBody, signature));
}