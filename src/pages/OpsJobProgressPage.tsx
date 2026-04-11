import { useEffect, useMemo, useState } from "react";
import clsx from "clsx";
import {
  ArrowUpDown,
  ChevronRight,
  ClipboardCheck,
  Download,
  Eye,
  LayoutGrid,
  LoaderCircle,
  RefreshCw,
  Search,
  Table2,
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

type ViewMode = "board" | "table";
type SortKey =
  | "job"
  | "customer"
  | "vehicle"
  | "mechanic"
  | "status"
  | "progress"
  | "scheduled";
type SortDirection = "asc" | "desc";

interface WorkspaceState {
  viewMode: ViewMode;
  searchTerm: string;
  statusFilter: DerivedJobProgressStatus | "all";
  mechanicFilter: string;
  scheduledFrom: string;
  scheduledTo: string;
  sortKey: SortKey;
  sortDirection: SortDirection;
}

const STORAGE_KEY = "ops-job-progress-workspace";
const DEFAULT_STATE: WorkspaceState = {
  viewMode: "table",
  searchTerm: "",
  statusFilter: "all",
  mechanicFilter: "all",
  scheduledFrom: "",
  scheduledTo: "",
  sortKey: "scheduled",
  sortDirection: "desc",
};

const statusMeta: Record<
  DerivedJobProgressStatus,
  { label: string; chipClassName: string; helperText: string; sortOrder: number }
> = {
  assigned: {
    label: "Assigned",
    chipClassName: "bg-slate-100 text-slate-700",
    helperText: "Job created but not yet started.",
    sortOrder: 1,
  },
  scheduled: {
    label: "Scheduled",
    chipClassName: "bg-indigo-100 text-indigo-700",
    helperText: "Job is scheduled and waiting for mechanic arrival.",
    sortOrder: 2,
  },
  check_in_pending: {
    label: "Check-In Pending",
    chipClassName: "bg-amber-100 text-amber-700",
    helperText: "Mechanic still needs to submit the arrival inspection.",
    sortOrder: 3,
  },
  checked_in: {
    label: "Checked In",
    chipClassName: "bg-sky-100 text-sky-700",
    helperText: "Pre-work inspection is done. Service work can continue.",
    sortOrder: 4,
  },
  in_progress: {
    label: "In Progress",
    chipClassName: "bg-blue-100 text-blue-700",
    helperText: "Checklist work has started and is still ongoing.",
    sortOrder: 5,
  },
  work_completed: {
    label: "Work Completed",
    chipClassName: "bg-emerald-100 text-emerald-700",
    helperText: "All tracked checklist tasks are complete.",
    sortOrder: 6,
  },
  completed: {
    label: "Completed",
    chipClassName: "bg-emerald-100 text-emerald-700",
    helperText: "Job has been fully completed and closed.",
    sortOrder: 7,
  },
  cancelled: {
    label: "Cancelled",
    chipClassName: "bg-rose-100 text-rose-700",
    helperText: "Job has been cancelled.",
    sortOrder: 8,
  },
};

const sortColumns: Array<{ key: SortKey; label: string }> = [
  { key: "job", label: "Job" },
  { key: "customer", label: "Customer" },
  { key: "vehicle", label: "Vehicle" },
  { key: "mechanic", label: "Mechanic" },
  { key: "status", label: "Status" },
  { key: "progress", label: "Progress" },
  { key: "scheduled", label: "Scheduled" },
];

function formatDateTime(value: string | null): string {
  if (!value) {
    return "Not available";
  }

  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function getChecklistPercent(item: OpsJobProgressBoardItem): number {
  if (item.progressStatus === "completed") return 100;
  if (item.progressStatus === "cancelled") return 0;
  if (item.checklistTotals.total === 0) return item.checkIn.isSubmitted ? 20 : 0;

  return Math.round(
    (item.checklistTotals.completed / item.checklistTotals.total) * 100,
  );
}

function getProgressSummary(item: OpsJobProgressBoardItem): string {
  if (item.progressStatus === "completed") return "100% complete";
  if (item.progressStatus === "cancelled") return "Cancelled";
  if (!item.checkIn.isSubmitted) return "Check-in pending";
  if (item.checklistTotals.total === 0) return "Check-in submitted";

  return `${item.checklistTotals.completed}/${item.checklistTotals.total} checklist steps`;
}

function matchesDateRange(
  scheduledFor: string | null,
  scheduledFrom: string,
  scheduledTo: string,
): boolean {
  if (!scheduledFrom && !scheduledTo) return true;
  if (!scheduledFor) return false;

  const scheduledDate = scheduledFor.slice(0, 10);
  if (scheduledFrom && scheduledDate < scheduledFrom) return false;
  if (scheduledTo && scheduledDate > scheduledTo) return false;

  return true;
}

function csvEscape(value: string | number | null): string {
  return `"${String(value ?? "").replace(/"/g, '""')}"`;
}

function loadWorkspaceState(): WorkspaceState {
  if (typeof window === "undefined") return DEFAULT_STATE;

  try {
    const rawValue = window.localStorage.getItem(STORAGE_KEY);
    return rawValue ? { ...DEFAULT_STATE, ...JSON.parse(rawValue) } : DEFAULT_STATE;
  } catch {
    return DEFAULT_STATE;
  }
}

function getSortValue(item: OpsJobProgressBoardItem, sortKey: SortKey) {
  switch (sortKey) {
    case "job":
      return item.job.job_reference.toLowerCase();
    case "customer":
      return (item.booking.full_name || "").toLowerCase();
    case "vehicle":
      return item.booking.car_registration.toLowerCase();
    case "mechanic":
      return (item.job.assigned_mechanic_name || "").toLowerCase();
    case "status":
      return statusMeta[item.progressStatus].sortOrder;
    case "progress":
      return getChecklistPercent(item);
    case "scheduled":
      return item.job.scheduled_for ? new Date(item.job.scheduled_for).getTime() : 0;
  }
}

function ActionButtons({
  item,
  onOpenJobOverview,
  onOpenChecklist,
  onOpenCheckIn,
  compact = false,
}: {
  item: OpsJobProgressBoardItem;
  onOpenJobOverview?: OpsJobProgressPageProps["onOpenJobOverview"];
  onOpenChecklist?: OpsJobProgressPageProps["onOpenChecklist"];
  onOpenCheckIn?: OpsJobProgressPageProps["onOpenCheckIn"];
  compact?: boolean;
}) {
  const className = compact
    ? "inline-flex min-h-10 items-center justify-center gap-2 rounded-2xl px-3 text-sm font-semibold"
    : "inline-flex min-h-11 items-center justify-center gap-2 rounded-2xl px-4 text-sm font-semibold";

  return (
    <div className={clsx("flex flex-col gap-2", !compact && "sm:flex-row")}>
      <button
        type="button"
        onClick={() => onOpenJobOverview?.(item.job, item.booking)}
        className={`${className} bg-slate-950 text-white`}
      >
        <Eye className="h-4 w-4" />
        {compact ? "Overview" : "Open Job Detail"}
      </button>
      <button
        type="button"
        onClick={() => onOpenChecklist?.(item.job, item.booking)}
        className={`${className} border border-slate-300 bg-white text-slate-700`}
      >
        <Wrench className="h-4 w-4" />
        Checklist
      </button>
      <button
        type="button"
        onClick={() => onOpenCheckIn?.(item.job, item.booking)}
        className={`${className} border border-slate-300 bg-white text-slate-700`}
      >
        <ChevronRight className="h-4 w-4" />
        Check-In
      </button>
    </div>
  );
}

function OpsJobProgressPage({
  onBackToDashboard,
  onOpenJobOverview,
  onOpenChecklist,
  onOpenCheckIn,
}: OpsJobProgressPageProps) {
  const savedState = useMemo(() => loadWorkspaceState(), []);
  const [jobs, setJobs] = useState<OpsJobProgressBoardItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>(savedState.viewMode);
  const [searchTerm, setSearchTerm] = useState(savedState.searchTerm);
  const [statusFilter, setStatusFilter] = useState<DerivedJobProgressStatus | "all">(
    savedState.statusFilter,
  );
  const [mechanicFilter, setMechanicFilter] = useState(savedState.mechanicFilter);
  const [scheduledFrom, setScheduledFrom] = useState(savedState.scheduledFrom);
  const [scheduledTo, setScheduledTo] = useState(savedState.scheduledTo);
  const [sortKey, setSortKey] = useState<SortKey>(savedState.sortKey);
  const [sortDirection, setSortDirection] = useState<SortDirection>(
    savedState.sortDirection,
  );

  const loadJobs = async () => {
    try {
      setIsLoading(true);
      setLoadError(null);
      setJobs(await fetchOpsJobProgressBoard());
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

  useEffect(() => {
    if (typeof window === "undefined") return;

    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        viewMode,
        searchTerm,
        statusFilter,
        mechanicFilter,
        scheduledFrom,
        scheduledTo,
        sortKey,
        sortDirection,
      } satisfies WorkspaceState),
    );
  }, [
    viewMode,
    searchTerm,
    statusFilter,
    mechanicFilter,
    scheduledFrom,
    scheduledTo,
    sortKey,
    sortDirection,
  ]);

  const mechanicOptions = useMemo(
    () =>
      Array.from(
        new Set(
          jobs
            .map((item) => item.job.assigned_mechanic_name?.trim() || "")
            .filter(Boolean),
        ),
      ).sort((left, right) => left.localeCompare(right)),
    [jobs],
  );

  const filteredJobs = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();

    return jobs.filter((item) => {
      if (statusFilter !== "all" && item.progressStatus !== statusFilter) return false;
      if (
        mechanicFilter !== "all" &&
        (item.job.assigned_mechanic_name?.trim() || "") !== mechanicFilter
      ) {
        return false;
      }
      if (!matchesDateRange(item.job.scheduled_for, scheduledFrom, scheduledTo)) {
        return false;
      }
      if (!normalizedSearch) return true;

      const searchableText = [
        item.job.job_reference,
        item.booking.booking_number,
        item.booking.full_name,
        item.booking.car_registration,
        item.job.assigned_mechanic_name,
        item.booking.city,
        item.booking.postcode,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return searchableText.includes(normalizedSearch);
    });
  }, [jobs, mechanicFilter, scheduledFrom, scheduledTo, searchTerm, statusFilter]);

  const sortedJobs = useMemo(() => {
    return [...filteredJobs].sort((left, right) => {
      const leftValue = getSortValue(left, sortKey);
      const rightValue = getSortValue(right, sortKey);
      const comparison =
        typeof leftValue === "number" && typeof rightValue === "number"
          ? leftValue - rightValue
          : String(leftValue).localeCompare(String(rightValue));

      if (comparison === 0) {
        const tieBreak =
          new Date(right.job.updated_at).getTime() -
          new Date(left.job.updated_at).getTime();
        return sortDirection === "asc" ? tieBreak * -1 : tieBreak;
      }

      return sortDirection === "asc" ? comparison : comparison * -1;
    });
  }, [filteredJobs, sortDirection, sortKey]);

  const totals = useMemo(
    () => ({
      active: jobs.filter(
        (item) =>
          item.progressStatus !== "completed" &&
          item.progressStatus !== "cancelled",
      ).length,
      checkedIn: jobs.filter((item) => item.checkIn.isSubmitted).length,
      completed: jobs.filter((item) => item.progressStatus === "completed").length,
    }),
    [jobs],
  );

  const hasActiveFilters =
    searchTerm.trim() !== "" ||
    statusFilter !== "all" ||
    mechanicFilter !== "all" ||
    scheduledFrom !== "" ||
    scheduledTo !== "";

  const handleSort = (nextSortKey: SortKey) => {
    if (sortKey === nextSortKey) {
      setSortDirection((current) => (current === "asc" ? "desc" : "asc"));
      return;
    }

    setSortKey(nextSortKey);
    setSortDirection(nextSortKey === "scheduled" ? "desc" : "asc");
  };

  const handleResetFilters = () => {
    setSearchTerm("");
    setStatusFilter("all");
    setMechanicFilter("all");
    setScheduledFrom("");
    setScheduledTo("");
  };

  const handleExportCsv = () => {
    if (sortedJobs.length === 0) return;

    const headers = [
      "Job Reference",
      "Booking Number",
      "Customer",
      "Vehicle",
      "Mechanic",
      "Status",
      "Progress",
      "Checklist Completed",
      "Checklist Total",
      "Check-In Status",
      "Scheduled For",
      "Updated At",
    ];

    const rows = sortedJobs.map((item) => [
      item.job.job_reference,
      item.booking.booking_number,
      item.booking.full_name,
      item.booking.car_registration,
      item.job.assigned_mechanic_name || "Not assigned",
      statusMeta[item.progressStatus].label,
      getProgressSummary(item),
      item.checklistTotals.completed,
      item.checklistTotals.total,
      item.checkIn.isSubmitted ? "Submitted" : "Pending",
      item.job.scheduled_for ?? "",
      item.job.updated_at,
    ]);

    const csvContent = [headers, ...rows]
      .map((row) => row.map(csvEscape).join(","))
      .join("\r\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const downloadUrl = window.URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = downloadUrl;
    link.download = `ops-jobs-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    window.URL.revokeObjectURL(downloadUrl);
  };

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(59,130,246,0.08),_transparent_28%),linear-gradient(180deg,_#f8fafc_0%,_#eef4f8_100%)] px-4 py-6 sm:px-6 sm:py-8">
      <div className="mx-auto max-w-7xl">
        <header className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <span className="inline-flex rounded-full bg-slate-900 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-white">
              Operations
            </span>
            <h1 className="mt-3 text-3xl font-semibold tracking-tight text-slate-950">
              Job Operations
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
              Track every assigned job, review progress, and switch between a
              visual board and a searchable jobs table.
            </p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row">
            <button
              type="button"
              onClick={handleExportCsv}
              disabled={sortedJobs.length === 0}
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-2xl border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-700 disabled:opacity-50"
            >
              <Download className="h-4 w-4" />
              Export CSV
            </button>
            <button
              type="button"
              onClick={() => void loadJobs()}
              disabled={isLoading}
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-2xl border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-700 disabled:opacity-50"
            >
              <RefreshCw className={clsx("h-4 w-4", isLoading && "animate-spin")} />
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

        <div className="mb-5 grid gap-4 sm:grid-cols-4">
          <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
              Total Assigned jobs
            </p>
            <p className="mt-2 text-3xl font-semibold text-slate-950">{jobs.length}</p>
          </div>
          <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
              Active jobs
            </p>
            <p className="mt-2 text-3xl font-semibold text-slate-950">{totals.active}</p>
          </div>
          <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
              Checked in
            </p>
            <p className="mt-2 text-3xl font-semibold text-slate-950">{totals.checkedIn}</p>
          </div>
          <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
              Completed jobs
            </p>
            <p className="mt-2 text-3xl font-semibold text-slate-950">{totals.completed}</p>
          </div>
        </div>

        <section className="rounded-[1.75rem] border border-slate-200 bg-white p-5 shadow-[0_24px_80px_-48px_rgba(15,23,42,0.45)] sm:p-6">
          <div className="mb-5 flex flex-col gap-4">
            <div>
              <div className="flex flex-wrap items-center gap-3">
                <h2 className="text-xl font-semibold text-slate-950">Jobs workspace</h2>
                <div className="inline-flex rounded-2xl border border-slate-200 bg-slate-50 p-1">
                  <button
                    type="button"
                    onClick={() => setViewMode("table")}
                    className={clsx(
                      "inline-flex min-h-10 items-center justify-center gap-2 rounded-xl px-4 text-sm font-semibold transition",
                      viewMode === "table"
                        ? "bg-white text-slate-950 shadow-sm"
                        : "text-slate-600",
                    )}
                  >
                    <Table2 className="h-4 w-4" />
                    Table
                  </button>
                  <button
                    type="button"
                    onClick={() => setViewMode("board")}
                    className={clsx(
                      "inline-flex min-h-10 items-center justify-center gap-2 rounded-xl px-4 text-sm font-semibold transition",
                      viewMode === "board"
                        ? "bg-white text-slate-950 shadow-sm"
                        : "text-slate-600",
                    )}
                  >
                    <LayoutGrid className="h-4 w-4" />
                    Board
                  </button>
                </div>
              </div>
              <p className="mt-2 text-sm text-slate-600">
                Table view is best for daily ops control. Board view gives a
                quick visual status scan.
              </p>
            </div>

            <div className="grid gap-3 xl:grid-cols-[minmax(0,1.35fr)_repeat(4,minmax(160px,0.38fr))]">
              <label className="flex flex-col gap-2 text-sm font-semibold text-slate-900">
                Search jobs
                <div className="flex min-h-11 items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 transition focus-within:border-sky-400 focus-within:bg-white focus-within:ring-4 focus-within:ring-sky-100">
                  <Search className="h-4 w-4 text-slate-400" />
                  <input
                    value={searchTerm}
                    onChange={(event) => setSearchTerm(event.target.value)}
                    placeholder="Job ref, customer, reg, mechanic..."
                    className="h-full w-full bg-transparent text-sm font-medium text-slate-900 outline-none placeholder:text-slate-400"
                  />
                </div>
              </label>

              <label className="flex flex-col gap-2 text-sm font-semibold text-slate-900">
                Filter status
                <select
                  value={statusFilter}
                  onChange={(event) =>
                    setStatusFilter(event.target.value as DerivedJobProgressStatus | "all")
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

              <label className="flex flex-col gap-2 text-sm font-semibold text-slate-900">
                Filter mechanic
                <select
                  value={mechanicFilter}
                  onChange={(event) => setMechanicFilter(event.target.value)}
                  className="min-h-11 rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm font-medium text-slate-900 outline-none transition focus:border-sky-400 focus:bg-white focus:ring-4 focus:ring-sky-100"
                >
                  <option value="all">All mechanics</option>
                  {mechanicOptions.map((mechanicName) => (
                    <option key={mechanicName} value={mechanicName}>
                      {mechanicName}
                    </option>
                  ))}
                </select>
              </label>

              <label className="flex flex-col gap-2 text-sm font-semibold text-slate-900">
                Scheduled from
                <input
                  type="date"
                  value={scheduledFrom}
                  onChange={(event) => setScheduledFrom(event.target.value)}
                  className="min-h-11 rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm font-medium text-slate-900 outline-none transition focus:border-sky-400 focus:bg-white focus:ring-4 focus:ring-sky-100"
                />
              </label>

              <label className="flex flex-col gap-2 text-sm font-semibold text-slate-900">
                Scheduled to
                <input
                  type="date"
                  value={scheduledTo}
                  onChange={(event) => setScheduledTo(event.target.value)}
                  className="min-h-11 rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm font-medium text-slate-900 outline-none transition focus:border-sky-400 focus:bg-white focus:ring-4 focus:ring-sky-100"
                />
              </label>
            </div>

            <div className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600 sm:flex-row sm:items-center sm:justify-between">
              <p>
                Showing <span className="font-semibold text-slate-900">{sortedJobs.length}</span>{" "}
                of <span className="font-semibold text-slate-900">{jobs.length}</span> jobs
              </p>
              <div className="flex flex-wrap items-center gap-3">
                <p className="text-xs font-medium uppercase tracking-[0.14em] text-slate-500">
                  {viewMode === "table" ? "Table view" : "Board view"}
                </p>
                <p className="text-xs font-medium uppercase tracking-[0.14em] text-slate-500">
                  Sorted by {sortKey} {sortDirection}
                </p>
                <button
                  type="button"
                  onClick={handleResetFilters}
                  disabled={!hasActiveFilters}
                  className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Reset filters
                </button>
              </div>
            </div>
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
          ) : sortedJobs.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-slate-300 bg-slate-50 px-6 py-12 text-center">
              <p className="text-base font-semibold text-slate-900">
                No jobs match this view
              </p>
              <p className="mt-2 text-sm text-slate-500">
                Try another search or filter, or create a new job from Ops Assign Job.
              </p>
            </div>
          ) : viewMode === "board" ? (
            <div className="space-y-4">
              {sortedJobs.map((item) => {
                const checklistPercent = getChecklistPercent(item);
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
                            {item.booking.full_name} - {item.booking.car_registration}
                          </p>
                          <p className="mt-1 text-sm text-slate-600">
                            {item.job.assigned_mechanic_name || "Mechanic not assigned"} -{" "}
                            {item.booking.city}, {item.booking.postcode}
                          </p>
                          <p className="mt-1 text-xs text-slate-500">{meta.helperText}</p>
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
                              {item.checklistTotals.completed}/{item.checklistTotals.total}
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
                              {item.checkIn.isSubmitted ? "Submitted" : "Pending"}
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

                        <ActionButtons
                          item={item}
                          onOpenJobOverview={onOpenJobOverview}
                          onOpenChecklist={onOpenChecklist}
                          onOpenCheckIn={onOpenCheckIn}
                        />
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          ) : (
            <div className="overflow-hidden rounded-3xl border border-slate-200">
              <div className="overflow-x-auto">
                <table className="min-w-full border-collapse bg-white text-left">
                  <thead className="bg-slate-50">
                    <tr>
                      {sortColumns.map((column) => (
                        <th key={column.key} className="px-4 py-3">
                          <button
                            type="button"
                            onClick={() => handleSort(column.key)}
                            className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-slate-500 transition hover:text-slate-900"
                          >
                            {column.label}
                            <ArrowUpDown
                              className={clsx(
                                "h-3.5 w-3.5",
                                sortKey === column.key
                                  ? "text-slate-900"
                                  : "text-slate-400",
                              )}
                            />
                          </button>
                        </th>
                      ))}
                      <th className="px-4 py-3">
                        <span className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                          Actions
                        </span>
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {sortedJobs.map((item, index) => {
                      const meta = statusMeta[item.progressStatus];
                      const checklistPercent = getChecklistPercent(item);

                      return (
                        <tr
                          key={item.job.id}
                          className={clsx(
                            "align-top border-t border-slate-200",
                            index % 2 === 0 ? "bg-white" : "bg-slate-50/60",
                          )}
                        >
                          <td className="px-4 py-4">
                            <p className="text-sm font-semibold text-slate-950">
                              {item.job.job_reference}
                            </p>
                            <p className="mt-1 text-xs text-slate-500">
                              {item.booking.booking_number}
                            </p>
                          </td>
                          <td className="px-4 py-4">
                            <p className="text-sm font-semibold text-slate-950">
                              {item.booking.full_name}
                            </p>
                            <p className="mt-1 text-xs text-slate-500">
                              {item.booking.city}, {item.booking.postcode}
                            </p>
                          </td>
                          <td className="px-4 py-4">
                            <p className="text-sm font-semibold text-slate-950">
                              {item.booking.car_registration}
                            </p>
                            <p className="mt-1 text-xs text-slate-500">
                              {item.services.map((service) => service.service_name).join(", ")}
                            </p>
                          </td>
                          <td className="px-4 py-4 text-sm font-medium text-slate-900">
                            {item.job.assigned_mechanic_name || "Not assigned"}
                          </td>
                          <td className="px-4 py-4">
                            <span
                              className={clsx(
                                "inline-flex rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em]",
                                meta.chipClassName,
                              )}
                            >
                              {meta.label}
                            </span>
                            <p className="mt-2 text-xs text-slate-500">{meta.helperText}</p>
                          </td>
                          <td className="px-4 py-4">
                            <p className="text-sm font-semibold text-slate-900">
                              {getProgressSummary(item)}
                            </p>
                            <div className="mt-2 h-2 w-32 overflow-hidden rounded-full bg-slate-200">
                              <div
                                className="h-full rounded-full bg-sky-500 transition-all"
                                style={{ width: `${checklistPercent}%` }}
                              />
                            </div>
                            <p className="mt-2 text-xs text-slate-500">
                              Check-in: {item.checkIn.isSubmitted ? "Submitted" : "Pending"}
                            </p>
                          </td>
                          <td className="px-4 py-4">
                            <p className="text-sm font-medium text-slate-900">
                              {formatDateTime(item.job.scheduled_for)}
                            </p>
                            <p className="mt-1 text-xs text-slate-500">
                              Updated {formatDateTime(item.job.updated_at)}
                            </p>
                          </td>
                          <td className="px-4 py-4">
                            <ActionButtons
                              item={item}
                              onOpenJobOverview={onOpenJobOverview}
                              onOpenChecklist={onOpenChecklist}
                              onOpenCheckIn={onOpenCheckIn}
                              compact
                            />
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}

export default OpsJobProgressPage;
