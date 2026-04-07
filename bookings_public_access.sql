alter table public.bookings enable row level security;

drop policy if exists "Anon can read bookings" on public.bookings;
drop policy if exists "Public can create bookings" on public.bookings;
drop policy if exists "Authenticated users can create bookings" on public.bookings;
drop policy if exists "Authenticated users can read bookings" on public.bookings;
drop policy if exists "Ops and admin can read bookings" on public.bookings;
drop policy if exists "Staff can read operational bookings" on public.bookings;

drop function if exists public.create_public_booking(
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
  numeric
);

create or replace function public.create_public_booking(
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
  v_booking public.bookings%rowtype;
begin
  if (p_latitude is null) <> (p_longitude is null) then
    raise exception 'Latitude and longitude must be provided together.';
  end if;

  if p_latitude is not null and (p_latitude < -90 or p_latitude > 90) then
    raise exception 'Latitude is out of range.';
  end if;

  if p_longitude is not null and (p_longitude < -180 or p_longitude > 180) then
    raise exception 'Longitude is out of range.';
  end if;

  insert into public.bookings (
    full_name,
    phone,
    email,
    street_address_1,
    street_address_2,
    city,
    postcode,
    car_registration,
    make,
    model,
    fuel,
    engine,
    year,
    selected_services,
    total_price,
    latitude,
    longitude,
    geocoded_at
  )
  values (
    p_full_name,
    p_phone,
    p_email,
    p_street_address_1,
    p_street_address_2,
    p_city,
    p_postcode,
    p_car_registration,
    p_make,
    p_model,
    p_fuel,
    p_engine,
    p_year,
    p_selected_services,
    p_total_price,
    p_latitude,
    p_longitude,
    case
      when p_latitude is null or p_longitude is null then null
      else coalesce(p_geocoded_at, timezone('utc'::text, now()))
    end
  )
  returning * into v_booking;

  return jsonb_build_object(
    'id', v_booking.id,
    'booking_number', v_booking.booking_number,
    'full_name', v_booking.full_name,
    'email', v_booking.email,
    'car_registration', v_booking.car_registration,
    'created_at', v_booking.created_at,
    'total_price', v_booking.total_price,
    'selected_services', v_booking.selected_services
  );
end;
$$;

revoke all on function public.create_public_booking(
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
  double precision,
  double precision,
  timestamptz
) from public;

grant execute on function public.create_public_booking(
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
  double precision,
  double precision,
  timestamptz
) to anon, authenticated;

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
  )
);
