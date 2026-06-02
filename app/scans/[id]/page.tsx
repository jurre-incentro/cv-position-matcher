import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { MatchCard } from "@/components/match-card";
import { StatusBadge } from "@/components/status-badge";
import { createSupabaseAdminClient } from "@/lib/supabase/server";
import { formatDateTime } from "@/lib/utils";
import type { ScanJob } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function ScanDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = createSupabaseAdminClient();
  const { data: scan, error } = await supabase
    .from("scan_jobs")
    .select("*, match_results(*, cv_sources(file_name, drive_file_id))")
    .eq("id", id)
    .single();

  if (error) {
    throw new Error(error.message);
  }

  const job = scan as ScanJob;
  const matches = [...(job.match_results ?? [])].sort((left, right) => left.rank - right.rank);

  return (
    <main className="min-h-screen">
      <header className="border-b border-line bg-white">
        <div className="mx-auto max-w-6xl px-5 py-6">
          <Link href="/" className="inline-flex items-center gap-2 text-sm font-medium text-moss">
            <ArrowLeft className="h-4 w-4" />
            Terug naar scans
          </Link>
          <div className="mt-5 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h1 className="text-2xl font-semibold text-ink">{job.email_subject ?? "Nieuwe aanvraag"}</h1>
              <p className="mt-2 max-w-3xl text-sm leading-6 text-ink/65">{job.request_summary ?? "Nog geen samenvatting beschikbaar."}</p>
            </div>
            <StatusBadge status={job.status} />
          </div>
          <div className="mt-4 flex flex-wrap gap-3 text-sm text-ink/60">
            <span>Aangemaakt: {formatDateTime(job.created_at)}</span>
            <span>Afgerond: {formatDateTime(job.completed_at)}</span>
            {job.email_from ? <span>Van: {job.email_from}</span> : null}
          </div>
        </div>
      </header>

      <section className="mx-auto max-w-6xl px-5 py-8">
        {job.error_message ? (
          <div className="mb-6 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800">{job.error_message}</div>
        ) : null}

        <div className="grid gap-5">
          {matches.length ? (
            matches.map((match) => <MatchCard key={match.id} match={match} />)
          ) : (
            <div className="rounded-lg border border-line bg-white p-10 text-center text-sm text-ink/60 shadow-soft">
              Nog geen matchresultaten voor deze scan.
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
