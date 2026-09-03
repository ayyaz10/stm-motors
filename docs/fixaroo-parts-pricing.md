# Fixaroo parts pricing

## Current mode

Fixaroo pricing is retained for future use but is disabled by default. With
`FIXAROO_PRICING_ENABLED=false` (or unset), both pricing preview and booking
submission use the existing Supabase vehicle-category prices only. A stored
Fixaroo API key cannot activate external pricing by itself.

The booking flow requests pricing only for selected services. The private
Supabase Edge Function resolves compatible Fixaroo parts for the selected
make, model, and year, then adds the configured labour amount to each service.

```text
estimated service price = matched Fixaroo parts + £40 labour
```

`FIXAROO_LABOUR_PRICE` defaults to `40`, so labour can be adjusted later
without changing application code. VAT is not added.

## Required secrets

Set these as Supabase Edge Function secrets. Do not expose the Fixaroo key in a
`VITE_` variable or frontend code.

```bash
supabase secrets set FIXAROO_PRICING_ENABLED=false
supabase secrets set FIXAROO_API_KEY=fxr_your_api_key
supabase secrets set FIXAROO_LABOUR_PRICE=40
```

After Fixaroo has supplied a working key and its API has passed a smoke test,
enable the integration explicitly with:

```bash
supabase secrets set FIXAROO_PRICING_ENABLED=true
```

## Deployment

Apply migrations before deploying both functions:

```bash
supabase db push
supabase functions deploy vehicle-parts-pricing
supabase functions deploy create-booking
```

The `fixaroo_parts_cache` table is private and caches each vehicle/category
response for 24 hours to protect the API allowance. Public users cannot read or
modify the cache.

## Fallback behaviour

If the API key is missing, Fixaroo is unavailable, a category request fails, or
an exact part requirement cannot be matched, that service uses the existing
Supabase vehicle-category estimate. The booking page remains usable and never
shows a fabricated zero price.

Fault-dependent Heating, Air Conditioning, Suspension, and Steering repairs do
not have a safely identifiable part before diagnosis. They therefore start at
the configured labour price and retain `pricing_type = from`; required parts
are confirmed before work begins.

At submission, `create-booking` resolves prices again server-side and stores the
parts, labour, source, and quoted total in `service_pricing_snapshot`. Browser
prices are never trusted.
