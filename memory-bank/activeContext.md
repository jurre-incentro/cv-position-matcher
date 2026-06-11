# Active Context

## Current Focus
Vacancy URL input has been implemented as the primary manual scan path. A user can paste a public vacancy webpage URL, the server scrapes readable HTML text, the CV cache is synchronized against Google Drive, and matching runs against the current cached CV documents.

## Relevant Entry Points
- Manual scans: `app/api/scans/route.ts` and `app/scans/new/page.tsx`.
- Inbound scans: `app/api/webhooks/resend/route.ts`.
- Pipeline: `lib/services/scan-pipeline.ts`.
- Vacancy scraping: `lib/services/vacancy-scraper.ts`.
- CV Drive/cache sync: `lib/services/google-drive.ts`.
- LLM calls: `lib/services/openrouter.ts`.

## Implemented Direction
- `POST /api/scans` accepts either `url` or pasted `text`; URL is preferred when present.
- `createAndRunVacancyUrlScan` scrapes the page and passes extracted vacancy text into the same scan pipeline.
- `syncCvSourcesWithDrive` lists supported Drive CVs, checks Supabase cache freshness, downloads only new/changed CVs, upserts those into `cv_sources`, and returns current Drive CV documents for matching.
- CV matching remains parallel via `Promise.all` in `matchDocuments`.
- `/scans/new` defaults to a vacancy-link form and keeps pasted text as a fallback tab.

## Current Limitations
- Scraping targets server-rendered/static HTML. JavaScript-rendered vacancy pages may not expose enough text.
- Source URL is stored in `scan_jobs.email_from` and reflected in the text sent to the structuring prompt, not in a dedicated database column.
- Removed Drive files are excluded from current matching because matching uses the current Drive listing, but stale `cv_sources` rows are not deleted.
- Route processing is still synchronous and may hit duration limits with many CVs or slow websites.
