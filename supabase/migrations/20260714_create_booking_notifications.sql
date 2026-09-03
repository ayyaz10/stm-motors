create extension if not exists pgcrypto;

create table if not exists public.public_booking_submission_requests (
  id uuid primary key default gen_random_uuid(),
  idempotency_key text not null,
  request_hash text not null,
  booking_id uuid references public.bookings (id) on delete set null,
  status text not null default 'processing' check (
    status in ('processing', 'created', 'failed')
  ),
  error_code text,
  error_message text,
  completed_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create unique index if not exists public_booking_submission_requests_idempotency_key_key
  on public.public_booking_submission_requests (idempotency_key);

create index if not exists public_booking_submission_requests_booking_id_idx
  on public.public_booking_submission_requests (booking_id);

create index if not exists public_booking_submission_requests_status_idx
  on public.public_booking_submission_requests (status);

create table if not exists public.booking_email_notifications (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid not null references public.bookings (id) on delete cascade,
  email_type text not null check (
    email_type in ('admin', 'customer')
  ),
  recipient_email text not null,
  status text not null default 'pending' check (
    status in ('pending', 'sent', 'failed')
  ),
  resend_message_id text,
  last_attempted_at timestamptz,
  failure_reason text,
  attempt_count integer not null default 0 check (attempt_count >= 0),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create unique index if not exists booking_email_notifications_booking_id_email_type_key
  on public.booking_email_notifications (booking_id, email_type);

create index if not exists booking_email_notifications_status_idx
  on public.booking_email_notifications (status);

create index if not exists booking_email_notifications_last_attempted_at_idx
  on public.booking_email_notifications (last_attempted_at desc);

create or replace function public.set_public_booking_submission_request_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

drop trigger if exists public_booking_submission_requests_set_updated_at
  on public.public_booking_submission_requests;

create trigger public_booking_submission_requests_set_updated_at
before update on public.public_booking_submission_requests
for each row
execute function public.set_public_booking_submission_request_updated_at();

create or replace function public.set_booking_email_notification_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

drop trigger if exists booking_email_notifications_set_updated_at
  on public.booking_email_notifications;

create trigger booking_email_notifications_set_updated_at
before update on public.booking_email_notifications
for each row
execute function public.set_booking_email_notification_updated_at();

alter table public.public_booking_submission_requests enable row level security;
alter table public.booking_email_notifications enable row level security;
