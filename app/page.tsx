import Link from "next/link";
import { ArrowRight, Inbox, Plus, RefreshCw } from "lucide-react";
import { DeleteScanButton } from "@/components/delete-scan-button";
import { StatusBadge } from "@/components/status-badge";
import { createSupabaseAdminClient } from "@/lib/supabase/server";
import { formatDateTime } from "@/lib/utils";
import type { ScanJob } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const supabase = createSupabaseAdminClient();
  const { data: scans, error } = await supabase
    .from("scan_jobs")
    .select("*, match_results(id, score)")
    .order("created_at", { ascending: false })
    .limit(25);

  if (error) {
    throw new Error(error.message);
  }

  return (
    <main className="min-h-screen">
      <header className="border-b border-line bg-white">
        <div className="mx-auto flex max-w-6xl flex-col gap-4 px-5 py-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-ink">CV Position Matcher</h1>
            <p className="mt-1 text-sm text-ink/60">Scans, statussen en matchresultaten uit forwarded aanvragen.</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 rounded-lg border border-line bg-mist px-3 py-2 text-sm text-ink/70">
              <Inbox className="h-4 w-4" />
              Resend inbound webhook
            </div>
            <Link
              href="/scans/new"
              className="flex items-center gap-2 rounded-lg bg-moss px-3 py-2 text-sm font-medium text-white transition hover:bg-moss-dark"
            >
              <Plus className="h-4 w-4" />
              Nieuwe scan
            </Link>
            <form action="/api/auth/logout" method="POST">
              <button
                type="submit"
                className="rounded-lg border border-line bg-white px-3 py-2 text-sm text-ink/60 transition hover:text-ink"
              >
                Uitloggen
              </button>
            </form>
          </div>
        </div>
      </header>

      <section className="mx-auto max-w-6xl px-5 py-8">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-ink">Laatste scans</h2>
          <RefreshCw className="h-4 w-4 text-ink/50" />
        </div>

        <div className="overflow-hidden rounded-lg border border-line bg-white shadow-soft">
          <div className="grid grid-cols-[1.2fr_1fr_120px_80px_92px] gap-3 border-b border-line bg-mist px-4 py-3 text-xs font-semibold uppercase tracking-wide text-ink/60 max-md:hidden">
            <span>Aanvraag</span>
            <span>Aangemaakt</span>
            <span>Status</span>
            <span>Matches</span>
            <span className="text-right">Acties</span>
          </div>
          <div className="divide-y divide-line">
            {(scans as ScanJob[] | null)?.length ? (
              (scans as ScanJob[]).map((scan) => {
                const scanLabel = scan.email_subject ?? "Nieuwe aanvraag";

                return (
                  <div
                    key={scan.id}
                    className="grid gap-3 px-4 py-4 transition hover:bg-mist/70 md:grid-cols-[1.2fr_1fr_120px_80px_92px] md:items-center"
                  >
                    <Link href={`/scans/${scan.id}`} className="group">
                      <div className="font-medium text-ink group-hover:text-moss">{scanLabel}</div>
                      <div className="mt-1 line-clamp-1 text-sm text-ink/55">{scan.request_summary ?? scan.email_from ?? "Nog geen samenvatting"}</div>
                    </Link>
                    <div className="text-sm text-ink/60">{formatDateTime(scan.created_at)}</div>
                    <StatusBadge status={scan.status} />
                    <div className="text-sm font-medium text-ink">{scan.match_results?.length ?? 0}</div>
                    <div className="flex items-center gap-2 md:justify-end">
                      <Link
                        href={`/scans/${scan.id}`}
                        aria-label={`Open scan ${scanLabel}`}
                        className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-line bg-white text-ink/50 transition hover:border-moss/40 hover:text-moss"
                      >
                        <ArrowRight className="h-4 w-4" />
                      </Link>
                      <DeleteScanButton scanId={scan.id} label={scanLabel} />
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="px-4 py-12 text-center text-sm text-ink/60">Nog geen scans ontvangen.</div>
            )}
          </div>
        </div>
      </section>
    </main>
  );
}
