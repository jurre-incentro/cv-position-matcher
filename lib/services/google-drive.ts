import { google } from "googleapis";
import { getEnv } from "@/lib/env";
import { createTextHash, extractDocumentText, isSupportedCvMimeType } from "@/lib/services/document-parser";
import type { CvDocument } from "@/lib/types";

export async function fetchCvDocumentsFromDrive(): Promise<CvDocument[]> {
  const env = getEnv();
  const auth = new google.auth.JWT({
    email: env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
    key: env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, "\n"),
    scopes: ["https://www.googleapis.com/auth/drive.readonly"],
  });

  const drive = google.drive({ version: "v3", auth });
  const filesResponse = await drive.files.list({
    q: `'${env.GOOGLE_DRIVE_FOLDER_ID}' in parents and trashed = false`,
    fields: "files(id,name,mimeType,modifiedTime)",
    pageSize: 100,
    orderBy: "modifiedTime desc",
    supportsAllDrives: true,
    includeItemsFromAllDrives: true,
  });

  const files = filesResponse.data.files ?? [];
  const supportedFiles = files.filter((file) => file.id && file.name && file.mimeType && isSupportedCvMimeType(file.mimeType));

  const documents: CvDocument[] = [];
  for (const file of supportedFiles) {
    const download = await drive.files.get(
      { fileId: file.id!, alt: "media", supportsAllDrives: true },
      { responseType: "arraybuffer" },
    );

    const buffer = Buffer.from(download.data as ArrayBuffer);
    const text = await extractDocumentText(buffer, file.mimeType!);

    if (!text) {
      continue;
    }

    documents.push({
      driveFileId: file.id!,
      fileName: file.name!,
      mimeType: file.mimeType!,
      modifiedTime: file.modifiedTime ?? null,
      text,
      textHash: createTextHash(text),
    });
  }

  return documents;
}
