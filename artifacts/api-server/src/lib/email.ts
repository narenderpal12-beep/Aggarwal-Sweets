import nodemailer from "nodemailer";

const GMAIL_USER = (process.env.GMAIL_USER ?? "").trim();
const GMAIL_PASS = (process.env.GMAIL_APP_PASSWORD ?? "").replace(/\s/g, "");
const ADMIN_EMAIL = GMAIL_USER; // same inbox receives all admin notifications

export const isEmailConfigured = () => Boolean(GMAIL_USER && GMAIL_PASS);


const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: { user: GMAIL_USER, pass: GMAIL_PASS },
});

// ─── OTP ──────────────────────────────────────────────────────────────────────
export async function sendOtpEmail(to: string, code: string): Promise<void> {
  await transporter.sendMail({
    from: `"Aggarwal Sweets Sirsa" <${GMAIL_USER}>`,
    to,
    subject: `${code} is your Aggarwal Sweets login code`,
    html: `
      <div style="font-family:sans-serif;max-width:480px;margin:auto;padding:32px;background:#fdf8f0;border-radius:16px">
        <h2 style="font-size:22px;color:#1a1a1a;margin:0 0 8px">Your one-time login code</h2>
        <p style="color:#555;margin:0 0 24px">Use this code to sign in to Aggarwal Sweets Sirsa. It expires in <b>10 minutes</b>.</p>
        <div style="font-size:40px;font-weight:800;letter-spacing:10px;color:#2d6a4f;text-align:center;padding:20px;background:#fff;border-radius:12px;border:2px dashed #2d6a4f">
          ${code}
        </div>
        <p style="color:#999;font-size:12px;margin:24px 0 0">If you didn't request this, you can safely ignore this email.</p>
        <hr style="border:none;border-top:1px solid #e8d5b0;margin:24px 0">
        <p style="color:#aaa;font-size:11px;text-align:center">Aggarwal Sweets · Sirsa, Haryana</p>
      </div>
    `,
  });
}

// ─── Order emails ─────────────────────────────────────────────────────────────
interface OrderItem { product: { name: string }; variant: { weight: string; material: string }; quantity: number }
interface Order {
  id: string; date: string; phone: string; address: string;
  subtotal: number; status: string; customerEmail?: string;
  items: OrderItem[];
}

function itemRows(items: OrderItem[]) {
  return items.map(l =>
    `<tr>
      <td style="padding:8px 0;border-bottom:1px solid #f0e8d8">${l.product.name} (${l.variant.weight})</td>
      <td style="padding:8px 0;border-bottom:1px solid #f0e8d8;text-align:right">× ${l.quantity}</td>
    </tr>`
  ).join("");
}

export async function sendOrderEmails(order: Order): Promise<void> {
  if (!isEmailConfigured()) return;

  const ops: Promise<void>[] = [];

  // 1. Customer confirmation (if email available)
  if (order.customerEmail) {
    ops.push(
      transporter.sendMail({
        from: `"Aggarwal Sweets Sirsa" <${GMAIL_USER}>`,
        to: order.customerEmail,
        subject: `Order ${order.id} confirmed — Aggarwal Sweets Sirsa`,
        html: `
          <div style="font-family:sans-serif;max-width:520px;margin:auto;padding:32px;background:#fdf8f0;border-radius:16px">
            <h2 style="font-size:22px;color:#1a1a1a;margin:0 0 4px">We've got your order! 🎉</h2>
            <p style="color:#555;margin:0 0 24px">Thank you for ordering from Aggarwal Sweets Sirsa. Our team will call you shortly to confirm delivery.</p>

            <table style="width:100%;border-collapse:collapse;font-size:14px;color:#333">
              <tr><td style="padding:8px 0;border-bottom:1px solid #f0e8d8;font-weight:bold;color:#2d6a4f" colspan="2">Your Items</td></tr>
              ${itemRows(order.items)}
            </table>

            <div style="margin:20px 0;padding:16px;background:#fff;border-radius:10px;border:1px solid #e8d5b0;font-size:14px">
              <div style="display:flex;justify-content:space-between;margin-bottom:8px"><span>Order ID</span><b style="font-family:monospace">${order.id}</b></div>
              <div style="display:flex;justify-content:space-between;margin-bottom:8px"><span>Total</span><b>₹${order.subtotal}</b></div>
              <div style="display:flex;justify-content:space-between;margin-bottom:8px"><span>Phone</span><b>${order.phone}</b></div>
              <div style="display:flex;justify-content:space-between"><span>Delivery to</span><b>${order.address}</b></div>
            </div>

            <p style="color:#777;font-size:13px;margin:0 0 4px">Payment: <b>Cash on delivery</b> — no advance required.</p>
            <p style="color:#777;font-size:13px;margin:0">Fresh batches packed daily in Sirsa.</p>

            <hr style="border:none;border-top:1px solid #e8d5b0;margin:24px 0">
            <p style="color:#aaa;font-size:11px;text-align:center">Aggarwal Sweets · Sirsa, Haryana</p>
          </div>
        `,
      }).then(() => {})
    );
  }

  // 2. Admin notification (always)
  ops.push(
    transporter.sendMail({
      from: `"Aggarwal Sweets Orders" <${GMAIL_USER}>`,
      to: ADMIN_EMAIL,
      subject: `🛒 New Order ${order.id} — ₹${order.subtotal}`,
      html: `
        <div style="font-family:sans-serif;max-width:520px;margin:auto;padding:32px;background:#f9f9f9;border-radius:16px">
          <h2 style="color:#1a1a1a;margin:0 0 4px">New order received</h2>
          <p style="color:#555;margin:0 0 20px">A new COD order has been placed on the store.</p>

          <table style="width:100%;border-collapse:collapse;font-size:14px;color:#333">
            <tr><td style="padding:8px 0;border-bottom:1px solid #e0e0e0;font-weight:bold;color:#2d6a4f" colspan="2">Order Items</td></tr>
            ${itemRows(order.items)}
          </table>

          <div style="margin:20px 0;padding:16px;background:#fff;border-radius:10px;border:1px solid #e0e0e0;font-size:14px">
            <div style="margin-bottom:8px"><b>Order ID:</b> <span style="font-family:monospace">${order.id}</span></div>
            <div style="margin-bottom:8px"><b>Total:</b> ₹${order.subtotal}</div>
            <div style="margin-bottom:8px"><b>Phone:</b> ${order.phone}</div>
            <div style="margin-bottom:8px"><b>Address:</b> ${order.address}</div>
            <div style="margin-bottom:8px"><b>Customer email:</b> ${order.customerEmail ?? "—"}</div>
            <div><b>Date:</b> ${order.date}</div>
          </div>
        </div>
      `,
    }).then(() => {})
  );

  await Promise.allSettled(ops);
}
