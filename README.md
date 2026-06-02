# CV Position Matcher

MVP voor automatische matching van forwarded detacheringsaanvragen tegen CV's in één Google Drive-folder.

## Stack

- Next.js App Router, TypeScript en Tailwind
- Vercel deploy target
- Supabase Postgres
- Resend inbound webhooks en outbound resultaatmails
- Google Drive API voor PDF/DOCX CV's
- OpenRouter voor aanvraagstructurering en matching

## Flow

1. Forward een aanvraag naar het Resend inbound scanadres.
2. Resend roept `POST /api/webhooks/resend` aan.
3. De webhook signature wordt gevalideerd met Svix headers.
4. De app maakt een `scan_jobs` record aan.
5. De app downloadt actuele PDF/DOCX CV's uit `GOOGLE_DRIVE_FOLDER_ID`.
6. PDF/DOCX tekst wordt in-memory geextraheerd.
7. OpenRouter structureert de aanvraag en matcht elk CV.
8. Top 5 resultaten worden opgeslagen in Supabase.
9. Resend mailt het matchrapport naar `RESULT_EMAIL_TO`.
10. De webapp toont scans en matchdetails.

## Setup

1. Installeer dependencies:

```bash
npm install
```

2. Maak een Supabase project aan en voer `supabase/schema.sql` uit in de SQL editor.

3. Kopieer `.env.local.example` naar `.env.local` en vul alle waarden in.

4. Deel de Google Drive-folder met het service-account emailadres.

5. Configureer in Resend inbound email forwarding naar:

```text
https://<jouw-vercel-domain>/api/webhooks/resend
```

6. Start lokaal:

```bash
npm run dev
```

## Belangrijke v1-keuzes

- Geen Gmail listener, alleen handmatig forwarden.
- Geen volledige CV-tekst in database of logs.
- Alleen PDF en DOCX.
- Synchronous webhookverwerking. Voor grotere CV-folders is een queue de eerste logische uitbreiding.
- Dashboard is open leesbaar zolang je geen Vercel Authentication, middleware of Supabase auth toevoegt.

## Environment variables

Zie `.env.local.example`. Secrets horen alleen in `.env.local` en Vercel Environment Variables.

## Verificatie

```bash
npm run typecheck
npm run build
```
