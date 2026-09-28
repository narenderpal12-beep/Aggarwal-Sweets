import pdfMake from "pdfmake";
import type { TDocumentDefinitions } from "pdfmake/interfaces";
import { createRequire } from "node:module";
import path from "node:path";

const require = createRequire(import.meta.url);
const fontDir = path.join(path.dirname(require.resolve("pdfmake/package.json")), "fonts", "Roboto");

pdfMake.setUrlAccessPolicy(() => false);
pdfMake.setLocalAccessPolicy(filePath => filePath.startsWith(fontDir + path.sep));
pdfMake.addFonts({
  Roboto: {
    normal: path.join(fontDir, "Roboto-Regular.ttf"),
    bold: path.join(fontDir, "Roboto-Medium.ttf"),
    italics: path.join(fontDir, "Roboto-Italic.ttf"),
    bolditalics: path.join(fontDir, "Roboto-MediumItalic.ttf"),
  },
});

export function createPdfBuffer(document: TDocumentDefinitions): Promise<Buffer> {
  return pdfMake.createPdf(document).getBuffer();
}