import { useEffect, useMemo, useState } from "react";
import clsx from "clsx";
import {
  AlertCircle,
  BriefcaseBusiness,
  CalendarDays,
  CheckCircle2,
  ChevronRight,
  LoaderCircle,
  RefreshCw,
  ShieldCheck,
  UserRound,
} from "lucide-react";
import {
  fetchBookingAssignmentCandidates,
  reopenJobForOps,
  unassignJob,
  updateJob,
  type BookingAssignmentCandidate,
  type CreatedJob,
} from "../lib/jobs";
import { ensureBookingCoordinates } from "../lib/bookingLocation";
import { createJobWithServiceSnapshots } from "../lib/jobWorkflow";
import {
  fetchMechanicOptions,
  type MechanicOption,
} from "../lib/mechanics";
import {
  fetchVehicleCheckInPhotoPathsForJob,
  removeVehicleCheckInPhotos,
} from "../lib/vehicleCheckIns";

interface OpsAssignJobPageProps {
  onBackToDashboard?: () => void;
  onOpenProgressBoard?: () => void;
  onOpenJobOverview?: (
    job: CreatedJob,
    booking: BookingAssignmentCandidate,
  ) => void;
}

interface FormErrors {
  bookingId?: string;
  mechanicId?: string;
  reopenReason?: string;
}

interface LatestAssignment {
  action: "created" | "updated";
  job: CreatedJob;
  booking: BookingAssignmentCandidate;
  mechanicName: string;
  mechanicEmail: string;
}

function formatMechanicLabel(mechanic: MechanicOption): string {
  if (mechanic.full_name?.trim()) {
    return `${mechanic.full_name} (${mechanic.email})`;
  }

  return mechanic.email;
}

function formatBookingTime(timestamp: string): string {
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(timestamp));
}

function formatDateTimeLocalValue(value: string | null): string {
  if (!value) {
    return "";
  }

  const date = new Date(value);
  const offset = date.getTimezoneOffset();
  const localDate = new Date(date.getTime() - offset * 60_000);

  return localDate.toISOString().slice(0, 16);
}

function getAssignmentStatusMeta(booking: BookingAssignmentCandidate): {
  label: string;
  chipClassName: string;
  helperText: string;
} {
  if (!booking.existing_job) {
    return {
      label: "Ready for assignment",
      chipClassName: "bg-amber-100 text-amber-700",
      helperText: "No job has been created for this booking yet.",
    };
  }

  if (booking.existing_job.status === "completed") {
    return {
      label: "Completed",
      chipClassName: "bg-emerald-100 text-emerald-700",
      helperText: "This job is already completed and should stay assigned.",
    };
  }

  if (booking.existing_job.status === "cancelled") {
    return {
      label: "Cancelled",
      chipClassName: "bg-rose-100 text-rose-700",
      helperText: "This job was cancelled.",
    };
  }

  if (booking.existing_job.can_unassign) {
    return {
      label: "Assigned",
      chipClassName: "bg-sky-100 text-sky-700",
      helperText:
        "Safe to unassign because check-in and checklist work have not started.",
    };
  }

  return {
    label: "Started",
    chipClassName: "bg-slate-100 text-slate-700",
    helperText:
      "Work has already started, so this job should be reassigned carefully instead of unassigned.",
  };
}

function OpsAssignJobPage({
  onBackToDashboard,
  onOpenProgressBoard,
  onOpenJobOverview,
}: OpsAssignJobPageProps) {
  const [bookings, setBookings] = useState<BookingAssignmentCandidate[]>([]);
  const [mechanics, setMechanics] = useState<MechanicOption[]>([]);
  const [selectedBookingId, setSelectedBookingId] = useState("");
  const [selectedMechanicId, setSelectedMechanicId] = useState("");
  const [scheduledFor, setScheduledFor] = useState("");
  const [opsNotes, setOpsNotes] = useState("");
  const [reopenReason, setReopenReason] = useState("");
  const [resetWorkflowOnReopen, setResetWorkflowOnReopen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isMechanicsLoading, setIsMechanicsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [mechanicsLoadError, setMechanicsLoadError] = useState<string | null>(
    null,
  );
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [assignmentActionMessage, setAssignmentActionMessage] = useState<
    string | null
  >(null);
  const [errors, setErrors] = useState<FormErrors>({});
  const [latestAssignment, setLatestAssignment] = useState<LatestAssignment | null>(
    null,
  );
  const [unassigningJobId, setUnassigningJobId] = useState<string | null>(null);
  const [bookingTab, setBookingTab] = useState<"ready" | "assigned" | "closed">(
    "ready",
  );
  const [assignedJobsTab, setAssignedJobsTab] = useState<"assigned" | "started">(
    "assigned",
  );

  const selectedBooking = useMemo(
    () => bookings.find((booking) => booking.id === selectedBookingId) ?? null,
    [bookings, selectedBookingId],
  );
  const selectedMechanic = useMemo(
    () => mechanics.find((mechanic) => mechanic.id === selectedMechanicId) ?? null,
    [mechanics, selectedMechanicId],
  );
  const isEditingJob = Boolean(selectedBooking?.existing_job);
  const isSelectedJobClosed =
    selectedBooking?.existing_job?.status === "completed" ||
    selectedBooking?.existing_job?.status === "cancelled";
  const isReopenMode = Boolean(selectedBooking?.existing_job) && isSelectedJobClosed;
  const availableBookings = useMemo(
    () => bookings.filter((booking) => !booking.existing_job),
    [bookings],
  );
  const assignedBookings = useMemo(
    () => bookings.filter((booking) => Boolean(booking.existing_job)),
    [bookings],
  );
  const activeAssignedBookings = useMemo(
    () =>
      assignedBookings.filter(
        (booking) =>
          booking.existing_job?.status !== "completed" &&
          booking.existing_job?.status !== "cancelled",
      ),
    [assignedBookings],
  );
  const safelyAssignedBookings = useMemo(
    () =>
      activeAssignedBookings.filter((booking) => booking.existing_job?.can_unassign),
    [activeAssignedBookings],
  );
  const startedAssignedBookings = useMemo(
    () =>
      activeAssignedBookings.filter((booking) => !booking.existing_job?.can_unassign),
    [activeAssignedBookings],
  );
  const closedBookings = useMemo(
    () =>
      assignedBookings.filter(
        (booking) =>
          booking.existing_job?.status === "completed" ||
          booking.existing_job?.status === "cancelled",
      ),
    [assignedBookings],
  );
  const bookingTabItems = useMemo(() => {
    if (bookingTab === "assigned") {
      return activeAssignedBookings;
    }

    if (bookingTab === "closed") {
      return closedBookings;
    }

    return availableBookings;
  }, [activeAssignedBookings, availableBookings, bookingTab, closedBookings]);
  const assignedPreviewBookings = useMemo(
    () =>
      (assignedJobsTab === "assigned"
        ? safelyAssignedBookings
        : startedAssignedBookings
      ).slice(0, 5),
    [assignedJobsTab, safelyAssignedBookings, startedAssignedBookings],
  );

  const loadBookings = async () => {
    try {
      setIsLoading(true);
      setLoadError(null);

      const candidates = await fetchBookingAssignmentCandidates();

      setBookings(candidates);
      setSelectedBookingId((currentValue) => {
        if (currentValue && candidates.some((booking) => booking.id === currentValue)) {
          return currentValue;
        }

        return candidates.find((booking) => !booking.existing_job)?.id ?? "";
      });
    } catch (error) {
      setLoadError(
        error instanceof Error
          ? error.message
          : "Unable to load bookings for assignment.",
      );
    } finally {
      setIsLoading(false);
    }
  };

  const loadMechanics = async () => {
    try {
      setIsMechanicsLoading(true);
      setMechanicsLoadError(null);

      const nextMechanics = await fetchMechanicOptions();

      setMechanics(nextMechanics);
      setSelectedMechanicId((currentValue) =>
        nextMechanics.some((mechanic) => mechanic.id === currentValue)
          ? currentValue
          : "",
      );
    } catch (error) {
      setMechanics([]);
      setMechanicsLoadError(
        error instanceof Error
          ? error.message
          : "Unable to load mechanics for assignment.",
      );
    } finally {
      setIsMechanicsLoading(false);
    }
  };

  useEffect(() => {
    void loadBookings();
    void loadMechanics();
  }, []);

  useEffect(() => {
    if (!selectedBooking) {
      setReopenReason("");
      setResetWorkflowOnReopen(false);
      return;
    }

    if (selectedBooking.existing_job) {
      setSelectedMechanicId(
        selectedBooking.existing_job.assigned_mechanic_user_id ?? "",
      );
      setScheduledFor(
        formatDateTimeLocalValue(selectedBooking.existing_job.scheduled_for),
      );
      setOpsNotes(selectedBooking.existing_job.ops_notes ?? "");
      setReopenReason("");
      setResetWorkflowOnReopen(false);
      setErrors({});
      return;
    }

    setScheduledFor("");
    setOpsNotes("");
    setReopenReason("");
    setResetWorkflowOnReopen(false);
  }, [selectedBookingId, selectedBooking]);

  const validateForm = (): FormErrors => {
    const nextErrors: FormErrors = {};

    if (!selectedBookingId) {
      nextErrors.bookingId = "Choose a booking to assign.";
    }

    if (!selectedMechanicId) {
      nextErrors.mechanicId = "Choose a mechanic to assign.";
    }

    return nextErrors;
  };

  const resetAssignmentForm = (nextBookingId = "") => {
    setSelectedBookingId(nextBookingId);
    setSelectedMechanicId("");
    setScheduledFor("");
    setOpsNotes("");
    setReopenReason("");
    setResetWorkflowOnReopen(false);
    setErrors({});
  };

  const handleAssignJob = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (isSubmitting) {
      return;
    }

    if (isReopenMode) {
      if (!selectedBooking?.existing_job) {
        setSubmitError("Select a closed job before reopening it.");
        return;
      }

      if (!reopenReason.trim()) {
        setErrors({
          reopenReason: "Add a short reason before reopening the job.",
        });
        setSubmitError("Add a reason before reopening the job.");
        return;
      }

      let savedPhotoPaths: string[] = [];
      let cleanupNote = "";

      try {
        setIsSubmitting(true);
        setSubmitError(null);
        setAssignmentActionMessage(null);
        setLatestAssignment(null);

        if (resetWorkflowOnReopen) {
          savedPhotoPaths = await fetchVehicleCheckInPhotoPathsForJob(
            selectedBooking.existing_job.id,
          );
        }

        await reopenJobForOps(selectedBooking.existing_job.id, {
          reason: reopenReason.trim(),
          reset_workflow: resetWorkflowOnReopen,
        });

        if (resetWorkflowOnReopen && savedPhotoPaths.length > 0) {
          try {
            await removeVehicleCheckInPhotos(savedPhotoPaths);
          } catch (cleanupError) {
            cleanupNote =
              " Saved check-in photos could not be removed automatically and may need manual cleanup in storage.";
            console.error(
              "Failed to remove saved vehicle check-in photos after reopening",
              cleanupError,
            );
          }
        }

        await loadBookings();
        setBookingTab("assigned");
        setSelectedBookingId(selectedBooking.id);
        setAssignmentActionMessage(
          resetWorkflowOnReopen
            ? `Job reopened and mechanic workflow was reset.${cleanupNote} You can now update the assignment details on the right.`
            : `Job reopened with its saved workflow history intact.${cleanupNote} You can now review the assignment details on the right.`,
        );
        setErrors({});
      } catch (error) {
        setSubmitError(
          error instanceof Error
            ? error.message
            : "Failed to reopen the job.",
        );
      } finally {
        setIsSubmitting(false);
      }

      return;
    }

    const nextErrors = validateForm();
    setErrors(nextErrors);

    if (
      nextErrors.bookingId ||
      nextErrors.mechanicId
    ) {
      setSubmitError(
        isEditingJob
          ? "Complete the mechanic details before updating the job."
          : "Complete the booking and mechanic details before creating the job.",
      );
      return;
    }

    if (!selectedBooking) {
      setSubmitError("Select a valid booking before assigning a job.");
      return;
    }

    if (selectedBooking.existing_job && isSelectedJobClosed) {
      setSubmitError("Closed jobs should stay read-only in this assignment flow.");
      return;
    }

    if (!selectedMechanic) {
      setSubmitError("Select a valid mechanic before assigning a job.");
      return;
    }

    try {
      setIsSubmitting(true);
      setSubmitError(null);
      setAssignmentActionMessage(null);

      const selectedBookingSnapshot = selectedBooking;
      const assignedMechanicName =
        selectedMechanic.full_name?.trim() || selectedMechanic.email;

      let locationMessage: string | null = null;
      let job: CreatedJob;

      if (selectedBookingSnapshot.existing_job) {
        job = await updateJob(selectedBookingSnapshot.existing_job.id, {
          assigned_mechanic_user_id: selectedMechanic.id,
          assigned_mechanic_name: assignedMechanicName,
          assigned_mechanic_phone: null,
          scheduled_for: scheduledFor || null,
          ops_notes: opsNotes.trim() || null,
        });
        locationMessage =
          "Job details were updated. Existing check-in and checklist history stay attached to this job.";
      } else {
        try {
          const ensuredCoordinates = await ensureBookingCoordinates(
            selectedBookingSnapshot.id,
          );

          if (ensuredCoordinates.source === "geocoded") {
            locationMessage =
              "Customer location was saved and will be available on the mechanic map.";
          } else if (ensuredCoordinates.source === "missing") {
            locationMessage =
              "Job created, but map coordinates could not be saved yet. The mechanic will still see the address and Google Maps link.";
          }
        } catch (error) {
          console.error("Failed to prepare booking coordinates", error);
          locationMessage =
            "Job created, but live map coordinates could not be refreshed right now. The mechanic will still see the address and Google Maps link.";
        }

        job = await createJobWithServiceSnapshots(
          {
            booking_id: selectedBookingSnapshot.id,
            assigned_mechanic_user_id: selectedMechanic.id,
            assigned_mechanic_name: assignedMechanicName,
            assigned_mechanic_phone: null,
            scheduled_for: scheduledFor || null,
            ops_notes: opsNotes.trim() || null,
          },
          selectedBookingSnapshot.selected_services,
        );
      }

      const updatedBookings = bookings.map((booking) =>
        booking.id === selectedBookingSnapshot.id
          ? {
              ...booking,
              existing_job: {
                ...job,
                has_check_in:
                  booking.existing_job?.has_check_in ?? false,
                total_checklist_items:
                  booking.existing_job?.total_checklist_items ?? 0,
                completed_checklist_items:
                  booking.existing_job?.completed_checklist_items ?? 0,
                can_unassign:
                  booking.existing_job?.can_unassign ?? true,
              },
            }
          : booking,
      );

      setLatestAssignment({
        action: selectedBookingSnapshot.existing_job ? "updated" : "created",
        job,
        booking: selectedBookingSnapshot,
        mechanicName: assignedMechanicName,
        mechanicEmail: selectedMechanic.email,
      });
      setBookings(updatedBookings);

      if (selectedBookingSnapshot.existing_job) {
        setSelectedBookingId(selectedBookingSnapshot.id);
      } else {
        const nextBookingId =
          updatedBookings.find((booking) => !booking.existing_job)?.id ?? "";

        resetAssignmentForm(nextBookingId);
      }
      setAssignmentActionMessage(locationMessage);
    } catch (error) {
      setSubmitError(
        error instanceof Error
          ? error.message
          : isEditingJob
            ? "Failed to update the job."
            : "Failed to assign the job.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUnassignJob = async (booking: BookingAssignmentCandidate) => {
    if (
      !booking.existing_job ||
      !booking.existing_job.can_unassign ||
      unassigningJobId
    ) {
      return;
    }

    try {
      setUnassigningJobId(booking.existing_job.id);
      setSubmitError(null);
      setAssignmentActionMessage(null);

      await unassignJob(booking.existing_job.id);

      setBookings((currentBookings) =>
        currentBookings.map((currentBooking) =>
          currentBooking.id === booking.id
            ? {
                ...currentBooking,
                existing_job: null,
              }
            : currentBooking,
        ),
      );
      setLatestAssignment((currentAssignment) =>
        currentAssignment?.job.id === booking.existing_job?.id
          ? null
          : currentAssignment,
      );
      setSelectedBookingId((currentValue) => currentValue || booking.id);
      setAssignmentActionMessage(
        `${booking.booking_number} is back in the unassigned pool and can be assigned again.`,
      );
    } catch (error) {
      setSubmitError(
        error instanceof Error ? error.message : "Failed to unassign the job.",
      );
    } finally {
      setUnassigningJobId(null);
    }
  };

  const openJobOverview = () => {
    if (latestAssignment && onOpenJobOverview) {
      onOpenJobOverview(latestAssignment.job, latestAssignment.booking);
    }
  };

  const openAssignedJobOverview = (booking: BookingAssignmentCandidate) => {
    if (booking.existing_job && onOpenJobOverview) {
      onOpenJobOverview(booking.existing_job, booking);
    }
  };

  const openJobForEditing = (booking: BookingAssignmentCandidate) => {
    if (!booking.existing_job) {
      return;
    }

    setBookingTab("assigned");
    setSelectedBookingId(booking.id);
    setSelectedMechanicId(booking.existing_job.assigned_mechanic_user_id ?? "");
    setScheduledFor(formatDateTimeLocalValue(booking.existing_job.scheduled_for));
    setOpsNotes(booking.existing_job.ops_notes ?? "");
    setErrors({});
    setSubmitError(null);
    setAssignmentActionMessage(null);
  };

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(59,130,246,0.10),_transparent_28%),linear-gradient(180deg,_#f8fafc_0%,_#eef3f8_100%)] px-4 py-6 sm:px-6 sm:py-8">
      <div className="mx-auto max-w-6xl">
        <header className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <span className="inline-flex rounded-full bg-slate-900 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-white">
              Operations
            </span>
            <h1 className="mt-3 text-3xl font-semibold tracking-tight text-slate-950">
              Assign Job
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
              Pick a confirmed booking, assign a mechanic, and create the job
              reference that will be used for field check-in.
            </p>
          </div>

          <button
            type="button"
            onClick={onBackToDashboard}
            className="inline-flex min-h-11 items-center justify-center rounded-2xl border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-700"
          >
            Back to dashboard
          </button>
        </header>

        <div className="grid gap-5 lg:grid-cols-[1.2fr_0.8fr]">
          <section className="rounded-[1.75rem] border border-slate-200 bg-white p-5 shadow-[0_24px_80px_-48px_rgba(15,23,42,0.45)] sm:p-6">
            <div className="mb-5 flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-sky-700">
                  Step 1
                </p>
                <h2 className="mt-1 text-xl font-semibold text-slate-950">
                  Booking queue
                </h2>
                <p className="mt-2 text-sm text-slate-600">
                  Switch between ready, active, and closed bookings without
                  leaving the ops assignment page.
                </p>
              </div>
              <button
                type="button"
                onClick={() => void loadBookings()}
                disabled={isLoading}
                className="inline-flex min-h-10 items-center justify-center gap-2 rounded-2xl border border-slate-300 px-4 text-sm font-semibold text-slate-700 disabled:opacity-50"
              >
                <RefreshCw
                  className={clsx("h-4 w-4", isLoading && "animate-spin")}
                />
                Refresh
              </button>
            </div>

            {loadError ? (
              <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                {loadError}
              </div>
            ) : null}

            {!isLoading ? (
              <div className="mb-5 flex flex-wrap gap-2">
                {[
                  {
                    key: "ready" as const,
                    label: "Ready",
                    count: availableBookings.length,
                  },
                  {
                    key: "assigned" as const,
                    label: "Assigned / Started",
                    count: activeAssignedBookings.length,
                  },
                  {
                    key: "closed" as const,
                    label: "Closed",
                    count: closedBookings.length,
                  },
                ].map((tab) => (
                  <button
                    key={tab.key}
                    type="button"
                    onClick={() => setBookingTab(tab.key)}
                    className={clsx(
                      "inline-flex min-h-11 items-center gap-2 rounded-2xl border px-4 text-sm font-semibold transition",
                      bookingTab === tab.key
                        ? "border-slate-900 bg-slate-900 text-white"
                        : "border-slate-300 bg-white text-slate-700 hover:border-slate-400",
                    )}
                  >
                    <span>{tab.label}</span>
                    <span
                      className={clsx(
                        "rounded-full px-2.5 py-0.5 text-xs",
                        bookingTab === tab.key
                          ? "bg-white/15 text-white"
                          : "bg-slate-100 text-slate-600",
                      )}
                    >
                      {tab.count}
                    </span>
                  </button>
                ))}
              </div>
            ) : null}

            {isLoading ? (
              <div className="flex min-h-64 items-center justify-center rounded-3xl border border-dashed border-slate-300 bg-slate-50">
                <div className="flex items-center gap-3 text-sm font-medium text-slate-600">
                  <LoaderCircle className="h-4 w-4 animate-spin" />
                  Loading bookings...
                </div>
              </div>
            ) : bookings.length === 0 ? (
              <div className="rounded-3xl border border-dashed border-slate-300 bg-slate-50 px-6 py-12 text-center">
                <p className="text-base font-semibold text-slate-900">
                  No bookings found
                </p>
                <p className="mt-2 text-sm text-slate-500">
                  Once customers submit bookings, they will appear here for ops
                  assignment.
                </p>
              </div>
            ) : bookingTabItems.length === 0 ? (
              <div className="rounded-3xl border border-dashed border-slate-300 bg-slate-50 px-6 py-12 text-center">
                <p className="text-base font-semibold text-slate-900">
                  {bookingTab === "ready"
                    ? "No bookings ready for assignment"
                    : bookingTab === "assigned"
                      ? "No active assigned jobs"
                      : "No closed jobs yet"}
                </p>
                <p className="mt-2 text-sm text-slate-500">
                  {bookingTab === "ready"
                    ? "New customer bookings will appear here when they are ready for ops."
                    : bookingTab === "assigned"
                      ? "Assigned and started jobs will appear here for quick ops review."
                      : "Completed or cancelled jobs will appear here once they move out of active work."}
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {bookingTabItems.map((booking) => {
                  const isAssigned = Boolean(booking.existing_job);
                  const isSelected = selectedBookingId === booking.id;
                  const assignmentMeta = getAssignmentStatusMeta(booking);
                  const isSelectable = bookingTab === "ready" || isAssigned;

                  return (
                    <button
                      key={booking.id}
                      type="button"
                      disabled={!isSelectable}
                      onClick={() => {
                        if (!isSelectable) {
                          return;
                        }

                        setSelectedBookingId(booking.id);
                        setErrors((currentErrors) => ({
                          ...currentErrors,
                          bookingId: undefined,
                        }));
                        setSubmitError(null);
                        setAssignmentActionMessage(null);
                      }}
                      className={clsx(
                        "w-full rounded-3xl border p-4 text-left transition",
                        !isSelectable
                          ? "cursor-not-allowed border-slate-200 bg-slate-100 opacity-80"
                          : isSelected
                            ? "border-sky-300 bg-sky-50 shadow-sm"
                            : "border-slate-200 bg-white hover:border-slate-300",
                      )}
                    >
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                        <div>
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="rounded-full bg-slate-900 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-white">
                              {booking.booking_number}
                            </span>
                            {isAssigned ? (
                              <span className="rounded-full bg-emerald-100 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-emerald-700">
                                {booking.existing_job?.job_reference}
                              </span>
                            ) : null}
                            <span
                              className={clsx(
                                "rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em]",
                                assignmentMeta.chipClassName,
                              )}
                            >
                              {assignmentMeta.label}
                            </span>
                          </div>
                          <p className="mt-3 text-base font-semibold text-slate-950">
                            {booking.full_name}
                          </p>
                          <p className="mt-1 text-sm text-slate-600">
                            {booking.car_registration} • {booking.email}
                          </p>
                          <p className="mt-1 text-xs text-slate-500">
                            Booked {formatBookingTime(booking.created_at)}
                          </p>
                          <p className="mt-2 text-xs text-slate-500">
                            {assignmentMeta.helperText}
                          </p>
                          {bookingTab === "assigned" ? (
                            <p className="mt-2 text-xs font-medium text-sky-700">
                              Select this job to edit assignment details on the right.
                            </p>
                          ) : null}
                          {bookingTab === "closed" ? (
                            <p className="mt-2 text-xs font-medium text-slate-600">
                              Select this job to review it or reopen it with a
                              reason.
                            </p>
                          ) : null}
                        </div>

                        <div className="text-sm text-slate-600 sm:text-right">
                          <p className="font-semibold text-slate-900">
                            £{booking.total_price.toFixed(2)}
                          </p>
                          <p className="mt-1">
                            {booking.selected_services.length} service
                            {booking.selected_services.length === 1 ? "" : "s"}
                          </p>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </section>

          <section className="rounded-[1.75rem] border border-slate-200 bg-white p-5 shadow-[0_24px_80px_-48px_rgba(15,23,42,0.45)] sm:p-6">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-700">
                Step 2
              </p>
              <h2 className="mt-1 text-xl font-semibold text-slate-950">
                {isReopenMode
                  ? "Reopen job"
                  : isEditingJob
                    ? "Edit job"
                    : "Assign mechanic"}
              </h2>
              <p className="mt-2 text-sm text-slate-600">
                {isReopenMode
                  ? "Closed jobs stay read-only by default. Reopen with a reason before making any more changes."
                  : isEditingJob
                  ? "Update the assigned mechanic, schedule, or ops notes for an active job."
                  : "Create a job only when the booking is ready for operations."}
              </p>
            </div>

            <form
              onSubmit={handleAssignJob}
              noValidate
              className="mt-6 space-y-4"
            >
              <label className="space-y-2">
                <span className="text-sm font-semibold text-slate-900">
                  {isReopenMode
                    ? "Selected closed job"
                    : isEditingJob
                      ? "Editing job"
                      : "Selected booking"}
                </span>
                <select
                  value={selectedBookingId}
                  onChange={(event) => {
                    setSelectedBookingId(event.target.value);
                    setErrors((currentErrors) => ({
                      ...currentErrors,
                      bookingId: undefined,
                    }));
                  }}
                  className={clsx(
                    "min-h-12 w-full rounded-2xl border bg-slate-50 px-4 text-sm text-slate-900 outline-none transition focus:bg-white focus:ring-4",
                    errors.bookingId
                      ? "border-rose-300 focus:border-rose-400 focus:ring-rose-100"
                      : "border-slate-200 focus:border-sky-400 focus:ring-sky-100",
                  )}
                >
                  <option value="">Select a booking</option>
                  {(isEditingJob
                    ? bookings.filter(
                        (booking) =>
                          booking.id === selectedBookingId || !booking.existing_job,
                      )
                    : availableBookings
                  ).map((booking) => (
                    <option key={booking.id} value={booking.id}>
                      {booking.booking_number} - {booking.full_name}
                    </option>
                  ))}
                </select>
                {errors.bookingId ? (
                  <p className="flex items-center gap-2 text-sm text-rose-600">
                    <AlertCircle className="h-4 w-4" />
                    {errors.bookingId}
                  </p>
                ) : null}
                {isReopenMode ? (
                  <p className="text-xs text-slate-500">
                    Closed jobs can be reopened here with a reason. Once
                    reopened, the normal edit form comes back for assignment
                    changes.
                  </p>
                ) : isEditingJob ? (
                  <p className="text-xs text-slate-500">
                    Active jobs can be edited here for mechanic, schedule, and
                    ops notes. Completed or cancelled jobs stay read-only.
                  </p>
                ) : null}
              </label>

              {selectedBooking ? (
                <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
                  <p className="font-semibold text-slate-900">
                    {selectedBooking.existing_job?.job_reference
                      ? `${selectedBooking.existing_job.job_reference} - ${selectedBooking.booking_number}`
                      : selectedBooking.booking_number}
                  </p>
                  <p className="mt-1">{selectedBooking.full_name}</p>
                  <p className="mt-1">{selectedBooking.car_registration}</p>
                  {isReopenMode ? (
                    <p className="mt-2 text-xs text-slate-500">
                      Reopening keeps control with ops/admin. Use the reason
                      below so the team knows why this closed job is being
                      opened again.
                    </p>
                  ) : isEditingJob ? (
                    <p className="mt-2 text-xs text-slate-500">
                      This edit mode updates assignment details only. Existing
                      check-in and checklist history stay attached to this job.
                    </p>
                  ) : null}
                  {isEditingJob && !selectedBooking.existing_job?.can_unassign ? (
                    <p className="mt-2 text-xs font-medium text-amber-700">
                      Work has already started, so use this form to manage the
                      assignment instead of unassigning the job.
                    </p>
                  ) : null}
                  {selectedBooking.existing_job && onOpenJobOverview ? (
                    <button
                      type="button"
                      onClick={() =>
                        onOpenJobOverview(
                          selectedBooking.existing_job!,
                          selectedBooking,
                        )
                      }
                      className="mt-4 inline-flex min-h-10 items-center justify-center rounded-2xl border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-700"
                    >
                      Open Job Overview
                    </button>
                  ) : null}
                </div>
              ) : null}

              {isReopenMode ? (
                <>
                  <label className="space-y-2">
                    <span className="text-sm font-semibold text-slate-900">
                      Reopen reason
                    </span>
                    <textarea
                      value={reopenReason}
                      onChange={(event) => {
                        setReopenReason(event.target.value);
                        setErrors((currentErrors) => ({
                          ...currentErrors,
                          reopenReason: undefined,
                        }));
                        setSubmitError(null);
                      }}
                      rows={4}
                      placeholder="Explain why this completed or cancelled job needs to be reopened."
                      className={clsx(
                        "w-full rounded-2xl border bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:bg-white focus:ring-4",
                        errors.reopenReason
                          ? "border-rose-300 focus:border-rose-400 focus:ring-rose-100"
                          : "border-slate-200 focus:border-sky-400 focus:ring-sky-100",
                      )}
                    />
                    {errors.reopenReason ? (
                      <p className="flex items-center gap-2 text-sm text-rose-600">
                        <AlertCircle className="h-4 w-4" />
                        {errors.reopenReason}
                      </p>
                    ) : (
                      <p className="text-xs text-slate-500">
                        Keep this short but specific so the team knows why the
                        closed job is being reopened.
                      </p>
                    )}
                  </label>

                  <label className="flex items-start gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4 text-sm text-slate-700">
                    <input
                      type="checkbox"
                      checked={resetWorkflowOnReopen}
                      onChange={(event) =>
                        setResetWorkflowOnReopen(event.target.checked)
                      }
                      className="mt-1 h-4 w-4 rounded border-slate-300 text-slate-900 focus:ring-slate-300"
                    />
                    <span>
                      <span className="block font-semibold text-slate-900">
                        Reset mechanic workflow for reassignment
                      </span>
                      <span className="mt-1 block text-slate-600">
                        Use this when a job was completed by mistake or needs to
                        be handed to another mechanic. Saved check-in and
                        checklist progress will be cleared so the job can start
                        again cleanly.
                      </span>
                    </span>
                  </label>

                  <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
                    Closed jobs stay protected by default. Reopening creates an
                    explicit ops/admin audit step before any more changes are
                    made.
                  </div>
                </>
              ) : (
                <>
                  <label className="space-y-2">
                    <span className="flex items-center gap-2 text-sm font-semibold text-slate-900">
                      <UserRound className="h-4 w-4 text-slate-500" />
                      Mechanic
                    </span>
                    <select
                      value={selectedMechanicId}
                      onChange={(event) => {
                        setSelectedMechanicId(event.target.value);
                        setErrors((currentErrors) => ({
                          ...currentErrors,
                          mechanicId: undefined,
                        }));
                        setSubmitError(null);
                      }}
                      disabled={isMechanicsLoading || mechanics.length === 0}
                      className={clsx(
                        "min-h-12 w-full rounded-2xl border bg-slate-50 px-4 text-sm text-slate-900 outline-none transition focus:bg-white focus:ring-4 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400",
                        errors.mechanicId
                          ? "border-rose-300 focus:border-rose-400 focus:ring-rose-100"
                          : "border-slate-200 focus:border-sky-400 focus:ring-sky-100",
                      )}
                    >
                      <option value="">
                        {isMechanicsLoading
                          ? "Loading mechanics..."
                          : mechanics.length === 0
                            ? "No mechanics available"
                            : "Select a mechanic"}
                      </option>
                      {mechanics.map((mechanic) => (
                        <option key={mechanic.id} value={mechanic.id}>
                          {formatMechanicLabel(mechanic)}
                        </option>
                      ))}
                    </select>
                    {selectedMechanic ? (
                      <p className="text-sm text-slate-500">
                        Assigning to {formatMechanicLabel(selectedMechanic)}
                      </p>
                    ) : null}
                    {errors.mechanicId ? (
                      <p className="flex items-center gap-2 text-sm text-rose-600">
                        <AlertCircle className="h-4 w-4" />
                        {errors.mechanicId}
                      </p>
                    ) : null}
                  </label>

                  <label className="space-y-2">
                    <span className="flex items-center gap-2 text-sm font-semibold text-slate-900">
                      <AlertCircle className="h-4 w-4 text-slate-500" />
                      Assignment note
                    </span>
                    <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
                      Ops now assigns jobs to a real mechanic account instead of a
                      typed name and phone number.
                    </div>
                  </label>

                  <label className="space-y-2">
                    <span className="flex items-center gap-2 text-sm font-semibold text-slate-900">
                      <CalendarDays className="h-4 w-4 text-slate-500" />
                      Scheduled for
                      <span className="text-xs font-medium uppercase tracking-[0.14em] text-slate-400">
                        Optional
                      </span>
                    </span>
                    <input
                      type="datetime-local"
                      value={scheduledFor}
                      onChange={(event) => setScheduledFor(event.target.value)}
                      className="min-h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm text-slate-900 outline-none transition focus:border-sky-400 focus:bg-white focus:ring-4 focus:ring-sky-100"
                    />
                  </label>

                  <label className="space-y-2">
                    <span className="text-sm font-semibold text-slate-900">
                      Ops notes
                      <span className="ml-2 text-xs font-medium uppercase tracking-[0.14em] text-slate-400">
                        Optional
                      </span>
                    </span>
                    <textarea
                      value={opsNotes}
                      onChange={(event) => setOpsNotes(event.target.value)}
                      rows={4}
                      placeholder="Add access notes, parts notes, or service instructions for the mechanic."
                      className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-sky-400 focus:bg-white focus:ring-4 focus:ring-sky-100"
                    />
                  </label>
                </>
              )}

              {submitError ? (
                <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                  {submitError}
                </div>
              ) : null}

              {mechanicsLoadError ? (
                <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                  {mechanicsLoadError}
                </div>
              ) : null}

              {assignmentActionMessage ? (
                <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
                  {assignmentActionMessage}
                </div>
              ) : null}

              <button
                type="submit"
                disabled={
                  isSubmitting ||
                  !selectedBookingId ||
                  (isReopenMode
                    ? !reopenReason.trim()
                    : isMechanicsLoading ||
                      mechanics.length === 0 ||
                      !selectedMechanicId ||
                      isSelectedJobClosed)
                }
                className={clsx(
                  "inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl px-5 text-sm font-semibold transition",
                  !isSubmitting &&
                    selectedBookingId &&
                    (isReopenMode
                      ? Boolean(reopenReason.trim())
                      : Boolean(selectedMechanicId) && !isSelectedJobClosed)
                    ? "bg-slate-950 text-white hover:bg-slate-800"
                    : "cursor-not-allowed bg-slate-200 text-slate-500",
                )}
              >
                {isSubmitting ? (
                  <>
                    <LoaderCircle className="h-4 w-4 animate-spin" />
                    {isReopenMode
                      ? "Reopening job..."
                      : isEditingJob
                        ? "Updating job..."
                        : "Creating job..."}
                  </>
                ) : (
                  <>
                    {isReopenMode
                      ? "Reopen job"
                      : isEditingJob
                        ? "Update job"
                        : "Create job"}
                    <ChevronRight className="h-4 w-4" />
                  </>
                )}
              </button>
            </form>

            {latestAssignment ? (
              <div className="mt-6 rounded-3xl border border-emerald-200 bg-emerald-50 p-5">
                <div className="flex items-start gap-3">
                  <div className="rounded-2xl bg-white p-2.5 text-emerald-700 shadow-sm">
                    <ShieldCheck className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-emerald-800">
                      {latestAssignment.action === "updated"
                        ? "Job updated successfully"
                        : "Job created successfully"}
                    </p>
                    <p className="mt-2 text-2xl font-semibold text-slate-950">
                      {latestAssignment.job.job_reference}
                    </p>
                    <p className="mt-2 text-sm text-slate-600">
                      Linked to {latestAssignment.booking.booking_number} for{" "}
                      {latestAssignment.booking.full_name}.
                    </p>
                  </div>
                </div>

                <div className="mt-5 grid gap-3 sm:grid-cols-2">
                  <div className="rounded-2xl bg-white px-4 py-3 text-sm text-slate-700 shadow-sm">
                    <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                      Assigned mechanic
                    </p>
                    <p className="mt-2 font-semibold text-slate-900">
                      {latestAssignment.mechanicName}
                    </p>
                    <p className="mt-1">{latestAssignment.mechanicEmail}</p>
                  </div>
                  <div className="rounded-2xl bg-white px-4 py-3 text-sm text-slate-700 shadow-sm">
                    <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                      Booking
                    </p>
                    <p className="mt-2 font-semibold text-slate-900">
                      {latestAssignment.booking.booking_number}
                    </p>
                    <p className="mt-1">
                      {latestAssignment.booking.car_registration}
                    </p>
                  </div>
                </div>

                <div className="mt-5 flex flex-col gap-3 sm:flex-row">
                  <button
                    type="button"
                    onClick={openJobOverview}
                    className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-slate-950 px-5 text-sm font-semibold text-white"
                  >
                    <BriefcaseBusiness className="h-4 w-4" />
                    Open Job Overview
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setLatestAssignment(null);
                    }}
                    className="inline-flex min-h-12 items-center justify-center rounded-2xl border border-slate-300 bg-white px-5 text-sm font-semibold text-slate-700"
                  >
                    {latestAssignment.action === "updated"
                      ? "Continue managing jobs"
                      : "Assign another job"}
                  </button>
                </div>
              </div>
            ) : null}

            {activeAssignedBookings.length > 0 ? (
              <div className="mt-6 rounded-3xl border border-slate-200 bg-slate-50 p-4">
                <div className="flex items-start gap-3">
                  <BriefcaseBusiness className="mt-0.5 h-4 w-4 text-slate-500" />
                  <div className="w-full">
                    <div className="flex flex-col gap-3">
                      <div>
                        <p className="text-sm font-semibold text-slate-900">
                          Manage assigned jobs
                        </p>
                        <p className="mt-1 text-sm text-slate-600">
                          Safe unassign is only available before check-in or
                          checklist progress starts.
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={onOpenProgressBoard}
                        className="inline-flex min-h-11 w-full items-center justify-center rounded-2xl border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-700 sm:w-auto sm:self-start sm:whitespace-nowrap"
                      >
                        Open full progress board
                      </button>
                    </div>

                    <div className="mt-4 flex flex-wrap gap-2">
                      {[
                        {
                          key: "assigned" as const,
                          label: "Assigned",
                          count: safelyAssignedBookings.length,
                        },
                        {
                          key: "started" as const,
                          label: "Started",
                          count: startedAssignedBookings.length,
                        },
                      ].map((tab) => (
                        <button
                          key={tab.key}
                          type="button"
                          onClick={() => setAssignedJobsTab(tab.key)}
                          className={clsx(
                            "inline-flex min-h-10 items-center gap-2 rounded-2xl border px-4 text-sm font-semibold transition",
                            assignedJobsTab === tab.key
                              ? "border-slate-900 bg-slate-900 text-white"
                              : "border-slate-300 bg-white text-slate-700 hover:border-slate-400",
                          )}
                        >
                          <span>{tab.label}</span>
                          <span
                            className={clsx(
                              "rounded-full px-2.5 py-0.5 text-xs",
                              assignedJobsTab === tab.key
                                ? "bg-white/15 text-white"
                                : "bg-slate-100 text-slate-600",
                            )}
                          >
                            {tab.count}
                          </span>
                        </button>
                      ))}
                    </div>

                    <div className="mt-4 space-y-3">
                      {assignedPreviewBookings.map((booking) => {
                        const job = booking.existing_job;

                        if (!job) {
                          return null;
                        }

                        const assignmentMeta = getAssignmentStatusMeta(booking);
                        const isUnassigning = unassigningJobId === job.id;

                        return (
                          <div
                            key={job.id}
                            className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm"
                          >
                            <div className="flex flex-col gap-4">
                              <div>
                                <div className="flex flex-wrap items-center gap-2">
                                  <span className="rounded-full bg-slate-900 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-white">
                                    {job.job_reference}
                                  </span>
                                  <span className="rounded-full bg-slate-100 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-700">
                                    {booking.booking_number}
                                  </span>
                                  <span
                                    className={clsx(
                                      "rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em]",
                                      assignmentMeta.chipClassName,
                                    )}
                                  >
                                    {assignmentMeta.label}
                                  </span>
                                </div>
                                <p className="mt-3 text-sm font-semibold text-slate-900">
                                  {booking.full_name} •{" "}
                                  {booking.car_registration}
                                </p>
                                <p className="mt-1 text-sm text-slate-600">
                                  {job.assigned_mechanic_name ||
                                    "Mechanic not assigned"}
                                </p>
                                <p className="mt-2 text-xs text-slate-500">
                                  {assignmentMeta.helperText}
                                </p>
                              </div>

                              <div className="flex flex-col gap-2">
                                <button
                                  type="button"
                                  onClick={() => openJobForEditing(booking)}
                                  className="inline-flex min-h-11 w-full items-center justify-center rounded-2xl border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-700"
                                >
                                  Edit Job
                                </button>
                                <button
                                  type="button"
                                  onClick={() =>
                                    openAssignedJobOverview(booking)
                                  }
                                  disabled={!onOpenJobOverview}
                                  className="inline-flex min-h-11 w-full items-center justify-center rounded-2xl border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                  Open Job Overview
                                </button>
                                <button
                                  type="button"
                                  onClick={() =>
                                    void handleUnassignJob(booking)
                                  }
                                  disabled={
                                    !job.can_unassign ||
                                    Boolean(unassigningJobId)
                                  }
                                  className={clsx(
                                    "inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-2xl px-4 text-sm font-semibold transition",
                                    job.can_unassign && !unassigningJobId
                                      ? "border border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100"
                                      : "cursor-not-allowed border border-slate-200 bg-slate-100 text-slate-400",
                                  )}
                                >
                                  {isUnassigning ? (
                                    <>
                                      <LoaderCircle className="h-4 w-4 animate-spin" />
                                      Unassigning...
                                    </>
                                  ) : (
                                    "Unassign Job"
                                  )}
                                </button>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {assignedPreviewBookings.length === 0 ? (
                      <div className="mt-4 rounded-2xl border border-dashed border-slate-300 bg-white px-4 py-6 text-sm text-slate-500">
                        {assignedJobsTab === "assigned"
                          ? "No safely assigned jobs are waiting to start."
                          : "No started jobs need attention right now."}
                      </div>
                    ) : null}

                    {(assignedJobsTab === "assigned"
                      ? safelyAssignedBookings.length
                      : startedAssignedBookings.length) >
                    assignedPreviewBookings.length ? (
                      <div className="mt-4 rounded-2xl border border-dashed border-slate-300 bg-white px-4 py-3 text-sm text-slate-600">
                        Showing {assignedPreviewBookings.length} of{" "}
                        {assignedJobsTab === "assigned"
                          ? safelyAssignedBookings.length
                          : startedAssignedBookings.length}{" "}
                        {assignedJobsTab} jobs. Use the full progress board to
                        view the rest.
                      </div>
                    ) : null}
                  </div>
                </div>
              </div>
            ) : null}

            <div className="mt-6 rounded-3xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
              <div className="flex items-start gap-3">
                <CheckCircle2 className="mt-0.5 h-4 w-4 text-emerald-600" />
                <p>
                  Customer bookings keep their own booking number. Jobs are only
                  created here when ops is ready to assign the work.
                </p>
              </div>
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}

export default OpsAssignJobPage;
