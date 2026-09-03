-- Qualify the override category column because the function's return column
-- has the same name.

create or replace function public.classify_vehicle_pricing(
  p_vehicle_model_id bigint default null,
  p_make text default null,
  p_model text default null
)
returns table (
  vehicle_model_id bigint,
  pricing_category text,
  mapping_reason text,
  matched_rule text
)
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_vehicle_model_id bigint := p_vehicle_model_id;
  v_make text := p_make;
  v_model text := p_model;
  v_make_normalized text;
  v_model_normalized text;
  v_category text;
  v_reason text;
  v_rule text;
  v_min_engine_size integer;
begin
  if v_vehicle_model_id is null
     and nullif(btrim(coalesce(p_make, '')), '') is not null
     and nullif(btrim(coalesce(p_model, '')), '') is not null then
    select vm.id
    into v_vehicle_model_id
    from public.vehicle_models vm
    join public.vehicle_makes mk on mk.id = vm.make_id
    where public.normalize_vehicle_pricing_text(mk.name)
            = public.normalize_vehicle_pricing_text(p_make)
      and (
        public.normalize_vehicle_pricing_text(vm.name)
          = public.normalize_vehicle_pricing_text(p_model)
        or public.normalize_vehicle_pricing_text(vm.name)
          = public.normalize_vehicle_pricing_text(mk.name || ' ' || p_model)
        or public.normalize_vehicle_pricing_text(p_model)
          = public.normalize_vehicle_pricing_text(mk.name || ' ' || vm.name)
      )
    order by vm.id
    limit 1;
  end if;

  if v_vehicle_model_id is not null then
    select mk.name, vm.name
    into v_make, v_model
    from public.vehicle_models vm
    join public.vehicle_makes mk on mk.id = vm.make_id
    where vm.id = v_vehicle_model_id;
  end if;

  v_make_normalized := public.normalize_vehicle_pricing_text(v_make);
  v_model_normalized := public.normalize_vehicle_pricing_text(v_model);

  if v_vehicle_model_id is not null then
    select override_rule.pricing_category
    into v_category
    from public.vehicle_pricing_overrides override_rule
    where override_rule.vehicle_model_id = v_vehicle_model_id;

    if found then
      return query
      select v_vehicle_model_id, v_category, 'manual_override'::text,
        v_vehicle_model_id::text;
      return;
    end if;
  end if;

  select rule.pricing_category, rule.mapping_reason, rule.normalized_make
  into v_category, v_reason, v_rule
  from public.vehicle_pricing_make_rules rule
  where rule.active
    and rule.normalized_make = v_make_normalized
  limit 1;

  if found then
    return query
    select v_vehicle_model_id, v_category, v_reason, v_rule;
    return;
  end if;

  select
    rule.pricing_category,
    rule.mapping_reason,
    concat_ws(':', rule.normalized_make, rule.normalized_model_pattern)
  into v_category, v_reason, v_rule
  from public.vehicle_pricing_model_rules rule
  where rule.active
    and (rule.normalized_make is null or rule.normalized_make = v_make_normalized)
    and strpos(
      ' ' || v_model_normalized || ' ',
      ' ' || rule.normalized_model_pattern || ' '
    ) > 0
  order by rule.priority, rule.id
  limit 1;

  if found then
    return query
    select v_vehicle_model_id, v_category, v_reason, v_rule;
    return;
  end if;

  if v_vehicle_model_id is not null then
    select min(engine_size_simple) filter (where engine_size_simple > 0)
    into v_min_engine_size
    from public.vehicle_model_engine_sizes
    where model_id = v_vehicle_model_id;

    if v_min_engine_size >= 2500 then
      return query
      select v_vehicle_model_id, 'suv_premium'::text,
        'large_engine_rule'::text, v_min_engine_size::text;
      return;
    end if;
  end if;

  return query
  select v_vehicle_model_id, 'mid_size'::text, 'fallback_mid_size'::text, null::text;
end;
$$;

revoke all on function public.classify_vehicle_pricing(bigint, text, text)
  from public;
grant execute on function public.classify_vehicle_pricing(bigint, text, text)
  to anon, authenticated, service_role;

