alter table public.vehicle_check_ins enable row level security;
alter table public.vehicle_check_ins
alter column mechanic_phone drop not null;

alter table public.vehicle_check_ins
add column if not exists odometer_reading bigint;

with ranked_check_ins as (
  select
    id,
    row_number() over (
      partition by job_id
      order by submitted_at desc, id desc
    ) as row_number_for_job
  from public.vehicle_check_ins
  where job_id is not null
)
delete from public.vehicle_check_ins
where id in (
  select id
  from ranked_check_ins
  where row_number_for_job > 1
);

create unique index if not exists vehicle_check_ins_job_id_unique_idx
  on public.vehicle_check_ins (job_id)
  where job_id is not null;

drop policy if exists "Anon can insert vehicle check-ins" on public.vehicle_check_ins;
drop policy if exists "Ops and admin can read vehicle check-ins" on public.vehicle_check_ins;
drop policy if exists "Mechanics can create assigned vehicle check-ins" on public.vehicle_check_ins;
drop policy if exists "Mechanics can update assigned vehicle check-ins" on public.vehicle_check_ins;

create policy "Ops and admin can read vehicle check-ins"
on public.vehicle_check_ins
for select
to authenticated
using (public.has_role(array['ops', 'admin']));

create policy "Mechanics can create assigned vehicle check-ins"
on public.vehicle_check_ins
for insert
to authenticated
with check (
  exists (
    select 1
    from public.jobs j
    where j.id::text = public.vehicle_check_ins.job_id
      and j.assigned_mechanic_user_id = auth.uid()
      and j.status not in ('completed', 'cancelled')
  )
);

create policy "Mechanics can update assigned vehicle check-ins"
on public.vehicle_check_ins
for update
to authenticated
using (
  exists (
    select 1
    from public.jobs j
    where j.id::text = public.vehicle_check_ins.job_id
      and j.assigned_mechanic_user_id = auth.uid()
      and j.status not in ('completed', 'cancelled')
  )
)
with check (
  exists (
    select 1
    from public.jobs j
    where j.id::text = public.vehicle_check_ins.job_id
      and j.assigned_mechanic_user_id = auth.uid()
      and j.status not in ('completed', 'cancelled')
  )
);

drop policy if exists "Anon can upload vehicle check photos" on storage.objects;
drop policy if exists "Anon can read vehicle check photos" on storage.objects;
drop policy if exists "Anon can delete vehicle check photos" on storage.objects;
drop policy if exists "Authenticated staff can upload vehicle check photos" on storage.objects;
drop policy if exists "Authenticated staff can read vehicle check photos" on storage.objects;
drop policy if exists "Authenticated staff can delete vehicle check photos" on storage.objects;
drop policy if exists "Mechanics can upload assigned vehicle check photos" on storage.objects;
drop policy if exists "Staff can read permitted vehicle check photos" on storage.objects;
drop policy if exists "Staff can delete permitted vehicle check photos" on storage.objects;

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
