create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  role text not null check (role in ('mechanic', 'ops', 'admin')),
  full_name text,
  phone text,
  created_at timestamptz not null default timezone('utc'::text, now()),
  updated_at timestamptz not null default timezone('utc'::text, now())
);

create index if not exists profiles_role_idx
  on public.profiles (role);

alter table public.jobs
add column if not exists assigned_mechanic_user_id uuid references public.profiles(id) on delete set null;

create index if not exists jobs_assigned_mechanic_user_id_idx
  on public.jobs (assigned_mechanic_user_id);

create or replace function public.set_profiles_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

drop trigger if exists set_profiles_updated_at on public.profiles;
create trigger set_profiles_updated_at
before update on public.profiles
for each row
execute function public.set_profiles_updated_at();

-- These helpers use security definer so RLS policies can check the signed-in
-- user's role without recursing back through profile policies.
create or replace function public.current_app_role()
returns text
language sql
stable
security definer
set search_path = public
as $$
  select role
  from public.profiles
  where id = auth.uid();
$$;

create or replace function public.has_role(required_roles text[])
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles
    where id = auth.uid()
      and role = any(required_roles)
  );
$$;

alter table public.profiles enable row level security;

drop policy if exists "Users can read own profile" on public.profiles;
create policy "Users can read own profile"
on public.profiles
for select
to authenticated
using (auth.uid() = id);

drop policy if exists "Ops and admin can read all profiles" on public.profiles;
create policy "Ops and admin can read all profiles"
on public.profiles
for select
to authenticated
using (public.has_role(array['ops', 'admin']));
