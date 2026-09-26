alter table public.mechanic_applications
  add column if not exists referral_source text,
  add column if not exists referral_details text;

alter table public.mechanic_applications
  drop constraint if exists mechanic_applications_referral_source_check;

alter table public.mechanic_applications
  add constraint mechanic_applications_referral_source_check check (
    referral_source is null or referral_source in (
      'google_search',
      'facebook',
      'instagram',
      'tiktok',
      'linkedin',
      'indeed_or_job_board',
      'friend_or_colleague',
      'existing_customer_or_partner',
      'leaflet_or_local_ad',
      'other'
    )
  );

create index if not exists mechanic_applications_referral_source_idx
  on public.mechanic_applications (referral_source);
