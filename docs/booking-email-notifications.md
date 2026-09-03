# Booking Email Notifications

This repository now sends booking emails through a Supabase Edge Function backed by Resend.

## What Changed

- `supabase/functions/create-booking/index.ts`
  Handles booking creation, idempotency, and both admin/customer emails.
- `supabase/functions/_shared/create-booking.ts`
  Shared booking validation, trusted pricing, hashing, and response shaping.
- `supabase/functions/_shared/booking-emails.ts`
  Responsive HTML and plain-text email templates plus config helpers.
- `supabase/migrations/20260714_create_booking_notifications.sql`
  Adds booking request idempotency tracking and email delivery tracking tables.
- `src/lib/bookings.ts`
  Frontend now calls the `create-booking` Edge Function instead of writing bookings directly from the browser.
- `src/components/Steps/UserDetails.tsx`
  Uses a stable idempotency key while a booking submission is in flight or retried.
- `src/lib/bookingServiceCatalog.ts`
  Trusted service pricing used for booking validation.
- `src/lib/formSubmit.ts`
  Booking FormSubmit logic removed. Mechanic application FormSubmit remains untouched.
- `.env.example`
  Placeholder environment variables for booking email delivery.

## Required Secrets

Set these secrets in Supabase before deploying the function:

```bash
supabase secrets set \
  SUPABASE_URL=https://YOUR_PROJECT_ID.supabase.co \
  SUPABASE_SERVICE_ROLE_KEY=YOUR_SERVICE_ROLE_KEY \
  RESEND_API_KEY=re_xxxxxxxxxxxxxxxxxxxxx \
  ADMIN_BOOKING_EMAIL=info@stmmotors.com \
  BOOKING_FROM_EMAIL='STM Motors <bookings@stmmotors.com>' \
  PUBLIC_WEBSITE_URL=https://stmmotors.com
```

Production values expected by this project:

- `ADMIN_BOOKING_EMAIL=info@stmmotors.com`
- `BOOKING_FROM_EMAIL=STM Motors <bookings@stmmotors.com>`
- `PUBLIC_WEBSITE_URL=https://stmmotors.com`

## SQL Migration

Apply the booking notification migration before deploying the function:

```bash
supabase db push
```

If you apply SQL manually, run:

- [supabase/migrations/20260714_create_booking_notifications.sql](/F:/git_repos/car/stm-autotrader/supabase/migrations/20260714_create_booking_notifications.sql)

This migration adds:

- `public_booking_submission_requests`
  Tracks idempotency keys so retries do not create duplicate bookings.
- `booking_email_notifications`
  Tracks admin/customer email status, Resend message IDs, attempt counts, and failure reasons.

## Function Deployment

Deploy the booking function:

```bash
supabase functions deploy create-booking
```

Serve it locally while developing:

```bash
supabase functions serve create-booking --env-file .env.local
```

## Local Development

Frontend env:

```bash
VITE_SUPABASE_URL=https://YOUR_PROJECT_ID.supabase.co
VITE_SUPABASE_ANON_KEY=YOUR_SUPABASE_ANON_KEY
```

Function env:

```bash
SUPABASE_URL=https://YOUR_PROJECT_ID.supabase.co
SUPABASE_SERVICE_ROLE_KEY=YOUR_SERVICE_ROLE_KEY
RESEND_API_KEY=re_xxxxxxxxxxxxxxxxxxxxx
ADMIN_BOOKING_EMAIL=info@stmmotors.com
BOOKING_FROM_EMAIL='STM Motors <bookings@stmmotors.com>'
PUBLIC_WEBSITE_URL=https://stmmotors.com
```

The frontend now submits bookings to `create-booking`, which:

1. Validates the incoming payload server-side.
2. Recalculates total price from the trusted service catalog.
3. Creates the booking through the existing `create_public_booking` database function.
4. Sends the admin email to `info@stmmotors.com`.
5. Sends the customer confirmation email to the booking email address.
6. Stores email delivery results in `booking_email_notifications`.

## Resend Domain Verification

Before production email can send reliably, verify the STM Motors domain inside Resend.

Recommended sender:

- `STM Motors <bookings@stmmotors.com>`

Required external manual actions:

1. Add `stmmotors.com` as a sending domain in Resend.
2. Add the DNS records Resend provides inside your DNS provider.
3. Wait for Resend to mark the domain as verified.
4. Only then use `BOOKING_FROM_EMAIL=STM Motors <bookings@stmmotors.com>`.

Do not skip domain verification or production sends may fail or land in spam.

## Duplicate Protection

Duplicate sends are prevented by a layered approach:

- Browser uses a stable idempotency key while retrying the same booking submission.
- `public_booking_submission_requests.idempotency_key` is unique.
- Each email type is unique per booking in `booking_email_notifications`.
- Resend uses a stable `Idempotency-Key` header for each booking/email type pair.

This protects against:

- double clicks
- browser retries
- confirmation page reloads
- network retries
- duplicate function invocations

## Failure Handling

- If the booking save fails, the function returns a safe error and no confirmation page should be shown.
- If the booking is saved but one or both emails fail, the booking is preserved and the failure is recorded in `booking_email_notifications`.
- The frontend keeps the booking success flow intact even if email delivery later fails.

## Inspecting Logs

Function logs:

```bash
supabase functions logs create-booking
```

Database follow-up queries:

```sql
select *
from public.booking_email_notifications
order by created_at desc;

select *
from public.public_booking_submission_requests
order by created_at desc;
```

## Manual Test Checklist

Run these after migration + secrets + deploy:

1. Submit a valid booking and confirm:
   - booking row is created
   - admin email is received at `info@stmmotors.com`
   - customer email is received at the entered address
2. Submit the same booking twice quickly and confirm only one booking is created for the same idempotency key.
3. Retry the same request after a temporary network interruption and confirm the booking is not duplicated.
4. Force an invalid email or missing required field and confirm the request is rejected safely.
5. Temporarily remove `RESEND_API_KEY` in a non-production environment and confirm:
   - booking is still created
   - email rows are recorded as failed
   - customer does not see internal error details
6. Review email HTML on desktop and mobile clients.

## Production Notes

- Upload the latest frontend build after deploying the Edge Function and DB migration.
- Keep `SUPABASE_SERVICE_ROLE_KEY` only inside Supabase secrets or secure server environments.
- Never expose Resend credentials or service-role credentials in frontend code.
