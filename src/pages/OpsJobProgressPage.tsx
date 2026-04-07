import { useEffect, useMemo, useState } from "react";
import clsx from "clsx";
import {
  ChevronRight,
  ClipboardCheck,
  Eye,
  LoaderCircle,
  RefreshCw,
  Wrench,
} from "lucide-react";
import {
  fetchOpsJobProgressBoard,
  type DerivedJobProgressStatus,
  type OpsJobProgressBoardItem,
} from "../lib/jobWorkflow";

interface OpsJobProgressPageProps {
  onBackToDashboard?: () => void;
  onOpenJobOverview?: (
    job: OpsJobProgressBoardItem["job"],
    booking: OpsJobProgressBoardItem["booking"],
  ) => void;
  onOpenChecklist?: (
    job: OpsJobProgressBoardItem["job"],
    booking: OpsJobProgressBoardItem["booking"],
  ) => void;
  onOpenCheckIn?: (
    job: OpsJobProgressBoardItem["job"],
    booking: OpsJobProgressBoardItem["booking"],
  ) => void;
}

const statusMeta: Record<
  DerivedJobProgressStatus,
  {
    label: string;
    chipClassName: string;
    helperText: string;
  }
> = {
  assigned: {
    label: "Assigned",
    chipClassName: "bg-slate-100 text-slate-700",
    helperText: "Job created but not yet started.",
  },
  scheduled: {
    label: "Scheduled",
    chipClassName: "bg-indigo-100 text-indigo-700",
    helperText: "Job is scheduled and waiting for mechanic arrival.",
  },
  check_in_pending: {
    label: "Check-In Pending",
    chipClassName: "bg-amber-100 text-amber-700",
    helperText: "Mechanic still needs to submit the arrival inspection.",
  },
  checked_in: {
    label: "Checked In",
    chipClassName: "bg-sky-100 text-sky-700",
    helperText: "Pre-work inspection is done. Service work can continue.",
  },
  in_progress: {
    label: "In Progress",
    chipClassName: "bg-blue-100 text-blue-700",
    helperText: "Checklist work has started and is still ongoing.",
  },
  work_completed: {
    label: "Work Completed",
    chipClassName: "bg-emerald-100 text-emerald-700",
    helperText: "All tracked checklist tasks are complete.",
  },
  completed: {
    label: "Completed",
    chipClassName: "bg-emerald-100 text-emerald-700",
    helperText: "Job has been fully completed and closed.",
  },
  cancelled: {
    label: "Cancelled",
    chipClassName: "bg-rose-100 text-rose-700",
    helperText: "Job has been cancelled.",
  },
};

function formatDateTime(value: string | null): string {
  if (!value) {
    return "Not available";
  }

  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function OpsJobProgressPage({
  onBackToDashboard,
  onOpenJobOverview,
  onOpenChecklist,
  onOpenCheckIn,
}: OpsJobProgressPageProps) {
  const [jobs, setJobs] = useState<OpsJobProgressBoardItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<
    DerivedJobProgressStatus | "all"
  >("all");

  const loadJobs = async () => {
    try {
      setIsLoading(true);
      setLoadError(null);

      const progressJobs = await fetchOpsJobProgressBoard();

      setJobs(progressJobs);
    } catch (error) {
      setLoadError(
        error instanceof Error ? error.message : "Unable to load job progress.",
      );
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadJobs();
  }, []);

  const filteredJobs = useMemo(() => {
    if (statusFilter === "all") {
      return jobs;
    }

    return jobs.filter((job) => job.progressStatus === statusFilter);
  }, [jobs, statusFilter]);

  const activeJobs = jobs.filter(
    (job) =>
      job.progressStatus !== "completed" && job.progressStatus !== "cancelled",
  ).length;
  const checkedInJobs = jobs.filter((job) => job.checkIn.isSubmitted).length;

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(59,130,246,0.08),_transparent_28%),linear-gradient(180deg,_#f8fafc_0%,_#eef4f8_100%)] px-4 py-6 sm:px-6 sm:py-8">
      <div className="mx-auto max-w-6xl">
        <header className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <span className="inline-flex rounded-full bg-slate-900 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-white">
              Operations
            </span>
            <h1 className="mt-3 text-3xl font-semibold tracking-tight text-slate-950">
              Job Progress Board
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
              Track every assigned job, see whether check-in has been submitted,
              and monitor how much of the service checklist is complete.
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
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
            <button
              type="button"
              onClick={onBackToDashboard}
              className="inline-flex min-h-11 items-center justify-center rounded-2xl border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-700"
            >
              Back to dashboard
            </button>
          </div>
        </header>

        <div className="mb-5 grid gap-4 sm:grid-cols-3">
          <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
              Total Assigned jobs
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
              {activeJobs}
            </p>
          </div>
          <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
              Checked in
            </p>
            <p className="mt-2 text-3xl font-semibold text-slate-950">
              {checkedInJobs}
            </p>
          </div>
        </div>

        <section className="rounded-[1.75rem] border border-slate-200 bg-white p-5 shadow-[0_24px_80px_-48px_rgba(15,23,42,0.45)] sm:p-6">
          <div className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-xl font-semibold text-slate-950">
                Live progress
              </h2>
              <p className="mt-2 text-sm text-slate-600">
                Every card below combines job status, check-in progress, and
                checklist completion.
              </p>
            </div>

            <label className="flex flex-col gap-2 text-sm font-semibold text-slate-900">
              Filter status
              <select
                value={statusFilter}
                onChange={(event) =>
                  setStatusFilter(
                    event.target.value as DerivedJobProgressStatus | "all",
                  )
                }
                className="min-h-11 rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm font-medium text-slate-900 outline-none transition focus:border-sky-400 focus:bg-white focus:ring-4 focus:ring-sky-100"
              >
                <option value="all">All statuses</option>
                {Object.entries(statusMeta).map(([value, meta]) => (
                  <option key={value} value={value}>
                    {meta.label}
                  </option>
                ))}
              </select>
            </label>
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
                Loading job progress...
              </div>
            </div>
          ) : filteredJobs.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-slate-300 bg-slate-50 px-6 py-12 text-center">
              <p className="text-base font-semibold text-slate-900">
                No jobs match this view
              </p>
              <p className="mt-2 text-sm text-slate-500">
                Try another filter or create a new job from Ops Assign Job.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredJobs.map((item) => {
                const checklistPercent =
                  item.checklistTotals.total === 0
                    ? 0
                    : Math.round(
                        (item.checklistTotals.completed /
                          item.checklistTotals.total) *
                          100,
                      );
                const meta = statusMeta[item.progressStatus];

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
                            {item.booking.full_name} •{" "}
                            {item.booking.car_registration}
                          </p>
                          <p className="mt-1 text-sm text-slate-600">
                            {item.job.assigned_mechanic_name ||
                              "Mechanic not assigned"}{" "}
                            • {item.booking.city}, {item.booking.postcode}
                          </p>
                          <p className="mt-1 text-xs text-slate-500">
                            {meta.helperText}
                          </p>
                        </div>

                        <div className="flex flex-wrap gap-2 text-xs text-slate-500">
                          {item.services.map((service) => (
                            <span
                              key={service.id}
                              className="rounded-full bg-white px-3 py-1 shadow-sm"
                            >
                              {service.service_name}
                            </span>
                          ))}
                        </div>
                      </div>

                      <div className="min-w-72 space-y-3">
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
                        </div>

                        <div className="grid gap-3 sm:grid-cols-2">
                          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                              Vehicle Check-In
                            </p>
                            <p className="mt-2 text-sm font-semibold text-slate-900">
                              {item.checkIn.isSubmitted
                                ? "Submitted"
                                : "Pending"}
                            </p>
                            <p className="mt-1 text-xs text-slate-500">
                              {item.checkIn.isSubmitted
                                ? `By ${item.checkIn.submittedBy || "mechanic"} on ${formatDateTime(item.checkIn.submittedAt)}`
                                : "Waiting for mechanic arrival check-in"}
                            </p>
                            <p className="mt-2 text-xs font-medium text-slate-500">
                              Photos: {item.checkIn.photoCount}/5
                            </p>
                          </div>
                          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                              Scheduled
                            </p>
                            <p className="mt-2 text-sm font-semibold text-slate-900">
                              {formatDateTime(item.job.scheduled_for)}
                            </p>
                            <p className="mt-1 text-xs text-slate-500">
                              Updated {formatDateTime(item.job.updated_at)}
                            </p>
                          </div>
                        </div>

                        <div className="flex flex-col gap-2 sm:flex-row">
                          <button
                            type="button"
                            onClick={() =>
                              onOpenJobOverview?.(item.job, item.booking)
                            }
                            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-2xl bg-slate-950 px-4 text-sm font-semibold text-white"
                          >
                            <Eye className="h-4 w-4" />
                            Open Job Detail
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              onOpenChecklist?.(item.job, item.booking)
                            }
                            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-2xl border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-700"
                          >
                            <Wrench className="h-4 w-4" />
                            Checklist
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              onOpenCheckIn?.(item.job, item.booking)
                            }
                            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-2xl border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-700"
                          >
                            <ChevronRight className="h-4 w-4" />
                            Check-In
                          </button>
                        </div>
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

export default OpsJobProgressPage;
