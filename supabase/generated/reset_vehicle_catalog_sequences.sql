select setval(
  pg_get_serial_sequence(''public.vehicle_makes'', ''id''),
  coalesce((select max(id) from public.vehicle_makes), 1),
  true
);

select setval(
  pg_get_serial_sequence(''public.vehicle_models'', ''id''),
  coalesce((select max(id) from public.vehicle_models), 1),
  true
);

select setval(
  pg_get_serial_sequence(''public.vehicle_model_fuels'', ''id''),
  coalesce((select max(id) from public.vehicle_model_fuels), 1),
  true
);

select setval(
  pg_get_serial_sequence(''public.vehicle_model_engine_sizes'', ''id''),
  coalesce((select max(id) from public.vehicle_model_engine_sizes), 1),
  true
);

select setval(
  pg_get_serial_sequence(''public.vehicle_model_years'', ''id''),
  coalesce((select max(id) from public.vehicle_model_years), 1),
  true
);
