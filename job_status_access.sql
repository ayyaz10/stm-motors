alter table public.jobs enable row level security;
alter table public.jobs
  add column if not exists reopened_at timestamptz;
alter table public.jobs
  add column if not exists reopened_by_user_id uuid references auth.users(id);
alter table public.jobs
  add column if not exists reopen_reason text;

drop policy if exists "Mechanics can update assigned jobs" on public.jobs;
drop policy if exists "Ops and admins can update jobs" on public.jobs;

create policy "Ops and admins can update jobs"
on public.jobs
for update
to authenticated
using (public.has_role(array['ops', 'admin']))
with check (public.has_role(array['ops', 'admin']));

create or replace function public.complete_assigned_job(p_job_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_job public.jobs%rowtype;
  v_has_check_in boolean;
  v_total_checklist_items integer;
  v_completed_checklist_items integer;
begin
  select *
  into v_job
  from public.jobs
  where id = p_job_id
    and assigned_mechanic_user_id = auth.uid();

  if not found then
    raise exception 'You can only complete jobs assigned to you.';
  end if;

  if v_job.status = 'cancelled' then
    raise exception 'Cancelled jobs cannot be completed.';
  end if;

  if v_job.status = 'completed' then
    return;
  end if;

  select exists (
    select 1
    from public.vehicle_check_ins vci
    where vci.job_id = p_job_id::text
  )
  into v_has_check_in;

  if not v_has_check_in then
    raise exception 'Vehicle check-in must be submitted before the job can be completed.';
  end if;

  select
    count(items.id),
    count(items.id) filter (where items.is_completed)
  into v_total_checklist_items, v_completed_checklist_items
  from public.job_services services
  left join public.job_service_checklist_items items
    on items.job_service_id = services.id
  where services.job_id = p_job_id;

  if v_total_checklist_items > 0
     and v_completed_checklist_items < v_total_checklist_items then
    raise exception 'Complete all checklist items before submitting the service.';
  end if;

  update public.jobs
  set status = 'completed',
      updated_at = timezone('utc'::text, now())
  where id = p_job_id;
end;
$$;

revoke all on function public.complete_assigned_job(uuid) from public;
grant execute on function public.complete_assigned_job(uuid) to authenticated;

create or replace function public.reopen_job_for_ops(
  p_job_id uuid,
  p_reason text,
  p_reset_workflow boolean default false
)
returns public.jobs
language plpgsql
security definer
set search_path = public
as $$
declare
  v_job public.jobs%rowtype;
  v_has_check_in boolean;
  v_total_checklist_items integer;
  v_completed_checklist_items integer;
  v_next_status text;
begin
  if not public.has_role(array['ops', 'admin']) then
    raise exception 'Only ops or admin users can reopen closed jobs.';
  end if;

  if coalesce(trim(p_reason), '') = '' then
    raise exception 'A reopen reason is required.';
  end if;

  select *
  into v_job
  from public.jobs
  where id = p_job_id;

  if not found then
    raise exception 'Job not found.';
  end if;

  if v_job.status not in ('completed', 'cancelled') then
    raise exception 'Only completed or cancelled jobs can be reopened.';
  end if;

  if p_reset_workflow then
    delete from public.vehicle_check_ins
    where job_id = p_job_id::text;

    update public.job_service_checklist_items
    set
      is_completed = false,
      completed_at = null,
      completed_by_name = null,
      notes = null
    where job_service_id in (
      select id
      from public.job_services
      where job_id = p_job_id
    );

    v_next_status := case
      when v_job.scheduled_for is not null then 'scheduled'
      else 'assigned'
    end;
  else
    select exists (
      select 1
      from public.vehicle_check_ins vci
      where vci.job_id = p_job_id::text
    )
    into v_has_check_in;

    select
      count(items.id),
      count(items.id) filter (where items.is_completed)
    into v_total_checklist_items, v_completed_checklist_items
    from public.job_services services
    left join public.job_service_checklist_items items
      on items.job_service_id = services.id
    where services.job_id = p_job_id;

    v_next_status := case
      when not v_has_check_in and v_job.scheduled_for is not null then 'scheduled'
      when not v_has_check_in then 'assigned'
      when v_total_checklist_items = 0 then 'in_progress'
      when v_completed_checklist_items < v_total_checklist_items then 'in_progress'
      else 'in_progress'
    end;
  end if;

  update public.jobs
  set
    status = v_next_status,
    reopened_at = timezone('utc'::text, now()),
    reopened_by_user_id = auth.uid(),
    reopen_reason = trim(p_reason),
    updated_at = timezone('utc'::text, now())
  where id = p_job_id
  returning *
  into v_job;

  return v_job;
end;
$$;

revoke all on function public.reopen_job_for_ops(uuid, text, boolean) from public;
grant execute on function public.reopen_job_for_ops(uuid, text, boolean) to authenticated;
