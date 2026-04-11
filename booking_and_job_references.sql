create extension if not exists pgcrypto;

create sequence if not exists public.booking_number_seq;
create sequence if not exists public.job_reference_seq;

create or replace function public.generate_booking_number()
returns text
language plpgsql
as $$
declare
  next_sequence bigint;
begin
  next_sequence := nextval('public.booking_number_seq');

  return 'BKG-'
    || to_char(timezone('utc', now()), 'YYYYMMDD')
    || '-'
    || lpad(next_sequence::text, 6, '0');
end;
$$;

create or replace function public.generate_job_reference()
returns text
language plpgsql
as $$
declare
  next_sequence bigint;
begin
  next_sequence := nextval('public.job_reference_seq');

  return 'JOB-'
    || to_char(timezone('utc', now()), 'YYYYMMDD')
    || '-'
    || lpad(next_sequence::text, 6, '0');
end;
$$;

alter table public.bookings
add column if not exists booking_number text;

update public.bookings
set booking_number = public.generate_booking_number()
where booking_number is null;

alter table public.bookings
alter column booking_number set default public.generate_booking_number();

alter table public.bookings
alter column booking_number set not null;

create unique index if not exists bookings_booking_number_key
  on public.bookings (booking_number);

create table if not exists public.jobs (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid not null references public.bookings(id) on delete cascade,
  job_reference text not null default public.generate_job_reference(),
  status text not null default 'unassigned',
  booking_number_snapshot text,
  car_registration_snapshot text,
  vehicle_summary_snapshot text,
  assigned_mechanic_name text,
  assigned_mechanic_phone text,
  scheduled_for timestamptz,
  created_at timestamptz not null default timezone('utc'::text, now()),
  updated_at timestamptz not null default timezone('utc'::text, now()),
  constraint jobs_status_check check (
    status in ('unassigned', 'assigned', 'scheduled', 'in_progress', 'completed', 'cancelled')
  )
);

alter table public.jobs
  add column if not exists booking_number_snapshot text;

alter table public.jobs
  add column if not exists car_registration_snapshot text;

alter table public.jobs
  add column if not exists vehicle_summary_snapshot text;

update public.jobs
set
  booking_number_snapshot = coalesce(public.jobs.booking_number_snapshot, bookings.booking_number),
  car_registration_snapshot = coalesce(public.jobs.car_registration_snapshot, bookings.car_registration),
  vehicle_summary_snapshot = coalesce(
    public.jobs.vehicle_summary_snapshot,
    trim(
      concat_ws(
        ' ',
        bookings.make,
        bookings.model,
        bookings.engine,
        bookings.fuel,
        bookings.year
      )
    )
  )
from public.bookings
where bookings.id = public.jobs.booking_id;

create unique index if not exists jobs_job_reference_key
  on public.jobs (job_reference);

create index if not exists jobs_booking_id_idx
  on public.jobs (booking_id);

alter table public.jobs enable row level security;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

drop trigger if exists set_jobs_updated_at on public.jobs;
create trigger set_jobs_updated_at
before update on public.jobs
for each row
execute function public.set_updated_at();
