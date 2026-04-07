alter table public.jobs enable row level security;
alter table public.job_services enable row level security;
alter table public.job_service_checklist_items enable row level security;

drop policy if exists "Anon can read jobs" on public.jobs;
drop policy if exists "Anon can create jobs" on public.jobs;
drop policy if exists "Anon can delete jobs" on public.jobs;
drop policy if exists "Ops and admin can read jobs" on public.jobs;
create policy "Ops and admin can read jobs"
on public.jobs
for select
to authenticated
using (public.has_role(array['ops', 'admin']));

drop policy if exists "Ops and admin can create jobs" on public.jobs;
create policy "Ops and admin can create jobs"
on public.jobs
for insert
to authenticated
with check (public.has_role(array['ops', 'admin']));

drop policy if exists "Ops and admin can delete jobs" on public.jobs;
create policy "Ops and admin can delete jobs"
on public.jobs
for delete
to authenticated
using (public.has_role(array['ops', 'admin']));

drop policy if exists "Anon can read job services" on public.job_services;
drop policy if exists "Anon can create job services" on public.job_services;
drop policy if exists "Anon can delete job services" on public.job_services;
drop policy if exists "Ops and admin can read job services" on public.job_services;
create policy "Ops and admin can read job services"
on public.job_services
for select
to authenticated
using (public.has_role(array['ops', 'admin']));

drop policy if exists "Ops and admin can create job services" on public.job_services;
create policy "Ops and admin can create job services"
on public.job_services
for insert
to authenticated
with check (public.has_role(array['ops', 'admin']));

drop policy if exists "Ops and admin can delete job services" on public.job_services;
create policy "Ops and admin can delete job services"
on public.job_services
for delete
to authenticated
using (public.has_role(array['ops', 'admin']));

drop policy if exists "Anon can read checklist items" on public.job_service_checklist_items;
drop policy if exists "Anon can create checklist items" on public.job_service_checklist_items;
drop policy if exists "Anon can update checklist items" on public.job_service_checklist_items;
drop policy if exists "Anon can delete checklist items" on public.job_service_checklist_items;
drop policy if exists "Ops and admin can read checklist items" on public.job_service_checklist_items;
create policy "Ops and admin can read checklist items"
on public.job_service_checklist_items
for select
to authenticated
using (public.has_role(array['ops', 'admin']));

drop policy if exists "Ops and admin can create checklist items" on public.job_service_checklist_items;
create policy "Ops and admin can create checklist items"
on public.job_service_checklist_items
for insert
to authenticated
with check (public.has_role(array['ops', 'admin']));

drop policy if exists "Ops and admin can update checklist items" on public.job_service_checklist_items;
create policy "Ops and admin can update checklist items"
on public.job_service_checklist_items
for update
to authenticated
using (public.has_role(array['ops', 'admin']))
with check (public.has_role(array['ops', 'admin']));

drop policy if exists "Ops and admin can delete checklist items" on public.job_service_checklist_items;
create policy "Ops and admin can delete checklist items"
on public.job_service_checklist_items
for delete
to authenticated
using (public.has_role(array['ops', 'admin']));
