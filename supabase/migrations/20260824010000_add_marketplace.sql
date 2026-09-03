create extension if not exists pgcrypto;

create or replace function public.is_marketplace_staff()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles
    where profiles.id = auth.uid()
      and profiles.role in ('ops', 'admin')
  );
$$;

revoke all on function public.is_marketplace_staff() from public;
grant execute on function public.is_marketplace_staff() to authenticated;

create table if not exists public.marketplace_vehicle_listings (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  stock_reference text unique,
  make text not null,
  model text not null,
  derivative text,
  registration_number text,
  year integer not null check (year between 1900 and 2100),
  price numeric(12,2) not null check (price >= 0),
  mileage integer not null check (mileage >= 0),
  fuel_type text not null,
  transmission text not null,
  body_type text,
  engine_size text,
  colour text,
  doors smallint check (doors between 1 and 10),
  seats smallint check (seats between 1 and 20),
  previous_owners smallint check (previous_owners >= 0),
  service_history text,
  mot_expiry date,
  description text not null default '',
  features text[] not null default '{}',
  specifications jsonb not null default '{}'::jsonb check (jsonb_typeof(specifications) = 'object'),
  status text not null default 'draft' check (
    status in ('draft', 'published', 'reserved', 'sold', 'archived')
  ),
  featured boolean not null default false,
  show_when_sold boolean not null default true,
  published_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  created_by uuid,
  updated_by uuid,
  internal_notes text
);

create table if not exists public.marketplace_vehicle_images (
  id uuid primary key default gen_random_uuid(),
  vehicle_id uuid not null references public.marketplace_vehicle_listings(id) on delete cascade,
  storage_path text not null unique,
  alt_text text not null default '',
  sort_order integer not null default 0 check (sort_order >= 0),
  is_primary boolean not null default false,
  created_at timestamptz not null default timezone('utc', now()),
  created_by uuid
);

create table if not exists public.marketplace_vehicle_enquiries (
  id uuid primary key default gen_random_uuid(),
  reference text not null unique,
  idempotency_key uuid not null unique,
  vehicle_id uuid not null references public.marketplace_vehicle_listings(id) on delete restrict,
  vehicle_title_snapshot text not null,
  listing_slug_snapshot text not null,
  displayed_price_snapshot numeric(12,2) not null,
  name text not null,
  email text not null,
  phone text,
  preferred_contact text not null check (preferred_contact in ('email', 'phone', 'either')),
  message text not null,
  privacy_consent boolean not null check (privacy_consent),
  source_url text,
  status text not null default 'new' check (
    status in ('new', 'contacted', 'in_progress', 'completed', 'closed')
  ),
  internal_notes text,
  contacted_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.marketplace_sell_submissions (
  id uuid primary key default gen_random_uuid(),
  reference text not null unique,
  idempotency_key uuid not null unique,
  name text not null,
  email text not null,
  phone text not null,
  postcode text not null,
  preferred_contact text not null check (preferred_contact in ('email', 'phone', 'either')),
  registration_number text not null,
  make text not null,
  model text not null,
  year integer not null check (year between 1900 and 2100),
  mileage integer not null check (mileage >= 0),
  fuel_type text,
  transmission text,
  colour text,
  body_type text,
  service_history text,
  mot_expiry date,
  previous_owners smallint check (previous_owners >= 0),
  condition text not null,
  known_faults text,
  outstanding_finance text not null check (outstanding_finance in ('yes', 'no', 'unsure')),
  expected_price numeric(12,2) check (expected_price >= 0),
  additional_notes text,
  privacy_consent boolean not null check (privacy_consent),
  source_url text,
  status text not null default 'new' check (
    status in ('new', 'contacted', 'in_progress', 'completed', 'closed')
  ),
  internal_notes text,
  contacted_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.marketplace_sell_submission_images (
  id uuid primary key default gen_random_uuid(),
  submission_id uuid not null references public.marketplace_sell_submissions(id) on delete cascade,
  storage_path text not null unique,
  original_filename text not null,
  mime_type text not null,
  size_bytes integer not null check (size_bytes > 0),
  sort_order integer not null default 0 check (sort_order >= 0),
  created_at timestamptz not null default timezone('utc', now())
);

create index if not exists marketplace_vehicle_listings_public_idx
  on public.marketplace_vehicle_listings (status, published_at desc)
  where status in ('published', 'reserved', 'sold');
create index if not exists marketplace_vehicle_listings_filters_idx
  on public.marketplace_vehicle_listings (make, model, price, year, mileage);
create index if not exists marketplace_vehicle_images_vehicle_idx
  on public.marketplace_vehicle_images (vehicle_id, is_primary desc, sort_order);
create index if not exists marketplace_vehicle_enquiries_status_idx
  on public.marketplace_vehicle_enquiries (status, created_at desc);
create index if not exists marketplace_vehicle_enquiries_email_idx
  on public.marketplace_vehicle_enquiries (lower(email), created_at desc);
create index if not exists marketplace_sell_submissions_status_idx
  on public.marketplace_sell_submissions (status, created_at desc);
create index if not exists marketplace_sell_submissions_email_idx
  on public.marketplace_sell_submissions (lower(email), created_at desc);

create or replace function public.set_marketplace_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

drop trigger if exists marketplace_listings_set_updated_at on public.marketplace_vehicle_listings;
create trigger marketplace_listings_set_updated_at before update on public.marketplace_vehicle_listings
for each row execute function public.set_marketplace_updated_at();
drop trigger if exists marketplace_enquiries_set_updated_at on public.marketplace_vehicle_enquiries;
create trigger marketplace_enquiries_set_updated_at before update on public.marketplace_vehicle_enquiries
for each row execute function public.set_marketplace_updated_at();
drop trigger if exists marketplace_sell_submissions_set_updated_at on public.marketplace_sell_submissions;
create trigger marketplace_sell_submissions_set_updated_at before update on public.marketplace_sell_submissions
for each row execute function public.set_marketplace_updated_at();

alter table public.marketplace_vehicle_listings enable row level security;
alter table public.marketplace_vehicle_images enable row level security;
alter table public.marketplace_vehicle_enquiries enable row level security;
alter table public.marketplace_sell_submissions enable row level security;
alter table public.marketplace_sell_submission_images enable row level security;

create policy "Marketplace staff manage listings" on public.marketplace_vehicle_listings
for all to authenticated using (public.is_marketplace_staff()) with check (public.is_marketplace_staff());
create policy "Marketplace staff manage listing images" on public.marketplace_vehicle_images
for all to authenticated using (public.is_marketplace_staff()) with check (public.is_marketplace_staff());
create policy "Marketplace staff read enquiries" on public.marketplace_vehicle_enquiries
for select to authenticated using (public.is_marketplace_staff());
create policy "Marketplace staff update enquiries" on public.marketplace_vehicle_enquiries
for update to authenticated using (public.is_marketplace_staff()) with check (public.is_marketplace_staff());
create policy "Marketplace staff read sell submissions" on public.marketplace_sell_submissions
for select to authenticated using (public.is_marketplace_staff());
create policy "Marketplace staff update sell submissions" on public.marketplace_sell_submissions
for update to authenticated using (public.is_marketplace_staff()) with check (public.is_marketplace_staff());
create policy "Marketplace staff read sell images" on public.marketplace_sell_submission_images
for select to authenticated using (public.is_marketplace_staff());

revoke all on public.marketplace_vehicle_listings from anon, authenticated;
revoke all on public.marketplace_vehicle_images from anon, authenticated;
revoke all on public.marketplace_vehicle_enquiries from anon, authenticated;
revoke all on public.marketplace_sell_submissions from anon, authenticated;
revoke all on public.marketplace_sell_submission_images from anon, authenticated;
grant select, insert, update, delete on public.marketplace_vehicle_listings to authenticated;
grant select, insert, update, delete on public.marketplace_vehicle_images to authenticated;
grant select, update on public.marketplace_vehicle_enquiries to authenticated;
grant select, update on public.marketplace_sell_submissions to authenticated;
grant select on public.marketplace_sell_submission_images to authenticated;
grant all on public.marketplace_vehicle_listings to service_role;
grant all on public.marketplace_vehicle_images to service_role;
grant all on public.marketplace_vehicle_enquiries to service_role;
grant all on public.marketplace_sell_submissions to service_role;
grant all on public.marketplace_sell_submission_images to service_role;

create or replace view public.marketplace_public_vehicle_listings
with (security_barrier = true)
as
select
  id, slug, stock_reference, make, model, derivative, year, price, mileage,
  fuel_type, transmission, body_type, engine_size, colour, doors, seats,
  previous_owners, service_history, mot_expiry, description, features,
  specifications, status, featured, published_at, created_at, updated_at
from public.marketplace_vehicle_listings
where status in ('published', 'reserved')
   or (status = 'sold' and show_when_sold);

create or replace view public.marketplace_public_vehicle_images
with (security_barrier = true)
as
select id, vehicle_id, storage_path, alt_text, sort_order, is_primary
from public.marketplace_vehicle_images
where exists (
  select 1 from public.marketplace_vehicle_listings listing
  where listing.id = marketplace_vehicle_images.vehicle_id
    and (
      listing.status in ('published', 'reserved')
      or (listing.status = 'sold' and listing.show_when_sold)
    )
);

revoke all on public.marketplace_public_vehicle_listings from public;
revoke all on public.marketplace_public_vehicle_images from public;
grant select on public.marketplace_public_vehicle_listings to anon, authenticated;
grant select on public.marketplace_public_vehicle_images to anon, authenticated;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'marketplace-listings',
  'marketplace-listings',
  true,
  8388608,
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'marketplace-seller-submissions',
  'marketplace-seller-submissions',
  false,
  4194304,
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

create policy "Marketplace listing images are publicly readable"
on storage.objects for select to anon, authenticated
using (bucket_id = 'marketplace-listings');

create policy "Marketplace staff upload listing images"
on storage.objects for insert to authenticated
with check (bucket_id = 'marketplace-listings' and public.is_marketplace_staff());
create policy "Marketplace staff update listing images"
on storage.objects for update to authenticated
using (bucket_id = 'marketplace-listings' and public.is_marketplace_staff())
with check (bucket_id = 'marketplace-listings' and public.is_marketplace_staff());
create policy "Marketplace staff delete listing images"
on storage.objects for delete to authenticated
using (bucket_id = 'marketplace-listings' and public.is_marketplace_staff());

create policy "Marketplace staff read seller images"
on storage.objects for select to authenticated
using (bucket_id = 'marketplace-seller-submissions' and public.is_marketplace_staff());

