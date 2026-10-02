import type { TDocumentDefinitions, TableCell } from "pdfmake/interfaces";
import { createPdfBuffer } from "./pdf-renderer.js";

export type BillItem = {
  product: { name: string; description?: string };
  variant: { material: string; weight: string; price: number };
  quantity: number;
};

export type BillPricing = {
  itemsSubtotal: number;
  discount: number;
  gstPercent: number;
  gst: number;
  deliveryCharge: number;
  deliveryWaived: boolean;
  handlingCharge: number;
  total: number;
  couponCode?: string;
};

export type BillOrder = {
  id: string;
  date: string;
  customerName?: string;
  customerEmail?: string;
  phone: string;
  address: string;
  items: BillItem[];
  pricing: BillPricing;
  subtotal: number;
  paymentMethod?: "cod" | "razorpay";
  paymentReference?: string;
  paymentStatus?: string;
  orderStatus?: string;
};

export type OrderReportPdfItem = {
  category: string;
  product: string;
  variant: string;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
};

export type OrderReportPdfRow = {
  orderId: string;
  date: string;
  status: string;
  customer: string;
  email: string;
  phone: string;
  address: string;
  paymentMethod: string;
  paymentStatus: string;
  quantity: number;
  lineTotal: number;
  items: OrderReportPdfItem[];
};

export type OrderReportPdfData = {
  title: string;
  fromDate: string;
  toDate: string;
  status: string;
  category: string;
  orders: number;
  revenue: number;
  items: number;
  rows: OrderReportPdfRow[];
};

const money = (value: number) => `INR ${value.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export async function generateOrderBillPdf(order: BillOrder, logoDataUrl?: string): Promise<Buffer> {
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

  void logoDataUrl;
  const dateParts = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Asia/Kolkata",
    day: "2-digit", month: "2-digit", year: "2-digit",
    hour: "2-digit", minute: "2-digit", hourCycle: "h23",
  }).formatToParts(date);
  const datePart = (type: string) => dateParts.find(part => part.type === type)?.value ?? "";
  const orderDate = `${datePart("day")}/${datePart("month")}/${datePart("year")}`;
  const orderTime = `${datePart("hour")}:${datePart("minute")}`;
  const tokenMatch = order.id.match(/-(\d{5})$/);
  const tokenNumber = tokenMatch ? String(Number(tokenMatch[1])) : "—";
  const pageWidth = 80 * 72 / 25.4;
  const pageContentWidth = pageWidth - 24;
  const amount = (value: number) => value.toLocaleString("en-IN", {
    minimumFractionDigits: 2, maximumFractionDigits: 2,
  });
  const headerCell = (text: string, alignment: "left" | "center" | "right" = "left"): TableCell => ({
    text, bold: true, color: "#111111", fontSize: 7, alignment, margin: [2, 3, 2, 3],
  });
  const detailCell = (text: string, alignment: "left" | "center" | "right" = "left"): TableCell => ({
    text, fontSize: 7.5, alignment, margin: [2, 2, 2, 2],
  });
  const itemRows: TableCell[][] = [
    [
      headerCell("No.", "center"),
      headerCell("Item"),
      headerCell("Qty.", "center"),
      headerCell("Price", "right"),
      headerCell("Amount", "right"),
    ],
    ...order.items.map((item, index): TableCell[] => [
      detailCell(String(index + 1), "center"),
      {
        stack: [
          { text: item.product.name, fontSize: 8 },
          { text: `(${item.variant.weight})`, fontSize: 7 },
        ],
        fontSize: 7.5, margin: [2, 3, 2, 3],
      },
      detailCell(String(item.quantity), "center"),
      detailCell(amount(item.variant.price), "right"),
      detailCell(amount(item.variant.price * item.quantity), "right"),
    ]),
  ];
  const totalQuantity = order.items.reduce((total, item) => total + item.quantity, 0);
  const rule = (lineWidth = 0.8) => ({
    canvas: [{
      type: "line" as const, x1: 0, y1: 0, x2: pageContentWidth, y2: 0,
      lineWidth, lineColor: "#222222",
    }],
    margin: [0, 3, 0, 3] as [number, number, number, number],
  });

  const document: TDocumentDefinitions = {
    pageSize: { width: pageWidth, height: "auto" },
    pageMargins: [10, 10, 10, 10],
    info: { title: `Order bill ${order.id}`, author: "Aggarwal Sweets Sirsa" },
    defaultStyle: { font: "Roboto", fontSize: 7.5, color: "#111111" },
    content: [
      { text: "Aggarwal sweets", fontSize: 12, bold: true, italics: true, alignment: "center" },
      { text: "Bhadra Bazar, Sirsa Contact:", fontSize: 9.5, bold: true, alignment: "center", margin: [0, 2, 0, 0] },
      { text: "96715-00121", fontSize: 10, bold: true, alignment: "center", margin: [0, 0, 0, 3] },
      rule(1.2),
      { text: `Name: ${order.customerName?.trim() || "Customer"} (M: ${order.phone})`, fontSize: 8.5, margin: [0, 1, 0, 2] },
      { text: `Adr: ${order.address}`, fontSize: 8.5, margin: [0, 0, 0, 1] },
      { text: "Locality: Sirsa", fontSize: 8.5, margin: [0, 0, 0, 2] },
      rule(1.2),
      {
        columns: [
          {
            width: "50%",
            text: `Date: ${orderDate}`,
            fontSize: 8.5,
          },
          {
            width: "50%",
            text: "Delivery",
            fontSize: 9,
            bold: true,
            alignment: "right",
          },
        ],
        margin: [0, 1, 0, 1],
      },
      {
        columns: [
          { width: 30, text: orderTime, fontSize: 8.5 },
          { width: 62, text: "Cashier: biller", fontSize: 6.5 },
          { width: "*", text: `Bill No.: ${order.id}`, fontSize: 6.5, alignment: "right" },
        ],
        margin: [0, 0, 0, 1],
      },
      { text: `Token No.: ${tokenNumber}`, fontSize: 9, bold: true, margin: [0, 0, 0, 1] },
      {
        table: { headerRows: 1, dontBreakRows: true, widths: [16, "*", 23, 45, 50], body: itemRows },
        layout: {
          hLineWidth: (index: number) => index === 0 || index === 1 || index === itemRows.length ? 1 : 0.5,
          hLineColor: () => "#222222",
          vLineWidth: () => 0,
          paddingLeft: () => 1,
          paddingRight: () => 1,
          paddingTop: () => 2,
          paddingBottom: () => 2,
        },
      },
      {
        table: {
          widths: ["*", "*"],
          body: [[
            detailCell(`Total Qty: ${totalQuantity}`),
            detailCell(`Sub Total  ${amount(order.pricing.itemsSubtotal)}`, "right"),
          ]],
        },
        layout: "noBorders",
      },
      rule(1.2),
      {
        table: {
          widths: ["*", 60],
          body: [
            [
              detailCell(`GST (${order.pricing.gstPercent}%) · included`),
              detailCell(`₹ ${amount(order.pricing.gst)}`, "right"),
            ],
            [
              detailCell(order.pricing.deliveryWaived ? "Delivery charge (waived)" : "Delivery charge · included"),
              detailCell(`₹ ${amount(order.pricing.deliveryCharge)}`, "right"),
            ],
          ],
        },
        layout: "noBorders",
        margin: [0, 0, 0, 1],
      },
      { text: `Grand Total  ₹ ${amount(order.pricing.total)}`, fontSize: 11, bold: true, alignment: "center", margin: [0, 1, 0, 1] },
      rule(1.2),
      { text: "Thanks", fontSize: 11, bold: true, alignment: "center", margin: [0, 1, 0, 0] },
    ],
  };

  return createPdfBuffer(document);
}

export async function generateOrderReportPdf(report: OrderReportPdfData): Promise<Buffer> {
  const tableBody: TableCell[][] = [
    ["Order", "Customer", "All items in order", "Qty", "Recognized line revenue"].map(text => ({
      text, bold: true, color: "#ffffff", fillColor: "#164735", fontSize: 7, margin: [4, 5, 4, 5],
    })),
    ...report.rows.map(row => [
      {
        stack: [
          { text: row.orderId, bold: true, fontSize: 8 },
          { text: row.date },
          { text: row.status },
          { text: `${row.paymentMethod} · ${row.paymentStatus}` },
        ],
        fontSize: 7, margin: [4, 5, 4, 5],
      },
      {
        stack: [
          { text: row.customer || "Customer", bold: true },
          { text: row.email || "—" },
          { text: row.phone || "—" },
          { text: row.address || "—" },
        ],
        fontSize: 7, margin: [4, 5, 4, 5],
      },
      {
        stack: row.items.length
          ? row.items.map((item, index) => ({
              stack: [
                { text: `${index + 1}. ${item.product || "Order item"}`, bold: true },
                { text: `${item.category || "—"} · ${item.variant || "Standard"} · ${item.quantity} × ${money(item.unitPrice)} = ${money(item.lineTotal)}` },
              ],
              margin: [0, 0, 0, 5],
            }))
          : [{ text: "No items", italics: true }],
        fontSize: 7, margin: [4, 5, 4, 5],
      },
      { text: String(row.quantity), alignment: "center", fontSize: 7, margin: [4, 5, 4, 5] },
      { text: money(row.lineTotal), alignment: "right", bold: true, fontSize: 7, margin: [4, 5, 4, 5] },
    ] as TableCell[]),
  ];

  const document: TDocumentDefinitions = {
    pageSize: "A4",
    pageOrientation: "landscape",
    pageMargins: [24, 36, 24, 42],
    info: { title: report.title, author: "Aggarwal Sweets Sirsa" },
    defaultStyle: { font: "Roboto", fontSize: 8, color: "#20362d" },
    content: [
      { text: "AGGARWAL SWEETS · ORDER REPORT", fontSize: 15, bold: true, color: "#164735" },
      { text: report.title, fontSize: 10, margin: [0, 4, 0, 0] },
      { text: `Dates: ${report.fromDate} to ${report.toDate}   ·   Status: ${report.status}   ·   Category: ${report.category}`, fontSize: 8, color: "#64746d", margin: [0, 3, 0, 10] },
      {
        columns: [
          { text: `Orders: ${report.orders}`, bold: true },
          { text: `Items: ${report.items}`, bold: true },
          { text: `Recognized revenue: ${money(report.revenue)}`, bold: true, alignment: "right" },
        ],
        margin: [0, 0, 0, 12],
      },
      report.rows.length
        ? { table: { headerRows: 1, keepWithHeaderRows: 1, widths: [85, 110, "*", 35, 88], body: tableBody }, layout: "lightHorizontalLines" }
        : { text: "No order items match these filters.", italics: true, color: "#64746d", margin: [0, 8, 0, 0] },
    ],
    footer: (page, pages) => ({
      text: `Aggarwal Sweets  |  Page ${page} of ${pages}`,
      alignment: "center", fontSize: 8, color: "#64746d", margin: [24, 12, 24, 0],
    }),
  };

  return createPdfBuffer(document);
}