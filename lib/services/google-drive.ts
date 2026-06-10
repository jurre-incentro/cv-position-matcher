import { google } from "googleapis";
import { getGoogleDriveEnv } from "@/lib/env";
import { createTextHash, extractDocumentText, isSupportedCvMimeType, GOOGLE_DOC_MIME } from "@/lib/services/document-parser";
import { createSupabaseAdminClient } from "@/lib/supabase/server";
import type { CvDocument } from "@/lib/types";

const DOCX_MIME = "application/vnd.openxmlformats-officedocument.wordprocessingml.document";

type DriveCvFile = {
  id: string;
  name: string;
  mimeType: string;
  modifiedTime: string | null;
};

type CachedCvSource = {
  drive_file_id: string;
  file_name: string;
  mime_type: string;
  modified_time: string | null;
  text_hash: string | null;
  text_content: string | null;
  is_active: boolean;
};

export async function fetchCvDocumentsFromDrive(): Promise<CvDocument[]> {
  const { documents } = await syncCvSourcesWithDrive();
  return documents;
}

export async function syncCvSourcesWithDrive(): Promise<{ documents: CvDocument[]; syncedCount: number }> {
  const drive = createDriveClient();
  const supabase = createSupabaseAdminClient();

  const [driveFiles, { data: rawCachedSources, error }] = await Promise.all([
    listSupportedDriveCvFiles(drive),
    supabase
      .from("cv_sources")
      .select("drive_file_id, file_name, mime_type, modified_time, text_hash, text_content, is_active"),
  ]);

  if (error) {
    throw new Error(`Could not read cached CV sources: ${error.message}`);
  }

  const cachedSources = (rawCachedSources as CachedCvSource[] | null) ?? [];
  const cacheMap = new Map(cachedSources.map((source) => [source.drive_file_id, source]));
  const driveFileIds = new Set(driveFiles.map((f) => f.id));

  const toDeactivate = cachedSources
    .filter((s) => s.is_active && !driveFileIds.has(s.drive_file_id))
    .map((s) => s.drive_file_id);

  const deactivatePromise = toDeactivate.length
    ? supabase.from("cv_sources").update({ is_active: false }).in("drive_file_id", toDeactivate)
    : Promise.resolve();

  if (!driveFiles.length) {
    await deactivatePromise;
    return { documents: [], syncedCount: 0 };
  }

  let syncedCount = 0;

  const [documents] = await Promise.all([
    Promise.all(
      driveFiles.map(async (file) => {
        const cached = cacheMap.get(file.id);

        if (isFreshCachedSource(cached, file)) {
          if (!cached.is_active) {
            await supabase.from("cv_sources").update({ is_active: true }).eq("drive_file_id", file.id);
          }
          return cachedSourceToDocument(cached, file);
        }

        const document = await downloadCvDocument(drive, file);
        if (!document) {
          return null;
        }

        await upsertCvSourceDocument(document);
        syncedCount += 1;
        return document;
      }),
    ),
    deactivatePromise,
  ]);

  return {
    documents: documents.filter((document): document is CvDocument => document !== null),
    syncedCount,
  };
}

function createDriveClient() {
  const env = getGoogleDriveEnv();
  const auth = new google.auth.JWT({
    email: env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
    key: env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, "\n"),
    scopes: ["https://www.googleapis.com/auth/drive.readonly"],
  });

  return google.drive({ version: "v3", auth });
}

async function listSupportedDriveCvFiles(drive: ReturnType<typeof google.drive>): Promise<DriveCvFile[]> {
  const env = getGoogleDriveEnv();
  const filesResponse = await drive.files.list({
    q: `'${env.GOOGLE_DRIVE_FOLDER_ID}' in parents and trashed = false`,
    fields: "files(id,name,mimeType,modifiedTime)",
    pageSize: 100,
    orderBy: "modifiedTime desc",
    supportsAllDrives: true,
    includeItemsFromAllDrives: true,
  });

  return (filesResponse.data.files ?? [])
    .filter((file) => file.id && file.name && file.mimeType && isSupportedCvMimeType(file.mimeType))
    .map((file) => ({
      id: file.id!,
      name: file.name!,
      mimeType: file.mimeType!,
      modifiedTime: file.modifiedTime ?? null,
    }));
}

function isFreshCachedSource(cached: CachedCvSource | undefined, file: DriveCvFile): cached is CachedCvSource {
  return Boolean(
    cached?.text_content &&
      cached.text_hash &&
      cached.file_name === file.name &&
      cached.mime_type === file.mimeType &&
      cached.modified_time === file.modifiedTime,
  );
}

function cachedSourceToDocument(cached: CachedCvSource, file: DriveCvFile): CvDocument {
  return {
    driveFileId: file.id,
    fileName: file.name,
    mimeType: file.mimeType,
    modifiedTime: file.modifiedTime,
    text: cached.text_content!,
    textHash: cached.text_hash!,
  };
}

async function downloadCvDocument(drive: ReturnType<typeof google.drive>, file: DriveCvFile): Promise<CvDocument | null> {
  try {
    let buffer: Buffer;
    let effectiveMimeType = file.mimeType;

    if (file.mimeType === GOOGLE_DOC_MIME) {
      const export_ = await drive.files.export({ fileId: file.id, mimeType: DOCX_MIME }, { responseType: "arraybuffer" });
      buffer = Buffer.from(export_.data as ArrayBuffer);
      effectiveMimeType = DOCX_MIME;
    } else {
      const download = await drive.files.get(
        { fileId: file.id, alt: "media", supportsAllDrives: true },
        { responseType: "arraybuffer" },
      );
      buffer = Buffer.from(download.data as ArrayBuffer);
    }

    const text = await extractDocumentText(buffer, effectiveMimeType);
    if (!text) {
      return null;
    }

    return {
      driveFileId: file.id,
      fileName: file.name,
      mimeType: file.mimeType,
      modifiedTime: file.modifiedTime,
      text,
      textHash: createTextHash(text),
    };
  } catch {
    return null;
  }
}

export async function upsertCvSourceDocument(cv: CvDocument) {
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("cv_sources")
    .upsert(
      {
        drive_file_id: cv.driveFileId,
        file_name: cv.fileName,
        mime_type: cv.mimeType,
        modified_time: cv.modifiedTime,
        text_hash: cv.textHash,
        text_content: cv.text,
        last_scanned_at: new Date().toISOString(),
        is_active: true,
      },
      { onConflict: "drive_file_id" },
    )
    .select("id")
    .single();

  if (error || !data) {
    throw new Error(`Could not upsert CV source: ${error?.message ?? "unknown error"}`);
  }

  return data.id as string;
}
