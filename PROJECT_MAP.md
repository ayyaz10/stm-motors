# PROJECT_MAP

This file is the quick architecture map for this repo.

Maintenance rule:
- Whenever a new feature is added, changed, or removed, update this file in the same piece of work.

## App Structure

The app is a Vite + React + TypeScript frontend backed by Supabase.

Current user flows:
- Customer booking flow
- Ops job assignment and progress tracking
- Mechanic guided workflow: dashboard -> job overview -> vehicle check-in -> service checklist

Main entry points:
- `src/main.tsx`: React bootstrap
- `src/App.tsx`: lightweight route switch based on `window.location`

Main route/page map:
- `src/pages/CarSelectionPage.tsx`: customer booking journey
- `src/pages/StaffLoginPage.tsx`: staff email/password login page
- `src/pages/OpsAssignJobPage.tsx`: ops assigns mechanics and creates jobs
  - also handles active job edits for mechanic, schedule, and ops notes
  - closed jobs can be reopened here with a reason before any further edits are allowed
- `src/pages/OpsJobProgressPage.tsx`: ops progress board
- `src/pages/MechanicDashboardPage.tsx`: mechanic landing page showing active and previous jobs
- `src/pages/MechanicJobOverviewPage.tsx`: mechanic overview and single guided start entry point
  - also serves as a read-only job review page for ops/admin
  - retries missing map coordinates when needed and shows a visible refresh error state
- `src/pages/VehicleCheckInPage.tsx`: mechanic guided step 1, including submitted-state navigation
- `src/pages/ServiceChecklistPage.tsx`: mechanic guided step 2 with final service submission
  - both pages now also support read-only ops/admin review mode

## What Each Folder Does

Repo root:
- `src/`: frontend app source
- `supabase/`: database SQL for vehicle catalog and generated seed files
- `scripts/`: one-off data generation scripts for vehicle catalog imports
- `public/`: static frontend assets
- `dist/`: build output
- `*.sql` in root: business schema changes and workflow tables for bookings, jobs, and vehicle check-ins

`src/` folders:
- `src/pages/`: page-level screens and route targets
- `src/components/`: reusable UI pieces and step-based booking UI
- `src/lib/`: Supabase access and workflow/data modules
- `src/utils/`: validation, formatting, storage helpers, image helpers
- `src/data/`: static business data such as service definitions
- `src/config/`: app feature flags and runtime settings
- `src/assets/`: bundled assets

`src/components/` subfolders:
- `auth/`: small auth UI pieces such as session status
- `forms/`: booking forms for number plate and car details
- `Steps/`: booking step content such as work selection, user details, and confirmation
- `navigation/`: stepper and tab navigation UI
- `mechanic/`: mechanic-specific UI such as location card/map
- `test/`: isolated test/demo components and related tests

## Where Auth Lives

Current state:
- Database auth foundations now exist in `auth_staff_profiles.sql`.
- Supabase client setup lives in `src/lib/supabase.ts`.
- Frontend staff session state now loads in `src/App.tsx`.
- Staff email/password login now lives in `src/pages/StaffLoginPage.tsx`.
- Staff profile loading and role checks now live in `src/App.tsx`.
- Route guards are now implemented in `src/App.tsx` for ops and mechanic pages.
- Existing operational SQL policies are still mostly permissive and still need role-based replacement.

Current auth database pieces:
- `public.profiles`: one row per authenticated staff user
- `public.profiles.role`: `mechanic`, `ops`, or `admin`
- `public.jobs.assigned_mechanic_user_id`: links a job to the actual mechanic user
- `public.current_app_role()` and `public.has_role(...)`: helper functions for future RLS policies
- `public.list_mechanics()`: authenticated helper function that returns mechanic ids, names, and emails for ops assignment

Current auth frontend pieces:
- `src/lib/auth.ts`: sign in, sign out, load the current session, load the staff profile, and subscribe to auth changes
- `src/components/auth/StaffSessionStatus.tsx`: small on-screen session status panel for manual testing
- `src/App.tsx`: owns app-level staff session, staff profile, loading state, auth errors, route guards, and mechanic login redirect to `/mechanic/jobs`
- `src/pages/StaffLoginPage.tsx`: simple staff login UI using email and password, plus role-aware next-step guidance

Planned auth location:
- Supabase Auth will be the auth provider.
- Frontend auth/session helpers should live in `src/lib/` as dedicated auth modules.
- Route guards should live close to routing, either in `src/App.tsx` or extracted guard components/hooks.
- Role and access enforcement should primarily live in database RLS policies, not only in the frontend.

## Where API Calls Happen

Most backend calls happen through Supabase inside `src/lib/`.

Core modules:
- `src/lib/auth.ts`: staff sign in/out, session loading, profile loading, and auth state subscriptions
- `src/lib/mechanics.ts`: mechanic dropdown data for ops assignment
- `src/lib/mechanicJobs.ts`: mechanic dashboard job loading and progress summaries
- `src/lib/supabase.ts`: shared Supabase client
- `src/lib/bookings.ts`: creates customer bookings through a secure RPC instead of direct table reads
- `src/lib/jobs.ts`: create/delete/unassign jobs, complete assigned jobs through RPC, and load booking assignment candidates
  - also reopens closed jobs for ops/admin through a controlled RPC
- `src/lib/jobWorkflow.ts`: orchestrates job creation, service snapshots, checklist data, and overview/progress loading
- `src/lib/vehicleCheckIns.ts`: vehicle check-in uploads and signed photo URLs
  - also updates an existing check-in record when the mechanic revisits step 1
- `src/lib/bookingLocation.ts`: booking location lookup, geocoding, and map URL building
  - saves coordinates through a secure RPC instead of direct booking table updates
- `src/lib/vehicles.ts`: vehicle catalog queries
- `src/lib/jobProgress.ts`: derived job status helpers

Non-Supabase external API usage:
- `src/lib/bookingLocation.ts` calls OpenStreetMap Nominatim and `postcodes.io` for geocoding

## Where State Lives

This app currently uses local component state, not a global state library.

State patterns:
- Page-level `useState` drives most screens
- `useEffect` handles loading, hydration, and sync side effects
- `useMemo` is used for derived values in complex pages

Examples:
- `src/App.tsx`: owns app-level staff session/profile state, listens for auth changes, and protects role-based routes
  - job overview route now allows ops/admin review access while keeping mechanic workflow actions disabled for ops
  - check-in and checklist routes now do the same for review-only ops/admin access
- `src/pages/StaffLoginPage.tsx`: owns staff login form state and sign-in/sign-out actions
- `src/pages/CarSelectionPage.tsx`: owns multi-step booking state and persists it to `localStorage`
- `src/components/Steps/UserDetails.tsx`: owns submission/loading/error state for booking creation
- `src/pages/OpsAssignJobPage.tsx`: owns booking selection, assignment form state, loading state, and workflow actions
  - the same form now handles both new job creation and active job editing for ops/admin
  - closed jobs use a dedicated reopen mode with required reason and optional workflow reset
- `src/pages/OpsJobProgressPage.tsx`: owns progress board filters and load state
- `src/pages/MechanicDashboardPage.tsx`: owns mechanic dashboard tabs, load state, and dashboard refresh
- `src/pages/MechanicJobOverviewPage.tsx`: owns job overview load state and decides whether Start goes to check-in or checklist
  - when opened from ops, the same page switches into read-only review mode
- `src/pages/VehicleCheckInPage.tsx`: owns inspection photo state, upload state, and existing-submission detection using the signed-in mechanic identity passed from `src/App.tsx`
  - existing check-ins load back into the form and stay editable until the job is closed
- `src/pages/ServiceChecklistPage.tsx`: owns checklist completion state, blocks step 2 until check-in exists, and submits the finished service
  - in review mode, the same pages render read-only without allowing ops/admin to change mechanic workflow data

Persistent client state:
- Booking flow draft data is stored in browser `localStorage` under `carSelectionData`
- Mechanic workflow no longer depends on cached local mechanic details; identity comes from the signed-in staff account

## Reusable Components

Shared UI components:
- `src/components/auth/StaffSessionStatus.tsx`
- `src/components/forms/NumberPlateForm.tsx`
- `src/components/forms/CarDetailsForm.tsx`
- `src/components/navigation/Stepper.tsx`
- `src/components/navigation/CarTabs.tsx`

Booking flow step components:
- `src/components/Steps/WorkSelection.tsx`
- `src/components/Steps/UserDetails.tsx`
- `src/components/Steps/BookingConfirmation.tsx`

Mechanic reusable UI:
- `src/components/mechanic/MechanicLocationCard.tsx`
- `src/components/mechanic/MechanicLocationMap.tsx`

Test/helper components:
- `src/components/test/PostcodeInput.tsx`

## Database Flow

High-level flow:
1. Customer creates a booking through `public.create_public_booking(...)`
2. Staff users exist in Supabase Auth and get a matching row in `profiles`
3. Ops loads bookings waiting for assignment
4. Ops creates a row in `jobs`
5. Jobs can link to the real assigned mechanic through `assigned_mechanic_user_id`
6. Job services are copied from static service definitions into `job_services`
7. Checklist items are copied into `job_service_checklist_items`
8. Mechanic logs in and lands on `My Jobs`
9. Mechanic opens `Job Overview` and starts the guided flow
10. Mechanic submits `vehicle_check_ins` and uploads photos to Supabase Storage
11. Mechanic completes checklist items
12. Mechanic submits the finished service through `public.complete_assigned_job(...)`
13. Ops reads combined job progress from booking, job, checklist, and check-in data

Important schema / SQL files:
- `auth_staff_profiles.sql`: staff profiles, staff role helpers, and job-to-mechanic user link
- `bookings_public_access.sql`: secure public booking RPC plus minimal staff booking read policies
- `jobs_staff_access.sql`: authenticated ops/admin policies for creating and reading jobs, job services, and checklist rows, while dropping old anon access
- `job_status_access.sql`: ops/admin job update policy plus `public.complete_assigned_job(...)` for secure mechanic completion
  - also contains `public.reopen_job_for_ops(...)` for controlled reopening of closed jobs
- `mechanic_job_access.sql`: authenticated mechanic policies for reading only their own jobs, updating only their own checklist rows, and reading only their own check-ins
- `mechanic_directory.sql`: SQL function used by ops to fetch mechanics for the assignment dropdown
- `vehicle_check_in_staff_access.sql`: authenticated mechanic check-in insert/update policies, one-check-in-per-job guard, and folder-scoped storage/photo access for assigned jobs only
- `booking_and_job_references.sql`: booking number and job reference generation plus the base `jobs` table
- `mechanic_job_workflow.sql`: job services and checklist snapshot tables
- `vehicle_check_ins.sql`: base check-in table and storage bucket
- `booking_location_coordinates.sql`: booking coordinate support
- `booking_location_coordinates.sql`: booking coordinate columns plus secure `save_booking_coordinates(...)` RPC for staff geocoding saves
- `vehicle_check_ins.sql`: storage bucket for vehicle photos
- `supabase/vehicle_catalog.sql`: vehicle catalog tables/policies
- `supabase/generated/*`: generated seed and support files for vehicle catalog data

Storage flow:
- Vehicle images are uploaded to the `vehicle-checks` storage bucket
- Upload paths start with the assigned `jobId`, which is then enforced by storage RLS
- Signed URLs are created for viewing uploaded photos

## Important Business Logic

Booking and services:
- Static service definitions live in `src/data/services.ts`
- Booking price and service selection are derived on the frontend before booking creation
- Car input can be driven by number plate or manual vehicle details, controlled by `src/config/appSettings.ts`

Job workflow:
- `src/lib/jobWorkflow.ts` is the main workflow module
- When a job is created, selected services are snapshotted into job-specific service rows
- Checklist items are also snapshotted so jobs remain stable even if the master service catalog changes later
- If downstream inserts fail during job creation, the app attempts cleanup by deleting the incomplete job
- Ops assignment now selects a real mechanic account from `public.list_mechanics()` and stores `assigned_mechanic_user_id` on the job
- Ops/admin can edit active job assignment details without replacing the snapped service checklist history
- Closed jobs now stay read-only until ops/admin reopens them with a reason
- Reopen can optionally reset saved check-in and checklist progress when a job needs to be reassigned cleanly
- Mechanics now follow a guided two-step workflow:
- `Job Overview` has one Start action
- ops/admin can open the same overview in review mode without starting mechanic workflow
- `Vehicle Check-In` is step 1
- `Service Checklist` is step 2
- Final service submission returns the mechanic to their dashboard
- ops/admin can also open steps 1 and 2 in read-only mode from the progress board for review

Job progress:
- `src/lib/jobProgress.ts` derives business progress states from job status, check-in presence, and checklist completion
- Visible location access is based on derived job progress status
- `src/lib/mechanicJobs.ts` builds the mechanic dashboard by combining assigned jobs, booking details, check-in state, and checklist totals

Vehicle check-in:
- Validation helpers live in `src/utils/vehicleCheckInValidation.ts`
- Image compression support lives in `src/utils/imageCompression.ts`
- Authenticated mechanics now need `vehicle_check_in_staff_access.sql` to save check-ins for jobs assigned to them
- Mechanic identity for check-in now comes from the signed-in staff session/profile instead of manual name and phone inputs
- Re-opening the check-in page after submission loads the saved state back into the form so mechanics can update it until the job is completed or cancelled
- Database now keeps one check-in row per job and updates that record instead of creating repeated rows for the same job
- If ops/admin reopens a completed job with workflow reset enabled, the saved check-in row is removed and checklist progress is cleared so the mechanic can start again from step 1

Location logic:
- `src/lib/bookingLocation.ts` builds display addresses, Google Maps links, and missing coordinate recovery
- If exact coordinates are missing, the app attempts address geocoding and postcode fallback lookup
- Saved booking coordinates now go through a dedicated security-definer RPC because direct frontend updates were blocked by booking RLS

## Notes For Future Work

Next auth steps:
- Expand role-based policies to cover any future staff management or reporting tables
- Add admin-only staff management flows when needed

Recent policy note:
- Customer booking now depends on the secure RPC in `bookings_public_access.sql`, so the booking flow works without keeping broad read access on `public.bookings`.
