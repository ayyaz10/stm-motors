create extension if not exists pgcrypto;

alter table public.jobs
add column if not exists ops_notes text;

create table if not exists public.job_services (
  id uuid primary key default gen_random_uuid(),
  job_id uuid not null references public.jobs(id) on delete cascade,
  service_id text not null,
  service_name text not null,
  short_description text,
  labour_time text,
  parts_included text[] not null default '{}',
  important_notes text[] not null default '{}',
  sort_order integer not null default 0,
  created_at timestamptz not null default timezone('utc'::text, now())
);

create index if not exists job_services_job_id_idx
  on public.job_services (job_id);

create table if not exists public.job_service_checklist_items (
  id uuid primary key default gen_random_uuid(),
  job_service_id uuid not null references public.job_services(id) on delete cascade,
  checklist_label text not null,
  sort_order integer not null default 0,
  is_completed boolean not null default false,
  completed_at timestamptz,
  completed_by_name text,
  notes text,
  created_at timestamptz not null default timezone('utc'::text, now())
);

create index if not exists job_service_checklist_items_job_service_id_idx
  on public.job_service_checklist_items (job_service_id);

alter table public.job_services enable row level security;
alter table public.job_service_checklist_items enable row level security;
