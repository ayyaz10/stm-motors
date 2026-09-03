revoke execute on function public.is_marketplace_admin() from anon;
grant execute on function public.is_marketplace_admin() to authenticated, service_role;

revoke all on function public.set_staff_invitation_updated_at() from public;
revoke execute on function public.set_staff_invitation_updated_at() from anon, authenticated;
