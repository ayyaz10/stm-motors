import { useEffect, useMemo, useState } from "react";
import clsx from "clsx";
import {
  AlertCircle,
  CheckCircle2,
  ClipboardList,
  LoaderCircle,
  Wrench,
} from "lucide-react";
import {
  fetchJobWorkflowOverview,
  updateJobChecklistItem,
  type JobWorkflowOverview,
} from "../lib/jobWorkflow";
import { completeAssignedJob } from "../lib/jobs";

interface ServiceChecklistPageProps {
  jobId?: string;
  jobReference?: string;
  mechanicDisplayName?: string;
  isReviewMode?: boolean;
  onBackToCheckIn?: () => void;
  onBackToDashboard?: () => void;
}

function ServiceChecklistPage({
  jobId,
  jobReference,
  mechanicDisplayName,
  isReviewMode = false,
  onBackToCheckIn,
  onBackToDashboard,
}: ServiceChecklistPageProps) {
  const [workflow, setWorkflow] = useState<JobWorkflowOverview | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [savingItemId, setSavingItemId] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [isSubmittingService, setIsSubmittingService] = useState(false);

  const reference = useMemo(
    () => jobId?.trim() || jobReference?.trim() || "",
    [jobId, jobReference],
  );

  const loadWorkflow = async () => {
    if (!reference) {
      setLoadError("No job reference was provided.");
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setLoadError(null);

      const nextWorkflow = await fetchJobWorkflowOverview(reference);

      setWorkflow(nextWorkflow);
    } catch (error) {
      setLoadError(
        error instanceof Error
          ? error.message
          : "Unable to load the service checklist.",
      );
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadWorkflow();
  }, [reference]);

  const handleToggleItem = async (
    itemId: string,
    nextChecked: boolean,
  ): Promise<void> => {
    if (!workflow || savingItemId || !workflow.checkIn.isSubmitted || isReviewMode) {
      return;
    }

    const completedByName =
      mechanicDisplayName || workflow.job.assigned_mechanic_name || null;

    try {
      setSavingItemId(itemId);
      setSaveError(null);

      await updateJobChecklistItem(itemId, {
        is_completed: nextChecked,
        completed_by_name: completedByName,
      });

      setWorkflow((currentWorkflow) => {
        if (!currentWorkflow) {
          return currentWorkflow;
        }

        const nextServices = currentWorkflow.services.map((service) => ({
          ...service,
          checklist_items: service.checklist_items.map((item) =>
            item.id === itemId
              ? {
                  ...item,
                  is_completed: nextChecked,
                  completed_at: nextChecked ? new Date().toISOString() : null,
                  completed_by_name: nextChecked ? completedByName : null,
                }
              : item,
          ),
        }));
        const total = nextServices.reduce(
          (count, service) => count + service.checklist_items.length,
          0,
        );
        const completed = nextServices.reduce(
          (count, service) =>
            count +
            service.checklist_items.filter((item) => item.is_completed).length,
          0,
        );

        return {
          ...currentWorkflow,
          services: nextServices,
          checklistTotals: {
            total,
            completed,
          },
        };
      });
    } catch (error) {
      setSaveError(
        error instanceof Error
          ? error.message
          : "Unable to update the checklist item.",
      );
    } finally {
      setSavingItemId(null);
    }
  };

  const handleSubmitService = async () => {
    if (!workflow || isSubmittingService || isReviewMode) {
      return;
    }

    try {
      setIsSubmittingService(true);
      setSaveError(null);

      await completeAssignedJob(workflow.job.id);
      onBackToDashboard?.();
    } catch (error) {
      setSaveError(
        error instanceof Error
          ? error.message
          : "Unable to submit the completed service.",
      );
    } finally {
      setIsSubmittingService(false);
    }
  };

  if (isLoading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-100 px-4">
        <div className="flex items-center gap-3 rounded-3xl border border-slate-200 bg-white px-5 py-4 text-sm font-medium text-slate-700 shadow-sm">
          <LoaderCircle className="h-4 w-4 animate-spin" />
          Loading service checklist...
        </div>
      </main>
    );
  }

  if (loadError || !workflow) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-100 px-4">
        <div className="w-full max-w-lg rounded-3xl border border-rose-200 bg-white p-6 shadow-sm">
          <div className="flex items-start gap-3 text-rose-700">
            <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" />
            <div>
              <h1 className="text-xl font-semibold text-slate-950">
                Unable to open checklist
              </h1>
              <p className="mt-2 text-sm">
                {loadError || "Checklist data is missing."}
              </p>
            </div>
          </div>
        </div>
      </main>
    );
  }

  const progressPercent =
    workflow.checklistTotals.total === 0
      ? 0
      : Math.round(
          (workflow.checklistTotals.completed / workflow.checklistTotals.total) *
            100,
        );
  const isServiceReadyToSubmit =
    workflow.checkIn.isSubmitted &&
    workflow.job.status !== "completed" &&
    workflow.job.status !== "cancelled" &&
    (workflow.checklistTotals.total === 0 ||
      workflow.checklistTotals.completed === workflow.checklistTotals.total);

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(14,165,233,0.10),_transparent_28%),linear-gradient(180deg,_#f8fafc_0%,_#eef4f8_100%)] px-4 py-6 sm:px-6 sm:py-8">
      <div className="mx-auto max-w-5xl">
        <header className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <span className="inline-flex rounded-full bg-slate-900 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-white">
              Step 2 of 2
            </span>
            <h1 className="mt-3 text-3xl font-semibold tracking-tight text-slate-950">
              Service Checklist
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
              {isReviewMode
                ? "Review the saved service checklist in read-only mode."
                : "Complete each task in order, then submit the finished service to move the job back to your dashboard."}
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            <button
              type="button"
              onClick={onBackToCheckIn}
              disabled={!onBackToCheckIn}
              className="inline-flex min-h-11 items-center justify-center rounded-2xl border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Back to Vehicle Check-In
            </button>
            <button
              type="button"
              onClick={onBackToDashboard}
              disabled={!onBackToDashboard}
              className="inline-flex min-h-11 items-center justify-center rounded-2xl border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isReviewMode ? "Back to Review" : "Back to Dashboard"}
            </button>
          </div>
        </header>

        <section className="rounded-[1.75rem] border border-slate-200 bg-white p-5 shadow-[0_24px_80px_-48px_rgba(15,23,42,0.45)] sm:p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-sky-700">
                {workflow.job.job_reference}
              </p>
              <h2 className="mt-1 text-xl font-semibold text-slate-950">
                {workflow.booking.booking_number} -{" "}
                {workflow.booking.car_registration}
              </h2>
            </div>
            <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
              {workflow.job.assigned_mechanic_name || "Mechanic not assigned"}
            </span>
          </div>

          <div className="mt-5 rounded-3xl border border-slate-200 bg-slate-50 p-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-slate-900">
                  Checklist progress
                </p>
                <p className="text-xs text-slate-500">
                  {workflow.checklistTotals.completed} of{" "}
                  {workflow.checklistTotals.total} tasks complete
                </p>
              </div>
              <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-slate-700 shadow-sm">
                {progressPercent}%
              </span>
            </div>
            <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-200">
              <div
                className="h-full rounded-full bg-sky-500 transition-all"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>

          {!workflow.checkIn.isSubmitted ? (
            <div className="mt-6 rounded-3xl border border-amber-200 bg-amber-50 px-6 py-8">
              <p className="text-base font-semibold text-amber-900">
                Vehicle check-in must be completed first
              </p>
              <p className="mt-2 text-sm leading-6 text-amber-800">
                {isReviewMode
                  ? "This checklist step has not started yet because vehicle check-in is still missing."
                  : "This checklist is the second step. Go back to vehicle check-in, submit the arrival inspection, and then return here."}
              </p>
              <button
                type="button"
                onClick={onBackToCheckIn}
                disabled={!onBackToCheckIn}
                className="mt-4 rounded-2xl bg-slate-950 px-4 py-3 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50"
              >
                Go to Vehicle Check-In
              </button>
            </div>
          ) : (
            <>
              {saveError ? (
                <div className="mt-5 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                  {saveError}
                </div>
              ) : null}

              <div className="mt-6 space-y-5">
                {workflow.services.map((service) => (
                  <div
                    key={service.id}
                    className="rounded-3xl border border-slate-200 bg-slate-50 p-4"
                  >
                    <div className="flex items-start gap-3">
                      <div className="rounded-2xl bg-white p-2.5 text-sky-700 shadow-sm">
                        {service.checklist_items.every((item) => item.is_completed) &&
                        service.checklist_items.length > 0 ? (
                          <CheckCircle2 className="h-5 w-5" />
                        ) : (
                          <Wrench className="h-5 w-5" />
                        )}
                      </div>
                      <div>
                        <p className="text-base font-semibold text-slate-950">
                          {service.service_name}
                        </p>
                        {service.short_description ? (
                          <p className="mt-1 text-sm text-slate-600">
                            {service.short_description}
                          </p>
                        ) : null}
                        <p className="mt-2 text-xs font-medium uppercase tracking-[0.14em] text-slate-500">
                          {
                            service.checklist_items.filter((item) => item.is_completed)
                              .length
                          }{" "}
                          of {service.checklist_items.length} steps complete
                        </p>
                      </div>
                    </div>

                    <div className="mt-4 space-y-3">
                      {service.checklist_items.map((item) => {
                        const isSavingThisItem = savingItemId === item.id;

                        return (
                          <label
                            key={item.id}
                            className={clsx(
                              "flex items-start gap-3 rounded-2xl border px-4 py-3 transition",
                              item.is_completed
                                ? "border-emerald-200 bg-emerald-50"
                                : "border-slate-200 bg-white",
                              !isReviewMode && "cursor-pointer",
                            )}
                          >
                            <input
                              type="checkbox"
                              checked={item.is_completed}
                              disabled={
                                isReviewMode ||
                                Boolean(savingItemId) ||
                                isSubmittingService
                              }
                              onChange={(event) =>
                                void handleToggleItem(item.id, event.target.checked)
                              }
                              className="mt-1 h-4 w-4 rounded border-slate-300 text-sky-600 focus:ring-sky-500"
                            />
                            <div className="flex-1">
                              <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                                <p className="text-sm font-medium text-slate-900">
                                  {item.checklist_label}
                                </p>
                                {isSavingThisItem ? (
                                  <span className="inline-flex items-center gap-2 text-xs font-medium text-slate-500">
                                    <LoaderCircle className="h-3.5 w-3.5 animate-spin" />
                                    Saving
                                  </span>
                                ) : item.is_completed && item.completed_by_name ? (
                                  <span className="text-xs font-medium text-emerald-700">
                                    Completed by {item.completed_by_name}
                                  </span>
                                ) : null}
                              </div>
                            </div>
                          </label>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>

              {workflow.services.length === 0 ? (
                <div className="mt-6 rounded-3xl border border-dashed border-slate-300 bg-slate-50 px-6 py-10 text-center">
                  <ClipboardList className="mx-auto h-8 w-8 text-slate-400" />
                  <p className="mt-3 text-base font-semibold text-slate-900">
                    No checklist items found
                  </p>
                  <p className="mt-2 text-sm text-slate-500">
                    This job has no snapped service workflow yet.
                  </p>
                </div>
              ) : null}

              <div className="mt-6 rounded-3xl border border-slate-200 bg-slate-50 p-5">
                <p className="text-sm font-semibold text-slate-900">
                  {isReviewMode ? "Checklist review" : "Finish the service"}
                </p>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  {isReviewMode
                    ? "Ops and admin can review checklist progress here, but only mechanics can submit the finished service."
                    : "Submit Service is enabled once vehicle check-in is complete and all checklist work is finished."}
                </p>
                <button
                  type="button"
                  onClick={() => void handleSubmitService()}
                  disabled={
                    isReviewMode || !isServiceReadyToSubmit || isSubmittingService
                  }
                  className="mt-4 inline-flex min-h-12 items-center justify-center rounded-2xl bg-slate-950 px-5 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-500"
                >
                  {isSubmittingService
                    ? "Submitting..."
                    : isReviewMode
                      ? "Review only"
                      : "Submit Service"}
                </button>
              </div>
            </>
          )}
        </section>
      </div>
    </main>
  );
}

export default ServiceChecklistPage;
