# STM Motors marketplace deployment

The same production bundle supports both STM Motors domains without sharing
their customer journeys:

- `stmmotors.com` resolves to the existing service and booking application.
- `stmmotors.co.uk` resolves to the vehicle marketplace application.

At runtime `src/lib/siteMode.ts` selects the marketplace only for
`stmmotors.co.uk` and `www.stmmotors.co.uk`. `VITE_SITE_MODE=marketplace` can
be used for a dedicated preview build; production should normally use `auto`.

## Supabase

Apply the marketplace migration and deploy the public submission functions:

```bash
npx supabase db push --linked
npx supabase functions deploy submit-marketplace-enquiry
npx supabase functions deploy submit-sell-vehicle
npx supabase functions deploy submit-mechanic-application
```

Configure these Edge Function secrets (existing Resend and reCAPTCHA secrets
are reused):

```bash
npx supabase secrets set MARKETPLACE_TO_EMAIL=info@stmmotors.com
npx supabase secrets set "MARKETPLACE_FROM_EMAIL=STM Motors Sales <info@stmmotors.com>"
npx supabase secrets set MECHANIC_APPLICATION_TO_EMAIL=info@stmmotors.com
npx supabase secrets set "MECHANIC_APPLICATION_FROM_EMAIL=STM Motors <info@stmmotors.com>"
```

Also retain `RESEND_API_KEY`, `CONTACT_RECAPTCHA_SECRET`, `SUPABASE_URL` and
`SUPABASE_SERVICE_ROLE_KEY`. The service-role key must never be placed in a
`VITE_` variable.

Add both marketplace origins to the Supabase Auth URL allow list:

- `https://stmmotors.co.uk`
- `https://www.stmmotors.co.uk`

Add `stmmotors.co.uk` and `www.stmmotors.co.uk` to the allowed domains for the
existing Google reCAPTCHA site key before enabling the public forms.

## Hostinger and DNS

1. Point the `stmmotors.co.uk` apex A record to the Hostinger web server.
2. Point `www.stmmotors.co.uk` to the apex with the Hostinger-recommended
   CNAME.
3. Add the domain as a separate website/document root in Hostinger.
4. Enable SSL for both apex and `www` before launching.
5. Upload the marketplace ZIP contents into the `.co.uk` document root.
6. Keep `public/.htaccess` in the deployed root so React routes such as
   `/cars/example-slug` and `/admin/vehicles` fall back to `index.html`.
7. Redirect one of `www` or apex to the canonical apex
   `https://stmmotors.co.uk` at the Hostinger level.

Build with:

```bash
npm ci
npm run build
```

The required public build variables are:

```text
VITE_SUPABASE_URL
VITE_SUPABASE_ANON_KEY
VITE_RECAPTCHA_SITE_KEY
VITE_SITE_MODE=auto
```

The marketplace sitemap is available at `/sitemap-marketplace.xml`. Vehicle
detail metadata is generated from each published Supabase listing.

## Launch checks

- Confirm `.com/book` still opens the service booking flow.
- Confirm `.co.uk/` opens the marketplace rather than the service homepage.
- Confirm draft/archived vehicles do not appear publicly.
- Confirm `ops` or `admin` can sign in at `https://staff.stmmotors.com/login` and open Marketplace tools there.
- Submit one test purchase enquiry and one test sell request.
- Confirm seller photos can be opened only from the authenticated admin view.
- Confirm email notifications reach `MARKETPLACE_TO_EMAIL`.

## Invitation-only staff accounts

Marketplace staff do not have a public signup route. The first Admin must be
created in Supabase Auth and given `role = 'admin'` in `public.profiles`.
After that, the Admin can invite additional Admin or Ops users from
`https://staff.stmmotors.com/staff`. Ops users continue to manage vehicles and enquiries but cannot
manage staff invitations.

Deploy the invitation functions after applying the latest migration:

```bash
npx supabase db push --linked
npx supabase functions deploy manage-staff-invitations
npx supabase functions deploy accept-staff-invitation
```

Add these exact URLs to **Authentication > URL Configuration > Redirect URLs**
in the hosted Supabase Dashboard:

- `https://staff.stmmotors.com/accept-invite`
- `http://localhost:5173/accept-invite` (development only)
- `http://127.0.0.1:5173/accept-invite` (development only)

Keep the old `.co.uk/admin/accept-invite` allowlist entries temporarily for invitations already sent before the central staff portal launch.

Supabase Auth must have working production SMTP before real staff invitations
are sent. The system never stores passwords or invitation tokens. A pending
invitation has no active Admin/Ops profile; its approved role is activated only
after the recipient opens the invite and successfully sets a password.
