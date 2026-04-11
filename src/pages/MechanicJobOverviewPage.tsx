import { useCallback, useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  CarFront,
  ChevronLeft,
  ChevronRight,
  LoaderCircle,
  NotebookPen,
  Phone,
  ShieldCheck,
  UserRound,
  Wrench,
} from "lucide-react";
import {
  fetchJobWorkflowOverview,
  type JobWorkflowOverview,
} from "../lib/jobWorkflow";
import { ensureBookingCoordinates } from "../lib/bookingLocation";
import { canViewJobLocation } from "../lib/jobProgress";
import MechanicLocationCard from "../components/mechanic/MechanicLocationCard";

interface MechanicJobOverviewPageProps {
  jobId?: string;
  jobReference?: string;
  canStartWorkflow?: boolean;
  isReviewMode?: boolean;
  onBackToDashboard?: () => void;
  onStart?: (nextStep: "checkin" | "checklist") => void;
}

function formatDateTime(value: string | null): string {
  if (!value) {
    return "Not scheduled";
  }

  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

const checkInPhotoLabels = [
  { key: "odometer" as const, label: "Odometer" },
  { key: "front" as const, label: "Front" },
  { key: "rear" as const, label: "Rear" },
  { key: "left" as const, label: "Left Side" },
  { key: "right" as const, label: "Right Side" },
];

function MechanicJobOverviewPage({
  jobId,
  jobReference,
  canStartWorkflow = true,
  isReviewMode = false,
  onBackToDashboard,
  onStart,
}: MechanicJobOverviewPageProps) {
  const [workflow, setWorkflow] = useState<JobWorkflowOverview | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [locationRefreshError, setLocationRefreshError] = useState<string | null>(
    null,
  );
  const [activePhotoIndex, setActivePhotoIndex] = useState<number | null>(null);
  const [isRefreshingLocation, setIsRefreshingLocation] = useState(false);
  const [hasAttemptedLocationRefresh, setHasAttemptedLocationRefresh] =
    useState(false);

  const reference = useMemo(
    () => jobId?.trim() || jobReference?.trim() || "",
    [jobId, jobReference],
  );

  const loadWorkflow = useCallback(async () => {
    if (!reference) {
      setLoadError("No job reference was provided.");
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setLoadError(null);
      setLocationRefreshError(null);
      setHasAttemptedLocationRefresh(false);

      const nextWorkflow = await fetchJobWorkflowOverview(reference);

      setWorkflow(nextWorkflow);
    } catch (error) {
      setLoadError(
        error instanceof Error
          ? error.message
          : "Unable to load the job overview.",
      );
    } finally {
      setIsLoading(false);
    }
  }, [reference]);

  useEffect(() => {
    void loadWorkflow();
  }, [loadWorkflow]);

  const handleRefreshLocation = useCallback(
    async (markAttempted = false) => {
      if (!workflow || isRefreshingLocation) {
        return;
      }

      try {
        setIsRefreshingLocation(true);
        setLocationRefreshError(null);

        if (markAttempted) {
          setHasAttemptedLocationRefresh(true);
        }

        const ensuredCoordinates = await ensureBookingCoordinates(
          workflow.booking.id,
        );

        if (ensuredCoordinates.source === "missing") {
          setLocationRefreshError(
            "Coordinates could not be generated from this address yet. Check the address or try again later.",
          );
          return;
        }

        const refreshedWorkflow = await fetchJobWorkflowOverview(reference);
        setWorkflow(refreshedWorkflow);
      } catch (error) {
        console.error("Failed to refresh booking coordinates", error);
        setLocationRefreshError(
          error instanceof Error
            ? error.message
            : "Map coordinates could not be refreshed right now.",
        );
      } finally {
        setIsRefreshingLocation(false);
      }
    },
    [isRefreshingLocation, reference, workflow],
  );

  useEffect(() => {
    if (!workflow || isRefreshingLocation || hasAttemptedLocationRefresh) {
      return;
    }

    const shouldAttemptLocationRefresh =
      canViewJobLocation(workflow.progressStatus) &&
      workflow.location.latitude === null &&
      workflow.location.longitude === null;

    if (!shouldAttemptLocationRefresh) {
      return;
    }

    void handleRefreshLocation(true);
  }, [
    handleRefreshLocation,
    hasAttemptedLocationRefresh,
    isRefreshingLocation,
    workflow,
  ]);

  const availableCheckInPhotos = workflow
    ? checkInPhotoLabels
        .map((photo) => ({
          label: photo.label,
          url: workflow.checkIn.photos[photo.key],
        }))
        .filter(
          (photo): photo is { label: string; url: string } => Boolean(photo.url),
        )
    : [];
  const activePhoto =
    activePhotoIndex === null
      ? null
      : availableCheckInPhotos[activePhotoIndex] ?? null;

  useEffect(() => {
    if (activePhotoIndex === null) {
      return;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setActivePhotoIndex(null);
        return;
      }

      if (availableCheckInPhotos.length <= 1) {
        return;
      }

      if (event.key === "ArrowLeft") {
        setActivePhotoIndex((currentIndex) => {
          if (currentIndex === null) {
            return currentIndex;
          }

          return currentIndex === 0
            ? availableCheckInPhotos.length - 1
            : currentIndex - 1;
        });
      }

      if (event.key === "ArrowRight") {
        setActivePhotoIndex((currentIndex) => {
          if (currentIndex === null) {
            return currentIndex;
          }

          return currentIndex === availableCheckInPhotos.length - 1
            ? 0
            : currentIndex + 1;
        });
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [activePhotoIndex, availableCheckInPhotos.length]);

  if (isLoading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-100 px-4">
        <div className="flex items-center gap-3 rounded-3xl border border-slate-200 bg-white px-5 py-4 text-sm font-medium text-slate-700 shadow-sm">
          <LoaderCircle className="h-4 w-4 animate-spin" />
          Loading job overview...
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
                Unable to open job
              </h1>
              <p className="mt-2 text-sm">
                {loadError || "Job details are missing."}
              </p>
            </div>
          </div>
        </div>
      </main>
    );
  }

  const completionPercent =
    workflow.checklistTotals.total === 0
      ? 0
      : Math.round(
          (workflow.checklistTotals.completed / workflow.checklistTotals.total) *
            100,
        );
  const isJobClosed =
    workflow.job.status === "completed" || workflow.job.status === "cancelled";
  const isClosedMechanicView = isJobClosed && !isReviewMode;
  const locationStatus =
    isReviewMode && isJobClosed ? "in_progress" : workflow.progressStatus;
  const nextStep = workflow.checkIn.isSubmitted ? "checklist" : "checkin";
  const isWorkflowReadOnly = !canStartWorkflow;
  const canRetryLocationRefresh =
    canViewJobLocation(locationStatus) &&
    workflow.location.latitude === null &&
    workflow.location.longitude === null;
  const vehicleSummary =
    workflow.job.vehicle_summary_snapshot ||
    [
      workflow.booking.make,
      workflow.booking.model,
      workflow.booking.engine,
      workflow.booking.fuel,
      workflow.booking.year,
    ]
      .filter(Boolean)
      .join(" ");

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(16,185,129,0.08),_transparent_28%),linear-gradient(180deg,_#f8fafc_0%,_#edf4f1_100%)] px-4 py-6 sm:px-6 sm:py-8">
      <div className="mx-auto max-w-6xl">
        <header className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <span className="inline-flex rounded-full bg-slate-900 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-white">
              Mechanic Workflow
            </span>
            <h1 className="mt-3 text-3xl font-semibold tracking-tight text-slate-950">
              Job Overview
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
              Review the job, customer, and service scope before starting the
              guided mechanic workflow.
            </p>
          </div>

          <button
            type="button"
            onClick={onBackToDashboard}
            className="inline-flex min-h-11 items-center justify-center rounded-2xl border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-700"
          >
            {isReviewMode ? "Back to review" : "Back to dashboard"}
          </button>
        </header>

        <div className="grid gap-5 lg:grid-cols-[0.95fr_1.05fr]">
          <section className="space-y-5">
            <div className="rounded-[1.75rem] border border-slate-200 bg-white p-5 shadow-[0_24px_80px_-48px_rgba(15,23,42,0.45)] sm:p-6">
              <div className="flex items-start gap-4">
                <div className="rounded-2xl bg-emerald-50 p-3 text-emerald-700">
                  <ShieldCheck className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-700">
                    Job Summary
                  </p>
                  <h2 className="mt-1 text-xl font-semibold text-slate-950">
                    {workflow.job.job_reference}
                  </h2>
                  <p className="mt-2 text-sm text-slate-600">
                    Booking {workflow.booking.booking_number} -{" "}
                    {workflow.progressStatus.replaceAll("_", " ")}
                  </p>
                </div>
              </div>

              <div className="mt-6 grid gap-4 sm:grid-cols-2">
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                    Assigned mechanic
                  </p>
                  <p className="mt-2 text-base font-semibold text-slate-900">
                    {workflow.job.assigned_mechanic_name || "Not assigned"}
                  </p>
                  <p className="mt-1 text-sm text-slate-600">
                    Linked to the staff account selected by operations.
                  </p>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                    Scheduled for
                  </p>
                  <p className="mt-2 text-base font-semibold text-slate-900">
                    {formatDateTime(workflow.job.scheduled_for)}
                  </p>
                  <p className="mt-1 text-sm text-slate-600">
                    Created {formatDateTime(workflow.job.created_at)}
                  </p>
                </div>
              </div>

              <div className="mt-5 rounded-3xl border border-slate-200 bg-slate-50 p-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-slate-900">
                      Checklist progress
                    </p>
                    <p className="text-xs text-slate-500">
                      {workflow.checklistTotals.completed} of{" "}
                      {workflow.checklistTotals.total} tasks completed
                    </p>
                  </div>
                  <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-slate-700 shadow-sm">
                    {completionPercent}%
                  </span>
                </div>
                <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-200">
                  <div
                    className="h-full rounded-full bg-emerald-500 transition-all"
                    style={{ width: `${completionPercent}%` }}
                  />
                </div>
              </div>
            </div>

            <div className="rounded-[1.75rem] border border-slate-200 bg-white p-5 shadow-[0_24px_80px_-48px_rgba(15,23,42,0.45)] sm:p-6">
              <div className="flex items-start gap-4">
                <div className="rounded-2xl bg-sky-50 p-3 text-sky-700">
                  <UserRound className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-sky-700">
                    {isClosedMechanicView ? "Completed Record" : "Customer + Vehicle"}
                  </p>
                  <h2 className="mt-1 text-xl font-semibold text-slate-950">
                    {isClosedMechanicView
                      ? workflow.booking.car_registration
                      : workflow.booking.full_name || "Customer"}
                  </h2>
                </div>
              </div>

              {isClosedMechanicView ? (
                <div className="mt-6 rounded-3xl border border-slate-200 bg-slate-50 p-4 text-sm leading-6 text-slate-700">
                  <div className="flex items-start gap-3">
                    <ShieldCheck className="mt-0.5 h-4 w-4 text-slate-500" />
                    <div>
                      <p className="font-semibold text-slate-900">
                        Customer details archived after completion
                      </p>
                      <p className="mt-1">
                        Contact details, address, and submitted images are only
                        available to ops and admin once the job is completed.
                      </p>
                    </div>
                  </div>
                  {vehicleSummary ? (
                    <p className="mt-4 text-sm text-slate-600">
                      Vehicle summary: {vehicleSummary}
                    </p>
                  ) : null}
                </div>
              ) : (
                <div className="mt-6 space-y-4 text-sm text-slate-700">
                  <div className="flex items-start gap-3">
                    <Phone className="mt-0.5 h-4 w-4 text-slate-500" />
                    <span>{workflow.booking.phone}</span>
                  </div>
                  <div className="flex items-start gap-3">
                    <CarFront className="mt-0.5 h-4 w-4 text-slate-500" />
                    <span>
                      {workflow.booking.car_registration}
                      {vehicleSummary ? ` - ${vehicleSummary}` : ""}
                    </span>
                  </div>
                </div>
              )}
            </div>

            {!isClosedMechanicView ? (
              <div className="space-y-3">
                <MechanicLocationCard
                  location={workflow.location}
                  status={locationStatus}
                  isRefreshing={isRefreshingLocation}
                />
                {canRetryLocationRefresh ? (
                  <div className="rounded-3xl border border-slate-200 bg-white p-4 text-sm text-slate-700 shadow-[0_24px_80px_-48px_rgba(15,23,42,0.45)]">
                    {locationRefreshError ? (
                      <div className="flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-amber-800">
                        <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                        <p>{locationRefreshError}</p>
                      </div>
                    ) : (
                      <p className="text-slate-600">
                        Map coordinates are still missing for this address. You
                        can try refreshing the location again.
                      </p>
                    )}
                    <button
                      type="button"
                      onClick={() => void handleRefreshLocation()}
                      disabled={isRefreshingLocation}
                      className="mt-4 inline-flex min-h-11 items-center justify-center gap-2 rounded-2xl border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <LoaderCircle
                        className={
                          isRefreshingLocation
                            ? "h-4 w-4 animate-spin"
                            : "hidden"
                        }
                      />
                      {isRefreshingLocation
                        ? "Refreshing map..."
                        : "Retry map location"}
                    </button>
                  </div>
                ) : null}
              </div>
            ) : null}
          </section>

          <section className="space-y-5">
            <div className="rounded-[1.75rem] border border-slate-200 bg-white p-5 shadow-[0_24px_80px_-48px_rgba(15,23,42,0.45)] sm:p-6">
              <div className="flex items-start gap-4">
                <div className="rounded-2xl bg-amber-50 p-3 text-amber-700">
                  <Wrench className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-amber-700">
                    Services To Perform
                  </p>
                  <h2 className="mt-1 text-xl font-semibold text-slate-950">
                    Work Order
                  </h2>
                  <p className="mt-2 text-sm text-slate-600">
                    Review the services and expected work before starting.
                  </p>
                </div>
              </div>

              <div className="mt-6 space-y-4">
                {workflow.services.map((service) => (
                  <div
                    key={service.id}
                    className="rounded-3xl border border-slate-200 bg-slate-50 p-4"
                  >
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                      <div>
                        <p className="text-base font-semibold text-slate-950">
                          {service.service_name}
                        </p>
                        {service.short_description ? (
                          <p className="mt-1 text-sm text-slate-600">
                            {service.short_description}
                          </p>
                        ) : null}
                      </div>
                      {service.labour_time ? (
                        <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-slate-700 shadow-sm">
                          {service.labour_time}
                        </span>
                      ) : null}
                    </div>

                    {service.parts_included.length > 0 ? (
                      <p className="mt-3 text-sm text-slate-600">
                        Parts: {service.parts_included.join(", ")}
                      </p>
                    ) : null}

                    <p className="mt-3 text-sm text-slate-500">
                      {
                        service.checklist_items.filter((item) => item.is_completed)
                          .length
                      }{" "}
                      of {service.checklist_items.length} checklist steps
                      completed
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {isReviewMode ? null : (
              <div className="rounded-[1.75rem] border border-slate-200 bg-white p-5 shadow-[0_24px_80px_-48px_rgba(15,23,42,0.45)] sm:p-6">
                <div className="flex items-start gap-4">
                  <div className="rounded-2xl bg-violet-50 p-3 text-violet-700">
                    <NotebookPen className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-violet-700">
                      Guided Workflow
                    </p>
                    <h2 className="mt-1 text-xl font-semibold text-slate-950">
                      Start the service
                    </h2>
                  </div>
                </div>

                <div className="mt-5 rounded-3xl border border-slate-200 bg-slate-50 p-4 text-sm leading-6 text-slate-700">
                  <p>
                    {isJobClosed
                      ? "This job is already closed, so the guided workflow is now read-only."
                      : workflow.checkIn.isSubmitted
                        ? "Check-in has already been submitted. Start will continue straight to the service checklist."
                        : "Start opens the vehicle check-in first. Once that is submitted, the next step becomes the service checklist."}
                  </p>
                  {workflow.job.ops_notes?.trim() ? (
                    <p className="mt-3 border-t border-slate-200 pt-3">
                      Ops note: {workflow.job.ops_notes}
                    </p>
                  ) : null}
                </div>

                <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center">
                  <button
                    type="button"
                    onClick={() => onStart?.(nextStep)}
                    disabled={isJobClosed || isWorkflowReadOnly}
                    className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-slate-950 px-5 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-500"
                  >
                    {isJobClosed ? "Job closed" : "Start"}
                    {!isJobClosed && !isWorkflowReadOnly ? (
                      <ChevronRight className="h-4 w-4" />
                    ) : null}
                  </button>
                  <p className="text-xs text-slate-500">
                    {workflow.checkIn.isSubmitted
                      ? "Next step: Service Checklist"
                      : "Next step: Vehicle Check-In"}
                  </p>
                </div>
              </div>
            )}

            <div className="rounded-[1.75rem] border border-slate-200 bg-white p-5 shadow-[0_24px_80px_-48px_rgba(15,23,42,0.45)] sm:p-6">
              <div className="flex items-start gap-4">
                <div className="rounded-2xl bg-emerald-50 p-3 text-emerald-700">
                  <ShieldCheck className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-700">
                    Pre-Work Check-In
                  </p>
                  <h2 className="mt-1 text-xl font-semibold text-slate-950">
                    Arrival inspection
                  </h2>
                </div>
              </div>

              {workflow.checkIn.isSubmitted ? (
                <>
                  <div className="mt-5 grid gap-4 sm:grid-cols-3">
                    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
                      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                        Submitted by
                      </p>
                      <p className="mt-2 font-semibold text-slate-900">
                        {workflow.checkIn.submittedBy || "Mechanic"}
                      </p>
                    </div>
                    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
                      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                        Submitted at
                      </p>
                      <p className="mt-2 font-semibold text-slate-900">
                        {formatDateTime(workflow.checkIn.submittedAt)}
                      </p>
                    </div>
                    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
                      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                        Vehicle condition
                      </p>
                      <p className="mt-2 font-semibold text-slate-900">
                        Meter reading:{" "}
                        {workflow.checkIn.odometerReading !== null
                          ? workflow.checkIn.odometerReading
                          : "Not set"}
                      </p>
                      <p className="mt-2 font-semibold text-slate-900">
                        Damage:{" "}
                        {workflow.checkIn.visibleDamage === null
                          ? "Not set"
                          : workflow.checkIn.visibleDamage
                            ? "Yes"
                            : "No"}
                      </p>
                      <p className="mt-1 font-semibold text-slate-900">
                        Warning lights:{" "}
                        {workflow.checkIn.warningLights === null
                          ? "Not set"
                          : workflow.checkIn.warningLights
                            ? "Yes"
                            : "No"}
                      </p>
                    </div>
                  </div>

                  {!isClosedMechanicView && workflow.checkIn.notes?.trim() ? (
                    <div className="mt-4 rounded-3xl border border-slate-200 bg-slate-50 p-4 text-sm leading-6 text-slate-700">
                      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                        Check-In Notes
                      </p>
                      <p className="mt-2">{workflow.checkIn.notes}</p>
                    </div>
                  ) : null}

                  {isClosedMechanicView ? (
                    <div className="mt-5 rounded-3xl border border-slate-200 bg-slate-50 p-4 text-sm leading-6 text-slate-700">
                      Submitted arrival images are archived after completion and
                      can only be reviewed by ops or admin.
                    </div>
                  ) : (
                    <div className="mt-5 grid gap-4 min-[460px]:grid-cols-2 xl:grid-cols-3">
                      {checkInPhotoLabels.map((photo) => {
                        const photoUrl = workflow.checkIn.photos[photo.key];

                        return (
                          <div
                            key={photo.key}
                            className="overflow-hidden rounded-3xl border border-slate-200 bg-slate-50"
                          >
                            <div className="border-b border-slate-200 px-4 py-3">
                              <p className="text-sm font-semibold text-slate-900">
                                {photo.label}
                              </p>
                            </div>
                            {photoUrl ? (
                              <button
                                type="button"
                                onClick={() =>
                                  setActivePhotoIndex(
                                    availableCheckInPhotos.findIndex(
                                      (availablePhoto) =>
                                        availablePhoto.label === photo.label &&
                                        availablePhoto.url === photoUrl,
                                    ),
                                  )
                                }
                                className="block w-full"
                              >
                                <img
                                  src={photoUrl}
                                  alt={`${photo.label} check-in`}
                                  className="aspect-[4/3] w-full object-cover transition hover:opacity-95"
                                />
                                <span className="block border-t border-slate-200 bg-white px-4 py-2 text-left text-xs font-medium text-slate-500">
                                  Tap to open
                                </span>
                              </button>
                            ) : (
                              <div className="flex aspect-[4/3] items-center justify-center px-4 text-center text-sm text-slate-500">
                                Photo not available
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </>
              ) : (
                <div className="mt-5 rounded-3xl border border-dashed border-slate-300 bg-slate-50 px-6 py-10 text-center">
                  <p className="text-base font-semibold text-slate-900">
                    Check-in not submitted yet
                  </p>
                  <p className="mt-2 text-sm text-slate-500">
                    Start the guided flow to open vehicle check-in first. Once
                    it is submitted, the checklist becomes the next step.
                  </p>
                </div>
              )}
            </div>
          </section>
        </div>
      </div>

      {activePhoto ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/90 p-4"
          onClick={() => setActivePhotoIndex(null)}
        >
          <div
            className="w-full max-w-5xl overflow-hidden rounded-[1.75rem] bg-white shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
              <div>
                <p className="text-sm font-semibold text-slate-900">
                  {activePhoto.label}
                </p>
                <p className="text-xs text-slate-500">
                  Arrival inspection photo
                </p>
              </div>
              <button
                type="button"
                onClick={() => setActivePhotoIndex(null)}
                className="rounded-xl border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700"
              >
                Close
              </button>
            </div>
            <div className="bg-slate-100">
              <img
                src={activePhoto.url}
                alt={activePhoto.label}
                className="max-h-[80vh] w-full object-contain"
              />
            </div>
            {availableCheckInPhotos.length > 1 ? (
              <div className="flex items-center justify-between gap-3 border-t border-slate-200 px-4 py-3">
                <button
                  type="button"
                  onClick={() =>
                    setActivePhotoIndex((currentIndex) => {
                      if (currentIndex === null) {
                        return currentIndex;
                      }

                      return currentIndex === 0
                        ? availableCheckInPhotos.length - 1
                        : currentIndex - 1;
                    })
                  }
                  className="inline-flex min-h-11 items-center justify-center gap-2 rounded-2xl border border-slate-300 px-4 text-sm font-semibold text-slate-700"
                >
                  <ChevronLeft className="h-4 w-4" />
                  Previous
                </button>
                <p className="text-xs font-medium text-slate-500">
                  {activePhotoIndex! + 1} of {availableCheckInPhotos.length}
                </p>
                <button
                  type="button"
                  onClick={() =>
                    setActivePhotoIndex((currentIndex) => {
                      if (currentIndex === null) {
                        return currentIndex;
                      }

                      return currentIndex === availableCheckInPhotos.length - 1
                        ? 0
                        : currentIndex + 1;
                    })
                  }
                  className="inline-flex min-h-11 items-center justify-center gap-2 rounded-2xl border border-slate-300 px-4 text-sm font-semibold text-slate-700"
                >
                  Next
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            ) : null}
          </div>
        </div>
      ) : null}
    </main>
  );
}

export default MechanicJobOverviewPage;
