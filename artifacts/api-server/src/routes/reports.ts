import { Router } from "express";
import { generateAdminReportPdf, type AdminReportPdfData } from "../lib/admin-report-pdf.js";
import { requireSession } from "../lib/session.js";

const router = Router();

function isAdminReportPdfData(value: unknown): value is AdminReportPdfData {
  if (!value || typeof value !== "object") return false;
  const report = value as Record<string, unknown>;
  const headers = report.headers;
  const rows = report.rows;
  if (typeof report.title !== "string" || report.title.length < 1 || report.title.length > 200 ||
      !Array.isArray(report.summary) || report.summary.length > 20 ||
      !report.summary.every((line: unknown) => typeof line === "string" && line.length <= 500) ||
      !Array.isArray(headers) || headers.length < 1 || headers.length > 20 ||
      !headers.every((header: unknown) => typeof header === "string" && header.length > 0 && header.length <= 120) ||
      !Array.isArray(rows) || rows.length > 10000) return false;

  return rows.every((row: unknown) =>
    Array.isArray(row) && row.length === headers.length &&
    row.every((cell: unknown) => typeof cell === "string" && cell.length <= 3000)
  );
}

router.post("/reports/pdf", async (req, res) => {
  if (!requireSession(req, res, "admin")) return;
  if (!isAdminReportPdfData(req.body)) {
    res.status(400).json({ error: "Report data is invalid. Please refresh and try again." });
    return;
  }

  try {
    const pdf = await generateAdminReportPdf(req.body);
    res.status(200)
      .setHeader("Content-Type", "application/pdf")
      .setHeader("Content-Disposition", 'attachment; filename="admin-report.pdf"')
      .setHeader("Cache-Control", "no-store")
      .send(pdf);
  } catch {
    res.status(500).json({ error: "The report PDF could not be generated. Please try again." });
  }
});

export default router;