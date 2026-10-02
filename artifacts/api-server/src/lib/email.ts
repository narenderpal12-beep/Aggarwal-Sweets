import nodemailer from "nodemailer";
import { db, adminSettingsTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { generateA4OrderBillPdf } from "./order-bill-a4.js";
import type { BillItem, BillOrder } from "./order-bill.js";

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
type Order = Omit<BillOrder, "pricing"> & {
  status: string;
  receiverName?: string;
  deliveryRemarks?: string;
  deliveryContact?: string;
};

function escapeHtml(value: unknown) {
  return String(value ?? "").replace(/[&<>"']/g, character => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;",
  })[character]!);
}

export async function sendNewsletterContactEmail(contact: {
  name: string;
  email: string;
  mobile: string;
  message: string;
}): Promise<void> {
  if (!isEmailConfigured()) {
    throw new Error("Email notifications are not configured");
  }

  await transporter.sendMail({
    from: `"Aggarwal Sweets Sirsa" <${GMAIL_USER}>`,
    to: ADMIN_EMAIL,
    replyTo: contact.email,
    subject: "New website message — Aggarwal Sweets Sirsa",
    text: [
      "Someone wants to connect with you through the website.",
      "",
      `Name: ${contact.name}`,
      `Mobile: ${contact.mobile}`,
      `Email address: ${contact.email}`,
      "",
      "Message:",
      contact.message,
    ].join("\n"),
    html: `
      <div style="font-family:sans-serif;max-width:520px;margin:auto;padding:32px;background:#fdf8f0;border-radius:16px">
        <h2 style="font-size:22px;color:#1a1a1a;margin:0 0 12px">Someone wants to connect with you</h2>
        <p style="color:#555;margin:0 0 20px">A visitor sent a message through the “A sweet note from us” section.</p>
        <div style="padding:16px;background:#fff;border-radius:10px;border:1px solid #e8d5b0;color:#333">
          <p style="margin:0 0 8px"><b>Name:</b> ${escapeHtml(contact.name)}</p>
          <p style="margin:0 0 8px"><b>Mobile:</b> ${escapeHtml(contact.mobile)}</p>
          <p style="margin:0 0 16px"><b>Email address:</b> ${escapeHtml(contact.email)}</p>
          <p style="margin:0 0 6px"><b>Message:</b></p>
          <p style="margin:0;white-space:pre-wrap">${escapeHtml(contact.message)}</p>
        </div>
      </div>
    `,
  });
}

function itemRows(items: BillItem[]) {
  if (!Array.isArray(items)) return "";
  return items.map(l =>
    `<tr>
      <td style="padding:8px 0;border-bottom:1px solid #f0e8d8">${escapeHtml(l.product?.name ?? "Order item")} (${escapeHtml(l.variant?.weight ?? "Standard")})</td>
      <td style="padding:8px 0;border-bottom:1px solid #f0e8d8;text-align:right">× ${escapeHtml(l.quantity)}</td>
    </tr>`
  ).join("");
}

export async function sendOrderEmails(order: Order & Pick<BillOrder, "pricing">): Promise<void> {
  if (!isEmailConfigured()) return;

  const ops: Promise<void>[] = [];

  // 1. Customer confirmation (if email available)
  if (order.customerEmail) {
    ops.push(
      (async () => {
        const [logoSetting] = await db
          .select({ value: adminSettingsTable.value })
          .from(adminSettingsTable)
          .where(eq(adminSettingsTable.key, "logo_url"))
          .limit(1);
        const billPdf = await generateA4OrderBillPdf(order, logoSetting?.value);
        await transporter.sendMail({
        from: `"Aggarwal Sweets Sirsa" <${GMAIL_USER}>`,
        to: order.customerEmail,
        subject: `Order ${order.id} confirmed — Aggarwal Sweets Sirsa`,
        attachments: [{
          filename: `Aggarwal-Sweets-Bill-${order.id}.pdf`,
          content: billPdf,
          contentType: "application/pdf",
        }],
        html: `
          <div style="font-family:sans-serif;max-width:520px;margin:auto;padding:32px;background:#fdf8f0;border-radius:16px">
            <h2 style="font-size:22px;color:#1a1a1a;margin:0 0 4px">We've got your order! 🎉</h2>
            <p style="color:#555;margin:0 0 24px">Thank you for ordering from Aggarwal Sweets Sirsa. Our team will call you shortly to confirm delivery.</p>

            <table style="width:100%;border-collapse:collapse;font-size:14px;color:#333">
              <tr><td style="padding:8px 0;border-bottom:1px solid #f0e8d8;font-weight:bold;color:#2d6a4f" colspan="2">Your Items</td></tr>
              ${itemRows(order.items)}
            </table>

            <div style="margin:20px 0;padding:16px;background:#fff;border-radius:10px;border:1px solid #e8d5b0;font-size:14px">
               <div style="display:flex;justify-content:space-between;margin-bottom:8px"><span>Order ID</span><b style="font-family:monospace">${escapeHtml(order.id)}</b></div>
               <div style="display:flex;justify-content:space-between;margin-bottom:8px"><span>Total</span><b>₹${escapeHtml(order.subtotal)}</b></div>
               <div style="display:flex;justify-content:space-between;margin-bottom:8px"><span>Phone</span><b>${escapeHtml(order.phone)}</b></div>
               <div style="display:flex;justify-content:space-between"><span>Delivery to</span><b>${escapeHtml(order.address)}</b></div>
            </div>

            <p style="color:#777;font-size:13px;margin:0 0 4px">Your itemized order bill is attached as a PDF.</p>
            <p style="color:#777;font-size:13px;margin:0 0 4px">Payment: <b>${order.paymentMethod === "razorpay" ? "Paid online via Razorpay" : "Cash on delivery"}</b>${order.paymentReference ? ` · Reference ${escapeHtml(order.paymentReference)}` : order.paymentMethod === "razorpay" ? "" : " — no advance required"}.</p>
            <p style="color:#777;font-size:13px;margin:0">Fresh batches packed daily in Sirsa.</p>

            <hr style="border:none;border-top:1px solid #e8d5b0;margin:24px 0">
            <p style="color:#aaa;font-size:11px;text-align:center">Aggarwal Sweets · Sirsa, Haryana</p>
          </div>
        `,
        });
      })()
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
          <p style="color:#555;margin:0 0 20px">A new ${order.paymentMethod === "razorpay" ? "prepaid Razorpay" : "COD"} order has been placed on the store.</p>

          <table style="width:100%;border-collapse:collapse;font-size:14px;color:#333">
            <tr><td style="padding:8px 0;border-bottom:1px solid #e0e0e0;font-weight:bold;color:#2d6a4f" colspan="2">Order Items</td></tr>
            ${itemRows(order.items)}
          </table>

          <div style="margin:20px 0;padding:16px;background:#fff;border-radius:10px;border:1px solid #e0e0e0;font-size:14px">
             <div style="margin-bottom:8px"><b>Order ID:</b> <span style="font-family:monospace">${escapeHtml(order.id)}</span></div>
             <div style="margin-bottom:8px"><b>Total:</b> ₹${escapeHtml(order.subtotal)}</div>
             <div style="margin-bottom:8px"><b>Phone:</b> ${escapeHtml(order.phone)}</div>
             <div style="margin-bottom:8px"><b>Address:</b> ${escapeHtml(order.address)}</div>
             <div style="margin-bottom:8px"><b>Customer email:</b> ${escapeHtml(order.customerEmail ?? "—")}</div>
             <div><b>Date:</b> ${escapeHtml(order.date)}</div>
          </div>
        </div>
      `,
    }).then(() => {})
  );

  const results = await Promise.allSettled(ops);
  const failures = results.filter((result): result is PromiseRejectedResult => result.status === "rejected");
  if (failures.length) {
    throw new AggregateError(failures.map(result => result.reason), `${failures.length} order email(s) failed`);
  }
}

export async function sendDeliveredOrderEmail(order: Order): Promise<void> {
  if (!isEmailConfigured() || !order.customerEmail) return;

  await transporter.sendMail({
    from: `"Aggarwal Sweets Sirsa" <${GMAIL_USER}>`,
    to: order.customerEmail,
    subject: `Order ${order.id} delivered — Aggarwal Sweets Sirsa`,
    html: `
      <div style="font-family:sans-serif;max-width:520px;margin:auto;padding:32px;background:#fdf8f0;border-radius:16px">
        <h2 style="font-size:22px;color:#1a1a1a;margin:0 0 4px">Your order has been delivered</h2>
        <p style="color:#555;margin:0 0 24px">Thank you for ordering from Aggarwal Sweets Sirsa. We hope your sweets arrived fresh and delicious.</p>

        <table style="width:100%;border-collapse:collapse;font-size:14px;color:#333">
          <tr><td style="padding:8px 0;border-bottom:1px solid #f0e8d8;font-weight:bold;color:#2d6a4f" colspan="2">Delivered order</td></tr>
          ${itemRows(order.items)}
        </table>

        <div style="margin:20px 0;padding:16px;background:#fff;border-radius:10px;border:1px solid #e8d5b0;font-size:14px">
          <div style="display:flex;justify-content:space-between;margin-bottom:8px"><span>Order ID</span><b style="font-family:monospace">${escapeHtml(order.id)}</b></div>
          <div style="display:flex;justify-content:space-between;margin-bottom:8px"><span>Total</span><b>₹${escapeHtml(order.subtotal)}</b></div>
          <div style="display:flex;justify-content:space-between;margin-bottom:8px"><span>Delivered to</span><b>${escapeHtml(order.receiverName ?? "—")}</b></div>
          <div style="display:flex;justify-content:space-between;margin-bottom:8px"><span>Receiver contact</span><b>${escapeHtml(order.deliveryContact ?? "—")}</b></div>
          <div style="display:flex;justify-content:space-between"><span>Delivery address</span><b>${escapeHtml(order.address)}</b></div>
        </div>

        <div style="margin:20px 0;padding:16px;background:#fff;border-radius:10px;border:1px solid #e8d5b0;font-size:14px">
          <b>Delivery remarks</b>
          <p style="margin:8px 0 0;color:#555">${escapeHtml(order.deliveryRemarks ?? "No remarks added.")}</p>
        </div>

        <hr style="border:none;border-top:1px solid #e8d5b0;margin:24px 0">
        <p style="color:#aaa;font-size:11px;text-align:center">Aggarwal Sweets · Sirsa, Haryana</p>
      </div>
    `,
  });
}
