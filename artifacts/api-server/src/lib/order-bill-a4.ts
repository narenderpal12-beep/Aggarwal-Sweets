import type { TDocumentDefinitions, TableCell } from "pdfmake/interfaces";
import { createPdfBuffer } from "./pdf-renderer.js";
import type { BillOrder } from "./order-bill.js";

const money = (value: number) =>
  `INR ${value.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const sellerGstin = "06ADEPK5604P1ZC";

function isEmbeddedLogo(value?: string): value is string {
  return typeof value === "string" &&
    /^data:image\/(?:png|jpe?g);base64,[A-Za-z0-9+/]+={0,2}$/.test(value);
}

function indianNumberInWords(value: number): string {
  const ones = [
    "zero", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine",
    "ten", "eleven", "twelve", "thirteen", "fourteen", "fifteen", "sixteen", "seventeen", "eighteen", "nineteen",
  ];
  const tens = ["", "", "twenty", "thirty", "forty", "fifty", "sixty", "seventy", "eighty", "ninety"];
  if (value < 20) return ones[value];
  if (value < 100) return `${tens[Math.floor(value / 10)]}${value % 10 ? ` ${ones[value % 10]}` : ""}`;

  for (const [unit, label] of [[10_000_000, "crore"], [100_000, "lakh"], [1_000, "thousand"], [100, "hundred"]] as const) {
    if (value >= unit) {
      const quotient = Math.floor(value / unit);
      const remainder = value % unit;
      return `${indianNumberInWords(quotient)} ${label}${remainder ? ` ${indianNumberInWords(remainder)}` : ""}`;
    }
  }
  return "";
}

function amountInIndianWords(amount: number): string {
  const totalPaise = Math.round(amount * 100);
  const rupees = Math.floor(totalPaise / 100);
  const paise = totalPaise % 100;
  const capitalize = (text: string) => text.charAt(0).toUpperCase() + text.slice(1);
  return `Indian Rupees ${capitalize(indianNumberInWords(rupees))}${paise ? ` and ${capitalize(indianNumberInWords(paise))} Paise` : ""} Only`;
}

export async function generateA4OrderBillPdf(order: BillOrder, logoDataUrl?: string): Promise<Buffer> {
  const paidOnline = order.paymentMethod === "razorpay" && order.paymentStatus === "paid";
  const refunded = order.paymentStatus === "refunded";
  const date = new Date(order.date);
  const amounts = [
    order.subtotal, order.pricing.itemsSubtotal, order.pricing.discount,
    order.pricing.gstPercent, order.pricing.gst, order.pricing.deliveryCharge,
    order.pricing.handlingCharge, order.pricing.total,
  ];
  if (Number.isNaN(date.getTime()) || !order.items.length || order.items.length > 200 ||
      amounts.some(value => !Number.isFinite(value) || value < 0) ||
      order.items.some(item => !Number.isInteger(item.quantity) || item.quantity < 1 ||
        !Number.isFinite(item.variant.price) || item.variant.price < 0 ||
        typeof item.product?.name !== "string" || item.product.name.length > 300 ||
        typeof item.variant.material !== "string" || item.variant.material.length > 100 ||
        typeof item.variant.weight !== "string" || item.variant.weight.length > 100) ||
      Math.round(order.items.reduce((sum, item) => sum + item.variant.price * item.quantity, 0) * 100) !==
        Math.round(order.pricing.itemsSubtotal * 100) ||
      Math.round(order.subtotal * 100) !== Math.round(order.pricing.total * 100)) {
    throw new Error(`Cannot generate bill for order ${order.id}: invalid order amounts or date`);
  }

  const orderDate = new Intl.DateTimeFormat("en-IN", {
    timeZone: "Asia/Kolkata", dateStyle: "medium", timeStyle: "short",
  }).format(date);

  const headerCell = (text: string, alignment: "left" | "center" | "right" = "left"): TableCell => ({
    text, bold: true, color: "#ffffff", fillColor: "#164735",
    fontSize: 8, alignment, margin: [6, 7, 6, 7],
  });
  const detailCell = (text: string, alignment: "left" | "center" | "right" = "left"): TableCell => ({
    text, fontSize: 8, alignment, margin: [6, 6, 6, 6],
  });
  const itemRows: TableCell[][] = [
    [headerCell("NO.", "center"), headerCell("PARTICULARS"), headerCell("QTY", "right"),
      headerCell("UNIT PRICE", "right"), headerCell("AMOUNT", "right")],
    ...order.items.map((item, index): TableCell[] => [
      detailCell(String(index + 1), "center"),
      {
        stack: [
          { text: item.product.name, bold: true, fontSize: 8 },
          { text: `${item.variant.material} / ${item.variant.weight}`, fontSize: 7, color: "#64746d" },
          ...(item.product.description
            ? [{ text: item.product.description, fontSize: 7, color: "#64746d" }]
            : []),
        ],
        fontSize: 8, margin: [6, 6, 6, 6],
      },
      detailCell(String(item.quantity), "right"),
      detailCell(money(item.variant.price), "right"),
      detailCell(money(item.variant.price * item.quantity), "right"),
    ]),
  ];

  const totalLabel = refunded ? "ORDER TOTAL · PAYMENT REFUNDED" : paidOnline ? "TOTAL PAID" : "TOTAL DUE";
  const totalRows: TableCell[][] = [
    [detailCell("Items subtotal"), detailCell(money(order.pricing.itemsSubtotal), "right")],
    ...(order.pricing.discount > 0 ? [[
      detailCell(`Discount${order.pricing.couponCode ? ` (${order.pricing.couponCode})` : ""}`),
      detailCell(`− ${money(order.pricing.discount)}`, "right"),
    ]] : []),
    [detailCell(`GST (${order.pricing.gstPercent}%)`), detailCell(money(order.pricing.gst), "right")],
    ...(order.pricing.deliveryWaived || order.pricing.deliveryCharge > 0 ? [[
      detailCell(order.pricing.deliveryWaived ? "Delivery (waived)" : "Delivery charge"),
      detailCell(money(order.pricing.deliveryCharge), "right"),
    ]] : []),
    ...(order.pricing.handlingCharge > 0 ? [[
      detailCell("Handling charge"), detailCell(money(order.pricing.handlingCharge), "right"),
    ]] : []),
    [
      { text: totalLabel, bold: true, color: "#164735", fillColor: "#edf4ef", fontSize: 10, margin: [6, 7, 6, 7] },
      { text: money(order.pricing.total), alignment: "right", bold: true, color: "#164735", fillColor: "#edf4ef", fontSize: 10, margin: [6, 7, 6, 7] },
    ],
  ];

  const paymentText = refunded
    ? "This order payment has been refunded. This document is an order bill, not a formal tax invoice."
    : paidOnline
      ? `Paid online via Razorpay${order.paymentReference ? ` · Reference ${order.paymentReference}` : ""}. This order bill is not a formal tax invoice.`
      : order.paymentMethod === "razorpay"
        ? "Online payment via Razorpay is pending. This bill shows the amount due; it is not a payment receipt."
        : "Cash on delivery. This bill shows the amount due when your order is delivered; it is not a payment receipt.";

  const document: TDocumentDefinitions = {
    pageSize: "A4",
    pageMargins: [38, 34, 38, 48],
    info: { title: `Order bill ${order.id}`, author: "Aggarwal Sweets Sirsa" },
    defaultStyle: { font: "Roboto", fontSize: 8, color: "#20362d" },
    content: [
      {
        stack: [
          isEmbeddedLogo(logoDataUrl)
            ? { image: logoDataUrl, fit: [190, 52], alignment: "center", margin: [0, 0, 0, 4] }
            : { text: "AGGARWAL SWEETS", fontSize: 17, bold: true, color: "#164735", alignment: "center" },
          { text: "ORDER BILL", fontSize: 13, bold: true, alignment: "center", margin: [0, 2, 0, 0] },
          { text: "CUSTOMER COPY", fontSize: 7, bold: true, color: "#64746d", characterSpacing: 1.2, alignment: "center", margin: [0, 2, 0, 0] },
        ],
        margin: [0, 0, 0, 18],
      },
      {
        columns: [
          { stack: [
            { text: "SELLER", bold: true, fontSize: 7, color: "#64746d", characterSpacing: 0.6 },
            { text: "Aggarwal Sweets Sirsa", bold: true, fontSize: 9, margin: [0, 5, 0, 2] },
            { text: "Bhadra Bazar, Sirsa, Haryana 125055, India", fontSize: 8 },
            { text: `GSTIN: ${sellerGstin}`, fontSize: 7, margin: [0, 3, 0, 0] },
          ] },
          { width: 205, stack: [
            { text: "ORDER DETAILS", bold: true, fontSize: 7, color: "#64746d", characterSpacing: 0.6 },
            { text: `Order ID: ${order.id}`, bold: true, fontSize: 8, margin: [0, 5, 0, 2] },
            { text: `Order date: ${orderDate}`, fontSize: 8 },
            { text: `Payment: ${order.paymentMethod === "razorpay" ? "Online via Razorpay" : "Cash on delivery"}`, fontSize: 8, margin: [0, 2, 0, 0] },
          ] },
        ],
        columnGap: 18,
        margin: [0, 0, 0, 18],
      },
      { text: "BILL TO / DELIVERY DETAILS", bold: true, fontSize: 8, color: "#164735", margin: [0, 0, 0, 6] },
      {
        columns: [
          { width: "*", stack: [
            { text: order.customerName?.trim() || "Customer", bold: true, fontSize: 9 },
            { text: order.address, fontSize: 8, margin: [0, 3, 0, 0] },
          ] },
          { width: 205, stack: [
            { text: `Phone: ${order.phone}`, fontSize: 8 },
            ...(order.customerEmail ? [{ text: order.customerEmail, fontSize: 8, margin: [0, 3, 0, 0] as [number, number, number, number] }] : []),
          ] },
        ],
        columnGap: 18,
        margin: [0, 0, 0, 18],
      },
      { text: "ORDER ITEMS", bold: true, fontSize: 8, color: "#164735", margin: [0, 0, 0, 6] },
      {
        table: { headerRows: 1, dontBreakRows: true, widths: [28, "*", 34, 76, 82], body: itemRows },
        layout: "lightHorizontalLines",
      },
      {
        columns: [
          { text: "" },
          { width: 285, table: { widths: ["*", 95], body: totalRows }, layout: "lightHorizontalLines" },
        ],
        margin: [0, 12, 0, 9],
      },
      {
        text: `Amount in words: ${amountInIndianWords(order.pricing.total)}`,
        fontSize: 8, bold: true, margin: [0, 0, 0, 10],
      },
      {
        text: paymentText,
        fontSize: 8, color: "#53655d", margin: [0, 0, 0, 12],
      },
      {
        columns: [
          { text: "Thank you for ordering from Aggarwal Sweets Sirsa.", bold: true, color: "#164735", fontSize: 8 },
          { text: "Generated electronically · No signature required", alignment: "right", color: "#64746d", fontSize: 7 },
        ],
      },
    ],
    footer: (page, pages) => ({
      text: `Aggarwal Sweets Sirsa  |  Page ${page} of ${pages}`,
      alignment: "center", fontSize: 7, color: "#64746d", margin: [38, 14, 38, 0],
    }),
  };

  return createPdfBuffer(document);
}