# Project Brief

## Project
CV Position Matcher is an MVP that automatically matches Dutch staffing/detachment position requests against CV documents stored in one Google Drive folder.

## Core Goal
Reduce manual CV shortlisting by turning an incoming request into structured requirements, matching all available CVs, storing the top results, and sending a concise match report.

## Primary Users
- Recruiters or account managers who receive position requests.
- Internal users who review scan status and match details in the dashboard.

## Current Inputs
- Forwarded inbound emails via Resend webhook.
- Manual pasted request text via the `/scans/new` frontend.

## Core Output
- A `scan_jobs` record with structured request data and status.
- Top 5 `match_results` linked to indexed CV sources.
- An outbound email report sent through Resend.
- Dashboard pages for scan overview and scan details.

## Important Constraints
- CV source is currently one configured Google Drive folder.
- Supported CV file types are PDF and DOCX.
- Matching is synchronous; large folders may exceed runtime limits.
- Dashboard currently has no authentication layer.
- Secrets belong in `.env.local` and deployment environment variables, not in source control.
