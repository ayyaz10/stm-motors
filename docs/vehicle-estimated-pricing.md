# Vehicle-based estimated pricing

The booking flow resolves each selected `vehicle_models.id` to one internal
pricing category and reads the matching service prices from Supabase.

## Tables

- `service_pricing` stores one numeric price per service slug and category.
- `vehicle_pricing_overrides` stores private model-level manual corrections.
- `vehicle_pricing_make_rules` stores normalized premium/large-make rules.
- `vehicle_pricing_model_rules` stores normalized SUV, small, and mid-size
  model rules.
- `vehicle_pricing_classification_audit` is a service-role-only audit view.

The public roles can read active prices and active classification rules. They
cannot insert, update, or delete them and cannot read the override table.

## Change a price

Run as an administrator or service-role database user:

```sql
update public.service_pricing
set price = 92
where service_id = 'brake-pads-front-all'
  and vehicle_category = 'small';
```

`pricing_type` remains numeric metadata and must be either `estimated` or
`from`. VAT is not added by the application or database.

## Override one vehicle model

```sql
insert into public.vehicle_pricing_overrides (
  vehicle_model_id,
  pricing_category,
  notes
)
values (774, 'mid_size', 'Manually reviewed by STM Motors')
on conflict (vehicle_model_id) do update
set
  pricing_category = excluded.pricing_category,
  notes = excluded.notes;
```

Manual overrides always take priority over make, model, engine-size, and
fallback rules.

## Audit mappings

Run as a service-role database user:

```sql
select pricing_category, count(*)
from public.vehicle_pricing_classification_audit
group by pricing_category
order by pricing_category;

select vehicle_model_id, make, model, pricing_category, mapping_reason
from public.vehicle_pricing_classification_audit
where mapping_reason = 'fallback_mid_size'
order by make, model;
```

## Booking snapshots

New bookings preserve the resolved model id, category, mapping reason, overall
estimated/from price, and a JSON snapshot for every selected service. The
server-side booking function recalculates these values from Supabase; it does
not trust prices submitted by the browser.

