# System Patterns

## Architecture
- Next.js App Router application.
- Server route handlers perform orchestration and call service modules.
- Supabase service-role client is used server-side for inserts/updates/deletes.
- Google Drive is the source of CV files.
- OpenRouter is used for both request structuring and CV matching.
- Resend handles inbound webhook input and outbound result email.

## Data Model
- `scan_jobs`: one request scan, status, summary, structured request, error state.
- `cv_sources`: indexed CV metadata and extracted text hash/content.
- `match_results`: ranked candidate match output linked to scan and CV source.

## Pipeline Pattern
- Create job as `queued`.
- Mark `processing`.
- Structure request and fetch CVs concurrently.
- Store structured request and summary.
- Match all CVs, sort by score, save top 5.
- Mark `completed` and send email report.
- On error, mark `failed` with `error_message` and rethrow.

## Coding Patterns
- Shared types live in `lib/types.ts`.
- External integrations live under `lib/services/`.
- Route handlers should validate request shape before invoking the pipeline.
- UI uses Tailwind classes and small component files.
- Prefer preserving the existing visual language unless doing a deliberate redesign.

## Error Handling
- User-facing API errors return JSON `{ error }` with relevant HTTP status.
- Pipeline errors are written to `scan_jobs.error_message`.
- Webhook signature errors return 401.
