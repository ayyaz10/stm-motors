create extension if not exists pgcrypto;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

alter table public.jobs
add column if not exists scheduled_arrival_window jsonb;

create table if not exists public.availability_blocks (
  id uuid primary key default gen_random_uuid(),
  date date not null,
  start_time time not null,
  end_time time not null,
  block_type text not null default 'closed',
  reason text,
  is_active boolean not null default true,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default timezone('utc'::text, now()),
  updated_at timestamptz not null default timezone('utc'::text, now()),
  constraint availability_blocks_type_check check (
    block_type in ('closed', 'manual_hold')
  ),
  constraint availability_blocks_time_check check (start_time < end_time)
);

create index if not exists availability_blocks_date_idx
  on public.availability_blocks (date, start_time, end_time)
  where is_active = true;

drop trigger if exists set_availability_blocks_updated_at
on public.availability_blocks;

create trigger set_availability_blocks_updated_at
before update on public.availability_blocks
for each row
execute function public.set_updated_at();

create or replace function public.set_availability_block_created_by()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.created_by is null then
    new.created_by = auth.uid();
  end if;

  return new;
end;
$$;

drop trigger if exists set_availability_block_created_by
on public.availability_blocks;

create trigger set_availability_block_created_by
before insert on public.availability_blocks
for each row
execute function public.set_availability_block_created_by();

alter table public.availability_blocks enable row level security;

drop policy if exists "Anon can read active availability blocks"
on public.availability_blocks;

create policy "Anon can read active availability blocks"
on public.availability_blocks
for select
to anon
using (is_active = true);

drop policy if exists "Ops and admin can read availability blocks"
on public.availability_blocks;

create policy "Ops and admin can read availability blocks"
on public.availability_blocks
for select
to authenticated
using (public.has_role(array['ops', 'admin']));

drop policy if exists "Ops and admin can create availability blocks"
on public.availability_blocks;

create policy "Ops and admin can create availability blocks"
on public.availability_blocks
for insert
to authenticated
with check (public.has_role(array['ops', 'admin']));

drop policy if exists "Ops and admin can update availability blocks"
on public.availability_blocks;

create policy "Ops and admin can update availability blocks"
on public.availability_blocks
for update
to authenticated
using (public.has_role(array['ops', 'admin']))
with check (public.has_role(array['ops', 'admin']));

create or replace function public.get_public_unavailable_windows(
  p_start_date date,
  p_end_date date
)
returns jsonb
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(jsonb_agg(window_row order by window_row->>'date', window_row->>'start_time'), '[]'::jsonb)
  from (
    select jsonb_build_object(
      'id', ab.id,
      'date', ab.date::text,
      'start_time', to_char(ab.start_time, 'HH24:MI'),
      'end_time', to_char(ab.end_time, 'HH24:MI'),
      'block_type', ab.block_type,
      'reason', ab.reason,
      'source_job_id', null
    ) as window_row
    from public.availability_blocks ab
    where ab.is_active = true
      and ab.date between p_start_date and p_end_date

    union all

    select jsonb_build_object(
      'id', jobs.id,
      'date', coalesce(
        jobs.scheduled_arrival_window->>'date',
        (jobs.scheduled_for at time zone 'Europe/London')::date::text
      ),
      'start_time', coalesce(
        jobs.scheduled_arrival_window->>'start_time',
        to_char((jobs.scheduled_for at time zone 'Europe/London')::time, 'HH24:MI')
      ),
      'end_time', coalesce(
        jobs.scheduled_arrival_window->>'end_time',
        to_char(((jobs.scheduled_for at time zone 'Europe/London') + interval '2 hours')::time, 'HH24:MI')
      ),
      'block_type', 'scheduled_job',
      'reason', 'Booked job',
      'source_job_id', jobs.id
    ) as window_row
    from public.jobs
    where jobs.status not in ('completed', 'cancelled')
      and (
        (
          jobs.scheduled_arrival_window ? 'date'
          and (jobs.scheduled_arrival_window->>'date')::date between p_start_date and p_end_date
        )
        or (
          jobs.scheduled_arrival_window is null
          and jobs.scheduled_for is not null
          and (jobs.scheduled_for at time zone 'Europe/London')::date between p_start_date and p_end_date
        )
      )
  ) unavailable_windows;
$$;

revoke all on function public.get_public_unavailable_windows(date, date)
from public;

grant execute on function public.get_public_unavailable_windows(date, date)
to anon, authenticated;
