alter table public.bookings
add column if not exists latitude double precision;

alter table public.bookings
add column if not exists longitude double precision;

alter table public.bookings
add column if not exists geocoded_at timestamptz;

create index if not exists bookings_coordinates_idx
  on public.bookings (latitude, longitude);

alter table public.bookings enable row level security;

create or replace function public.save_booking_coordinates(
  p_booking_id uuid,
  p_latitude double precision,
  p_longitude double precision,
  p_geocoded_at timestamptz default timezone('utc'::text, now())
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if p_latitude is null or p_longitude is null then
    raise exception 'Latitude and longitude are required.';
  end if;

  if p_latitude < -90 or p_latitude > 90 then
    raise exception 'Latitude is out of range.';
  end if;

  if p_longitude < -180 or p_longitude > 180 then
    raise exception 'Longitude is out of range.';
  end if;

  if not (
    public.has_role(array['ops', 'admin'])
    or exists (
      select 1
      from public.jobs j
      where j.booking_id = p_booking_id
        and j.assigned_mechanic_user_id = auth.uid()
    )
  ) then
    raise exception 'You do not have permission to save booking coordinates.';
  end if;

  update public.bookings
  set
    latitude = p_latitude,
    longitude = p_longitude,
    geocoded_at = coalesce(p_geocoded_at, timezone('utc'::text, now()))
  where id = p_booking_id;

  if not found then
    raise exception 'Booking not found.';
  end if;
end;
$$;

revoke all on function public.save_booking_coordinates(
  uuid,
  double precision,
  double precision,
  timestamptz
) from public;

grant execute on function public.save_booking_coordinates(
  uuid,
  double precision,
  double precision,
  timestamptz
) to authenticated;
