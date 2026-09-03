# STM Motors staff portal deployment

The central staff application is deployed at `https://staff.stmmotors.com`. It uses the same Supabase Auth project, `profiles` roles, database tables, RLS policies and Edge Functions as the service and marketplace sites. It has no public signup.

## Build and local testing

1. Copy the normal frontend environment values into `.env.staff.local` when testing locally. Browser code must contain only `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` and other public `VITE_` values—never the service-role key.
2. Run `npm run dev:staff`.
3. Open `http://localhost:5173/login`.
4. Create a production package with `npm run build:staff`. The contents of `dist`, including `.htaccess`, are the files for the staff subdomain document root.

## Hostinger and DNS

1. In Hostinger, create the `staff.stmmotors.com` subdomain with a separate document root. Do not point it at the `.com` or `.co.uk` public-site directory.
2. If Hostinger does not create DNS automatically, add the `staff` A record to the same hosting IP, or the CNAME target supplied by Hostinger. Do not guess the value—copy it from the hosting account.
3. Enable SSL for `staff.stmmotors.com` and wait until HTTPS is valid before inviting staff.
4. Upload the staff ZIP to that subdomain document root and extract it so `index.html`, `assets/` and `.htaccess` are at the root.
5. `.htaccess` provides the SPA fallback needed for refreshing nested routes such as `/marketplace/vehicles/new`.

## Supabase Auth dashboard

Add these exact Redirect URLs under Authentication > URL Configuration:

- `https://staff.stmmotors.com/login`
- `https://staff.stmmotors.com/accept-invite`
- `https://staff.stmmotors.com/accept-mechanic-invite`
- `http://localhost:5173/login`
- `http://localhost:5173/accept-invite`
- `http://localhost:5173/accept-mechanic-invite`
- `http://127.0.0.1:5173/login`
- `http://127.0.0.1:5173/accept-invite`
- `http://127.0.0.1:5173/accept-mechanic-invite`

Keep the old `.co.uk/admin/accept-invite` URLs temporarily so already-sent invitations can be completed safely. The old page completes the password step on the original domain and then sends the user to the central login without forwarding tokens.

Configure production SMTP in Supabase Auth before sending real invitations. Confirm sender-domain DNS, rate limits and delivery monitoring.

## Edge Function configuration

Set server-side secrets (never `VITE_` prefixed):

```text
STAFF_INVITE_REDIRECT_URL=https://staff.stmmotors.com/accept-invite
STAFF_PORTAL_URL=https://staff.stmmotors.com
```

Deploy the changed functions against the confirmed linked project:

```text
npx supabase functions deploy manage-staff-invitations
npx supabase functions deploy accept-staff-invitation
npx supabase functions deploy approve-mechanic-application
```

`manage-staff-invitations` accepts only the exact production/local acceptance URLs coded in its allowlist. `staff.stmmotors.com` is explicitly included in CORS, but CORS is not authorization: JWT verification, the Admin role check and RLS remain authoritative.

## Role and route checks

- Admin: all Marketplace and Operations tools, workflow review and `/staff` invitations.
- Ops: Marketplace and Operations tools plus workflow review; `/staff` is denied.
- Mechanic: assigned jobs and their own workflow routes only.

After deployment, verify login/sign-out and direct refresh for each role. Test that an Ops user receives denial at `/staff`, a Mechanic receives denial at `/operations/jobs` and `/marketplace/vehicles`, and an anonymous browser cannot read protected tables or invoke privileged functions.

## Launch checklist

- Confirm `https://staff.stmmotors.com/login` has a valid certificate.
- Confirm `.com/book` and `.co.uk/cars` still load normally.
- Confirm old staff bookmarks redirect without sensitive/unknown query parameters.
- Send a new Admin/Ops invitation and verify it opens `/accept-invite`.
- Approve a test Mechanic and verify the email opens `/accept-mechanic-invite`.
- Confirm password values, access tokens and refresh tokens never appear in browser URLs or application logs.

