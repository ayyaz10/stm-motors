-- Public mechanic applications now pass through the CAPTCHA-verifying
-- submit-mechanic-application Edge Function. Direct Data API inserts would
-- otherwise allow callers to bypass the CAPTCHA completely.

drop policy if exists "Public can submit mechanic applications"
on public.mechanic_applications;

revoke insert on table public.mechanic_applications from anon, authenticated;

