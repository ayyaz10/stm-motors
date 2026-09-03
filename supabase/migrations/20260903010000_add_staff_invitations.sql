create or replace function public.is_marketplace_admin()
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
      and profiles.role = 'admin'
  );
$$;

revoke all on function public.is_marketplace_admin() from public;
grant execute on function public.is_marketplace_admin() to authenticated;

create table public.staff_invitations (
  id uuid primary key default gen_random_uuid(),
  email text not null check (char_length(email) between 3 and 254),
  normalized_email text not null check (
    normalized_email = lower(btrim(email))
    and char_length(normalized_email) between 3 and 254
  ),
  full_name text not null check (char_length(btrim(full_name)) between 2 and 120),
  invited_role text not null check (invited_role in ('admin', 'ops')),
  status text not null default 'creating' check (
    status in ('creating', 'pending', 'accepted', 'expired', 'cancelled', 'failed')
  ),
  invited_by uuid not null references public.profiles(id) on delete restrict,
  invited_user_id uuid references auth.users(id) on delete set null,
  cancelled_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  expires_at timestamptz,
  accepted_at timestamptz,
  last_sent_at timestamptz,
  cancelled_at timestamptz,
  resend_count integer not null default 0 check (resend_count >= 0),
  failure_reason text check (failure_reason is null or char_length(failure_reason) <= 500),
  check ((status = 'accepted') = (accepted_at is not null)),
  check ((status = 'cancelled') = (cancelled_at is not null))
);

create unique index staff_invitations_one_active_email_idx
  on public.staff_invitations (normalized_email)
  where status in ('creating', 'pending');
create index staff_invitations_status_created_idx
  on public.staff_invitations (status, created_at desc);
create index staff_invitations_invited_user_idx
  on public.staff_invitations (invited_user_id)
  where invited_user_id is not null;

create table public.staff_invitation_events (
  id bigint generated always as identity primary key,
  invitation_id uuid not null references public.staff_invitations(id) on delete cascade,
  event_type text not null check (
    event_type in (
      'created', 'sent', 'resent', 'accepted', 'cancelled', 'expired',
      'delivery_failed', 'activation_failed'
    )
  ),
  actor_user_id uuid references auth.users(id) on delete set null,
  details jsonb not null default '{}'::jsonb check (jsonb_typeof(details) = 'object'),
  created_at timestamptz not null default timezone('utc', now())
);

create index staff_invitation_events_invitation_idx
  on public.staff_invitation_events (invitation_id, created_at desc);

create or replace function public.set_staff_invitation_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

create trigger staff_invitations_set_updated_at
before update on public.staff_invitations
for each row execute function public.set_staff_invitation_updated_at();

alter table public.staff_invitations enable row level security;
alter table public.staff_invitation_events enable row level security;

create policy "Admins read staff invitations"
on public.staff_invitations
for select to authenticated
using (public.is_marketplace_admin());

create policy "Admins read staff invitation events"
on public.staff_invitation_events
for select to authenticated
using (public.is_marketplace_admin());

revoke all on public.staff_invitations from public, anon, authenticated;
revoke all on public.staff_invitation_events from public, anon, authenticated;
grant select on public.staff_invitations to authenticated;
grant select on public.staff_invitation_events to authenticated;
grant all on public.staff_invitations to service_role;
grant all on public.staff_invitation_events to service_role;
grant usage, select on sequence public.staff_invitation_events_id_seq to service_role;

create or replace function public.activate_staff_invitation(
  p_invitation_id uuid,
  p_user_id uuid,
  p_email text
)
returns table (activated_role text, activated_full_name text)
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  invitation public.staff_invitations%rowtype;
  existing_role text;
begin
  select * into invitation
  from public.staff_invitations
  where id = p_invitation_id
  for update;

  if not found then
    raise exception 'Invitation not found.' using errcode = 'P0002';
  end if;

  if invitation.invited_user_id is distinct from p_user_id
     or invitation.normalized_email is distinct from lower(btrim(p_email)) then
    raise exception 'Invitation does not match the authenticated user.' using errcode = '42501';
  end if;

  if invitation.status = 'accepted' then
    select role into existing_role from public.profiles where id = p_user_id;
    if existing_role is distinct from invitation.invited_role then
      raise exception 'Accepted invitation profile is inconsistent.' using errcode = 'P0001';
    end if;
    return query select invitation.invited_role, invitation.full_name;
    return;
  end if;

  if invitation.status <> 'pending' then
    raise exception 'Invitation is not pending.' using errcode = 'P0001';
  end if;

  if invitation.expires_at is null or invitation.expires_at <= timezone('utc', now()) then
    raise exception 'Invitation has expired.' using errcode = 'P0001';
  end if;

  select role into existing_role from public.profiles where id = p_user_id;
  if existing_role is not null then
    raise exception 'An existing staff profile prevents invitation activation.' using errcode = '23505';
  end if;

  insert into public.profiles (id, role, full_name)
  values (p_user_id, invitation.invited_role, invitation.full_name);

  update public.staff_invitations
  set status = 'accepted',
      accepted_at = timezone('utc', now()),
      failure_reason = null
  where id = invitation.id;

  insert into public.staff_invitation_events (
    invitation_id, event_type, actor_user_id
  ) values (
    invitation.id, 'accepted', p_user_id
  );

  return query select invitation.invited_role, invitation.full_name;
end;
$$;

revoke all on function public.activate_staff_invitation(uuid, uuid, text) from public;
revoke execute on function public.activate_staff_invitation(uuid, uuid, text) from anon, authenticated;
grant execute on function public.activate_staff_invitation(uuid, uuid, text) to service_role;
