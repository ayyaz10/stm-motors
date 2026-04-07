import { useEffect, useState } from "react";
import type { ReactNode } from "react";
import type { Session } from "@supabase/supabase-js";
import StaffSessionStatus from "./components/auth/StaffSessionStatus";
import {
  getCurrentSession,
  getStaffProfile,
  subscribeToAuthStateChanges,
  type StaffProfile,
  type StaffRole,
} from "./lib/auth";
import CarSelectionPage from "./pages/CarSelectionPage";
import MechanicDashboardPage from "./pages/MechanicDashboardPage";
import MechanicJobOverviewPage from "./pages/MechanicJobOverviewPage";
import OpsAssignJobPage from "./pages/OpsAssignJobPage";
import OpsJobProgressPage from "./pages/OpsJobProgressPage";
import ServiceChecklistPage from "./pages/ServiceChecklistPage";
import StaffLoginPage from "./pages/StaffLoginPage";
import VehicleCheckInPage from "./pages/VehicleCheckInPage";
import "./App.css";

const CAR_SELECTION_ROUTE = "/carselection";
const STAFF_LOGIN_ROUTE = "/staff/login";
const OPS_ASSIGN_JOB_ROUTE = "/ops/jobs";
const OPS_JOB_PROGRESS_ROUTE = "/ops/job-progress";
const MECHANIC_DASHBOARD_ROUTE = "/mechanic/jobs";
const MECHANIC_JOB_OVERVIEW_ROUTE = "/mechanic/job-overview";
const MECHANIC_SERVICE_CHECKLIST_ROUTE = "/mechanic/service-checklist";
const VEHICLE_CHECK_IN_ROUTE = "/vehiclecheckin";
const OPS_ALLOWED_ROLES: StaffRole[] = ["ops", "admin"];
const MECHANIC_ALLOWED_ROLES: StaffRole[] = ["mechanic", "admin"];
const JOB_OVERVIEW_ALLOWED_ROLES: StaffRole[] = ["mechanic", "ops", "admin"];
const WORKFLOW_REVIEW_ALLOWED_ROLES: StaffRole[] = ["mechanic", "ops", "admin"];

function navigateTo(path: string, replace = false) {
  const nextMethod = replace ? "replaceState" : "pushState";

  window.history[nextMethod](null, "", path);
  window.dispatchEvent(new PopStateEvent("popstate"));
}

function App() {
  const [locationState, setLocationState] = useState({
    pathname: window.location.pathname,
    search: window.location.search,
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
      });
    };

    window.addEventListener("popstate", handleLocationChange);

    if (window.location.pathname === "/") {
      navigateTo(CAR_SELECTION_ROUTE, true);
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
            onClick={() => navigateTo(CAR_SELECTION_ROUTE)}
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

  const { pathname, search } = locationState;
  const searchParams = new URLSearchParams(search);
  const overviewSource = searchParams.get("source");
  const isWorkflowReviewOnly = staffProfile?.role !== "mechanic";
  const signedInStaffDisplayName =
    staffProfile?.full_name?.trim() ||
    staffSession?.user.email?.trim() ||
    "Staff user";
  let pageContent: ReactNode;

  if (pathname === CAR_SELECTION_ROUTE) {
    pageContent = <CarSelectionPage />;
  } else if (pathname === STAFF_LOGIN_ROUTE) {
    pageContent = (
      <StaffLoginPage
        session={staffSession}
        profile={staffProfile}
        isProfileLoading={isStaffProfileLoading}
        onBackToCustomer={() => navigateTo(CAR_SELECTION_ROUTE)}
        onOpenOpsJobs={() => navigateTo(OPS_ASSIGN_JOB_ROUTE)}
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
        onBackToDashboard={() => navigateTo(CAR_SELECTION_ROUTE)}
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
              onClick={() => navigateTo(CAR_SELECTION_ROUTE)}
              className="rounded-2xl bg-slate-950 px-4 py-3 text-sm font-semibold text-white"
            >
              Go to Car Selection
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
          </div>
        </div>
      </main>
    );
  }

  return (
    <>
      {pageContent}
      <StaffSessionStatus
        session={staffSession}
        profile={staffProfile}
        isLoading={isStaffSessionLoading || isStaffProfileLoading}
        error={staffSessionError ?? staffProfileError}
      />
    </>
  );
}

export default App;
