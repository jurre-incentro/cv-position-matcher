# Progress

## Working
- Dashboard lists recent scans.
- Manual vacancy URL scans can be submitted from `/scans/new`.
- Manual pasted request text remains available as a fallback tab.
- Resend inbound webhook can create scans from forwarded emails.
- Vacancy pages are scraped server-side with basic protocol, host, timeout, content-type, and size checks.
- Pipeline structures requests, synchronizes CV cache with Google Drive, matches current Drive CVs using cached/downloaded text, stores top 5 results, and sends a report email.
- Scan detail page shows summary, status, errors, and match cards.
- Scan deletion API/button exists.

## Not Yet Implemented
- Auth for dashboard/API access.
- Async queue/background processing for large CV folders.
- JavaScript-rendered vacancy page scraping.
- Persistence of source URL as a first-class field in `scan_jobs`.
- Cleanup/deactivation of stale `cv_sources` rows for files removed from Drive.

## Known Risks
- Synchronous route processing can hit platform duration limits.
- Public read policies and unauthenticated dashboard are acceptable only for MVP/internal trusted deployment.
- CV text is stored in Supabase despite README saying no full CV text in database/logs; verify intended privacy posture before production use.
- Scraping arbitrary websites needs ongoing SSRF hardening; current protections block obvious local/private hostnames but do not resolve DNS to validate private IP targets after redirect.

## Recent Change Log
- 2026-06-10: Added initial memory bank documentation under `memory-bank/`.
- 2026-06-10: Added vacancy URL scan flow, vacancy scraper service, and explicit Google Drive to Supabase CV cache sync before matching.
