import { createSupabaseAdminClient } from "@/lib/supabase/server";
import { syncCvSourcesWithDrive, upsertCvSourceDocument } from "@/lib/services/google-drive";
import { scrapeVacancyPage } from "@/lib/services/vacancy-scraper";
import { matchCvToRequest, structurePositionRequest } from "@/lib/services/openrouter";
import { sendMatchReport } from "@/lib/services/resend";
import type { CvDocument, MatchResult, ScanJob } from "@/lib/types";

export type InboundEmail = {
  messageId: string | null;
  from: string | null;
  subject: string | null;
  text: string;
};

export async function createAndRunScan(email: InboundEmail) {
  const supabase = createSupabaseAdminClient();
  const { data: job, error } = await supabase
    .from("scan_jobs")
    .insert({
      email_message_id: email.messageId,
      email_from: email.from,
      email_subject: email.subject,
      status: "queued",
    })
    .select("*")
    .single();

  if (error || !job) {
    throw new Error(`Could not create scan job: ${error?.message ?? "unknown error"}`);
  }

  await runScanJob(job as ScanJob, email.text);
  return job as ScanJob;
}


export async function createAndRunVacancyUrlScan(url: string) {
  const scrapedVacancy = await scrapeVacancyPage(url);
  const vacancyText = `Vacaturelink: ${scrapedVacancy.url}\n${scrapedVacancy.title ? `Titel: ${scrapedVacancy.title}\n` : ""}\n${scrapedVacancy.text}`;

  return createAndRunScan({
    messageId: null,
    from: scrapedVacancy.url,
    subject: scrapedVacancy.title ?? `Vacature: ${scrapedVacancy.url}`,
    text: vacancyText,
  });
}

export async function runScanJob(job: ScanJob, emailText: string) {
  const supabase = createSupabaseAdminClient();

  try {
    await supabase.from("scan_jobs").update({ status: "processing" }).eq("id", job.id);

    const [structuredRequest, cvSync] = await Promise.all([
      structurePositionRequest(emailText),
      syncCvSourcesWithDrive(),
    ]);
    const cvDocuments = cvSync.documents;

    if (!cvDocuments.length) {
      throw new Error("No supported PDF or DOCX CVs found in the configured Google Drive folder");
    }

    await supabase
      .from("scan_jobs")
      .update({
        structured_request: structuredRequest,
        request_summary: structuredRequest.summary,
      })
      .eq("id", job.id);

    const rankedMatches = await matchDocuments(structuredRequest, cvDocuments);
    const savedMatches: MatchResult[] = [];

    for (const rankedMatch of rankedMatches.slice(0, 5)) {
      const cvSourceId = await upsertCvSource(rankedMatch.cv);
      const { data, error } = await supabase
        .from("match_results")
        .insert({
          scan_job_id: job.id,
          cv_source_id: cvSourceId,
          candidate_name: rankedMatch.match.candidate_name,
          role_title: rankedMatch.match.role_title ?? null,
          score: rankedMatch.match.score,
          rank: rankedMatch.rank,
          match_reasons: rankedMatch.match.match_reasons,
          risks: rankedMatch.match.risks,
          missing_requirements: rankedMatch.match.missing_requirements,
          evidence: rankedMatch.match.evidence,
        })
        .select(
          "*, cv_sources(file_name, drive_file_id)",
        )
        .single();

      if (error || !data) {
        throw new Error(`Could not save match result: ${error?.message ?? "unknown error"}`);
      }

      savedMatches.push(data as MatchResult);
    }

    const completedJob = {
      ...job,
      request_summary: structuredRequest.summary,
      structured_request: structuredRequest,
      status: "completed" as const,
    };

    await supabase
      .from("scan_jobs")
      .update({ status: "completed", completed_at: new Date().toISOString() })
      .eq("id", job.id);

    await sendMatchReport(completedJob, savedMatches);
  } catch (error) {
    await supabase
      .from("scan_jobs")
      .update({ status: "failed", error_message: error instanceof Error ? error.message : String(error) })
      .eq("id", job.id);
    throw error;
  }
}

const MATCH_CONCURRENCY = 5;

async function matchDocuments(
  structuredRequest: Awaited<ReturnType<typeof structurePositionRequest>>,
  cvDocuments: CvDocument[],
) {
  const matches: { cv: CvDocument; match: Awaited<ReturnType<typeof matchCvToRequest>> }[] = [];

  for (let i = 0; i < cvDocuments.length; i += MATCH_CONCURRENCY) {
    const batch = cvDocuments.slice(i, i + MATCH_CONCURRENCY);
    const batchResults = await Promise.all(
      batch.map(async (cv) => ({ cv, match: await matchCvToRequest(structuredRequest, cv) })),
    );
    matches.push(...batchResults);
  }

  return matches
    .sort((left, right) => right.match.score - left.match.score)
    .map((item, index) => ({ ...item, rank: index + 1 }));
}

async function upsertCvSource(cv: CvDocument) {
  return upsertCvSourceDocument(cv);
}
