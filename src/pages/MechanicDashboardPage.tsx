import { useCallback, useEffect, useMemo, useState } from "react";
import clsx from "clsx";
import {
  CalendarDays,
  ChevronRight,
  ClipboardCheck,
  LoaderCircle,
  RefreshCw,
  ShieldCheck,
} from "lucide-react";
import {
  fetchMechanicDashboardJobs,
  type MechanicDashboardJob,
} from "../lib/mechanicJobs";
import type { DerivedJobProgressStatus } from "../lib/jobProgress";

interface MechanicDashboardPageProps {
  mechanicUserId: string;
  onOpenJobOverview?: (
    job: MechanicDashboardJob["job"],
    booking: MechanicDashboardJob["booking"],
  ) => void;
}

const statusMeta: Record<
  DerivedJobProgressStatus,
  {
    label: string;
    chipClassName: string;
    helperText: string;
    nextStep: string;
  }
> = {
  assigned: {
    label: "Assigned",
    chipClassName: "bg-slate-100 text-slate-700",
    helperText: "This job has been assigned and is ready for the mechanic.",
    nextStep: "Open Job Overview to begin the guided workflow.",
  },
  scheduled: {
    label: "Scheduled",
    chipClassName: "bg-indigo-100 text-indigo-700",
    helperText: "The visit has been scheduled and is waiting for arrival.",
    nextStep: "Open Job Overview to start the visit.",
  },
  check_in_pending: {
    label: "Check-In Pending",
    chipClassName: "bg-amber-100 text-amber-700",
    helperText: "The arrival inspection still needs to be submitted.",
    nextStep: "Open Job Overview and start with vehicle check-in.",
  },
  checked_in: {
    label: "Checked In",
    chipClassName: "bg-sky-100 text-sky-700",
    helperText: "Check-in is complete and the service checklist is next.",
    nextStep: "Open Job Overview to continue the service checklist.",
  },
  in_progress: {
    label: "In Progress",
    chipClassName: "bg-blue-100 text-blue-700",
    helperText: "Service work is currently being completed.",
    nextStep: "Open Job Overview to continue the checklist.",
  },
  work_completed: {
    label: "Work Completed",
    chipClassName: "bg-emerald-100 text-emerald-700",
    helperText: "All checklist work is done and the service can be submitted.",
    nextStep: "Open Job Overview to review the finished job.",
  },
  completed: {
    label: "Completed",
    chipClassName: "bg-emerald-100 text-emerald-700",
    helperText: "This job has already been finished.",
    nextStep: "Open Job Overview to review the completed record.",
  },
  cancelled: {
    label: "Cancelled",
    chipClassName: "bg-rose-100 text-rose-700",
    helperText: "This job has been cancelled by the team.",
    nextStep: "Open Job Overview to review the job details.",
  },
};

function formatDateTime(value: string | null): string {
  if (!value) {
    return "Not scheduled";
  }

  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function MechanicDashboardPage({
  mechanicUserId,
  onOpenJobOverview,
}: MechanicDashboardPageProps) {
  const [jobs, setJobs] = useState<MechanicDashboardJob[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [jobTab, setJobTab] = useState<"active" | "completed">("active");

  const loadJobs = useCallback(async () => {
    try {
      setIsLoading(true);
      setLoadError(null);

      const nextJobs = await fetchMechanicDashboardJobs(mechanicUserId);

      setJobs(nextJobs);
    } catch (error) {
      setLoadError(
        error instanceof Error
          ? error.message
          : "Unable to load mechanic jobs.",
      );
    } finally {
      setIsLoading(false);
    }
  }, [mechanicUserId]);

  useEffect(() => {
    void loadJobs();
  }, [loadJobs]);

  const activeJobs = useMemo(
    () =>
      jobs.filter(
        (item) =>
          item.progressStatus !== "completed" &&
          item.progressStatus !== "cancelled",
      ),
    [jobs],
  );
  const completedJobs = useMemo(
    () =>
      jobs.filter(
        (item) =>
          item.progressStatus === "completed" ||
          item.progressStatus === "cancelled",
      ),
    [jobs],
  );
  const tabItems = jobTab === "active" ? activeJobs : completedJobs;

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(16,185,129,0.08),_transparent_28%),linear-gradient(180deg,_#f8fafc_0%,_#edf4f1_100%)] px-4 py-6 sm:px-6 sm:py-8">
      <div className="mx-auto max-w-6xl">
        <header className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <span className="inline-flex rounded-full bg-slate-900 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-white">
              Mechanic
            </span>
            <h1 className="mt-3 text-3xl font-semibold tracking-tight text-slate-950">
              My Jobs
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
              Review active work and previous jobs, then open Job Overview to
              follow the guided mechanic flow.
            </p>
          </div>

          <button
            type="button"
            onClick={() => void loadJobs()}
            disabled={isLoading}
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-2xl border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-700 disabled:opacity-50"
          >
            <RefreshCw
              className={clsx("h-4 w-4", isLoading && "animate-spin")}
            />
            Refresh
          </button>
        </header>

        <div className="mb-5 grid gap-4 sm:grid-cols-3">
          <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
              Total jobs
            </p>
            <p className="mt-2 text-3xl font-semibold text-slate-950">
              {jobs.length}
            </p>
          </div>
          <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
              Active jobs
            </p>
            <p className="mt-2 text-3xl font-semibold text-slate-950">
              {activeJobs.length}
            </p>
          </div>
          <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
              Previous jobs
            </p>
            <p className="mt-2 text-3xl font-semibold text-slate-950">
              {completedJobs.length}
            </p>
          </div>
        </div>

        <section className="rounded-[1.75rem] border border-slate-200 bg-white p-5 shadow-[0_24px_80px_-48px_rgba(15,23,42,0.45)] sm:p-6">
          <div className="mb-5 flex flex-wrap gap-2">
            {[
              {
                key: "active" as const,
                label: "Assigned / Active",
                count: activeJobs.length,
              },
              {
                key: "completed" as const,
                label: "Previous / Completed",
                count: completedJobs.length,
              },
            ].map((tab) => (
              <button
                key={tab.key}
                type="button"
                onClick={() => setJobTab(tab.key)}
                className={clsx(
                  "inline-flex min-h-11 items-center gap-2 rounded-2xl border px-4 text-sm font-semibold transition",
                  jobTab === tab.key
                    ? "border-slate-900 bg-slate-900 text-white"
                    : "border-slate-300 bg-white text-slate-700 hover:border-slate-400",
                )}
              >
                <span>{tab.label}</span>
                <span
                  className={clsx(
                    "rounded-full px-2.5 py-0.5 text-xs",
                    jobTab === tab.key
                      ? "bg-white/15 text-white"
                      : "bg-slate-100 text-slate-600",
                  )}
                >
                  {tab.count}
                </span>
              </button>
            ))}
          </div>

          {loadError ? (
            <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
              {loadError}
            </div>
          ) : null}

          {isLoading ? (
            <div className="flex min-h-64 items-center justify-center rounded-3xl border border-dashed border-slate-300 bg-slate-50">
              <div className="flex items-center gap-3 text-sm font-medium text-slate-600">
                <LoaderCircle className="h-4 w-4 animate-spin" />
                Loading mechanic jobs...
              </div>
            </div>
          ) : tabItems.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-slate-300 bg-slate-50 px-6 py-12 text-center">
              <p className="text-base font-semibold text-slate-900">
                {jobTab === "active"
                  ? "No active jobs assigned"
                  : "No previous jobs yet"}
              </p>
              <p className="mt-2 text-sm text-slate-500">
                {jobTab === "active"
                  ? "Jobs assigned by operations will appear here."
                  : "Completed or cancelled jobs will move here."}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {tabItems.map((item) => {
                const meta = statusMeta[item.progressStatus];
                const isClosedJob =
                  item.progressStatus === "completed" ||
                  item.progressStatus === "cancelled";
                const checklistPercent =
                  item.checklistTotals.total === 0
                    ? 0
                    : Math.round(
                        (item.checklistTotals.completed /
                          item.checklistTotals.total) *
                          100,
                      );

                return (
                  <article
                    key={item.job.id}
                    className="rounded-3xl border border-slate-200 bg-slate-50 p-4"
                  >
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                      <div className="space-y-3">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="rounded-full bg-slate-900 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-white">
                            {item.job.job_reference}
                          </span>
                          <span className="rounded-full bg-white px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-700 shadow-sm">
                            {item.booking.booking_number}
                          </span>
                          <span
                            className={clsx(
                              "rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em]",
                              meta.chipClassName,
                            )}
                          >
                            {meta.label}
                          </span>
                        </div>

                        <div>
                          <p className="text-base font-semibold text-slate-950">
                            {isClosedJob
                              ? item.booking.car_registration
                              : `${item.booking.full_name ?? "Customer"} - ${item.booking.car_registration}`}
                          </p>
                          {isClosedJob ? (
                            <p className="mt-1 text-sm text-slate-600">
                              {item.job.vehicle_summary_snapshot ||
                                "Customer contact details and submitted images are hidden after completion."}
                            </p>
                          ) : (
                            <p className="mt-1 text-sm text-slate-600">
                              {[item.booking.city, item.booking.postcode]
                                .filter(Boolean)
                                .join(", ")}
                            </p>
                          )}
                          <p className="mt-1 text-xs text-slate-500">
                            {meta.helperText}
                          </p>
                        </div>
                      </div>

                      <div className="min-w-72 space-y-3">
                        <div className="grid gap-3 sm:grid-cols-2">
                          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                            <div className="flex items-center gap-2 text-sm font-semibold text-slate-900">
                              <CalendarDays className="h-4 w-4 text-sky-700" />
                              Scheduled
                            </div>
                            <p className="mt-2 text-sm text-slate-700">
                              {formatDateTime(item.job.scheduled_for)}
                            </p>
                          </div>
                          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                            <div className="flex items-center gap-2 text-sm font-semibold text-slate-900">
                              <ShieldCheck className="h-4 w-4 text-emerald-700" />
                              Check-In
                            </div>
                            <p className="mt-2 text-sm text-slate-700">
                              {item.checkIn.isSubmitted
                                ? `Submitted ${formatDateTime(item.checkIn.submittedAt)}`
                                : "Pending"}
                            </p>
                          </div>
                        </div>

                        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                          <div className="flex items-center justify-between gap-3">
                            <div className="flex items-center gap-2 text-sm font-semibold text-slate-900">
                              <ClipboardCheck className="h-4 w-4 text-sky-700" />
                              Checklist
                            </div>
                            <span className="text-xs font-semibold text-slate-500">
                              {item.checklistTotals.completed}/
                              {item.checklistTotals.total}
                            </span>
                          </div>
                          <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-200">
                            <div
                              className="h-full rounded-full bg-sky-500 transition-all"
                              style={{ width: `${checklistPercent}%` }}
                            />
                          </div>
                          <p className="mt-3 text-xs text-slate-500">
                            {meta.nextStep}
                          </p>
                        </div>

                        <button
                          type="button"
                          onClick={() => onOpenJobOverview?.(item.job, item.booking)}
                          className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-2xl bg-slate-950 px-4 text-sm font-semibold text-white"
                        >
                          <ChevronRight className="h-4 w-4" />
                          Job Overview
                        </button>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}

export default MechanicDashboardPage;
