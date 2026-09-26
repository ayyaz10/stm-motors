import {
  ArrowLeft,
  Check,
  CircleAlert,
  CircleCheckBig,
  LoaderCircle,
  Mail,
  MapPinned,
  Phone,
  RefreshCw,
  ShieldCheck,
  Trash2,
  Wrench,
  XCircle,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import {
  approveMechanicApplication,
  deleteMechanicApplication,
  fetchMechanicApplications,
  type MechanicApplicationRecord,
  type MechanicApplicationStatus,
  updateMechanicApplicationReview,
} from "../lib/mechanicApplications";
import { formatMechanicServiceLabel } from "../data/mechanicServiceOptions";

type ApplicationFilter = MechanicApplicationStatus | "all";

interface OpsMechanicApplicationsPageProps {
  onBackToOpsDashboard: () => void;
}

const statusOptions: Array<{
  label: string;
  value: ApplicationFilter;
}> = [
  { value: "all", label: "All" },
  { value: "submitted", label: "Submitted" },
  { value: "under_review", label: "Under review" },
  { value: "needs_info", label: "Needs info" },
  { value: "approved", label: "Approved" },
  { value: "rejected", label: "Rejected" },
];

function formatStatusLabel(status: MechanicApplicationStatus) {
  return status.replaceAll("_", " ");
}

function formatMechanicType(value: string) {
  return value.replaceAll("_", " ");
}

function formatDate(value: string | null) {
  if (!value) {
    return "Not yet";
  }

  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}

function getStatusBadgeClassName(status: MechanicApplicationStatus) {
  switch (status) {
    case "submitted":
      return "border-sky-200 bg-sky-50 text-sky-700";
    case "under_review":
      return "border-amber-200 bg-amber-50 text-amber-700";
    case "needs_info":
      return "border-violet-200 bg-violet-50 text-violet-700";
    case "approved":
      return "border-emerald-200 bg-emerald-50 text-emerald-700";
    case "rejected":
      return "border-rose-200 bg-rose-50 text-rose-700";
    default:
      return "border-slate-200 bg-slate-50 text-slate-700";
  }
}

function replaceApplicationInList(
  applications: MechanicApplicationRecord[],
  nextApplication: MechanicApplicationRecord,
) {
  return applications.map((application) =>
    application.id === nextApplication.id ? nextApplication : application,
  );
}

function OpsMechanicApplicationsPage({
  onBackToOpsDashboard,
}: OpsMechanicApplicationsPageProps) {
  const [applications, setApplications] = useState<MechanicApplicationRecord[]>(
    [],
  );
  const [statusFilter, setStatusFilter] = useState<ApplicationFilter>("all");
  const [draftNotes, setDraftNotes] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [busyApplicationId, setBusyApplicationId] = useState<string | null>(
    null,
  );
  const [busyAction, setBusyAction] = useState<string | null>(null);

  const loadApplications = async () => {
    try {
      setIsLoading(true);
      const nextApplications = await fetchMechanicApplications();
      setApplications(nextApplications);
      setDraftNotes(
        Object.fromEntries(
          nextApplications.map((application) => [
            application.id,
            application.reviewNote ?? "",
          ]),
        ),
      );
      setLoadError(null);
    } catch (error) {
      setLoadError(
        error instanceof Error
          ? error.message
          : "Unable to load mechanic applications.",
      );
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadApplications();
  }, []);

  const applicationCounts = useMemo(() => {
    return applications.reduce<Record<ApplicationFilter, number>>(
      (counts, application) => {
        counts.all += 1;
        counts[application.status] += 1;
        return counts;
      },
      {
        all: 0,
        submitted: 0,
        under_review: 0,
        needs_info: 0,
        approved: 0,
        rejected: 0,
      },
    );
  }, [applications]);

  const filteredApplications = useMemo(() => {
    if (statusFilter === "all") {
      return applications;
    }

    return applications.filter(
      (application) => application.status === statusFilter,
    );
  }, [applications, statusFilter]);

  const handleStatusUpdate = async (
    applicationId: string,
    status: Exclude<MechanicApplicationStatus, "approved">,
  ) => {
    try {
      setBusyApplicationId(applicationId);
      setBusyAction(status);
      const nextApplication = await updateMechanicApplicationReview({
        applicationId,
        status,
        reviewNote: draftNotes[applicationId] ?? "",
      });
      setApplications((current) =>
        replaceApplicationInList(current, nextApplication),
      );
      setLoadError(null);
    } catch (error) {
      setLoadError(
        error instanceof Error
          ? error.message
          : "Unable to update the application status.",
      );
    } finally {
      setBusyApplicationId(null);
      setBusyAction(null);
    }
  };

  const handleApprove = async (applicationId: string) => {
    try {
      setBusyApplicationId(applicationId);
      setBusyAction("approved");
      const nextApplication = await approveMechanicApplication(applicationId);
      setApplications((current) =>
        replaceApplicationInList(current, nextApplication),
      );
      setDraftNotes((current) => ({
        ...current,
        [applicationId]: nextApplication.reviewNote ?? "",
      }));
      setLoadError(null);
    } catch (error) {
      setLoadError(
        error instanceof Error
          ? error.message
          : "Unable to approve the application.",
      );
    } finally {
      setBusyApplicationId(null);
      setBusyAction(null);
    }
  };

  const handleDelete = async (application: MechanicApplicationRecord) => {
    const confirmed = window.confirm(
      `Permanently delete the application from ${application.firstName} ${application.lastName} (${application.email})?\n\nOnly use this for test, spam or duplicate applications. This cannot be undone.`,
    );

    if (!confirmed) return;

    try {
      setBusyApplicationId(application.id);
      setBusyAction("delete");
      await deleteMechanicApplication(application.id);
      setApplications((current) =>
        current.filter((item) => item.id !== application.id),
      );
      setDraftNotes((current) => {
        const next = { ...current };
        delete next[application.id];
        return next;
      });
      setLoadError(null);
    } catch (error) {
      setLoadError(
        error instanceof Error
          ? error.message
          : "Unable to delete the application.",
      );
    } finally {
      setBusyApplicationId(null);
      setBusyAction(null);
    }
  };

  return (
    <main className="min-h-screen bg-slate-100 px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="rounded-[2rem] bg-slate-950 px-6 py-8 text-white shadow-[0_30px_90px_-55px_rgba(15,23,42,0.7)] sm:px-8 lg:px-10">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-3xl">
              <span className="inline-flex rounded-full bg-white/12 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-blue-100">
                Mechanic applications
              </span>
              <h1 className="mt-5 text-3xl font-bold tracking-tight sm:text-4xl">
                Review applications before staff access is created.
              </h1>
              <p className="mt-4 max-w-2xl text-sm leading-7 text-white/78 sm:text-base">
                Mechanics apply here first. Ops or admin reviews their work
                setup, then approval sends the invite and activates staff login.
              </p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <button
                type="button"
                onClick={onBackToOpsDashboard}
                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border border-white/16 px-5 text-sm font-semibold text-white hover:bg-white/8"
              >
                <ArrowLeft className="h-4 w-4" />
                Back to ops
              </button>
              <button
                type="button"
                onClick={() => void loadApplications()}
                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-[#1c69d4] px-5 text-sm font-semibold text-white hover:bg-[#1557b3]"
              >
                <RefreshCw className="h-4 w-4" />
                Refresh applications
              </button>
            </div>
          </div>
        </div>

        <section className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-5">
          {statusOptions.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => setStatusFilter(option.value)}
              className={`rounded-[1.4rem] border bg-white p-5 text-left shadow-[0_18px_60px_-55px_rgba(15,23,42,0.45)] ${
                statusFilter === option.value
                  ? "border-[#1c69d4] ring-2 ring-[#1c69d4]/12"
                  : "border-slate-200"
              }`}
            >
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                {option.label}
              </p>
              <p className="mt-3 text-3xl font-bold tracking-tight text-slate-950">
                {applicationCounts[option.value]}
              </p>
            </button>
          ))}
        </section>

        {loadError ? (
          <div className="mt-6 rounded-[1.5rem] border border-rose-200 bg-rose-50 px-5 py-4 text-sm text-rose-700">
            {loadError}
          </div>
        ) : null}

        <section className="mt-6">
          {isLoading ? (
            <div className="rounded-[1.8rem] border border-slate-200 bg-white px-6 py-12 text-center shadow-[0_24px_70px_-60px_rgba(15,23,42,0.45)]">
              <LoaderCircle className="mx-auto h-6 w-6 animate-spin text-[#1c69d4]" />
              <p className="mt-4 text-sm text-slate-600">
                Loading mechanic applications...
              </p>
            </div>
          ) : filteredApplications.length === 0 ? (
            <div className="rounded-[1.8rem] border border-slate-200 bg-white px-6 py-12 text-center shadow-[0_24px_70px_-60px_rgba(15,23,42,0.45)]">
              <p className="text-lg font-semibold text-slate-950">
                No applications in this view yet.
              </p>
              <p className="mt-3 text-sm leading-7 text-slate-600">
                New mechanic applications will appear here once applicants start
                using the public apply flow.
              </p>
            </div>
          ) : (
            <div className="grid gap-6">
              {filteredApplications.map((application) => {
                const isBusy = busyApplicationId === application.id;
                const draftNote = draftNotes[application.id] ?? "";

                return (
                  <article
                    key={application.id}
                    className="rounded-[1.8rem] border border-slate-200 bg-white p-6 shadow-[0_24px_70px_-60px_rgba(15,23,42,0.45)] sm:p-7"
                  >
                    <div className="flex flex-col gap-5 border-b border-slate-200 pb-6 lg:flex-row lg:items-start lg:justify-between">
                      <div>
                        <div className="flex flex-wrap items-center gap-3">
                          <h2 className="text-2xl font-bold tracking-tight text-slate-950">
                            {application.firstName} {application.lastName}
                          </h2>
                          <span
                            className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold capitalize ${getStatusBadgeClassName(application.status)}`}
                          >
                            {formatStatusLabel(application.status)}
                          </span>
                        </div>
                        <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-sm text-slate-600">
                          <span className="inline-flex items-center gap-2">
                            <Mail className="h-4 w-4 text-[#1c69d4]" />
                            {application.email}
                          </span>
                          <span className="inline-flex items-center gap-2">
                            <Phone className="h-4 w-4 text-[#1c69d4]" />
                            {application.phone}
                          </span>
                          <span className="inline-flex items-center gap-2">
                            <MapPinned className="h-4 w-4 text-[#1c69d4]" />
                            {application.postcode}
                          </span>
                        </div>
                      </div>

                      <div className="grid gap-2 text-sm text-slate-600 sm:grid-cols-2 lg:min-w-[18rem]">
                        <div>
                          <p className="font-semibold text-slate-950">
                            Submitted
                          </p>
                          <p>{formatDate(application.submittedAt)}</p>
                        </div>
                        <div>
                          <p className="font-semibold text-slate-950">
                            Reviewed
                          </p>
                          <p>{formatDate(application.reviewedAt)}</p>
                        </div>
                        <div>
                          <p className="font-semibold text-slate-950">Type</p>
                          <p className="capitalize">
                            {formatMechanicType(application.mechanicType)}
                          </p>
                        </div>
                        <div>
                          <p className="font-semibold text-slate-950">
                            Invite sent
                          </p>
                          <p>{formatDate(application.inviteSentAt)}</p>
                        </div>
                      </div>
                    </div>

                    <div className="mt-6 grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
                      <div className="grid gap-6">
                        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                          <div className="rounded-2xl bg-slate-50 p-4">
                            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                              Experience
                            </p>
                            <p className="mt-3 text-lg font-semibold text-slate-950">
                              {application.yearsExperience ?? 0} years
                            </p>
                          </div>
                          <div className="rounded-2xl bg-slate-50 p-4">
                            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                              Radius
                            </p>
                            <p className="mt-3 text-lg font-semibold text-slate-950">
                              {application.serviceRadiusMiles ?? 0} miles
                            </p>
                          </div>
                          <div className="rounded-2xl bg-slate-50 p-4">
                            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                              Diagnostic tools
                            </p>
                            <p className="mt-3 text-lg font-semibold text-slate-950">
                              {application.hasDiagnosticTools ? "Yes" : "No"}
                            </p>
                          </div>
                          <div className="rounded-2xl bg-slate-50 p-4">
                            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                              Service van
                            </p>
                            <p className="mt-3 text-lg font-semibold text-slate-950">
                              {application.hasServiceVan ? "Yes" : "No"}
                            </p>
                          </div>
                        </div>

                        <div className="grid gap-6 lg:grid-cols-2">
                          <div className="rounded-[1.5rem] border border-slate-200 p-5">
                            <div className="flex items-center gap-3">
                              <span className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-blue-50 text-[#1c69d4]">
                                <Wrench className="h-4 w-4" />
                              </span>
                              <h3 className="text-lg font-semibold text-slate-950">
                                Services offered
                              </h3>
                            </div>
                            <div className="mt-4 flex flex-wrap gap-2">
                              {application.servicesOffered.map((item) => (
                                <span
                                  key={item}
                                  className="rounded-full bg-slate-100 px-3 py-1 text-sm capitalize text-slate-700"
                                >
                                  {formatMechanicServiceLabel(item)}
                                </span>
                              ))}
                            </div>
                          </div>

                          <div className="rounded-[1.5rem] border border-slate-200 p-5">
                            <div className="flex items-center gap-3">
                              <span className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-blue-50 text-[#1c69d4]">
                                <ShieldCheck className="h-4 w-4" />
                              </span>
                              <h3 className="text-lg font-semibold text-slate-950">
                                Insurance held
                              </h3>
                            </div>
                            <div className="mt-4 flex flex-wrap gap-2">
                              {application.insuranceHeld.map((item) => (
                                <span
                                  key={item}
                                  className="rounded-full bg-slate-100 px-3 py-1 text-sm capitalize text-slate-700"
                                >
                                  {item.replaceAll("_", " ")}
                                </span>
                              ))}
                            </div>
                          </div>
                        </div>

                        <div className="rounded-[1.5rem] border border-slate-200 p-5">
                          <h3 className="text-lg font-semibold text-slate-950">
                            Booking setup and qualifications
                          </h3>
                          <div className="mt-4 grid gap-5 lg:grid-cols-2">
                            <div>
                              <p className="text-sm font-semibold text-slate-950">
                                How they work
                              </p>
                              <div className="mt-3 flex flex-wrap gap-2">
                                {application.workTypes.map((item) => (
                                  <span
                                    key={item}
                                    className="rounded-full bg-slate-100 px-3 py-1 text-sm capitalize text-slate-700"
                                  >
                                    {item.replaceAll("_", " ")}
                                  </span>
                                ))}
                              </div>
                            </div>
                            <div>
                              <p className="text-sm font-semibold text-slate-950">
                                Business name
                              </p>
                              <p className="mt-3 text-sm leading-7 text-slate-600">
                                {application.businessName || "Not provided"}
                              </p>
                            </div>
                          </div>
                          <div className="mt-5 grid gap-5 lg:grid-cols-2">
                            <div>
                              <p className="text-sm font-semibold text-slate-950">
                                Qualifications summary
                              </p>
                              <p className="mt-3 text-sm leading-7 text-slate-600">
                                {application.qualificationsSummary ||
                                  "Not provided"}
                              </p>
                            </div>
                            <div>
                              <p className="text-sm font-semibold text-slate-950">
                                Website or profile
                              </p>
                              {application.websiteUrl ? (
                                <a
                                  href={application.websiteUrl}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="mt-3 inline-flex text-sm font-semibold text-[#1c69d4] hover:text-[#1557b3]"
                                >
                                  {application.websiteUrl}
                                </a>
                              ) : (
                                <p className="mt-3 text-sm leading-7 text-slate-600">
                                  Not provided
                                </p>
                              )}
                            </div>
                          </div>
                          <div className="mt-5">
                            <p className="text-sm font-semibold text-slate-950">
                              Additional notes
                            </p>
                            <p className="mt-3 text-sm leading-7 text-slate-600">
                              {application.additionalNotes || "No extra notes."}
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="rounded-[1.5rem] border border-slate-200 p-5">
                        <h3 className="text-lg font-semibold text-slate-950">
                          Review and approval
                        </h3>
                        <p className="mt-3 text-sm leading-7 text-slate-600">
                          Use a review note for internal context or for a future
                          follow-up with the applicant. Approval sends the invite
                          and creates mechanic access.
                        </p>

                        <label className="mt-5 block">
                          <span className="mb-2 block text-sm font-semibold text-slate-900">
                            Review note
                          </span>
                          <textarea
                            rows={6}
                            value={draftNote}
                            onChange={(event) =>
                              setDraftNotes((current) => ({
                                ...current,
                                [application.id]: event.target.value,
                              }))
                            }
                            className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm text-slate-900 outline-none focus:border-[#1c69d4]"
                            placeholder="Add context for approval, needs-info follow-up, or rejection reasoning."
                          />
                        </label>

                        <div className="mt-5 rounded-2xl bg-slate-50 p-4 text-sm text-slate-700">
                          <div className="flex items-start gap-3">
                            {application.status === "approved" ? (
                              <CircleCheckBig className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" />
                            ) : application.status === "rejected" ? (
                              <XCircle className="mt-0.5 h-5 w-5 shrink-0 text-rose-600" />
                            ) : (
                              <CircleAlert className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
                            )}
                            <div>
                              <p className="font-semibold text-slate-950">
                                Access state
                              </p>
                              <p className="mt-1 leading-6 text-slate-600">
                                {application.status === "approved"
                                  ? "Invite sent and mechanic account linked for staff access."
                                  : "No staff access yet. Approval is still required before login becomes available."}
                              </p>
                            </div>
                          </div>
                        </div>

                        <div className="mt-6 grid gap-3">
                          <button
                            type="button"
                            onClick={() => void handleApprove(application.id)}
                            disabled={isBusy || application.status === "approved"}
                            className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-emerald-600 px-5 text-sm font-semibold text-white hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
                          >
                            {isBusy && busyAction === "approved" ? (
                              <LoaderCircle className="h-4 w-4 animate-spin" />
                            ) : (
                              <Check className="h-4 w-4" />
                            )}
                            Approve and send invite
                          </button>

                          <div className="grid gap-3 sm:grid-cols-2">
                            <button
                              type="button"
                              onClick={() =>
                                void handleStatusUpdate(
                                  application.id,
                                  "under_review",
                                )
                              }
                              disabled={isBusy}
                              className="inline-flex min-h-11 items-center justify-center rounded-xl border border-slate-300 px-4 text-sm font-semibold text-slate-700 hover:border-[#1c69d4] hover:text-[#1c69d4] disabled:cursor-not-allowed disabled:opacity-60"
                            >
                              {isBusy && busyAction === "under_review"
                                ? "Saving..."
                                : "Mark under review"}
                            </button>
                            <button
                              type="button"
                              onClick={() =>
                                void handleStatusUpdate(application.id, "needs_info")
                              }
                              disabled={isBusy}
                              className="inline-flex min-h-11 items-center justify-center rounded-xl border border-violet-200 px-4 text-sm font-semibold text-violet-700 hover:bg-violet-50 disabled:cursor-not-allowed disabled:opacity-60"
                            >
                              {isBusy && busyAction === "needs_info"
                                ? "Saving..."
                                : "Needs info"}
                            </button>
                          </div>

                          <button
                            type="button"
                            onClick={() =>
                              void handleStatusUpdate(application.id, "rejected")
                            }
                            disabled={isBusy}
                            className="inline-flex min-h-11 items-center justify-center rounded-xl border border-rose-200 px-4 text-sm font-semibold text-rose-700 hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-60"
                          >
                            {isBusy && busyAction === "rejected"
                              ? "Saving..."
                              : "Reject application"}
                          </button>
                          {application.status !== "approved" &&
                          !application.authUserId ? (
                            <button
                              type="button"
                              onClick={() => void handleDelete(application)}
                              disabled={isBusy}
                              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-rose-300 bg-rose-50 px-4 text-sm font-semibold text-rose-800 hover:bg-rose-100 disabled:cursor-not-allowed disabled:opacity-60"
                            >
                              {isBusy && busyAction === "delete" ? (
                                <LoaderCircle className="h-4 w-4 animate-spin" />
                              ) : (
                                <Trash2 className="h-4 w-4" />
                              )}
                              {isBusy && busyAction === "delete"
                                ? "Deleting..."
                                : "Delete test or duplicate application"}
                            </button>
                          ) : null}
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

export default OpsMechanicApplicationsPage;
