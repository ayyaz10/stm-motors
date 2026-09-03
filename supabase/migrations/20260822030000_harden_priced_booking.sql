-- Keep the browser-supplied model id consistent with the selected catalog
-- make/model. Prices remain calculated entirely from server-side tables.

create or replace function public.create_public_booking_priced(
  p_full_name text,
  p_phone text,
  p_email text,
  p_street_address_1 text,
  p_street_address_2 text,
  p_city text,
  p_postcode text,
  p_car_registration text,
  p_make text,
  p_model text,
  p_fuel text,
  p_engine text,
  p_year text,
  p_selected_services text[],
  p_total_price numeric,
  p_vehicle_model_id bigint default null,
  p_availability jsonb default '[]'::jsonb,
  p_availability_note text default null,
  p_work_notes text default null,
  p_vehicle_driveable text default null,
  p_latitude double precision default null,
  p_longitude double precision default null,
  p_geocoded_at timestamptz default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_booking jsonb;
  v_booking_id uuid;
  v_vehicle_model_id bigint;
  v_vehicle_category text;
  v_mapping_reason text;
  v_total_price numeric(10, 2);
  v_pricing_type text;
  v_pricing_snapshot jsonb;
  v_priced_service_count integer;
begin
  -- This value is validated but never used to calculate the booking price.
  if p_total_price is not null and p_total_price < 0 then
    raise exception 'Submitted price cannot be negative.';
  end if;

  if p_vehicle_model_id is not null and not exists (
    select 1
    from public.vehicle_models vm
    join public.vehicle_makes mk on mk.id = vm.make_id
    where vm.id = p_vehicle_model_id
      and public.normalize_vehicle_pricing_text(mk.name)
        = public.normalize_vehicle_pricing_text(p_make)
      and (
        public.normalize_vehicle_pricing_text(vm.name)
          = public.normalize_vehicle_pricing_text(p_model)
        or public.normalize_vehicle_pricing_text(vm.name)
          = public.normalize_vehicle_pricing_text(mk.name || ' ' || p_model)
        or public.normalize_vehicle_pricing_text(p_model)
          = public.normalize_vehicle_pricing_text(mk.name || ' ' || vm.name)
      )
  ) then
    raise exception 'Vehicle model id does not match the selected make and model.';
  end if;

  select
    classification.vehicle_model_id,
    classification.pricing_category,
    classification.mapping_reason
  into
    v_vehicle_model_id,
    v_vehicle_category,
    v_mapping_reason
  from public.classify_vehicle_pricing(
    p_vehicle_model_id,
    p_make,
    p_model
  ) classification
  limit 1;

  select
    count(*)::integer,
    sum(pricing.price)::numeric(10, 2),
    case
      when bool_or(pricing.pricing_type = 'from') then 'from'
      else 'estimated'
    end,
    jsonb_agg(
      jsonb_build_object(
        'vehicle_model_id', v_vehicle_model_id,
        'service_id', pricing.service_id,
        'vehicle_pricing_category', v_vehicle_category,
        'quoted_price', pricing.price,
        'pricing_type', pricing.pricing_type
      )
      order by array_position(p_selected_services, pricing.service_id)
    )
  into
    v_priced_service_count,
    v_total_price,
    v_pricing_type,
    v_pricing_snapshot
  from public.service_pricing pricing
  where pricing.active
    and pricing.vehicle_category = v_vehicle_category
    and pricing.service_id = any(p_selected_services);

  if coalesce(cardinality(p_selected_services), 0) = 0 then
    raise exception 'Select at least one valid service.';
  end if;

  if v_priced_service_count <> cardinality(p_selected_services) then
    raise exception 'Estimated pricing is unavailable for one or more selected services.';
  end if;

  select public.create_public_booking(
    p_full_name => p_full_name,
    p_phone => p_phone,
    p_email => p_email,
    p_street_address_1 => p_street_address_1,
    p_street_address_2 => p_street_address_2,
    p_city => p_city,
    p_postcode => p_postcode,
    p_car_registration => p_car_registration,
    p_make => p_make,
    p_model => p_model,
    p_fuel => p_fuel,
    p_engine => p_engine,
    p_year => p_year,
    p_selected_services => p_selected_services,
    p_total_price => v_total_price,
    p_availability => p_availability,
    p_availability_note => p_availability_note,
    p_work_notes => p_work_notes,
    p_vehicle_driveable => p_vehicle_driveable,
    p_latitude => p_latitude,
    p_longitude => p_longitude,
    p_geocoded_at => p_geocoded_at
  )
  into v_booking;

  v_booking_id := (v_booking->>'id')::uuid;

  update public.bookings
  set
    vehicle_model_id = v_vehicle_model_id,
    vehicle_pricing_category = v_vehicle_category,
    pricing_mapping_reason = v_mapping_reason,
    quoted_price = v_total_price,
    pricing_type = v_pricing_type,
    service_pricing_snapshot = coalesce(v_pricing_snapshot, '[]'::jsonb)
  where id = v_booking_id;

  return v_booking || jsonb_build_object(
    'vehicle_model_id', v_vehicle_model_id,
    'vehicle_pricing_category', v_vehicle_category,
    'pricing_mapping_reason', v_mapping_reason,
    'quoted_price', v_total_price,
    'pricing_type', v_pricing_type,
    'service_pricing_snapshot', coalesce(v_pricing_snapshot, '[]'::jsonb)
  );
end;
$$;

revoke all on function public.create_public_booking_priced(
  text,
  text,
  text,
  text,
  text,
  text,
  text,
  text,
  text,
  text,
  text,
  text,
  text,
  text[],
  numeric,
  bigint,
  jsonb,
  text,
  text,
  text,
  double precision,
  double precision,
  timestamptz
) from public, anon, authenticated;

grant execute on function public.create_public_booking_priced(
  text,
  text,
  text,
  text,
  text,
  text,
  text,
  text,
  text,
  text,
  text,
  text,
  text,
  text[],
  numeric,
  bigint,
  jsonb,
  text,
  text,
  text,
  double precision,
  double precision,
  timestamptz
) to service_role;

