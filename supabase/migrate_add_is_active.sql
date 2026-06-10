alter table public.cv_sources
  add column if not exists is_active boolean not null default true;

create index if not exists cv_sources_is_active_idx on public.cv_sources(is_active) where is_active = true;
