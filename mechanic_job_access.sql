alter table public.jobs enable row level security;
alter table public.job_services enable row level security;
alter table public.job_service_checklist_items enable row level security;
alter table public.vehicle_check_ins enable row level security;

drop policy if exists "Mechanics can read assigned jobs" on public.jobs;
create policy "Mechanics can read assigned jobs"
on public.jobs
for select
to authenticated
using (assigned_mechanic_user_id = auth.uid());

drop policy if exists "Mechanics can read assigned job services" on public.job_services;
create policy "Mechanics can read assigned job services"
on public.job_services
for select
to authenticated
using (
  exists (
    select 1
    from public.jobs j
    where j.id = public.job_services.job_id
      and j.assigned_mechanic_user_id = auth.uid()
  )
);

drop policy if exists "Mechanics can read assigned checklist items" on public.job_service_checklist_items;
create policy "Mechanics can read assigned checklist items"
on public.job_service_checklist_items
for select
to authenticated
using (
  exists (
    select 1
    from public.job_services js
    join public.jobs j on j.id = js.job_id
    where js.id = public.job_service_checklist_items.job_service_id
      and j.assigned_mechanic_user_id = auth.uid()
  )
);

drop policy if exists "Mechanics can update assigned checklist items" on public.job_service_checklist_items;
create policy "Mechanics can update assigned checklist items"
on public.job_service_checklist_items
for update
to authenticated
using (
  exists (
    select 1
    from public.job_services js
    join public.jobs j on j.id = js.job_id
    where js.id = public.job_service_checklist_items.job_service_id
      and j.assigned_mechanic_user_id = auth.uid()
  )
)
with check (
  exists (
    select 1
    from public.job_services js
    join public.jobs j on j.id = js.job_id
    where js.id = public.job_service_checklist_items.job_service_id
      and j.assigned_mechanic_user_id = auth.uid()
  )
);

drop policy if exists "Mechanics can read assigned vehicle check-ins" on public.vehicle_check_ins;
create policy "Mechanics can read assigned vehicle check-ins"
on public.vehicle_check_ins
for select
to authenticated
using (
  exists (
    select 1
    from public.jobs j
    where j.id::text = public.vehicle_check_ins.job_id
      and j.assigned_mechanic_user_id = auth.uid()
  )
);
