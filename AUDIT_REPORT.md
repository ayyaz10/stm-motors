# STM Motors Pre-Production Audit

Audit date: 24 September 2026  
Scope: `stmmotors.com`, `stmmotors.co.uk`, `staff.stmmotors.com`, the React/Vite codebase, Supabase SQL and Edge Functions, storage, email, tests, dependencies, and the local development build.  
Method: static review, execution of lint/build/unit tests, dependency audit, non-destructive local UI inspection, and safe reasoning through data flows. No destructive testing, credential attacks, load testing, production writes, or production database changes were performed.

Severity: **Critical**, **High**, **Medium**, **Low**, **Improvement**. Confidence and remediation effort are stated per finding. Line numbers refer to the audited working tree and may move after edits.

## A. Executive summary

### Architecture map

| Area | Current implementation |
|---|---|
| Public service site | React 19 + TypeScript + Vite + Tailwind; selected for `stmmotors.com` in `src/main.tsx` |
| Vehicle marketplace | A second React application selected for `stmmotors.co.uk`; public inventory, enquiries and seller submissions |
| Staff portal | A third React application selected for `staff.stmmotors.com`; Admin, Ops and Mechanic roles |
| Routing | Hand-written History API routing in `App.tsx`, `MarketplaceApp.tsx`, `StaffApp.tsx`, and `src/lib/navigation.ts` |
| Backend | Supabase Edge Functions (Deno) plus browser-to-Supabase queries protected by Postgres RLS |
| Authentication | Supabase Auth; invitation-oriented staff access; role stored in `public.profiles` |
| Database | Supabase Postgres, with a mixture of ordered migrations and manually applied root SQL files |
| Storage | Private vehicle check-in and seller-submission images; public marketplace listing images |
| Email | Resend for bookings, contact, marketplace, mechanic applications, and invitations |
| Other services | Google reCAPTCHA, optional GA4/Google Ads, Fixaroo pricing, Nominatim/OpenStreetMap and postcodes.io |
| Important journeys | Book a service; contact; browse/enquire about a vehicle; submit a car for review; apply as a mechanic; approve/invite staff; create/assign/complete jobs; vehicle check-in and service checklist |
| Deployment configuration | Not present in the repository. DNS/hosting, rewrite rules, security headers, backups and monitoring cannot be fully verified from source |

### Overall condition

The project is functional and has several good foundations: TypeScript strict mode, server-side price calculation, RLS on sensitive tables, role-aware UI routing, private storage for sensitive photos, structured public views, escaped email HTML, idempotency records, consent-gated analytics, and 165 passing unit/component tests. Lint and all three production builds pass.

It is **not yet production-ready for valuable or high-volume data**. The largest risks are not basic XSS or SQL injection; they are authorization rules that exist only in frontend helpers, non-transactional multi-step workflows, public service abuse, schema deployment drift, and missing operational controls. An authenticated Ops/Admin user—or a compromised staff session—can bypass UI safeguards through the Supabase Data API and delete records the product says should be protected. Booking idempotency and mechanic approval both contain concurrency/partial-failure windows.

The frontend is also delivered as one large cross-site bundle. Every site mode currently ships about **1.29 MB minified JavaScript (about 351 KB gzip)** plus **139 KB CSS (about 26 KB gzip)**, while public images total about **57.5 MB**. Public SEO is partly implemented, but there is no `robots.txt`, no service-site sitemap, and client-only metadata means crawlers/social bots without JavaScript receive generic content.

### Biggest concerns

- **Security/data integrity:** direct database policies allow deletion paths that UI code attempts to prohibit; public Edge Functions lack durable rate limits; CAPTCHA is fail-open in multiple public flows.
- **Reliability:** mechanic approval, job creation, listing image mutations, and stale booking idempotency recovery are multi-step and non-transactional.
- **Privacy:** full customer booking and mechanic-applicant drafts remain indefinitely in browser `localStorage`; full addresses are sent from the browser to external geocoding services; retention is described vaguely and not implemented.
- **UX/accessibility:** errors and success messages are often not announced; uploaded filenames become image alt text; large staff pages and tables need mobile/keyboard verification; mechanic applicants do not receive a confirmation email.
- **Production operations:** core schema is outside the migration chain, remote migration state could not be verified, no CI/CD or hosting security configuration is committed, and no backup/restore, monitoring or alerting evidence exists.

### Audit validation results

| Check | Result |
|---|---|
| `npm run lint` | Pass |
| `npm run build` | Pass |
| `npm run build:staff` | Pass |
| `npx vite build --mode marketplace` | Pass |
| Jest | 23 suites / 165 tests passed |
| Coverage | No usable coverage report or enforced threshold produced |
| `npm audit` | 14 advisories: 1 critical, 9 high, 2 moderate, 2 low; primarily build/test-chain packages |
| Secrets scan | No committed live secret found; `.env.example` contains placeholders only |
| Production DB state | Not verified; CLI account returned insufficient privileges and no production SQL was executed |

## B. Top 10 issues

| # | Priority | Category | Issue | Location | Impact | Recommended fix |
|---|---|---|---|---|---|---|
| 1 | High | Authorization / integrity | Job deletion restrictions are enforced only in the browser; RLS permits Ops/Admin to delete any job | `jobs_staff_access.sql:22-28`; `src/lib/jobs.ts:270-335` | In-progress/completed job history and related rows can be removed by direct API calls | Revoke direct DELETE and expose a transaction-safe `SECURITY DEFINER` RPC that locks the row and enforces allowed status/no progress/no check-in rules |
| 2 | High | Authorization / integrity | Listing deletion safeguards are UI-only; marketplace staff RLS permits deleting any listing | `supabase/migrations/20260824010000_add_marketplace.sql:184-205`; `src/lib/marketplace.ts:380-435` | Published/reserved/sold listings without enquiries can be erased; audit history and storage can diverge | Use a restricted delete policy or RPC enforcing `draft/archived`, enquiry constraints, audit logging and storage cleanup |
| 3 | High | Availability / abuse | Public booking, contact, marketplace and pricing functions have no durable server-side rate limiter | `supabase/functions/create-booking/index.ts`; `vehicle-parts-pricing/index.ts`; public submission functions | Automated requests can generate database spam, external API usage and email cost, or degrade availability | Add gateway/IP/device/email throttles, fail-closed bot checks, quotas and monitoring; do not rely on CORS or email-only counts |
| 4 | High | Concurrency | Stale booking idempotency recovery is not atomic | `supabase/functions/create-booking/index.ts:195-281` | Two retries can both reclaim one key and create duplicate bookings | Move acquisition/reclaim into a DB RPC with row lock or compare-and-swap on prior status/timestamp plus an owner token |
| 5 | High | Workflow integrity | Mechanic approval/invite is non-transactional and race-prone | `supabase/functions/approve-mechanic-application/index.ts:97-184` | Concurrent approval or a mid-flow failure can leave duplicate invitations, orphan Auth users/profiles, or an unapproved application with staff access | Atomically claim approval first, make the operation idempotent, use compensating cleanup, and finalize with compare-and-set |
| 6 | High | Deployment | Core schema and RLS are outside `supabase/migrations` | root `*.sql` files versus `supabase/migrations/` | A clean deploy/reset cannot reproduce the operational database; environments can silently differ | Baseline the full schema into ordered migrations, pin CLI version, and test `db reset`/migration deployment in CI and staging |
| 7 | Medium | Privacy | Full booking and mechanic-application PII is stored indefinitely in `localStorage` | `src/pages/CarSelectionPage.tsx:382-632`; `MechanicApplicationPage.tsx:261-644` | Anyone using the same browser profile, an extension, or an XSS payload can recover names, address, contact details, registration and application data | Prefer memory/session storage; add explicit draft consent, TTL/versioning, minimize fields and clear on expiry/cancel/logout |
| 8 | Medium | Security | Contact CAPTCHA hostname validation trusts an attacker-supplied source URL; several flows skip CAPTCHA if the secret is absent | `submit-contact-form/index.ts:74-155,250-264`; `_shared/marketplace.ts:77-100` | Misconfiguration removes bot protection; contact hostname validation does not provide the claimed origin assurance | Use a fixed server-side production hostname/action allowlist and fail closed in production when CAPTCHA is required |
| 9 | Medium | Performance | No site/route code splitting and very large unoptimized assets | `src/main.tsx`; static imports in all app roots; `public/images/` | Slower initial load and poor mobile Core Web Vitals; staff code is sent to public visitors | Separate entry builds or dynamic imports by site/route, compress to AVIF/WebP, generate responsive variants and lazy-load below-fold media |
| 10 | Medium | Operations / supply chain | Vulnerable/outdated toolchain and no committed CI/security pipeline | `package.json`, `package-lock.json`; no CI configuration | Developer/CI exposure, inconsistent releases and no automatic regression gate | Patch Vite within v7, update safe transitive dependencies, pin Supabase CLI, add CI for lint/build/tests/audit/migration reset |

## C. Security findings

| ID | Severity | Confidence | Effort | Issue and affected code | Safe attack/abuse scenario and impact | Recommended fix |
|---|---|---|---|---|---|---|
| SEC-01 | High | Confirmed | Large | **Direct job delete bypasses product rules.** `jobs_staff_access.sql:22-28` authorizes any Ops/Admin delete, while `unassignJob()` in `src/lib/jobs.ts:270-335` is the only place checking status, check-ins and completed checklist items. | An authenticated Ops/Admin session can call `/rest/v1/jobs?id=eq...` directly and delete an in-progress/completed record. UI visibility is not an authorization boundary. `vehicle_check_ins.job_id` is text, not an FK, so orphan evidence may remain. | Revoke table DELETE, implement a locked RPC, enforce status/progress constraints inside Postgres, and write a deletion audit event. |
| SEC-02 | High | Confirmed | Medium | **Marketplace listing delete guard is frontend-only.** RLS grants marketplace staff `FOR ALL`; helper restrictions live in `src/lib/marketplace.ts:380-435`. | A staff account can delete a published listing with no enquiry through the Data API. The `ON DELETE RESTRICT` enquiry FK helps only when enquiries exist. | Grant insert/select/update separately; prohibit direct delete or add status-aware DELETE policy. Prefer an audited RPC. |
| SEC-03 | High | Confirmed | Medium | **No durable application-level rate limiting on costly public functions.** `create-booking` and `vehicle-parts-pricing` use a service-role client and public CORS without a rate limiter; contact and marketplace limits are absent or email-only. | An attacker rotates email/idempotency values and repeatedly triggers inserts, Fixaroo calls and Resend messages, causing spam, cost and service degradation. | Add edge/gateway rate limits plus a database-backed sliding window by trusted client IP and normalized target; global emergency quotas; request-size caps; alerts. |
| SEC-04 | Medium | Confirmed | Small | **Contact CAPTCHA allowed host derives from client `sourceUrl`.** `submit-contact-form/index.ts:74-109,148-154`. | The caller submits its own URL, so the returned CAPTCHA hostname is compared with a caller-selected host. Site-key restrictions may still block practical abuse, but this code does not establish origin trust. | Ignore client origin for security decisions. Compare hostname/action against a fixed environment allowlist. |
| SEC-05 | Medium | Confirmed | Small | **CAPTCHA is fail-open when secrets are absent.** `_shared/marketplace.ts:86`; contact checks only when a secret exists. Shared marketplace verification also ignores returned hostname/action. | A deployment secret omission silently turns off bot protection on contact, buyer enquiry and seller submissions. | Fail startup/request handling in production when required secrets are missing; validate hostname and action; add a deployment smoke test. |
| SEC-06 | Medium | Confirmed | Medium | **Upload validation trusts MIME metadata/extension.** `submit-sell-vehicle/index.ts:23-25,70-74,137-141`; `src/lib/marketplace.ts:250-255,469-488`. | A crafted/polyglot file can be stored as an image because bytes are not decoded. Private seller storage reduces exposure, but staff browsers and public listing images still process attacker-controlled content. EXIF is retained. | Verify magic bytes, decode/re-encode images, cap dimensions/pixels/body size, strip metadata, generate safe output names and scan if operationally warranted. |
| SEC-07 | Medium | Confirmed | Small | **Raw backend/provider errors are returned to clients.** `submit-marketplace-enquiry/index.ts:126-128`, `submit-sell-vehicle/index.ts:166-170`, `vehicle-parts-pricing/index.ts:81-90`, contact and approval paths. | Constraint, table or provider details can assist reconnaissance and create inconsistent user messages. | Log a correlation ID server-side; return stable public error codes/messages. Redact provider responses and PII from logs. |
| SEC-08 | Medium | Needs verification | Medium | **Hosted Auth may be weaker than intended.** Local `supabase/config.toml` enables signup, disables email confirmation, allows six-character passwords, no complexity, no secure password change and no Auth CAPTCHA. | If hosted settings match, arbitrary accounts and weak credentials increase spam and account-compromise risk. RLS prevents an account from automatically becoming staff, which limits impact. | Verify hosted Auth settings. Disable public signup for an invitation-only staff project, require 12+ character breached-password-resistant credentials, secure password changes and MFA for Admin/Ops. |
| SEC-09 | Medium | Needs verification | Small | **No repository evidence of CSP, HSTS, anti-clickjacking, permissions or referrer headers.** No hosting configuration is committed. | If the host does not add them, XSS impact, clickjacking and data leakage through referrers are less constrained. | Configure at the CDN/host and test: strict CSP, HSTS, `frame-ancestors`, `X-Content-Type-Options`, `Referrer-Policy`, `Permissions-Policy`. |
| SEC-10 | Medium | Highly likely | Small | **Anonymous availability surface exposes unnecessary identifiers.** `availability_blocks.sql` public RPC returns `id` and `source_job_id`; a base-table anon policy may expose `reason/created_by` depending grants. | Anonymous users may enumerate job-linked UUIDs and internal reasons even though the calendar only needs blocked windows. | Revoke anon base-table SELECT and expose only date/start/end/block type through a narrow security-definer function/view. Verify live grants. |
| SEC-11 | Low | Confirmed | Medium | **No durable audit log for destructive or sensitive business actions.** Listing/job deletion and most status changes are not append-only audited. | A legitimate or compromised staff account can change/delete operational data without sufficient forensic history. | Add actor, timestamp, prior/next state, correlation ID and reason to an append-only audit table protected from ordinary updates/deletes. |
| SEC-12 | Low | Confirmed | Small | **Broad `Access-Control-Allow-Origin: *` on public booking/pricing/contact functions.** | CORS does not create the main vulnerability because these endpoints are intentionally public, but it makes browser-based cross-site automation easier and signals that origin is not a control. | Restrict browser origins where practical while retaining real server-side rate limiting. Never treat CORS as authentication. |

No confirmed SQL/NoSQL/command injection, path traversal, open redirect, SSRF, hardcoded live secret, custom JWT flaw, or React DOM XSS was found. Supabase query builders parameterize values; the one dynamic `.or()` marketplace search is character-sanitized; React escapes rendered text; email HTML is escaped. These are not guarantees against future changes, so regression tests and headers are still required.

## D. Privacy / data exposure findings

| ID | Severity | Confidence | Effort | Finding | Impact / fix |
|---|---|---|---|---|---|
| PRIV-01 | Medium | Confirmed | Medium | Booking and mechanic-application drafts store extensive PII in persistent `localStorage`. | Shared-computer users, browser extensions or an XSS can read names, email, phone, full address, registration, work notes, qualifications and insurance details. Use session storage or explicit encrypted/TTL draft persistence and clear it reliably. |
| PRIV-02 | Medium | Confirmed | Medium | `src/lib/bookingLocation.ts:170-214` sends the full street address from the browser to Nominatim, then postcode to postcodes.io. The privacy processor list names Supabase, Resend and Google but not these services. | Third parties receive customer location and IP directly. Proxy through the backend where appropriate, minimize to postcode unless full accuracy is needed, update the notice and document lawful basis/processor terms. |
| PRIV-03 | Medium | Confirmed | Medium | No implemented retention/deletion schedule for bookings, contact data, marketplace enquiries, seller photos or rejected mechanic applications. Legal text says data is kept “as long as reasonably needed” without concrete periods. | Personal data can accumulate indefinitely, increasing breach and DSAR/erasure burden. Define record classes and automated retention jobs with legal holds and deletion logs. |
| PRIV-04 | Medium | Confirmed | Small | Seller and marketplace images retain original metadata because files are stored unchanged. | EXIF may disclose capture time, device and GPS. Decode/re-encode and strip metadata before storage/publication. |
| PRIV-05 | Low | Confirmed | Small | Public error responses can expose backend/provider details (SEC-07). | This can leak schema/operational metadata. Return public codes and keep detailed errors in access-controlled logs. |
| PRIV-06 | Low | Confirmed | Small | Mechanic application notification emails include all applicant details and notes (`submit-mechanic-application/index.ts:200-245`). | Email becomes another full PII copy. Send the minimum needed and link staff to the portal; define mailbox access and retention. |
| PRIV-07 | Improvement | Confirmed | Small | Analytics/Ads are consent-gated through the cookie provider, which is a positive control. | Keep IDs blank until policy and consent categories are finalized; verify tags with a consent-mode/network test before launch. |

## E. Functional bugs

| ID | Severity | Confidence | Effort | Finding and outcome | Fix |
|---|---|---|---|---|---|
| FUN-01 | High | Confirmed | Medium | **Booking retry race.** Two callers can both read a stale/failed idempotency row and both update it because reclaim at `create-booking/index.ts:260-270` does not compare prior status/timestamp or lock it. Duplicate bookings can result. | Atomic database claim with lock/CAS and owner token; create booking and mark request in one transaction where possible. |
| FUN-02 | High | Confirmed | Large | **Mechanic approval partial states.** Invite, profile upsert and application update are independent. Failure after invite creates an orphan user/profile; simultaneous reviewers race. | Add `approving` claim state, idempotency, compensation and a transactional database finalize step. |
| FUN-03 | Medium | Confirmed | Medium | **Job creation is client-orchestrated across jobs, services and checklist items.** Cleanup is best-effort (`src/lib/jobWorkflow.ts:202-274`). | Network loss or cleanup failure leaves partial workflows. Move to one Postgres transaction/RPC. |
| FUN-04 | Medium | Confirmed | Medium | **Listing image deletion removes storage first, DB second** (`src/lib/marketplace.ts:502-508`); primary-image selection is two independent updates (`511-522`). | A DB failure leaves a broken image row; a second update failure can leave no primary image. Use an Edge Function/RPC workflow with compensation; enforce at most/exactly one primary where applicable. |
| FUN-05 | Medium | Confirmed | Small | **Email delivery can fail while submissions report success.** Marketplace helper returns `false`, calls often ignore it; mechanic submission returns `notificationSent` but the UI completes. | Staff may never see an application/enquiry. Persist notification outbox status and retry asynchronously; show a monitored admin queue rather than coupling persistence to email. |
| FUN-06 | Medium | Confirmed | Small | **“Powered by” link is broken.** `https://stmconsultinggorup.com` in both layouts does not resolve in DNS at audit time. | A footer trust link fails and the domain spelling appears incorrect. Confirm the intended company domain, update both layouts and add an external-link test. |
| FUN-07 | Low | Confirmed | Small | **Mechanic applicants receive no submission confirmation.** `submit-mechanic-application` sends only the admin notification. | Applicants cannot verify receipt or reference their application. Send a minimal acknowledgement to the applicant with reference, expectations and privacy link. |
| FUN-08 | Low | Highly likely | Small | SPA “Page not found” renders from the normal app shell and hosting will usually return HTTP 200. | Monitoring and search engines treat invalid URLs as soft 404s. Configure host rewrites plus an appropriate server/edge 404 strategy and noindex metadata. |

## F. UX findings

| ID | Severity | Confidence | Effort | Finding | Recommendation |
|---|---|---|---|---|---|
| UX-01 | Medium | Confirmed | Small | Silent email failure means a user sees success even when staff notification failed. | Use an outbox and operational retry; do not burden users with provider detail, but ensure staff sees unsent items. |
| UX-02 | Medium | Confirmed | Small | Mechanic application lacks an applicant email receipt/reference (FUN-07). | Send a confirmation with expected response time and make clear that submission is not approval. |
| UX-03 | Medium | Highly likely | Medium | Large booking/mechanic forms risk abandonment, especially after reload/storage expiry; the draft behavior is invisible. | Add explicit save/resume messaging, progress status, time estimate and safe draft expiry. |
| UX-04 | Low | Confirmed | Small | Several admin pages expose raw backend error strings. | Map errors to actionable messages (“session expired”, “record changed”, “retry”) and include a support correlation ID. |
| UX-05 | Low | Confirmed | Small | Marketplace vehicle image link’s accessible name is an uploaded filename/hash plus status in the live local page. | Generate alt text from year/make/model; allow curated alt text; do not use filenames. |
| UX-06 | Improvement | Confirmed | Small | Delete actions use browser `confirm()`, which is abrupt and cannot explain dependency blockers well. | Use a consistent confirmation dialog showing what will be removed, why an item cannot be removed, and recovery/audit behavior. |
| UX-07 | Improvement | Confirmed | Medium | Staff records can change in another tab with no stale-record warning. | Add `updated_at` optimistic concurrency and explain conflicts with reload/merge choices. |

Positive UX: primary public CTAs are visible; the marketplace clearly distinguishes buying, selling and servicing; seller copy states that submission is not a guaranteed valuation/offer; empty inventory and access-denied states exist; navigation now scrolls new SPA pages to the top.

## G. UI / responsive findings

| ID | Severity | Confidence | Effort | Finding | Recommendation |
|---|---|---|---|---|---|
| UI-01 | Medium | Highly likely | Medium | Staff tables rely on horizontal scrolling, and some cells use fixed `min-w-64/min-w-72`. This is usable but poor on narrow phones. | At small breakpoints render card rows or priority columns with an accessible details expansion. |
| UI-02 | Medium | Needs verification | Medium | Very large staff screens (Ops Assign, Progress, mechanic workflow) have dense controls and were not covered by visual regression at phone/tablet widths. | Test 320, 375, 768, 1024 and 1440 px with real content, zoom 200%, mobile keyboard and long names/notes. |
| UI-03 | Low | Confirmed | Small | Admin pages are compressed into very long one-line JSX, making visual consistency and review difficult. | Break into shared page headers, status badges, table/card, form field and feedback components. |
| UI-04 | Improvement | Confirmed | Medium | Public service and marketplace areas use partially different spacing/component systems. | Introduce shared tokens for containers, form controls, status colors, focus rings and feedback without forcing a redesign. |

## H. Accessibility findings

| ID | Severity | Confidence | Effort | Finding | Recommendation |
|---|---|---|---|---|---|
| A11Y-01 | Medium | Confirmed | Small | Many dynamic error/success messages lack `role="alert"`, `aria-live`, or focus movement (marketplace login/list/editor/home and other pages). | Add a reusable live-status component; focus an error summary on submit and link errors to fields with `aria-describedby`. |
| A11Y-02 | Medium | Confirmed | Small | Listing upload filename becomes `alt_text` (`src/lib/marketplace.ts:487`), producing meaningless hashes/filenames in screen readers. | Default to vehicle year/make/model and image position; offer a human-editable alt field. Decorative admin thumbnails should remain `alt=""`. |
| A11Y-03 | Medium | Highly likely | Medium | Custom overlays are inconsistent. Some have dialog semantics/Escape behavior, while mobile menus and image overlay paths do not consistently expose `role=dialog`, focus trap, focus return or inert background. | Standardize on one accessible Dialog/Drawer primitive and test keyboard-only behavior. |
| A11Y-04 | Low | Confirmed | Small | Several icon-only admin image controls rely on visual icons without explicit accessible labels (move up/down/delete in `MarketplaceListingEditorPage.tsx:93`). | Add unique `aria-label`s such as “Move image 2 up” and “Delete image 2”. |
| A11Y-05 | Low | Highly likely | Medium | Focus styling is inconsistent; some inputs remove outline and only change border, which may be insufficient in high-contrast/low-vision use. | Use a shared, high-contrast `:focus-visible` ring; verify Windows High Contrast and 200% zoom. |
| A11Y-06 | Improvement | Needs verification | Medium | No automated axe/pa11y coverage or documented WCAG manual test exists. | Add axe to component/E2E tests and manually test landmarks, skip links, headings, labels, contrast, zoom and reduced motion. |

Positive accessibility: the marketplace live page exposes a skip link, headings are generally hierarchical, standard labels wrap most form controls, FAQ uses native disclosure semantics, and some dialogs already support Escape/focus management.

## I. Performance findings

| ID | Severity | Confidence | Effort | Finding | Recommendation |
|---|---|---|---|---|---|
| PERF-01 | Medium | Confirmed | Large | Every mode produces roughly 1.294 MB minified JS / 351 KB gzip and triggers Vite’s 500 KB warning. All app roots/pages are statically imported. | Dynamic import by hostname and route; create distinct entry points so public users never download staff/other-site code. |
| PERF-02 | Medium | Confirmed | Medium | `public/` is about 57.5 MB; individual images are 6–7.5 MB and many are 1–2.5 MB. | AVIF/WebP, responsive `srcset/sizes`, dimension-based derivatives, cache headers, lazy loading, and preload only the actual LCP image. |
| PERF-03 | Medium | Confirmed | Medium | Staff listing and invitation queries are unbounded. `listStaff()` can fetch 20,000 Auth users every time; listings/enquiries/submissions fetch all rows. | Add cursor pagination/search, server joins or a safe staff directory table, and indexed sort/filter columns. |
| PERF-04 | Low | Confirmed | Small | Marketplace filter options select every public listing to derive distinct values (`src/lib/marketplace.ts:309-322`). | Provide a cached `DISTINCT` RPC/materialized option source, or return filter facets with the listing query. |
| PERF-05 | Low | Highly likely | Medium | No performance budgets, Lighthouse CI or Web Vitals monitoring are configured. | Add bundle/image budgets and field Web Vitals after consent/privacy review. |

## J. Backend / API findings

| ID | Severity | Confidence | Effort | Finding | Recommendation |
|---|---|---|---|---|---|
| API-01 | High | Confirmed | Medium | Public functions use service-role credentials without durable throttling (SEC-03). | Central abuse-control layer and least-privilege RPCs rather than general service-role table access where possible. |
| API-02 | High | Confirmed | Medium | Booking idempotency reclaim is non-atomic (FUN-01). | Transactional claim/finalize state machine. |
| API-03 | High | Confirmed | Large | Mechanic approval calls Auth and DB in a non-idempotent multi-step sequence (FUN-02). | Claim, invite, compensate and finalize with explicit states and correlation ID. |
| API-04 | Medium | Confirmed | Small | Error contracts vary (`{error}`, `{message}`, raw provider text, different status mappings). | Define shared success/error schemas, public codes and status conventions; validate responses in clients. |
| API-05 | Medium | Confirmed | Medium | Public emails are sent inline with the request; provider latency/failure affects response behavior and can lose notifications. | Transactional outbox + retry worker; idempotency key per notification; dashboard for failed deliveries. |
| API-06 | Medium | Confirmed | Small | Seller/enquiry rate checks key only on normalized email and are bypassable by changing addresses. | Layer IP/device/global limits and anomaly detection; keep privacy-preserving hashes if storing rate keys. |
| API-07 | Low | Confirmed | Small | Several functions do not explicitly reject unsupported HTTP methods. | Return 405 with `Allow`; cap content type and body length before parsing. |
| API-08 | Improvement | Confirmed | Medium | Core job workflow is executed directly from the browser over several tables. | Move business mutations into narrow RPC/Edge Function commands; keep browser access read-oriented. |

## K. Database findings

| ID | Severity | Confidence | Effort | Finding | Recommendation |
|---|---|---|---|---|---|
| DB-01 | High | Confirmed | Large | Core booking/job/availability/check-in schema lives in root SQL scripts rather than ordered migrations. | Create a reviewed baseline and subsequent immutable migrations; verify a clean database produces the same schema. |
| DB-02 | High | Confirmed | Medium | Delete RLS policies do not encode business invariants (SEC-01/02). | Revoke direct delete and use transaction-safe command functions plus audit records. |
| DB-03 | Medium | Confirmed | Medium | `vehicle_check_ins.booking_id` and `job_id` are text with indexes but no foreign keys (`vehicle_check_ins.sql:7-33`). | Migrate valid values to UUID FKs with deliberate `RESTRICT`/retention semantics; quarantine invalid legacy rows first. |
| DB-04 | Medium | Confirmed | Medium | Job creation and approval do not share a database transaction with dependent records. | Provide stored procedures with locks, constraints and clear retry semantics. |
| DB-05 | Medium | Highly likely | Medium | Mechanic application approval fields are not visibly constrained to Auth/profile records, and state-field consistency is not enforced in the schema. | Add appropriate FKs where cross-schema references are supportable and CHECK constraints for approved/rejected timestamps/user IDs. |
| DB-06 | Low | Confirmed | Small | Public availability RPC returns more than the UI needs. | Narrow projection and revoke base-table anon access. |
| DB-07 | Improvement | Needs verification | Medium | Backup, PITR, restore testing, connection limits and production indexes cannot be verified from source. | Document hosted settings; schedule restore drills and capture slow-query/index metrics. |

## L. Code quality / technical debt

| ID | Severity | Confidence | Effort | Finding | Recommendation |
|---|---|---|---|---|---|
| CQ-01 | Medium | Confirmed | Large | Several pages are extremely large: Ops Assign ~2,161 lines, Mechanic Application ~1,595, Vehicle Check-In ~1,098, Mechanic Overview ~1,029, Progress ~946. | Extract domain hooks, validation/state machines, presentational sections and API commands. Keep page components orchestration-focused. |
| CQ-02 | Medium | Confirmed | Medium | Three manual routers duplicate route/auth/redirect behavior and make HTTP status, metadata, lazy loading and scroll restoration harder. | Adopt a mature router or central typed route table with lazy loaders, error boundaries and canonical metadata. |
| CQ-03 | Medium | Confirmed | Medium | Database types are handwritten and `.select("*")` is used in sensitive paths. | Generate Supabase TypeScript types in CI; select explicit columns and validate external function payloads with a schema library. |
| CQ-04 | Low | Confirmed | Small | `allowJs: true`, `checkJs: false` and `skipLibCheck: true` trade away checks even though source is TypeScript. | Remove `allowJs` if unnecessary; periodically run dependency type checks; document intentional exceptions. |
| CQ-05 | Low | Confirmed | Small | `dist-marketplace/` and `dist-service/` are untracked but not ignored; `.gitignore` only covers `dist`. | Ignore all generated output directories and clean them in CI. |
| CQ-06 | Low | Confirmed | Medium | Error/log handling is ad hoc, with `console.error/warn` throughout browser and functions. | Add structured logging, correlation IDs, PII redaction and an error-monitoring boundary. |
| CQ-07 | Improvement | Confirmed | Small | `/hero-preview` is a large experimental public route in the service bundle. | Remove from production or gate/noindex it and exclude from the production bundle. |

## M. Testing gaps

Existing coverage is useful for pricing, availability, cookie consent, navigation, marketplace cards/layout, mechanic application basics and dealership flow. All 165 tests pass. Important gaps:

| ID | Severity | Confidence | Effort | Missing coverage |
|---|---|---|---|---|
| TEST-01 | High | Confirmed | Large | No automated RLS/GRANT tests against a clean local Supabase instance for anon, Mechanic, Ops and Admin roles. |
| TEST-02 | High | Confirmed | Medium | No concurrency tests for booking idempotency, mechanic approval, double-clicks or two-tab record changes. |
| TEST-03 | High | Confirmed | Medium | No Edge Function integration tests for auth, rate limits, CAPTCHA fail-closed behavior, body limits, upload signatures and email outbox retry. |
| TEST-04 | Medium | Confirmed | Large | No end-to-end tests for booking, marketplace enquiry/sale submission, staff invitation, mechanic approval, job/check-in/checklist and guarded deletion. |
| TEST-05 | Medium | Confirmed | Medium | No migration reset/forward/rollback smoke test; core schema is not reproducible from migrations. |
| TEST-06 | Medium | Confirmed | Medium | No automated accessibility, keyboard, visual regression, mobile viewport or zoom tests. |
| TEST-07 | Medium | Confirmed | Small | Coverage reporting/threshold is not functioning as a release gate. |
| TEST-08 | Low | Confirmed | Small | No broken-link/DNS, sitemap/robots, structured-data or soft-404 tests. |

Recommended minimum release suite: unit tests; schema-validation tests; Supabase integration/RLS matrix; Edge Function tests; Playwright smoke flows on three hostnames at desktop/mobile; axe scans; migration reset; dependency audit; bundle/image budgets.

## N. Deployment / production findings

| ID | Severity | Confidence | Effort | Finding | Recommendation |
|---|---|---|---|---|---|
| DEP-01 | High | Confirmed | Large | Deployment cannot be reproduced from migrations (DB-01). Remote migration state was not verifiable with the available CLI account. | Baseline, stage and verify migrations before production changes. Never treat the currently prepared dashboard SQL as executed. |
| DEP-02 | Medium | Confirmed | Medium | No CI/CD workflow, deployment manifest, rewrite/header config, health check, rollback procedure or environment promotion strategy is committed. | Add protected CI/CD with preview/staging, immutable artifacts, manual production gate and rollback runbook. |
| DEP-03 | Medium | Needs verification | Medium | No evidence of automated backups/PITR/restore drills, uptime checks, error monitoring, email-failure alerts or abuse alerts. | Configure and document RPO/RTO, monthly restore test, synthetic journeys and alerts. |
| DEP-04 | Medium | Confirmed | Small | Installed Supabase CLI is substantially behind the config/schema tooling and could not parse current configuration reliably. | Pin a current CLI version in development/CI and update it through reviewed dependency changes. |
| DEP-05 | Medium | Needs verification | Small | Hosted Auth, CORS, storage size limits, SMTP, domains, TLS and security headers may differ from repository config. | Create a production configuration checklist and an automated post-deploy smoke/security check. |
| DEP-06 | Low | Confirmed | Small | Generated `dist-*` outputs are easy to commit accidentally. | Ignore them and build in CI from a clean checkout. |

## O. SEO findings

| ID | Severity | Confidence | Effort | Finding | Recommendation |
|---|---|---|---|---|---|
| SEO-01 | Medium | Confirmed | Small | No `public/robots.txt`; only `sitemap-marketplace.xml` exists and no service-site sitemap is present. | Add hostname-specific robots and sitemaps; point each robots file at the correct sitemap. |
| SEO-02 | Medium | Confirmed | Large | Titles, canonical, Open Graph and JSON-LD are injected only after React executes; `index.html` contains generic service metadata for every build. | Pre-render/SSR public routes or generate per-route HTML. At minimum produce hostname-specific base HTML and social cards. |
| SEO-03 | Medium | Highly likely | Medium | Invalid SPA routes are soft 404s and do not set noindex metadata. | Host-level 404 handling or edge rendering with status 404; set noindex on client fallback. |
| SEO-04 | Low | Confirmed | Small | Marketplace sitemap uses `/cars`, while legacy `/cars-for-sale` is client-redirected rather than an HTTP redirect. | Configure permanent server redirects for legacy paths to consolidate signals. |
| SEO-05 | Low | Confirmed | Small | `/hero-preview` is indexable unless production hosting blocks it. | Remove/gate or mark noindex and omit from production output. |
| SEO-06 | Low | Confirmed | Small | Vehicle image alt text may be filename-based and poor for accessibility/image discovery. | Generate descriptive alt text and offer editorial control. |
| SEO-07 | Improvement | Confirmed | Small | Marketplace Home/Vehicle structured data exists, which is positive; service LocalBusiness/service markup is limited. | Validate current JSON-LD and add truthful service/business data, address/coverage and breadcrumbs where applicable. |

## P. Dependency / supply-chain findings

`npm audit` reported **1 critical, 9 high, 2 moderate and 2 low** advisories. Packages named include `handlebars`, `brace-expansion`, `browserslist`, `flatted`, `js-yaml`, `nanoid`, `picomatch`, `postcss`, `vite`, `ws`, `@humanfs/node`, `baseline-browser-mapping`, `@babel/core` and `esbuild`. Most are build/test dependencies rather than code executed in the deployed static browser bundle, so the count does not mean the public application has fourteen remotely exploitable production flaws. It does mean developer and CI environments need patching.

| ID | Severity | Confidence | Effort | Finding | Recommendation |
|---|---|---|---|---|---|
| SUP-01 | Medium | Confirmed | Small | Direct Vite 7.3.1 falls in the reported vulnerable range; 7.3.6 was the compatible wanted patch at audit time. | Upgrade within v7 first, rebuild/test, and review v8 separately as a breaking change. |
| SUP-02 | Medium | Confirmed | Medium | Critical/high transitive advisories remain in test/build graph. | Refresh lockfile through controlled upgrades/overrides, confirm dependency paths with `npm audit`, and do not expose dev servers publicly. |
| SUP-03 | Low | Confirmed | Small | Many packages are behind compatible releases; React and Vite have newer majors/minors. | Batch low-risk patches, test, then schedule majors separately. Avoid blind `npm audit fix --force`. |
| SUP-04 | Medium | Confirmed | Small | No automated dependency review, lockfile integrity gate, SBOM or update policy. | Add Dependabot/Renovate, audit in CI, provenance/lockfile checks and periodic review of third-party scripts/services. |

## Q. Product improvement opportunities

1. Give applicants and sellers a reference plus a clear response-time expectation.
2. Add an operational “notification failed” queue so persisted enquiries cannot disappear from staff attention when email fails.
3. Add reversible archive/void states for jobs/listings instead of routine hard deletion; reserve hard delete for erroneous test data with audit reason.
4. Make staff workflow status transitions explicit and server-controlled, with allowed next states shown in the UI.
5. Add stale-record detection and activity history to staff records.
6. Let marketplace staff edit meaningful image alt text and automatically create safe derivatives.
7. Provide privacy self-service instructions/reference search for enquiries and applications to reduce DSAR handling effort.
8. Add product analytics only after consent configuration is verified; focus on funnel exits and validation failures, not sensitive form contents.

## R. Quick wins

1. Correct the non-resolving STM Consulting Group footer domain after confirming the intended URL.
2. Add `robots.txt`, a service sitemap, and noindex metadata for fallback/preview routes.
3. Add `role="alert"`/`aria-live` to shared error and success feedback.
4. Replace filename-derived marketplace alt text with vehicle-derived descriptions.
5. Fail closed when required CAPTCHA secrets are missing in production and use a fixed host allowlist.
6. Stop returning raw provider/database error messages.
7. Ignore `dist-marketplace/` and `dist-service/`.
8. Patch Vite within v7 and refresh safe transitive dependencies.
9. Add an applicant acknowledgement email and persist notification delivery state.
10. Compress the largest images and add explicit width/height/responsive sources for key public media.

## S. Long-term improvements

1. Move all business mutations to typed command endpoints/RPCs with transactions, locks, idempotency and audit trails.
2. Make the full database reproducible from ordered migrations and generated TypeScript types.
3. Split service, marketplace and staff builds/route chunks instead of shipping a universal bundle.
4. Replace manual routing with typed route configuration and pre-render public pages.
5. Build an outbox/worker model for all emails and external API work.
6. Introduce an append-only operational audit log and soft-delete/archive policies.
7. Break the largest pages into domain modules and model workflows as tested state machines.
8. Establish observability: structured logs, error tracking, metrics, synthetic checks, abuse alerts and restore drills.

## T. Remediation plan

### Phase 1 – Emergency/security fixes

- Replace direct job and marketplace listing DELETE permission with safe server-side commands.
- Add durable public-endpoint rate limits, body limits and fail-closed CAPTCHA configuration.
- Fix contact CAPTCHA hostname validation and redact public errors.
- Verify hosted Auth settings, RLS/grants, storage policies and production headers.
- Patch the compatible Vite/toolchain vulnerabilities.

Why first: these reduce unauthorized data loss, abuse and compromise exposure. The RLS/RPC work depends on reliable migrations, so prepare the migration baseline in parallel and deploy through staging.

### Phase 2 – High-impact bugs and data integrity

- Make booking idempotency reclaim atomic.
- Redesign mechanic approval as an idempotent claimed workflow with compensation.
- Move job creation and listing image mutations into transaction-safe server commands.
- Add notification outbox/retries and staff visibility.
- Add foreign keys/state constraints after cleaning legacy data.

Why second: once access is constrained, these changes prevent duplicate/partial records and silent lost work. Outbox work should precede applicant-confirmation expansion.

### Phase 3 – UX/UI, privacy and accessibility

- Replace persistent PII drafts with explicit TTL/session behavior.
- Update privacy disclosures and implement retention schedules.
- Add live feedback/error summaries and accessible dialogs/icon labels.
- Improve narrow-screen staff tables and verify all primary journeys at mobile/tablet/zoom breakpoints.
- Fix broken footer URL and add user acknowledgement/reference emails.

Why third: these improve trust and completion without building on unsafe workflows.

### Phase 4 – Performance and maintainability

- Split builds/routes, optimize image delivery and add performance budgets.
- Paginate staff data and optimize filter facets.
- Refactor the largest pages, generate DB types, standardize errors/logging and adopt typed routing.
- Add E2E, RLS, Edge Function, accessibility and visual regression suites with coverage gates.

Why fourth: architectural changes become safer after workflows and permissions are stable and covered by tests.

### Phase 5 – Long-term operations

- Pre-render/SSR public pages and establish correct HTTP redirects/404s.
- Complete observability, backup/PITR and restore drills, incident response and dependency governance.
- Add audited archive/retention tooling and staff activity history.

Why fifth: these are ongoing production maturity capabilities and depend on the earlier stable architecture.

## U. Final verification checklist

### Architecture and deployment

- [ ] A clean checkout plus pinned tooling can recreate the complete local database from migrations only.
- [ ] Staging and production migration lists match the repository; rollback/forward procedures are tested.
- [ ] Service, marketplace and staff hosts serve the correct build, TLS, rewrite, redirect and 404 behavior.
- [ ] CSP, HSTS, frame protection, referrer, MIME and permissions headers pass an automated check.
- [ ] Backups/PITR, restore drill, uptime monitoring, error monitoring and alert ownership are documented.

### Security and permissions

- [ ] Anonymous users cannot read protected tables/storage or invoke privileged functions.
- [ ] Mechanic, Ops and Admin RLS tests cover every table/action and negative cross-role/cross-record cases.
- [ ] Direct Data API calls cannot delete protected jobs or non-deletable listings.
- [ ] Delete/archive commands enforce status, dependency and audit-reason rules in the database.
- [ ] Public functions enforce method/content type/body size/rate limits and bot checks fail closed.
- [ ] CAPTCHA hostname/action use a fixed production allowlist.
- [ ] Hosted signup, email verification, password, secure-change and MFA settings match the staff-only model.
- [ ] Public responses contain stable error codes and no schema/provider/internal detail.
- [ ] File uploads are signature-verified, decoded/re-encoded, dimension-limited and metadata-stripped.
- [ ] No live secrets or generated sensitive artifacts are committed.

### Data integrity

- [ ] Concurrent identical booking requests create exactly one booking.
- [ ] Concurrent mechanic approvals create one user/invite/profile and one final application state.
- [ ] Failure at every workflow step leaves a recoverable, visible state with no orphan records.
- [ ] Job creation, primary-image change and image deletion are atomic or compensating and tested.
- [ ] Vehicle check-ins have validated foreign keys/retention behavior.
- [ ] Optimistic concurrency prevents silent overwrite from two tabs.
- [ ] All important mutations produce an immutable audit event.

### Privacy

- [ ] Browser storage contains no indefinite customer/applicant PII; drafts expire and can be cleared.
- [ ] Nominatim/postcodes.io, Supabase, Resend, Google and other processors are accurately disclosed.
- [ ] Retention periods and automated deletion/legal-hold rules exist for each data class.
- [ ] Email/logs contain only necessary PII and have access/retention controls.
- [ ] Image metadata is removed and private buckets remain private.
- [ ] DSAR/correction/deletion procedures have been tested end to end.

### Functionality and UX

- [ ] Booking, contact, buyer enquiry, seller submission and mechanic application survive email-provider failure through an outbox.
- [ ] Applicant/customer confirmation emails contain a reference and accurate non-guarantee/response-time wording.
- [ ] The STM Consulting Group footer link resolves to the confirmed domain on both sites.
- [ ] All destructive actions explain impact, require confirmation and show recoverable/audited outcomes.
- [ ] Loading, empty, offline, expired-session, conflict and retry states are understandable.
- [ ] SPA navigation opens new pages at the top while hash/back behavior remains correct.

### Accessibility and responsive UI

- [ ] Axe/pa11y critical/serious findings are zero on every public and staff route.
- [ ] Keyboard-only users can open/close dialogs and menus, remain trapped appropriately, and regain focus.
- [ ] Errors/successes are announced; invalid fields are linked to an error summary.
- [ ] Every icon-only control has an accessible name; image alt text is meaningful or intentionally empty.
- [ ] Focus is visible in normal and high-contrast modes.
- [ ] All flows pass at 320/375/768/1024/1440 px, 200% zoom and with long content/mobile keyboards.

### Performance, SEO and quality gates

- [ ] Public users do not download staff/other-site application code.
- [ ] Bundle and image budgets pass; LCP media uses responsive optimized formats.
- [ ] Staff lists and filters are paginated and remain fast with realistic volume.
- [ ] Host-specific robots/sitemaps, canonical metadata, structured data, redirects and true 404s validate.
- [ ] Lint, typecheck, unit, coverage, integration, RLS, E2E, accessibility, migration and dependency checks pass in CI.
- [ ] Dependency advisories are reviewed and the Vite/Supabase toolchain is pinned to supported patched versions.

## Audit limitations and items requiring live verification

- Production Supabase settings, live grants/policies, migration history, bucket configuration, backups and logs were not changed or exhaustively queried.
- Hosting/CDN headers, DNS routing, true HTTP status codes, TLS settings and rewrite configuration are not in the repository.
- Mobile findings are based on responsive source review and desktop local UI inspection; a device/viewport visual regression pass is still required.
- No load test, penetration test, password attack, destructive action or production form submission was performed.
- I did **not** execute the prepared mechanic-application DELETE policy during this audit. The editor remains open, but its live deployment state must be verified from `pg_policies` before anyone describes the migration as deployed.
