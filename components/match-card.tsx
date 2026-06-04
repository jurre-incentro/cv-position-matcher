import { AlertTriangle, CheckCircle2, FileText, HelpCircle } from "lucide-react";
import type React from "react";
import type { MatchResult } from "@/lib/types";

export function MatchCard({ match }: { match: MatchResult }) {
  return (
    <article className="rounded-lg border border-line bg-white p-5 shadow-soft">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="text-sm font-medium text-moss">#{match.rank}</div>

          <h2 className="mt-1 text-xl font-semibold text-ink">{match.candidate_name}</h2>
          <p className="mt-1 text-sm text-ink/60">{match.role_title ?? match.cv_sources?.file_name ?? "CV match"}</p>
        </div>
        <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full border border-line bg-mist text-lg font-bold text-ink">
          {Math.round(match.score)}
        </div>
      </div>

      <div className="mt-5 grid gap-4 md:grid-cols-2">
        <ListBlock title="Matchredenen" icon={<CheckCircle2 className="h-4 w-4 text-moss" />} items={match.match_reasons} />
        <ListBlock title="Risico's" icon={<AlertTriangle className="h-4 w-4 text-copper" />} items={match.risks} />
        <ListBlock title="Ontbrekende eisen" icon={<HelpCircle className="h-4 w-4 text-sky" />} items={match.missing_requirements} />
        <ListBlock title="Evidence" icon={<FileText className="h-4 w-4 text-ink/60" />} items={match.evidence} />
      </div>
    </article>
  );
}

function ListBlock({ title, icon, items }: { title: string; icon: React.ReactNode; items: string[] }) {
  return (
    <section>
      <h3 className="flex items-center gap-2 text-sm font-semibold text-ink">
        {icon}
        {title}
      </h3>
      <ul className="mt-2 space-y-1.5 text-sm leading-6 text-ink/70">
        {items.length ? items.map((item) => <li key={item}>{item}</li>) : <li>-</li>}
      </ul>
    </section>
  );
}
