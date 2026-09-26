alter table public.mechanic_applications enable row level security;

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
