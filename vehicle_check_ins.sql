create extension if not exists pgcrypto;

insert into storage.buckets (id, name, public)
values ('vehicle-checks', 'vehicle-checks', false)
on conflict (id) do nothing;

create table if not exists public.vehicle_check_ins (
  id uuid primary key default gen_random_uuid(),
  booking_id text,
  job_id text,
  mechanic_name text not null,
  mechanic_phone text,
  visible_damage boolean,
  warning_lights boolean,
  notes text,
  odometer_photo_path text not null,
  front_photo_path text not null,
  rear_photo_path text not null,
  left_photo_path text not null,
  right_photo_path text not null,
  submitted_at timestamptz not null default timezone('utc'::text, now())
);

create index if not exists vehicle_check_ins_booking_id_idx
  on public.vehicle_check_ins (booking_id);

create index if not exists vehicle_check_ins_job_id_idx
  on public.vehicle_check_ins (job_id);

create unique index if not exists vehicle_check_ins_job_id_unique_idx
  on public.vehicle_check_ins (job_id)
  where job_id is not null;

alter table public.vehicle_check_ins enable row level security;
