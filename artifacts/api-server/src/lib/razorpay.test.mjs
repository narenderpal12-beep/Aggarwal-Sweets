import assert from "node:assert/strict";
import { createHmac } from "node:crypto";
import test from "node:test";
import {
  createGatewayOrder, razorpayAvailable, verifyCheckoutSignature, verifyWebhookSignature,
} from "./razorpay.ts";

// Test-only credentials; no live keys or network calls are used here.
process.env.RAZORPAY_KEY_ID = "rzp_test_local_only";
process.env.RAZORPAY_KEY_SECRET = "test_secret_local_only";
process.env.RAZORPAY_WEBHOOK_SECRET = "test_webhook_local_only";

test("requires every merchant setting before enabling checkout", () => {
  assert.equal(razorpayAvailable(), true);
});

test("verifies the provider checkout signature using the server order id", () => {
  const expected = createHmac("sha256", "test_secret_local_only").update("order_123|pay_456").digest("hex");
  assert.equal(verifyCheckoutSignature("order_123", "pay_456", expected), true);
  assert.equal(verifyCheckoutSignature("order_other", "pay_456", expected), false);
  assert.equal(verifyCheckoutSignature("order_123", "pay_other", expected), false);
  assert.equal(verifyCheckoutSignature("order_123", "pay_456", "not a signature"), false);
});

test("verifies webhooks using the original raw bytes", () => {
  const raw = Buffer.from(' { "event":"payment.captured" } ');
  const expected = createHmac("sha256", "test_webhook_local_only").update(raw).digest("hex");
  assert.equal(verifyWebhookSignature(raw, expected), true);
  assert.equal(verifyWebhookSignature(Buffer.from(raw.toString().trim()), expected), false);
  assert.equal(verifyWebhookSignature(raw, "0".repeat(64)), false);
});

test("creates an INR order in paise without calling the live gateway", async () => {
  const previousFetch = globalThis.fetch;
  globalThis.fetch = async (url, options) => {
    assert.equal(url, "https://api.razorpay.com/v1/orders");
    assert.equal(options.method, "POST");
    const body = JSON.parse(options.body);
    assert.equal(body.amount, 12300);
    assert.equal(body.currency, "INR");
    assert.ok(body.receipt.startsWith("as-"));
    return new Response(JSON.stringify({ id: "order_fake123", amount: 12300, currency: "INR", status: "created" }), { status: 200 });
  };
  try {
    const order = await createGatewayOrder(12300);
    assert.equal(order.id, "order_fake123");
  } finally {
    globalThis.fetch = previousFetch;
  }
});