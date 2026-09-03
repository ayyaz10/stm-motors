import { useEffect, useState } from "react";
import type { ReactNode } from "react";
import type { Session } from "@supabase/supabase-js";
import StaffSessionStatus from "./components/auth/StaffSessionStatus";
import StaffPortalRedirect from "./components/auth/StaffPortalRedirect";
import PublicLayout from "./components/public/PublicLayout";
import ServiceDetailPage from "./components/public/ServiceDetailPage";
import { findLegalPageByPath } from "./data/legalPages";
import {
  getCurrentSession,
  getStaffProfile,
  subscribeToAuthStateChanges,
  type StaffProfile,
  type StaffRole,
} from "./lib/auth";
import { navigateTo } from "./lib/navigation";
import { mapLegacyStaffPath } from "./lib/staffPortal";
import AboutPage from "./pages/AboutPage";
import CarSelectionPage from "./pages/CarSelectionPage";
import ContactPage from "./pages/ContactPage";
import HomePage from "./pages/HomePage";
import HeroPreviewPage from "./pages/HeroPreviewPage";
import MechanicDashboardPage from "./pages/MechanicDashboardPage";
import MechanicApplicationPage from "./pages/MechanicApplicationPage";
import MechanicJobOverviewPage from "./pages/MechanicJobOverviewPage";
import OpsAssignJobPage from "./pages/OpsAssignJobPage";
import OpsMechanicApplicationsPage from "./pages/OpsMechanicApplicationsPage";
import OpsJobProgressPage from "./pages/OpsJobProgressPage";
import ServiceChecklistPage from "./pages/ServiceChecklistPage";
import ServicesPage from "./pages/ServicesPage";
import StaffLoginPage from "./pages/StaffLoginPage";
import TermsPage from "./pages/TermsPage";
import VehicleCheckInPage from "./pages/VehicleCheckInPage";
import { findServicePageByPath } from "./data/servicePages";
import "./App.css";

function MarketplaceDomainRedirect() {
  const isLocalPreview =
    window.location.hostname === "localhost" ||
    window.location.hostname === "127.0.0.1" ||
    window.location.hostname === "[::1]";
  const redirectTarget = isLocalPreview ? "/cars" : "https://stmmotors.co.uk";

  useEffect(() => {
    window.location.replace(redirectTarget);
  }, [redirectTarget]);

  return (
    <main className="flex min-h-[70vh] items-center justify-center bg-slate-50 px-6 text-center">
      <div>
        <h1 className="text-3xl font-bold text-slate-950">
          STM Motors vehicle marketplace has moved
        </h1>
        <p className="mt-3 text-slate-600">
          {isLocalPreview
            ? "Opening the local vehicle marketplace."
            : "Redirecting you to stmmotors.co.uk."}
        </p>
        <a
          href={redirectTarget}
          className="mt-6 inline-flex rounded-xl bg-[#1c69d4] px-5 py-3 font-semibold text-white"
        >
          Open vehicle marketplace
        </a>
      </div>
    </main>
  );
}

const HOME_ROUTE = "/";
const HERO_PREVIEW_ROUTE = "/hero-preview";
const SERVICES_ROUTE = "/services";
const ABOUT_ROUTE = "/about";
const CONTACT_ROUTE = "/contact";
const CARS_FOR_SALE_ROUTE = "/cars-for-sale";
const LEGAL_HUB_ROUTE = "/legal";
const TERMS_ROUTE = "/terms";
const BOOK_ROUTE = "/book";
const MECHANIC_APPLY_ROUTE = "/mechanic/apply";
const LEGACY_CAR_SELECTION_ROUTE = "/carselection";
const STAFF_LOGIN_ROUTE = "/staff/login";
const OPS_ASSIGN_JOB_ROUTE = "/ops/jobs";
const OPS_JOB_PROGRESS_ROUTE = "/ops/job-progress";
const OPS_MECHANIC_APPLICATIONS_ROUTE = "/ops/mechanic-applications";
const MECHANIC_DASHBOARD_ROUTE = "/mechanic/jobs";
const MECHANIC_JOB_OVERVIEW_ROUTE = "/mechanic/job-overview";
const MECHANIC_SERVICE_CHECKLIST_ROUTE = "/mechanic/service-checklist";
const VEHICLE_CHECK_IN_ROUTE = "/vehiclecheckin";
const OPS_ALLOWED_ROLES: StaffRole[] = ["ops", "admin"];
const MECHANIC_ALLOWED_ROLES: StaffRole[] = ["mechanic", "admin"];
const JOB_OVERVIEW_ALLOWED_ROLES: StaffRole[] = ["mechanic", "ops", "admin"];
const WORKFLOW_REVIEW_ALLOWED_ROLES: StaffRole[] = ["mechanic", "ops", "admin"];
const PUBLIC_ROUTES = new Set([
  HOME_ROUTE,
  HERO_PREVIEW_ROUTE,
  SERVICES_ROUTE,
  ABOUT_ROUTE,
  CONTACT_ROUTE,
  CARS_FOR_SALE_ROUTE,
  LEGAL_HUB_ROUTE,
  TERMS_ROUTE,
  BOOK_ROUTE,
  MECHANIC_APPLY_ROUTE,
  LEGACY_CAR_SELECTION_ROUTE,
]);

function App() {
  const [locationState, setLocationState] = useState({
    pathname: window.location.pathname,
    search: window.location.search,
    hash: window.location.hash,
  });
  const [staffSession, setStaffSession] = useState<Session | null>(null);
  const [staffProfile, setStaffProfile] = useState<StaffProfile | null>(null);
  const [isStaffSessionLoading, setIsStaffSessionLoading] = useState(true);
  const [isStaffProfileLoading, setIsStaffProfileLoading] = useState(false);
  const [staffSessionError, setStaffSessionError] = useState<string | null>(
    null,
  );
  const [staffProfileError, setStaffProfileError] = useState<string | null>(
    null,
  );

  useEffect(() => {
    const handleLocationChange = () => {
      setLocationState({
        pathname: window.location.pathname,
        search: window.location.search,
        hash: window.location.hash,
      });
    };

    window.addEventListener("popstate", handleLocationChange);

    if (window.location.pathname === LEGACY_CAR_SELECTION_ROUTE) {
      navigateTo(BOOK_ROUTE, true);
    }

    return () => {
      window.removeEventListener("popstate", handleLocationChange);
    };
  }, []);

  useEffect(() => {
    let isActive = true;

    const loadCurrentSession = async () => {
      try {
        setIsStaffSessionLoading(true);
        const nextSession = await getCurrentSession();

        if (!isActive) {
          return;
        }

        setStaffSession(nextSession);
        setStaffSessionError(null);
      } catch (error) {
        if (!isActive) {
          return;
        }

        setStaffSession(null);
        setStaffSessionError(
          error instanceof Error
            ? error.message
            : "Unable to load the current staff session.",
        );
      } finally {
        if (isActive) {
          setIsStaffSessionLoading(false);
        }
      }
    };

    void loadCurrentSession();

    const unsubscribe = subscribeToAuthStateChanges((nextSession) => {
      if (!isActive) {
        return;
      }

      setStaffSession(nextSession);
      setStaffSessionError(null);
      setIsStaffSessionLoading(false);
    });

    return () => {
      isActive = false;
      unsubscribe();
    };
  }, []);

  useEffect(() => {
    let isActive = true;

    const loadStaffProfile = async () => {
      if (!staffSession?.user.id) {
        setStaffProfile(null);
        setStaffProfileError(null);
        setIsStaffProfileLoading(false);
        return;
      }

      try {
        setIsStaffProfileLoading(true);
        const nextProfile = await getStaffProfile(staffSession.user.id);

        if (!isActive) {
          return;
        }

        setStaffProfile(nextProfile);
        setStaffProfileError(null);
      } catch (error) {
        if (!isActive) {
          return;
        }

        setStaffProfile(null);
        setStaffProfileError(
          error instanceof Error
            ? error.message
            : "Unable to load the staff profile.",
        );
      } finally {
        if (isActive) {
          setIsStaffProfileLoading(false);
        }
      }
    };

    void loadStaffProfile();

    return () => {
      isActive = false;
    };
  }, [staffSession?.user.id]);

  useEffect(() => {
    if (locationState.pathname !== STAFF_LOGIN_ROUTE) {
      return;
    }

    if (isStaffSessionLoading || isStaffProfileLoading) {
      return;
    }

    if (!staffSession || !staffProfile) {
      return;
    }

    if (staffProfile.role === "mechanic") {
      navigateTo(MECHANIC_DASHBOARD_ROUTE, true);
    }
  }, [
    locationState.pathname,
    isStaffSessionLoading,
    isStaffProfileLoading,
    staffSession,
    staffProfile,
  ]);

  const renderAccessNotice = (
    title: string,
    message: string,
    actionLabel = "Open staff login",
  ) => (
    <main className="flex min-h-screen items-center justify-center bg-slate-100 px-4">
      <div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <h1 className="text-2xl font-semibold text-slate-950">{title}</h1>
        <p className="mt-2 text-sm text-slate-600">{message}</p>
        <div className="mt-5 flex flex-col gap-3">
          <button
            type="button"
            onClick={() => navigateTo(STAFF_LOGIN_ROUTE)}
            className="rounded-2xl bg-slate-950 px-4 py-3 text-sm font-semibold text-white"
          >
            {actionLabel}
          </button>
          <button
            type="button"
            onClick={() => navigateTo(BOOK_ROUTE)}
            className="rounded-2xl border border-slate-300 px-4 py-3 text-sm font-semibold text-slate-700"
          >
            Open customer flow
          </button>
        </div>
      </div>
    </main>
  );

  const renderProtectedPage = (
    allowedRoles: StaffRole[],
    content: ReactNode,
  ) => {
    if (isStaffSessionLoading || isStaffProfileLoading) {
      return renderAccessNotice(
        "Checking access",
        "Checking the staff session and role.",
        "Open staff login",
      );
    }

    if (!staffSession) {
      return renderAccessNotice(
        "Sign in required",
        "You need a staff login to view this page.",
      );
    }

    if (staffProfileError) {
      return renderAccessNotice(
        "Profile load issue",
        staffProfileError,
        "Open staff login again",
      );
    }

    if (!staffProfile) {
      return renderAccessNotice(
        "Profile missing",
        "This staff account does not have a profile or role yet.",
      );
    }

    if (!allowedRoles.includes(staffProfile.role)) {
      return renderAccessNotice(
        "Access denied",
        `Your role is ${staffProfile.role}, so this page is not allowed.`,
      );
    }

    return content;
  };

  const { pathname, search, hash } = locationState;
  const matchedServicePage = findServicePageByPath(pathname);
  const matchedLegalPage = findLegalPageByPath(pathname);
  const searchParams = new URLSearchParams(search);
  const legacyStaffPath = mapLegacyStaffPath(pathname);
  const overviewSource = searchParams.get("source");
  const isWorkflowReviewOnly = staffProfile?.role !== "mechanic";
  const signedInStaffDisplayName =
    staffProfile?.full_name?.trim() ||
    staffSession?.user.email?.trim() ||
    "Staff user";
  let pageContent: ReactNode;

  if (pathname === HOME_ROUTE) {
    pageContent = <HomePage />;
  } else if (pathname === HERO_PREVIEW_ROUTE) {
    pageContent = <HeroPreviewPage />;
  } else if (matchedServicePage) {
    pageContent = <ServiceDetailPage servicePage={matchedServicePage} />;
  } else if (pathname === SERVICES_ROUTE) {
    pageContent = <ServicesPage />;
  } else if (pathname === ABOUT_ROUTE) {
    pageContent = <AboutPage />;
  } else if (pathname === CONTACT_ROUTE) {
    pageContent = <ContactPage />;
  } else if (pathname === CARS_FOR_SALE_ROUTE) {
    pageContent = <MarketplaceDomainRedirect />;
  } else if (
    pathname === LEGAL_HUB_ROUTE ||
    pathname === TERMS_ROUTE ||
    matchedLegalPage
  ) {
    pageContent = (
      <TermsPage
        currentPathname={pathname}
        currentHash={hash}
        legacySectionId={matchedLegalPage?.id ?? null}
      />
    );
  } else if (pathname === BOOK_ROUTE || pathname === LEGACY_CAR_SELECTION_ROUTE) {
    pageContent = <CarSelectionPage />;
  } else if (pathname === MECHANIC_APPLY_ROUTE) {
    pageContent = <MechanicApplicationPage />;
  } else if (legacyStaffPath) {
    pageContent = <StaffPortalRedirect pathname={pathname} search={search} />;
  } else if (pathname === STAFF_LOGIN_ROUTE) {
    pageContent = (
      <StaffLoginPage
        session={staffSession}
        profile={staffProfile}
        isProfileLoading={isStaffProfileLoading}
        onBackToCustomer={() => navigateTo(HOME_ROUTE)}
        onOpenOpsJobs={() => navigateTo(OPS_ASSIGN_JOB_ROUTE)}
        onOpenMechanicApplications={() =>
          navigateTo(OPS_MECHANIC_APPLICATIONS_ROUTE)
        }
        onOpenMechanicDashboard={() => navigateTo(MECHANIC_DASHBOARD_ROUTE)}
      />
    );
  } else if (pathname === OPS_ASSIGN_JOB_ROUTE) {
    pageContent = renderProtectedPage(
      OPS_ALLOWED_ROLES,
      <OpsAssignJobPage
        onBackToDashboard={() => navigateTo(OPS_JOB_PROGRESS_ROUTE)}
        onOpenProgressBoard={() => navigateTo(OPS_JOB_PROGRESS_ROUTE)}
        onOpenJobOverview={(job, booking) => {
          const nextSearchParams = new URLSearchParams({
            jobId: job.id,
            jobReference: job.job_reference,
            bookingId: booking.id,
            bookingNumber: booking.booking_number,
            source: "ops-assign",
          });

          navigateTo(
            `${MECHANIC_JOB_OVERVIEW_ROUTE}?${nextSearchParams.toString()}`,
          );
        }}
      />,
    );
  } else if (pathname === OPS_JOB_PROGRESS_ROUTE) {
    pageContent = renderProtectedPage(
      OPS_ALLOWED_ROLES,
      <OpsJobProgressPage
        onBackToDashboard={() => navigateTo(HOME_ROUTE)}
        onOpenJobOverview={(job, booking) => {
          const nextSearchParams = new URLSearchParams({
            jobId: job.id,
            jobReference: job.job_reference,
            bookingId: booking.id,
            bookingNumber: booking.booking_number,
            source: "ops-progress",
          });

          navigateTo(
            `${MECHANIC_JOB_OVERVIEW_ROUTE}?${nextSearchParams.toString()}`,
          );
        }}
        onOpenChecklist={(job, booking) => {
          const nextSearchParams = new URLSearchParams({
            jobId: job.id,
            jobReference: job.job_reference,
            bookingId: booking.id,
            bookingNumber: booking.booking_number,
            source: "ops-progress",
          });

          navigateTo(
            `${MECHANIC_SERVICE_CHECKLIST_ROUTE}?${nextSearchParams.toString()}`,
          );
        }}
        onOpenCheckIn={(job, booking) => {
          const nextSearchParams = new URLSearchParams({
            jobId: job.id,
            jobReference: job.job_reference,
            bookingId: booking.id,
            bookingNumber: booking.booking_number,
            source: "ops-progress",
          });

          navigateTo(`${VEHICLE_CHECK_IN_ROUTE}?${nextSearchParams.toString()}`);
        }}
      />,
    );
  } else if (pathname === OPS_MECHANIC_APPLICATIONS_ROUTE) {
    pageContent = renderProtectedPage(
      OPS_ALLOWED_ROLES,
      <OpsMechanicApplicationsPage
        onBackToOpsDashboard={() => navigateTo(OPS_ASSIGN_JOB_ROUTE)}
      />,
    );
  } else if (pathname === MECHANIC_DASHBOARD_ROUTE) {
    pageContent = renderProtectedPage(
      MECHANIC_ALLOWED_ROLES,
      <MechanicDashboardPage
        mechanicUserId={staffSession?.user.id ?? ""}
        onOpenJobOverview={(job, booking) => {
          const nextSearchParams = new URLSearchParams({
            jobId: job.id,
            jobReference: job.job_reference,
            bookingId: booking.id,
            bookingNumber: booking.booking_number,
            source: "mechanic-dashboard",
          });

          navigateTo(
            `${MECHANIC_JOB_OVERVIEW_ROUTE}?${nextSearchParams.toString()}`,
          );
        }}
      />,
    );
  } else if (pathname === MECHANIC_JOB_OVERVIEW_ROUTE) {
    pageContent = renderProtectedPage(
      JOB_OVERVIEW_ALLOWED_ROLES,
      <MechanicJobOverviewPage
        jobId={searchParams.get("jobId") ?? undefined}
        jobReference={searchParams.get("jobReference") ?? undefined}
        canStartWorkflow={!isWorkflowReviewOnly}
        isReviewMode={isWorkflowReviewOnly}
        onBackToDashboard={() => {
          if (overviewSource === "ops-assign") {
            navigateTo(OPS_ASSIGN_JOB_ROUTE);
            return;
          }

          if (overviewSource === "ops-progress") {
            navigateTo(OPS_JOB_PROGRESS_ROUTE);
            return;
          }

          navigateTo(MECHANIC_DASHBOARD_ROUTE);
        }}
        onStart={(nextStep) => {
          const nextSearchParams = new URLSearchParams(searchParams);

          navigateTo(
            nextStep === "checklist"
              ? `${MECHANIC_SERVICE_CHECKLIST_ROUTE}?${nextSearchParams.toString()}`
              : `${VEHICLE_CHECK_IN_ROUTE}?${nextSearchParams.toString()}`,
          );
        }}
      />,
    );
  } else if (pathname === MECHANIC_SERVICE_CHECKLIST_ROUTE) {
    pageContent = renderProtectedPage(
      WORKFLOW_REVIEW_ALLOWED_ROLES,
      <ServiceChecklistPage
        jobId={searchParams.get("jobId") ?? undefined}
        jobReference={searchParams.get("jobReference") ?? undefined}
        mechanicDisplayName={signedInStaffDisplayName}
        isReviewMode={isWorkflowReviewOnly}
        onBackToCheckIn={() => {
          const nextSearchParams = new URLSearchParams(searchParams);

          navigateTo(`${VEHICLE_CHECK_IN_ROUTE}?${nextSearchParams.toString()}`);
        }}
        onBackToDashboard={() => {
          if (overviewSource === "ops-assign") {
            navigateTo(OPS_ASSIGN_JOB_ROUTE);
            return;
          }

          if (overviewSource === "ops-progress") {
            navigateTo(OPS_JOB_PROGRESS_ROUTE);
            return;
          }

          navigateTo(MECHANIC_DASHBOARD_ROUTE);
        }}
      />,
    );
  } else if (pathname === VEHICLE_CHECK_IN_ROUTE) {
    pageContent = renderProtectedPage(
      WORKFLOW_REVIEW_ALLOWED_ROLES,
      <VehicleCheckInPage
        jobId={searchParams.get("jobId") ?? undefined}
        jobReference={searchParams.get("jobReference") ?? undefined}
        bookingId={searchParams.get("bookingId") ?? undefined}
        bookingNumber={searchParams.get("bookingNumber") ?? undefined}
        signedInMechanicName={signedInStaffDisplayName}
        signedInMechanicEmail={staffSession?.user.email ?? null}
        isReviewMode={isWorkflowReviewOnly}
        onOpenChecklist={() => {
          const nextSearchParams = new URLSearchParams(searchParams);

          navigateTo(
            `${MECHANIC_SERVICE_CHECKLIST_ROUTE}?${nextSearchParams.toString()}`,
          );
        }}
        onOpenOverview={() => {
          const nextSearchParams = new URLSearchParams(searchParams);

          navigateTo(
            `${MECHANIC_JOB_OVERVIEW_ROUTE}?${nextSearchParams.toString()}`,
          );
        }}
        onOpenDashboard={() => {
          if (overviewSource === "ops-assign") {
            navigateTo(OPS_ASSIGN_JOB_ROUTE);
            return;
          }

          if (overviewSource === "ops-progress") {
            navigateTo(OPS_JOB_PROGRESS_ROUTE);
            return;
          }

          navigateTo(MECHANIC_DASHBOARD_ROUTE);
        }}
      />,
    );
  } else {
    pageContent = (
      <main className="flex min-h-screen items-center justify-center bg-slate-100 px-4">
        <div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <h1 className="text-2xl font-semibold text-slate-950">
            Page not found
          </h1>
          <p className="mt-2 text-sm text-slate-600">
            Use one of the dashboard routes below.
          </p>
          <div className="mt-5 flex flex-col gap-3">
            <button
              type="button"
              onClick={() => navigateTo(HOME_ROUTE)}
              className="rounded-2xl bg-slate-950 px-4 py-3 text-sm font-semibold text-white"
            >
              Go to Homepage
            </button>
            <button
              type="button"
              onClick={() => navigateTo(STAFF_LOGIN_ROUTE)}
              className="rounded-2xl border border-slate-300 px-4 py-3 text-sm font-semibold text-slate-700"
            >
              Go to Staff Login
            </button>
            <button
              type="button"
              onClick={() => navigateTo(MECHANIC_DASHBOARD_ROUTE)}
              className="rounded-2xl border border-slate-300 px-4 py-3 text-sm font-semibold text-slate-700"
            >
              Go to Mechanic Jobs
            </button>
            <button
              type="button"
              onClick={() => navigateTo(OPS_ASSIGN_JOB_ROUTE)}
              className="rounded-2xl border border-slate-300 px-4 py-3 text-sm font-semibold text-slate-700"
            >
              Go to Ops Assign Job
            </button>
            <button
              type="button"
              onClick={() => navigateTo(OPS_JOB_PROGRESS_ROUTE)}
              className="rounded-2xl border border-slate-300 px-4 py-3 text-sm font-semibold text-slate-700"
            >
              Go to Job Progress
            </button>
            <button
              type="button"
              onClick={() => navigateTo(OPS_MECHANIC_APPLICATIONS_ROUTE)}
              className="rounded-2xl border border-slate-300 px-4 py-3 text-sm font-semibold text-slate-700"
            >
              Review mechanic applications
            </button>
          </div>
        </div>
      </main>
    );
  }

  const shouldUsePublicLayout =
    PUBLIC_ROUTES.has(pathname) ||
    Boolean(matchedServicePage) ||
    Boolean(matchedLegalPage);
  const renderedPageContent = shouldUsePublicLayout ? (
    <PublicLayout key={pathname} currentPath={pathname}>
      {pageContent}
    </PublicLayout>
  ) : (
    pageContent
  );

  return (
    <>
      {renderedPageContent}
      {import.meta.env.DEV && !shouldUsePublicLayout ? (
        <StaffSessionStatus
          session={staffSession}
          profile={staffProfile}
          isLoading={isStaffSessionLoading || isStaffProfileLoading}
          error={staffSessionError ?? staffProfileError}
        />
      ) : null}
    </>
  );
}

export default App;
