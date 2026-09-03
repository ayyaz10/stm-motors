import type { Session } from "@supabase/supabase-js";
import { useEffect, useState, type ReactNode } from "react";
import StaffPortalShell from "./components/staff/StaffPortalShell";
import {
  getCurrentSession,
  getStaffProfile,
  signOutStaff,
  subscribeToAuthStateChanges,
  type StaffProfile,
} from "./lib/auth";
import { navigateTo } from "./lib/navigation";
import {
  STAFF_PORTAL_ROUTES,
  allowedRolesForStaffRoute,
  canAccessStaffRoute,
  defaultRouteForRole,
  mapLegacyStaffPath,
  sanitizeStaffWorkflowSearch,
} from "./lib/staffPortal";
import { STAFF_SITE_ORIGIN } from "./lib/siteMode";
import MechanicDashboardPage from "./pages/MechanicDashboardPage";
import MechanicJobOverviewPage from "./pages/MechanicJobOverviewPage";
import OpsAssignJobPage from "./pages/OpsAssignJobPage";
import OpsJobProgressPage from "./pages/OpsJobProgressPage";
import OpsMechanicApplicationsPage from "./pages/OpsMechanicApplicationsPage";
import ServiceChecklistPage from "./pages/ServiceChecklistPage";
import VehicleCheckInPage from "./pages/VehicleCheckInPage";
import MarketplaceAcceptInvitePage from "./pages/marketplace/admin/MarketplaceAcceptInvitePage";
import MarketplaceEnquiriesAdminPage from "./pages/marketplace/admin/MarketplaceEnquiriesAdminPage";
import MarketplaceListingEditorPage from "./pages/marketplace/admin/MarketplaceListingEditorPage";
import MarketplaceListingsAdminPage from "./pages/marketplace/admin/MarketplaceListingsAdminPage";
import MarketplaceStaffAdminPage from "./pages/marketplace/admin/MarketplaceStaffAdminPage";
import StaffMechanicInvitePage from "./pages/staff/StaffMechanicInvitePage";
import StaffPortalDashboardPage from "./pages/staff/StaffPortalDashboardPage";
import StaffPortalLoginPage from "./pages/staff/StaffPortalLoginPage";

function AccessNotice({ title, message, action }: { title: string; message: string; action?: { label: string; run: () => void } }) {
  return <main className="flex min-h-[75vh] items-center justify-center bg-slate-100 px-5"><section className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-7 text-center shadow-sm"><h1 className="text-2xl font-bold">{title}</h1><p className="mt-3 text-sm leading-6 text-slate-600">{message}</p>{action ? <button type="button" onClick={action.run} className="mt-6 rounded-xl bg-[#1c69d4] px-5 py-3 font-semibold text-white">{action.label}</button> : null}</section></main>;
}

function workflowSearch(input: Record<string, string>) {
  return `?${new URLSearchParams(input).toString()}`;
}

function StaffApp() {
  const [location, setLocation] = useState({ pathname: window.location.pathname, search: window.location.search });
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<StaffProfile | null>(null);
  const [sessionLoading, setSessionLoading] = useState(true);
  const [profileLoading, setProfileLoading] = useState(false);
  const [authError, setAuthError] = useState("");

  useEffect(() => {
    const updateLocation = () => setLocation({ pathname: window.location.pathname, search: window.location.search });
    window.addEventListener("popstate", updateLocation);
    return () => window.removeEventListener("popstate", updateLocation);
  }, []);

  useEffect(() => {
    let active = true;
    getCurrentSession().then((nextSession) => { if (active) { setSession(nextSession); setAuthError(""); } }).catch((reason: unknown) => { if (active) setAuthError(reason instanceof Error ? reason.message : "Unable to check your staff session."); }).finally(() => { if (active) setSessionLoading(false); });
    const unsubscribe = subscribeToAuthStateChanges((nextSession) => {
      if (!active) return;
      setSession(nextSession);
      setProfile(null);
      setSessionLoading(false);
      setAuthError("");
    });
    return () => { active = false; unsubscribe(); };
  }, []);

  useEffect(() => {
    let active = true;
    if (!session) { setProfile(null); setProfileLoading(false); return; }
    setProfileLoading(true);
    getStaffProfile(session.user.id).then((nextProfile) => { if (active) { setProfile(nextProfile); setAuthError(""); } }).catch((reason: unknown) => { if (active) setAuthError(reason instanceof Error ? reason.message : "Unable to load your staff profile."); }).finally(() => { if (active) setProfileLoading(false); });
    return () => { active = false; };
  }, [session]);

  const mappedPath = mapLegacyStaffPath(location.pathname);
  const pathname = mappedPath ?? location.pathname;
  const search = sanitizeStaffWorkflowSearch(location.search);

  useEffect(() => {
    if (!mappedPath) return;
    navigateTo(`${mappedPath}${search}`, true);
  }, [mappedPath, search]);

  useEffect(() => {
    const isAuthCallback =
      pathname === STAFF_PORTAL_ROUTES.acceptInvite ||
      pathname === STAFF_PORTAL_ROUTES.acceptMechanicInvite;
    if (mappedPath || isAuthCallback) return;
    if (location.search !== search || window.location.hash) {
      navigateTo(`${pathname}${search}`, true);
    }
  }, [location.search, mappedPath, pathname, search]);

  useEffect(() => {
    if (pathname !== STAFF_PORTAL_ROUTES.login || sessionLoading || profileLoading || !session || !profile) return;
    navigateTo(defaultRouteForRole(profile.role), true);
  }, [pathname, sessionLoading, profileLoading, session, profile]);

  const signOut = async () => {
    try { await signOutStaff(); } finally { setSession(null); setProfile(null); navigateTo(STAFF_PORTAL_ROUTES.login, true); }
  };

  if (pathname === STAFF_PORTAL_ROUTES.acceptInvite) return <MarketplaceAcceptInvitePage canonicalOrigin={STAFF_SITE_ORIGIN} canonicalPath={STAFF_PORTAL_ROUTES.acceptInvite} successHref={STAFF_PORTAL_ROUTES.dashboard} />;
  if (pathname === STAFF_PORTAL_ROUTES.acceptMechanicInvite) return <StaffMechanicInvitePage />;

  if (pathname === STAFF_PORTAL_ROUTES.login) {
    if (sessionLoading || (session && profileLoading)) return <AccessNotice title="Checking staff access" message="Verifying your secure STM Motors session…" />;
    if (session && !profile) return <AccessNotice title="Staff access unavailable" message={authError || "This signed-in account does not have an active Admin, Ops or Mechanic profile."} action={{ label: "Sign out", run: () => void signOut() }} />;
    return <StaffPortalLoginPage />;
  }

  if (sessionLoading || profileLoading) return <AccessNotice title="Checking staff access" message="Verifying your secure STM Motors session…" />;
  if (!session) return <AccessNotice title="Staff sign in required" message="Sign in through the central staff portal to open this page." action={{ label: "Open staff login", run: () => navigateTo(STAFF_PORTAL_ROUTES.login, true) }} />;
  if (authError) return <AccessNotice title="Unable to verify staff access" message={authError} action={{ label: "Sign out and try again", run: () => void signOut() }} />;
  if (!profile) return <AccessNotice title="Staff profile missing" message="This account has no active STM Motors staff role, so protected portal data has not been loaded." action={{ label: "Sign out", run: () => void signOut() }} />;

  const allowedRoles = allowedRolesForStaffRoute(pathname);
  if (!allowedRoles) return <StaffPortalShell currentPath={pathname} staffName={profile.full_name || session.user.email || "Staff user"} staffRole={profile.role} onSignOut={() => void signOut()}><AccessNotice title="Page not found" message="This staff portal route does not exist." action={{ label: "Open dashboard", run: () => navigateTo(STAFF_PORTAL_ROUTES.dashboard) }} /></StaffPortalShell>;
  if (!canAccessStaffRoute(profile.role, pathname)) return <StaffPortalShell currentPath={pathname} staffName={profile.full_name || session.user.email || "Staff user"} staffRole={profile.role} onSignOut={() => void signOut()}><AccessNotice title="Access denied" message={`Your ${profile.role} role is not permitted to open this module. Protected data has not been loaded.`} action={{ label: "Open dashboard", run: () => navigateTo(STAFF_PORTAL_ROUTES.dashboard) }} /></StaffPortalShell>;

  const params = new URLSearchParams(search);
  const source = params.get("source");
  const displayName = profile.full_name?.trim() || session.user.email || "Staff user";
  const reviewOnly = profile.role !== "mechanic";
  const paramsFor = (job: { id: string; job_reference: string }, booking: { id: string; booking_number: string }, nextSource: string) => workflowSearch({ jobId: job.id, jobReference: job.job_reference, bookingId: booking.id, bookingNumber: booking.booking_number, source: nextSource });
  const backToWorkflowSource = () => {
    if (source === "ops-assign") return navigateTo(STAFF_PORTAL_ROUTES.operationsJobs);
    if (source === "ops-progress") return navigateTo(STAFF_PORTAL_ROUTES.operationsProgress);
    navigateTo(STAFF_PORTAL_ROUTES.mechanicJobs);
  };
  let content: ReactNode;

  if (pathname === STAFF_PORTAL_ROUTES.dashboard) content = <StaffPortalDashboardPage role={profile.role} name={displayName} />;
  else if (pathname === STAFF_PORTAL_ROUTES.marketplaceVehicles) content = <MarketplaceListingsAdminPage />;
  else if (pathname === STAFF_PORTAL_ROUTES.marketplaceVehicleNew) content = <MarketplaceListingEditorPage userId={session.user.id} />;
  else if (/^\/marketplace\/vehicles\/[0-9a-f-]+\/edit$/i.test(pathname)) content = <MarketplaceListingEditorPage listingId={pathname.split("/")[3]} userId={session.user.id} />;
  else if (pathname === STAFF_PORTAL_ROUTES.marketplaceEnquiries) content = <MarketplaceEnquiriesAdminPage mode="purchase" />;
  else if (pathname === STAFF_PORTAL_ROUTES.marketplaceSellSubmissions) content = <MarketplaceEnquiriesAdminPage mode="sell" />;
  else if (pathname === STAFF_PORTAL_ROUTES.staff) content = <MarketplaceStaffAdminPage canonicalOrigin={STAFF_SITE_ORIGIN} canonicalPath={STAFF_PORTAL_ROUTES.staff} />;
  else if (pathname === STAFF_PORTAL_ROUTES.operationsJobs) content = <OpsAssignJobPage onBackToDashboard={() => navigateTo(STAFF_PORTAL_ROUTES.dashboard)} onOpenProgressBoard={() => navigateTo(STAFF_PORTAL_ROUTES.operationsProgress)} onOpenJobOverview={(job, booking) => navigateTo(`${STAFF_PORTAL_ROUTES.mechanicOverview}${paramsFor(job, booking, "ops-assign")}`)} />;
  else if (pathname === STAFF_PORTAL_ROUTES.operationsProgress) content = <OpsJobProgressPage onBackToDashboard={() => navigateTo(STAFF_PORTAL_ROUTES.dashboard)} onOpenJobOverview={(job, booking) => navigateTo(`${STAFF_PORTAL_ROUTES.mechanicOverview}${paramsFor(job, booking, "ops-progress")}`)} onOpenChecklist={(job, booking) => navigateTo(`${STAFF_PORTAL_ROUTES.mechanicChecklist}${paramsFor(job, booking, "ops-progress")}`)} onOpenCheckIn={(job, booking) => navigateTo(`${STAFF_PORTAL_ROUTES.mechanicCheckIn}${paramsFor(job, booking, "ops-progress")}`)} />;
  else if (pathname === STAFF_PORTAL_ROUTES.operationsApplications) content = <OpsMechanicApplicationsPage onBackToOpsDashboard={() => navigateTo(STAFF_PORTAL_ROUTES.operationsJobs)} />;
  else if (pathname === STAFF_PORTAL_ROUTES.mechanicJobs) content = <MechanicDashboardPage mechanicUserId={session.user.id} onOpenJobOverview={(job, booking) => navigateTo(`${STAFF_PORTAL_ROUTES.mechanicOverview}${paramsFor(job, booking, "mechanic-dashboard")}`)} />;
  else if (pathname === STAFF_PORTAL_ROUTES.mechanicOverview) content = <MechanicJobOverviewPage jobId={params.get("jobId") ?? undefined} jobReference={params.get("jobReference") ?? undefined} canStartWorkflow={!reviewOnly} isReviewMode={reviewOnly} onBackToDashboard={backToWorkflowSource} onStart={(nextStep) => navigateTo(`${nextStep === "checklist" ? STAFF_PORTAL_ROUTES.mechanicChecklist : STAFF_PORTAL_ROUTES.mechanicCheckIn}${search}`)} />;
  else if (pathname === STAFF_PORTAL_ROUTES.mechanicChecklist) content = <ServiceChecklistPage jobId={params.get("jobId") ?? undefined} jobReference={params.get("jobReference") ?? undefined} mechanicDisplayName={displayName} isReviewMode={reviewOnly} onBackToCheckIn={() => navigateTo(`${STAFF_PORTAL_ROUTES.mechanicCheckIn}${search}`)} onBackToDashboard={backToWorkflowSource} />;
  else if (pathname === STAFF_PORTAL_ROUTES.mechanicCheckIn) content = <VehicleCheckInPage jobId={params.get("jobId") ?? undefined} jobReference={params.get("jobReference") ?? undefined} bookingId={params.get("bookingId") ?? undefined} bookingNumber={params.get("bookingNumber") ?? undefined} signedInMechanicName={displayName} signedInMechanicEmail={session.user.email} isReviewMode={reviewOnly} onOpenChecklist={() => navigateTo(`${STAFF_PORTAL_ROUTES.mechanicChecklist}${search}`)} onOpenOverview={() => navigateTo(`${STAFF_PORTAL_ROUTES.mechanicOverview}${search}`)} onOpenDashboard={backToWorkflowSource} />;
  else content = <AccessNotice title="Page not found" message="This staff portal route does not exist." />;

  return <StaffPortalShell currentPath={pathname} staffName={displayName} staffRole={profile.role} onSignOut={() => void signOut()}>{content}</StaffPortalShell>;
}

export default StaffApp;
