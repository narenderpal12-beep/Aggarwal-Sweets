import type { Content, TableCell, TDocumentDefinitions } from "pdfmake/interfaces";
import { createPdfBuffer } from "./pdf-renderer.js";

export type AdminReportPdfData = {
  title: string;
  summary: string[];
  headers: string[];
  rows: string[][];
};

export async function generateAdminReportPdf(report: AdminReportPdfData): Promise<Buffer> {
  const margins: [number, number, number, number] = [4, 5, 4, 5];
  const tableBody: TableCell[][] = [
    report.headers.map(text => ({
      text, bold: true, color: "#ffffff", fillColor: "#164735", fontSize: 7, margin: margins,
    } as TableCell)),
    ...report.rows.map(row => row.map(text => ({
      text, fontSize: 7, margin: margins,
    } as TableCell))),
  ];
  const summaryContent: Content[] = report.summary.map(text => ({
    text, fontSize: 8, color: "#64746d", margin: [0, 3, 0, 0],
  }));
  const reportTable: Content = {
    table: {
      headerRows: 1,
      keepWithHeaderRows: 1,
      widths: report.headers.map(() => "*"),
      body: tableBody,
    },
    layout: "lightHorizontalLines",
  };
  const emptyMessage: Content = {
    text: "No records match these filters.", italics: true, color: "#64746d", margin: [0, 8, 0, 0],
  };

  const document: TDocumentDefinitions = {
    pageSize: report.headers.length > 8 ? "A3" : "A4",
    pageOrientation: "landscape",
    pageMargins: [24, 36, 24, 42],
    info: { title: report.title, author: "Aggarwal Sweets Sirsa" },
    defaultStyle: { font: "Roboto", fontSize: 8, color: "#20362d" },
    content: [
      { text: "AGGARWAL SWEETS", fontSize: 15, bold: true, color: "#164735" },
      { text: report.title, fontSize: 11, margin: [0, 4, 0, 0] },
      ...summaryContent,
      report.rows.length ? reportTable : emptyMessage,
    ],
    footer: (page, pages) => ({
      text: `Aggarwal Sweets  |  Page ${page} of ${pages}`,
      alignment: "center", fontSize: 8, color: "#64746d", margin: [24, 12, 24, 0],
    }),
  };

  return createPdfBuffer(document);
}