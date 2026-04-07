alter table public.bookings enable row level security;

drop policy if exists "Anon can read bookings" on public.bookings;
drop policy if exists "Public can create bookings" on public.bookings;
drop policy if exists "Authenticated users can create bookings" on public.bookings;
drop policy if exists "Authenticated users can read bookings" on public.bookings;
drop policy if exists "Ops and admin can read bookings" on public.bookings;
drop policy if exists "Staff can read operational bookings" on public.bookings;

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
  p_total_price numeric
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_booking public.bookings%rowtype;
begin
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
    total_price
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
    p_total_price
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
  numeric
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
  numeric
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
