import { google } from "googleapis";
import { getEnv } from "@/lib/env";
import { createTextHash, extractDocumentText, isSupportedCvMimeType, GOOGLE_DOC_MIME } from "@/lib/services/document-parser";
import { createSupabaseAdminClient } from "@/lib/supabase/server";
import type { CvDocument } from "@/lib/types";

const DOCX_MIME = "application/vnd.openxmlformats-officedocument.wordprocessingml.document";

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

  // Load cached CV text from Supabase
  const supabase = createSupabaseAdminClient();
  const { data: cachedSources } = await supabase
    .from("cv_sources")
    .select("drive_file_id, text_hash, text_content, modified_time")
    .in("drive_file_id", supportedFiles.map((f) => f.id!));

  const cacheMap = new Map(
    (cachedSources ?? [])
      .filter((s) => s.text_content)
      .map((s) => [s.drive_file_id, { textHash: s.text_hash, text: s.text_content as string, modifiedTime: s.modified_time as string | null }]),
  );

  const documents = await Promise.all(
    supportedFiles.map(async (file) => {
      const cached = cacheMap.get(file.id!);

      // Skip download entirely if modifiedTime hasn't changed
      if (cached && cached.modifiedTime && cached.modifiedTime === file.modifiedTime) {
        return {
          driveFileId: file.id!,
          fileName: file.name!,
          mimeType: file.mimeType!,
          modifiedTime: file.modifiedTime ?? null,
          text: cached.text,
          textHash: cached.textHash,
        } satisfies CvDocument;
      }

      try {
        let buffer: Buffer;
        let effectiveMimeType = file.mimeType!;

        if (file.mimeType === GOOGLE_DOC_MIME) {
          const export_ = await drive.files.export(
            { fileId: file.id!, mimeType: DOCX_MIME },
            { responseType: "arraybuffer" },
          );
          buffer = Buffer.from(export_.data as ArrayBuffer);
          effectiveMimeType = DOCX_MIME;
        } else {
          const download = await drive.files.get(
            { fileId: file.id!, alt: "media", supportsAllDrives: true },
            { responseType: "arraybuffer" },
          );
          buffer = Buffer.from(download.data as ArrayBuffer);
        }

        const text = await extractDocumentText(buffer, effectiveMimeType);
        if (!text) return null;

        return {
          driveFileId: file.id!,
          fileName: file.name!,
          mimeType: file.mimeType!,
          modifiedTime: file.modifiedTime ?? null,
          text,
          textHash: createTextHash(text),
        } satisfies CvDocument;
      } catch {
        return null;
      }
    }),
  );

  return documents.filter((d): d is CvDocument => d !== null);
}
