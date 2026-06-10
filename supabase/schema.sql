create extension if not exists "pgcrypto";

create table if not exists public.scan_jobs (
  id uuid primary key default gen_random_uuid(),
  email_message_id text,
  email_from text,
  email_subject text,
  request_summary text,
  structured_request jsonb,
  status text not null default 'queued' check (status in ('queued', 'processing', 'completed', 'failed')),
  error_message text,
  created_at timestamptz not null default now(),
  completed_at timestamptz
);

create table if not exists public.cv_sources (
  id uuid primary key default gen_random_uuid(),
  drive_file_id text not null unique,
  file_name text not null,
  mime_type text not null,
  modified_time timestamptz,
  text_hash text,
  text_content text,
  last_scanned_at timestamptz,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.match_results (
  id uuid primary key default gen_random_uuid(),
  scan_job_id uuid not null references public.scan_jobs(id) on delete cascade,
  cv_source_id uuid references public.cv_sources(id) on delete set null,
  candidate_name text not null,
  role_title text,
  score numeric not null check (score >= 0 and score <= 100),
  rank int not null,
  match_reasons jsonb not null default '[]'::jsonb,
  risks jsonb not null default '[]'::jsonb,
  missing_requirements jsonb not null default '[]'::jsonb,
  evidence jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists cv_sources_is_active_idx on public.cv_sources(is_active) where is_active = true;
create index if not exists match_results_scan_job_id_idx on public.match_results(scan_job_id);
create index if not exists match_results_rank_idx on public.match_results(scan_job_id, rank);
create index if not exists scan_jobs_created_at_idx on public.scan_jobs(created_at desc);

alter table public.scan_jobs enable row level security;
alter table public.cv_sources enable row level security;
alter table public.match_results enable row level security;

create policy "Allow anon read scan jobs"
  on public.scan_jobs for select
  to anon
  using (true);

create policy "Allow anon read cv sources"
  on public.cv_sources for select
  to anon
  using (true);

create policy "Allow anon read match results"
  on public.match_results for select
  to anon
  using (true);
