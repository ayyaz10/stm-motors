alter table public.jobs
  add column if not exists booking_number_snapshot text;

alter table public.jobs
  add column if not exists car_registration_snapshot text;

alter table public.jobs
  add column if not exists vehicle_summary_snapshot text;

update public.jobs
set
  booking_number_snapshot = coalesce(public.jobs.booking_number_snapshot, bookings.booking_number),
  car_registration_snapshot = coalesce(public.jobs.car_registration_snapshot, bookings.car_registration),
  vehicle_summary_snapshot = coalesce(
    public.jobs.vehicle_summary_snapshot,
    trim(
      concat_ws(
        ' ',
        bookings.make,
        bookings.model,
        bookings.engine,
        bookings.fuel,
        bookings.year
      )
    )
  )
from public.bookings
where bookings.id = public.jobs.booking_id;

alter table public.vehicle_check_ins
  add column if not exists odometer_reading bigint;

drop policy if exists "Staff can read operational bookings" on public.bookings;
create policy "Staff can read operational bookings"
on public.bookings
for select
to authenticated
using (
  public.has_role(array['ops', 'admin'])
  or exists (
    select 1
    from public.jobs j
    where j.booking_id = public.bookings.id
      and j.assigned_mechanic_user_id = auth.uid()
      and j.status not in ('completed', 'cancelled')
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
      and j.status not in ('completed', 'cancelled')
  )
)
with check (
  exists (
    select 1
    from public.job_services js
    join public.jobs j on j.id = js.job_id
    where js.id = public.job_service_checklist_items.job_service_id
      and j.assigned_mechanic_user_id = auth.uid()
      and j.status not in ('completed', 'cancelled')
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
      and j.status not in ('completed', 'cancelled')
  )
);

drop policy if exists "Mechanics can upload assigned vehicle check photos" on storage.objects;
create policy "Mechanics can upload assigned vehicle check photos"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'vehicle-checks'
  and exists (
    select 1
    from public.jobs j
    where j.id::text = (storage.foldername(name))[1]
      and j.assigned_mechanic_user_id = auth.uid()
      and j.status not in ('completed', 'cancelled')
  )
);

drop policy if exists "Staff can read permitted vehicle check photos" on storage.objects;
create policy "Staff can read permitted vehicle check photos"
on storage.objects
for select
to authenticated
using (
  bucket_id = 'vehicle-checks'
  and (
    public.has_role(array['ops', 'admin'])
    or exists (
      select 1
      from public.jobs j
      where j.id::text = (storage.foldername(name))[1]
        and j.assigned_mechanic_user_id = auth.uid()
        and j.status not in ('completed', 'cancelled')
    )
  )
);

drop policy if exists "Staff can delete permitted vehicle check photos" on storage.objects;
create policy "Staff can delete permitted vehicle check photos"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'vehicle-checks'
  and (
    public.has_role(array['ops', 'admin'])
    or exists (
      select 1
      from public.jobs j
      where j.id::text = (storage.foldername(name))[1]
        and j.assigned_mechanic_user_id = auth.uid()
        and j.status not in ('completed', 'cancelled')
    )
  )
);
