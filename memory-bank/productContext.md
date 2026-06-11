# Product Context

## Problem
Position requests arrive as unstructured text. Manually reading the request, checking CVs, and ranking candidates is slow and inconsistent.

## Desired Experience
A user should be able to submit or forward a vacancy/request and quickly receive ranked candidate matches with reasons, risks, missing requirements, and supporting evidence.

## Main Flows
1. Inbound email is received by Resend and posted to `POST /api/webhooks/resend`.
2. Manual request text is submitted from `/scans/new` to `POST /api/scans`.
3. A scan job is created in Supabase with status `queued`.
4. The app structures the request using OpenRouter.
5. The app fetches PDF/DOCX CVs from Google Drive and extracts text.
6. Each CV is matched against the structured request using OpenRouter.
7. Results are ranked, stored, shown in the UI, and emailed.

## UI Surfaces
- `/`: latest scans table with status and match count.
- `/scans/new`: manual scan form.
- `/scans/[id]`: scan summary and match cards.

## Expected Tone
The app is operational and business-focused. Match reasoning should be clear, critical, and concise rather than promotional.
