create or replace function public.list_mechanics()
returns table (
  id uuid,
  full_name text,
  email text
)
language sql
stable
security definer
set search_path = public, auth
as $$
  select
    p.id,
    p.full_name,
    u.email::text
  from public.profiles p
  join auth.users u on u.id = p.id
  where p.role = 'mechanic'
  order by
    coalesce(nullif(trim(p.full_name), ''), u.email),
    u.email;
$$;

revoke all on function public.list_mechanics() from public;
grant execute on function public.list_mechanics() to authenticated;
