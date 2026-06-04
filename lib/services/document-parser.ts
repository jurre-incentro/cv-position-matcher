import crypto from "node:crypto";
import mammoth from "mammoth";
import pdf from "pdf-parse";

const PDF_MIME = "application/pdf";
const DOCX_MIME = "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
export const GOOGLE_DOC_MIME = "application/vnd.google-apps.document";

export function isSupportedCvMimeType(mimeType: string) {
  return mimeType === PDF_MIME || mimeType === DOCX_MIME || mimeType === GOOGLE_DOC_MIME;
}

export async function extractDocumentText(buffer: Buffer, mimeType: string) {
  if (mimeType === PDF_MIME) {
    const result = await pdf(buffer);
    return normalizeText(result.text);
  }

  if (mimeType === DOCX_MIME) {
    const result = await mammoth.extractRawText({ buffer });
    return normalizeText(result.value);
  }

  throw new Error(`Unsupported CV file type: ${mimeType}`);
}

export function createTextHash(text: string) {
  return crypto.createHash("sha256").update(text).digest("hex");
}

function normalizeText(text: string) {
  return text
    .replace(/\r/g, "\n")
    .replace(/[ \t]+/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}
