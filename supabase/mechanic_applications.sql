create extension if not exists pgcrypto;

create table if not exists public.mechanic_applications (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  submitted_at timestamptz not null default timezone('utc', now()),
  status text not null default 'submitted' check (
    status in ('submitted', 'under_review', 'needs_info', 'approved', 'rejected')
  ),
  first_name text not null,
  last_name text not null,
  email text not null,
  phone text not null,
  postcode text not null,
  business_name text,
  mechanic_type text not null check (
    mechanic_type in ('mobile_mechanic', 'garage_and_mobile', 'garage_based')
  ),
  years_experience integer,
  service_radius_miles integer,
  website_url text,
  qualifications_summary text,
  insurance_held text[] not null default '{}',
  services_offered text[] not null default '{}',
  work_types text[] not null default '{}',
  has_diagnostic_tools boolean,
  has_service_van boolean,
  additional_notes text,
  referral_source text check (
    referral_source is null or referral_source in (
      'google_search', 'facebook', 'instagram', 'tiktok', 'linkedin',
      'indeed_or_job_board', 'friend_or_colleague',
      'existing_customer_or_partner', 'leaflet_or_local_ad', 'other'
    )
  ),
  referral_details text,
  review_note text,
  reviewed_at timestamptz,
  approved_at timestamptz,
  approved_by uuid,
  auth_user_id uuid,
  invite_sent_at timestamptz
);

create index if not exists mechanic_applications_status_idx
  on public.mechanic_applications (status);

create index if not exists mechanic_applications_submitted_at_idx
  on public.mechanic_applications (submitted_at desc);

create or replace function public.set_mechanic_application_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

drop trigger if exists mechanic_applications_set_updated_at
on public.mechanic_applications;

create trigger mechanic_applications_set_updated_at
before update on public.mechanic_applications
for each row
execute function public.set_mechanic_application_updated_at();

alter table public.mechanic_applications enable row level security;

drop policy if exists "Public can submit mechanic applications"
on public.mechanic_applications;

create policy "Public can submit mechanic applications"
on public.mechanic_applications
for insert
to anon, authenticated
with check (status = 'submitted');

drop policy if exists "Ops and admin can read mechanic applications"
on public.mechanic_applications;

create policy "Ops and admin can read mechanic applications"
on public.mechanic_applications
for select
to authenticated
using (
  exists (
    select 1
    from public.profiles
    where profiles.id = auth.uid()
      and profiles.role in ('ops', 'admin')
  )
);

drop policy if exists "Ops and admin can update mechanic applications"
on public.mechanic_applications;

create policy "Ops and admin can update mechanic applications"
on public.mechanic_applications
for update
to authenticated
using (
  exists (
    select 1
    from public.profiles
    where profiles.id = auth.uid()
      and profiles.role in ('ops', 'admin')
  )
)
with check (
  exists (
    select 1
    from public.profiles
    where profiles.id = auth.uid()
      and profiles.role in ('ops', 'admin')
  )
);

drop policy if exists "Ops and admin can delete unapproved mechanic applications"
on public.mechanic_applications;

create policy "Ops and admin can delete unapproved mechanic applications"
on public.mechanic_applications
for delete
to authenticated
using (
  status <> 'approved'
  and auth_user_id is null
  and exists (
    select 1
    from public.profiles
    where profiles.id = auth.uid()
      and profiles.role in ('ops', 'admin')
  )
);
