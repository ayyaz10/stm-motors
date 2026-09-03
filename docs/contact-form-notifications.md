# Contact Form Notifications

The public contact page now sends email through a Supabase Edge Function backed by Resend.

## What Changed

- `supabase/functions/submit-contact-form/index.ts`
  Handles contact form validation, optional Google reCAPTCHA verification, and Resend delivery.
- `supabase/functions/_shared/contact-emails.ts`
  Builds the admin email HTML and plain-text content.
- `src/lib/contactEnquiries.ts`
  Frontend helper that invokes the Edge Function.
- `src/components/forms/GoogleRecaptchaField.tsx`
  Renders the Google reCAPTCHA widget when a site key is configured.
- `src/pages/ContactPage.tsx`
  Sends real contact enquiries instead of showing a fake success state.

## Required Resend Secrets

Set these secrets in Supabase before deploying the function:

```bash
supabase secrets set \
  RESEND_API_KEY=re_xxxxxxxxxxxxxxxxxxxxx \
  CONTACT_FORM_TO_EMAIL=info@stmmotors.com \
  CONTACT_FORM_FROM_EMAIL='STM Motors <info@stmmotors.com>' \
  PUBLIC_WEBSITE_URL=https://stmmotors.com
```

Recommended production values:

- `CONTACT_FORM_TO_EMAIL=info@stmmotors.com`
- `CONTACT_FORM_FROM_EMAIL=STM Motors <info@stmmotors.com>`
- `PUBLIC_WEBSITE_URL=https://stmmotors.com`

## Google reCAPTCHA Setup

This implementation is ready for Google reCAPTCHA v2 checkbox mode.

### Frontend env

Add your public site key:

```bash
VITE_RECAPTCHA_SITE_KEY=your-google-recaptcha-site-key
```

### Supabase secret

Add your server secret key:

```bash
supabase secrets set \
  CONTACT_RECAPTCHA_SECRET=your-google-recaptcha-secret
```

If `CONTACT_RECAPTCHA_SECRET` is not set, the contact form still sends email but Google reCAPTCHA verification is skipped. The hidden honeypot field remains active as a light anti-spam fallback.

## Function Deployment

Deploy the contact function:

```bash
supabase functions deploy submit-contact-form
```

Serve it locally while developing:

```bash
supabase functions serve submit-contact-form --env-file .env.local
```

## Manual Test Checklist

1. Submit a valid contact enquiry and confirm the email arrives at `info@stmmotors.com`.
2. Confirm the email `Reply-To` is the customer email address.
3. If Google reCAPTCHA is configured, try submitting without the checkbox and confirm the form is blocked.
4. Complete the checkbox and confirm the submission succeeds.
5. Fill the hidden honeypot field manually in dev tools and confirm the request is ignored safely.
