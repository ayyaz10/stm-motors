import { useEffect, useMemo, useState } from "react";
import clsx from "clsx";
import {
  AlertCircle,
  BriefcaseBusiness,
  CheckCircle2,
  ChevronLeft,
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
  AVAILABILITY_GROUPS,
  AVAILABILITY_SLOTS,
  formatAvailabilityDate,
  formatAvailabilityDaySummary,
  getAvailabilityWindowTimes,
  type AvailabilityBlock,
  type AvailabilityBlockType,
  type AvailabilityWindowKey,
} from "../lib/availability";
import {
  createAvailabilityBlock,
  deleteAvailabilityBlock,
  fetchOpsAvailabilityBlocks,
} from "../lib/availabilityBlocks";
import DashboardSelect from "../components/dashboard/DashboardSelect";
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

type AvailabilityDragMode = "select" | "deselect";

const todayDateKey = () => {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
};

const addDaysToDateKey = (dateKey: string, dayCount: number) => {
  const date = new Date(`${dateKey}T00:00:00`);

  date.setDate(date.getDate() + dayCount);

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
};

function getDateRangeKeys(startDateKey: string, endDateKey: string) {
  const rangeStart = startDateKey <= endDateKey ? startDateKey : endDateKey;
  const rangeEnd = startDateKey <= endDateKey ? endDateKey : startDateKey;
  const dates: string[] = [];
  let currentDate = rangeStart;

  while (currentDate <= rangeEnd) {
    dates.push(currentDate);
    currentDate = addDaysToDateKey(currentDate, 1);
  }

  return dates;
}

function normalizeAvailabilityBlockDates(dates: string[]) {
  return Array.from(new Set(dates.filter((date) => date >= todayDateKey()))).sort();
}

const toDateKey = (date: Date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
};

const startOfMonth = (date: Date) =>
  new Date(date.getFullYear(), date.getMonth(), 1);

const addMonths = (date: Date, monthCount: number) =>
  new Date(date.getFullYear(), date.getMonth() + monthCount, 1);

const formatCalendarMonth = (date: Date) =>
  new Intl.DateTimeFormat("en-GB", {
    month: "long",
    year: "numeric",
  }).format(date);

function buildCalendarMonthDays(monthDate: Date) {
  const monthStart = startOfMonth(monthDate);
  const month = monthStart.getMonth();
  const offset = (monthStart.getDay() + 6) % 7;
  const firstGridDate = new Date(monthStart);

  firstGridDate.setDate(monthStart.getDate() - offset);

  return Array.from({ length: 42 }, (_, index) => {
    const date = new Date(firstGridDate);

    date.setDate(firstGridDate.getDate() + index);

    return {
      date,
      dateKey: toDateKey(date),
      isCurrentMonth: date.getMonth() === month,
    };
  });
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

function formatBlockWindow(block: AvailabilityBlock): string {
  return `${formatAvailabilityDate(block.date)}, ${block.start_time}-${block.end_time}`;
}

function getBlockTypeLabel(type: AvailabilityBlockType): string {
  if (type === "manual_hold") return "Manual hold";
  if (type === "scheduled_job") return "Booked job";

  return "Closed";
}

function formatDriveable(value: "yes" | "no" | null): string {
  if (value === "yes") return "Driveable";
  if (value === "no") return "Not driveable";

  return "Not specified";
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
  const [availabilityBlocks, setAvailabilityBlocks] = useState<AvailabilityBlock[]>([]);
  const [availabilityCalendarMonth, setAvailabilityCalendarMonth] = useState(() =>
    startOfMonth(new Date()),
  );
  const [selectedAvailabilityBlockDates, setSelectedAvailabilityBlockDates] =
    useState<string[]>(() => [todayDateKey()]);
  const [availabilityRangeAnchor, setAvailabilityRangeAnchor] =
    useState<string>(todayDateKey());
  const [availabilityDragStart, setAvailabilityDragStart] =
    useState<string | null>(null);
  const [availabilityDragEnd, setAvailabilityDragEnd] =
    useState<string | null>(null);
  const [availabilityDragMode, setAvailabilityDragMode] =
    useState<AvailabilityDragMode>("select");
  const [availabilityBlockWindow, setAvailabilityBlockWindow] =
    useState<AvailabilityWindowKey>("group:all_day");
  const [availabilityBlockType, setAvailabilityBlockType] =
    useState<Exclude<AvailabilityBlockType, "scheduled_job">>("closed");
  const [availabilityBlockReason, setAvailabilityBlockReason] = useState("");
  const [availabilityBlockError, setAvailabilityBlockError] = useState<string | null>(
    null,
  );
  const [isAvailabilityBlocksLoading, setIsAvailabilityBlocksLoading] =
    useState(false);
  const [isSavingAvailabilityBlock, setIsSavingAvailabilityBlock] =
    useState(false);
  const [removingAvailabilityBlockId, setRemovingAvailabilityBlockId] =
    useState<string | null>(null);
  const [isRemovingAllAvailabilityBlocks, setIsRemovingAllAvailabilityBlocks] =
    useState(false);

  const selectedBooking = useMemo(
    () => bookings.find((booking) => booking.id === selectedBookingId) ?? null,
    [bookings, selectedBookingId],
  );
  const selectedMechanic = useMemo(
    () => mechanics.find((mechanic) => mechanic.id === selectedMechanicId) ?? null,
    [mechanics, selectedMechanicId],
  );
  const displayedAvailabilityBlockDates = useMemo(() => {
    if (!availabilityDragStart || !availabilityDragEnd) {
      return selectedAvailabilityBlockDates;
    }

    const draggedDates = getDateRangeKeys(
      availabilityDragStart,
      availabilityDragEnd,
    ).filter((date) => date >= todayDateKey());

    if (availabilityDragMode === "deselect") {
      const draggedDateSet = new Set(draggedDates);

      return normalizeAvailabilityBlockDates(
        selectedAvailabilityBlockDates.filter(
          (date) => !draggedDateSet.has(date),
        ),
      );
    }

    return normalizeAvailabilityBlockDates([
      ...selectedAvailabilityBlockDates,
      ...draggedDates,
    ]);
  }, [
    availabilityDragEnd,
    availabilityDragMode,
    availabilityDragStart,
    selectedAvailabilityBlockDates,
  ]);
  const displayedAvailabilityBlockDatesSet = useMemo(
    () => new Set(displayedAvailabilityBlockDates),
    [displayedAvailabilityBlockDates],
  );
  const selectedAvailabilityRangeSegments = useMemo(() => {
    const selectedDates = [...displayedAvailabilityBlockDates].sort();
    const segments = new Map<
      string,
      {
        isStart: boolean;
        isEnd: boolean;
        isMiddle: boolean;
        isSingle: boolean;
      }
    >();
    let index = 0;

    while (index < selectedDates.length) {
      const segmentDates = [selectedDates[index]];

      while (
        index + 1 < selectedDates.length &&
        selectedDates[index + 1] === addDaysToDateKey(selectedDates[index], 1)
      ) {
        index += 1;
        segmentDates.push(selectedDates[index]);
      }

      segmentDates.forEach((date, segmentIndex) => {
        const isSingle = segmentDates.length === 1;

        segments.set(date, {
          isSingle,
          isStart: !isSingle && segmentIndex === 0,
          isEnd: !isSingle && segmentIndex === segmentDates.length - 1,
          isMiddle:
            !isSingle &&
            segmentIndex > 0 &&
            segmentIndex < segmentDates.length - 1,
        });
      });

      index += 1;
    }

    return segments;
  }, [displayedAvailabilityBlockDates]);
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

  const loadAvailabilityBlocks = async () => {
    try {
      setIsAvailabilityBlocksLoading(true);
      setAvailabilityBlockError(null);

      const startDate = todayDateKey();
      const endDate = addDaysToDateKey(startDate, 45);

      setAvailabilityBlocks(await fetchOpsAvailabilityBlocks(startDate, endDate));
    } catch (error) {
      setAvailabilityBlockError(
        error instanceof Error
          ? error.message
          : "Unable to load availability blocks.",
      );
    } finally {
      setIsAvailabilityBlocksLoading(false);
    }
  };

  useEffect(() => {
    void loadBookings();
    void loadMechanics();
    void loadAvailabilityBlocks();
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
      setOpsNotes(selectedBooking.existing_job.ops_notes ?? "");
      setReopenReason("");
      setResetWorkflowOnReopen(false);
      setErrors({});
      return;
    }

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

    const confirmed = window.confirm(
      `Remove this job and return booking ${booking.booking_number} to the unassigned pool?\n\nOnly use this for test or incorrectly created jobs. This cannot be undone.`,
    );

    if (!confirmed) return;

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
    setOpsNotes(booking.existing_job.ops_notes ?? "");
    setErrors({});
    setSubmitError(null);
    setAssignmentActionMessage(null);
  };

  const handleCreateAvailabilityBlock = async (
    event: React.FormEvent<HTMLFormElement>,
  ) => {
    event.preventDefault();

    const times = getAvailabilityWindowTimes(availabilityBlockWindow);
    const datesToBlock = normalizeAvailabilityBlockDates(
      selectedAvailabilityBlockDates,
    );

    if (!times) {
      setAvailabilityBlockError("Choose a valid availability window.");
      return;
    }

    if (datesToBlock.length === 0) {
      setAvailabilityBlockError("Select at least one date to block.");
      return;
    }

    try {
      setIsSavingAvailabilityBlock(true);
      setAvailabilityBlockError(null);

      const nextBlocks = await Promise.all(
        datesToBlock.map((date) =>
          createAvailabilityBlock({
            date,
            start_time: times.start_time,
            end_time: times.end_time,
            block_type: availabilityBlockType,
            reason: availabilityBlockReason.trim() || null,
          }),
        ),
      );

      setAvailabilityBlocks((currentBlocks) =>
        [...nextBlocks, ...currentBlocks].sort((left, right) =>
          `${left.date}${left.start_time}`.localeCompare(
            `${right.date}${right.start_time}`,
          ),
        ),
      );
      setAvailabilityBlockReason("");
      setSelectedAvailabilityBlockDates([]);
      setAvailabilityDragStart(null);
      setAvailabilityDragEnd(null);
      setAvailabilityDragMode("select");
    } catch (error) {
      setAvailabilityBlockError(
        error instanceof Error
          ? error.message
          : "Unable to save this availability block.",
      );
    } finally {
      setIsSavingAvailabilityBlock(false);
    }
  };

  const handleRemoveAvailabilityBlock = async (blockId: string) => {
    try {
      setRemovingAvailabilityBlockId(blockId);
      setAvailabilityBlockError(null);

      await deleteAvailabilityBlock(blockId);
      setAvailabilityBlocks((currentBlocks) =>
        currentBlocks.filter((block) => block.id !== blockId),
      );
    } catch (error) {
      setAvailabilityBlockError(
        error instanceof Error
          ? error.message
          : "Unable to remove this availability block.",
      );
    } finally {
      setRemovingAvailabilityBlockId(null);
    }
  };

  const handleRemoveAllAvailabilityBlocks = async () => {
    if (availabilityBlocks.length === 0) {
      return;
    }

    try {
      setIsRemovingAllAvailabilityBlocks(true);
      setAvailabilityBlockError(null);

      await Promise.all(
        availabilityBlocks.map((block) => deleteAvailabilityBlock(block.id)),
      );
      setAvailabilityBlocks([]);
    } catch (error) {
      setAvailabilityBlockError(
        error instanceof Error
          ? error.message
          : "Unable to remove all availability blocks.",
      );
      await loadAvailabilityBlocks();
    } finally {
      setIsRemovingAllAvailabilityBlocks(false);
    }
  };

  const toggleAvailabilityBlockDate = (dateKey: string) => {
    if (dateKey < todayDateKey()) {
      return;
    }

    setSelectedAvailabilityBlockDates((currentDates) => {
      if (currentDates.includes(dateKey)) {
        return normalizeAvailabilityBlockDates(
          currentDates.filter((date) => date !== dateKey),
        );
      }

      return normalizeAvailabilityBlockDates([...currentDates, dateKey]);
    });
    setAvailabilityRangeAnchor(dateKey);
    setAvailabilityBlockError(null);
  };

  const addAvailabilityBlockDateRange = (startDate: string, endDate: string) => {
    const rangeDates = getDateRangeKeys(startDate, endDate).filter(
      (date) => date >= todayDateKey(),
    );

    setSelectedAvailabilityBlockDates((currentDates) =>
      normalizeAvailabilityBlockDates([...currentDates, ...rangeDates]),
    );
    setAvailabilityRangeAnchor(endDate);
    setAvailabilityBlockError(null);
  };

  const removeAvailabilityBlockDateRange = (
    startDate: string,
    endDate: string,
  ) => {
    const rangeDateSet = new Set(
      getDateRangeKeys(startDate, endDate).filter((date) => date >= todayDateKey()),
    );

    setSelectedAvailabilityBlockDates((currentDates) =>
      normalizeAvailabilityBlockDates(
        currentDates.filter((date) => !rangeDateSet.has(date)),
      ),
    );
    setAvailabilityRangeAnchor(endDate);
    setAvailabilityBlockError(null);
  };

  const toggleAvailabilityBlockDateRange = (
    startDate: string,
    endDate: string,
  ) => {
    const rangeDates = getDateRangeKeys(startDate, endDate).filter(
      (date) => date >= todayDateKey(),
    );
    const selectedDateSet = new Set(selectedAvailabilityBlockDates);
    const isFullySelected =
      rangeDates.length > 0 && rangeDates.every((date) => selectedDateSet.has(date));

    if (isFullySelected) {
      removeAvailabilityBlockDateRange(startDate, endDate);
    } else {
      addAvailabilityBlockDateRange(startDate, endDate);
    }
  };

  const clearAvailabilityBlockDates = () => {
    setSelectedAvailabilityBlockDates([]);
    setAvailabilityDragStart(null);
    setAvailabilityDragEnd(null);
    setAvailabilityDragMode("select");
    setAvailabilityBlockError(null);
  };

  const handleAvailabilityDateMouseDown = (
    dateKey: string,
    event: React.MouseEvent<HTMLButtonElement>,
  ) => {
    if (event.shiftKey || dateKey < todayDateKey()) {
      return;
    }

    setAvailabilityDragStart(dateKey);
    setAvailabilityDragEnd(dateKey);
    setAvailabilityDragMode(
      selectedAvailabilityBlockDates.includes(dateKey) ? "deselect" : "select",
    );
  };

  const handleAvailabilityDateMouseEnter = (dateKey: string) => {
    if (!availabilityDragStart || dateKey < todayDateKey()) {
      return;
    }

    setAvailabilityDragEnd(dateKey);
  };

  const handleAvailabilityDateMouseUp = (
    dateKey: string,
    event: React.MouseEvent<HTMLButtonElement>,
  ) => {
    if (event.shiftKey) {
      return;
    }

    if (!availabilityDragStart) {
      return;
    }

    if (availabilityDragStart === dateKey) {
      toggleAvailabilityBlockDate(dateKey);
    } else if (availabilityDragMode === "deselect") {
      removeAvailabilityBlockDateRange(availabilityDragStart, dateKey);
    } else {
      addAvailabilityBlockDateRange(availabilityDragStart, dateKey);
    }

    setAvailabilityDragStart(null);
    setAvailabilityDragEnd(null);
    setAvailabilityDragMode("select");
  };

  const handleAvailabilityDateClick = (
    dateKey: string,
    event: React.MouseEvent<HTMLButtonElement>,
  ) => {
    if (!event.shiftKey || dateKey < todayDateKey()) {
      return;
    }

    event.preventDefault();
    toggleAvailabilityBlockDateRange(availabilityRangeAnchor, dateKey);
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
                          {booking.availability.length > 0 ? (
                            <p className="mt-2 text-xs font-medium text-sky-700">
                              {booking.availability.length} available{" "}
                              {booking.availability.length === 1 ? "date" : "dates"} submitted
                            </p>
                          ) : null}
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
                            {booking.pricing_type === "from" ? "From " : ""}£
                            {Number(
                              booking.quoted_price ?? booking.total_price,
                            ).toFixed(2)}
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
                <DashboardSelect
                  value={selectedBookingId}
                  onChange={(nextBookingId) => {
                    setSelectedBookingId(nextBookingId);
                    setErrors((currentErrors) => ({
                      ...currentErrors,
                      bookingId: undefined,
                    }));
                  }}
                  invalid={Boolean(errors.bookingId)}
                  placeholder="Select a booking"
                  ariaLabel="Select booking"
                  buttonClassName="min-h-12"
                  options={[
                    { value: "", label: "Select a booking" },
                    ...(isEditingJob
                      ? bookings.filter(
                          (booking) =>
                            booking.id === selectedBookingId ||
                            !booking.existing_job,
                        )
                      : availableBookings
                    ).map((booking) => ({
                      value: booking.id,
                      label: `${booking.booking_number} - ${booking.full_name}`,
                    })),
                  ]}
                />
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
                  <div className="mt-4 rounded-2xl border border-slate-200 bg-white p-3">
                    <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                      Customer availability
                    </p>
                    {selectedBooking.availability.length > 0 ? (
                      <ul className="mt-3 space-y-2">
                        {selectedBooking.availability.map((day) => (
                          <li key={day.date}>
                            <p className="font-semibold text-slate-900">
                              {formatAvailabilityDate(day.date)}
                            </p>
                            <p className="mt-0.5 text-xs text-slate-500">
                              {formatAvailabilityDaySummary(day)}
                            </p>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="mt-2 text-xs text-amber-700">
                        No structured availability was saved for this booking.
                      </p>
                    )}
                    {selectedBooking.availability_note?.trim() ? (
                      <p className="mt-3 border-t border-slate-100 pt-3 text-xs text-slate-600">
                        Note: {selectedBooking.availability_note}
                      </p>
                    ) : null}
                  </div>
                  <div className="mt-3 grid gap-3 sm:grid-cols-2">
                    <div className="rounded-2xl border border-slate-200 bg-white p-3">
                      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                        Vehicle movement
                      </p>
                      <p className="mt-2 text-sm font-semibold text-slate-900">
                        {formatDriveable(selectedBooking.vehicle_driveable)}
                      </p>
                    </div>
                    <div className="rounded-2xl border border-slate-200 bg-white p-3">
                      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                        Service notes
                      </p>
                      <p className="mt-2 text-sm text-slate-600">
                        {selectedBooking.work_notes?.trim() || "No notes added"}
                      </p>
                    </div>
                  </div>
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
                    <DashboardSelect
                      value={selectedMechanicId}
                      onChange={(nextMechanicId) => {
                        setSelectedMechanicId(nextMechanicId);
                        setErrors((currentErrors) => ({
                          ...currentErrors,
                          mechanicId: undefined,
                        }));
                        setSubmitError(null);
                      }}
                      disabled={isMechanicsLoading || mechanics.length === 0}
                      invalid={Boolean(errors.mechanicId)}
                      placeholder={
                        isMechanicsLoading
                          ? "Loading mechanics..."
                          : mechanics.length === 0
                            ? "No mechanics available"
                            : "Select a mechanic"
                      }
                      ariaLabel="Select mechanic"
                      buttonClassName="min-h-12"
                      options={[
                        {
                          value: "",
                          label: isMechanicsLoading
                            ? "Loading mechanics..."
                            : mechanics.length === 0
                              ? "No mechanics available"
                              : "Select a mechanic",
                        },
                        ...mechanics.map((mechanic) => ({
                          value: mechanic.id,
                          label: formatMechanicLabel(mechanic),
                        })),
                      ]}
                    />
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

                  <div className="rounded-2xl border border-sky-100 bg-sky-50 px-4 py-3 text-sm leading-6 text-sky-800">
                    Ops assigns the mechanic here. The mechanic will choose the
                    final arrival window from the customer availability on their
                    job overview.
                  </div>

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

            <section className="mt-6 rounded-3xl border border-slate-200 bg-slate-50 p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                    Availability control
                  </p>
                  <h3 className="mt-1 text-base font-semibold text-slate-950">
                    Close or hold customer slots
                  </h3>
                  <p className="mt-1 text-sm leading-6 text-slate-600">
                    Blocks appear as unavailable in the customer booking
                    calendar. Scheduled jobs are also treated as booked.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => void loadAvailabilityBlocks()}
                  disabled={isAvailabilityBlocksLoading}
                  className="inline-flex min-h-10 items-center justify-center rounded-2xl border border-slate-300 bg-white px-3 text-sm font-semibold text-slate-700 disabled:opacity-50"
                >
                  <RefreshCw
                    className={clsx(
                      "h-4 w-4",
                      isAvailabilityBlocksLoading && "animate-spin",
                    )}
                  />
                </button>
              </div>

              <form
                onSubmit={handleCreateAvailabilityBlock}
                className="mt-4 grid gap-3"
              >
                <div className="rounded-3xl border border-slate-200 bg-white p-3">
                  <div className="flex items-center justify-between gap-3">
                    <button
                      type="button"
                      onClick={() =>
                        setAvailabilityCalendarMonth((currentMonth) =>
                          addMonths(currentMonth, -1),
                        )
                      }
                      className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 text-slate-600"
                      aria-label="Previous month"
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </button>
                    <div className="text-center">
                      <p className="text-sm font-semibold text-slate-950">
                        Select dates
                      </p>
                      <p className="mt-0.5 text-xs text-slate-500">
                        {selectedAvailabilityBlockDates.length} selected
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() =>
                        setAvailabilityCalendarMonth((currentMonth) =>
                          addMonths(currentMonth, 1),
                        )
                      }
                      className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 text-slate-600"
                      aria-label="Next month"
                    >
                      <ChevronRight className="h-4 w-4" />
                    </button>
                  </div>

                  <div className="mt-3 rounded-2xl border border-sky-100 bg-sky-50 px-4 py-3 text-xs leading-5 text-sky-800">
                    Click dates one by one, or drag across days to select a range.
                    Shift-click also fills a range from the last selected date.
                  </div>

                  <div className="mt-4 grid gap-4 xl:grid-cols-2">
                    {[availabilityCalendarMonth, addMonths(availabilityCalendarMonth, 1)].map(
                      (monthDate) => (
                        <div key={toDateKey(monthDate)} className="min-w-0">
                          <p className="text-center text-sm font-semibold text-slate-950">
                            {formatCalendarMonth(monthDate)}
                          </p>
                          <div className="mt-3 grid grid-cols-7 gap-1 text-center text-[11px] font-semibold text-slate-500">
                            {["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"].map(
                              (weekday) => (
                                <span key={weekday}>{weekday}</span>
                              ),
                            )}
                          </div>
                          <div className="mt-2 grid grid-cols-7 gap-1">
                            {buildCalendarMonthDays(monthDate).map((day) => {
                              const isSelected =
                                displayedAvailabilityBlockDatesSet.has(day.dateKey);
                              const isPast = day.dateKey < todayDateKey();
                              const segment =
                                selectedAvailabilityRangeSegments.get(day.dateKey);
                              const selectedClassName = segment?.isSingle
                                ? "rounded-xl bg-slate-950 text-white shadow-sm"
                                : segment?.isStart
                                  ? "rounded-l-xl rounded-r-none bg-slate-950 text-white shadow-sm"
                                  : segment?.isEnd
                                    ? "rounded-l-none rounded-r-xl bg-slate-950 text-white shadow-sm"
                                    : segment?.isMiddle
                                      ? "rounded-none bg-slate-950 text-white shadow-sm"
                                      : "";

                              return (
                                <button
                                  key={day.dateKey}
                                  type="button"
                                  onMouseDown={(event) =>
                                    handleAvailabilityDateMouseDown(
                                      day.dateKey,
                                      event,
                                    )
                                  }
                                  onMouseEnter={() =>
                                    handleAvailabilityDateMouseEnter(day.dateKey)
                                  }
                                  onMouseUp={(event) =>
                                    handleAvailabilityDateMouseUp(
                                      day.dateKey,
                                      event,
                                    )
                                  }
                                  onClick={(event) =>
                                    handleAvailabilityDateClick(
                                      day.dateKey,
                                      event,
                                    )
                                  }
                                  onKeyDown={(event) => {
                                    if (
                                      event.key !== "Enter" &&
                                      event.key !== " "
                                    ) {
                                      return;
                                    }

                                    event.preventDefault();

                                    if (event.shiftKey) {
                                      toggleAvailabilityBlockDateRange(
                                        availabilityRangeAnchor,
                                        day.dateKey,
                                      );
                                    } else {
                                      toggleAvailabilityBlockDate(day.dateKey);
                                    }
                                  }}
                                  aria-pressed={
                                    selectedAvailabilityBlockDates.includes(
                                      day.dateKey,
                                    )
                                  }
                                  disabled={isPast}
                                  className={clsx(
                                    "flex aspect-square min-h-8 items-center justify-center text-xs font-semibold transition",
                                    isSelected
                                      ? selectedClassName
                                      : isPast
                                        ? "cursor-not-allowed rounded-xl text-slate-300"
                                        : day.isCurrentMonth
                                          ? "rounded-xl text-slate-700 hover:bg-sky-50 hover:text-sky-700"
                                          : "rounded-xl text-slate-300 hover:bg-slate-50",
                                  )}
                                >
                                  {day.date.getDate()}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      ),
                    )}
                  </div>

                  {selectedAvailabilityBlockDates.length > 0 ? (
                    <div className="mt-4 flex max-h-40 flex-wrap gap-2 overflow-y-auto border-t border-slate-100 pt-3 pr-1">
                      {selectedAvailabilityBlockDates.map((date) => (
                        <button
                          key={date}
                          type="button"
                          onClick={() => toggleAvailabilityBlockDate(date)}
                          className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700"
                        >
                          {formatAvailabilityDate(date)} x
                        </button>
                      ))}
                      <button
                        type="button"
                        onClick={clearAvailabilityBlockDates}
                        className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-600 transition hover:border-rose-200 hover:bg-rose-50 hover:text-rose-700"
                      >
                        Clear all dates
                      </button>
                    </div>
                  ) : null}
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <label className="space-y-2">
                    <span className="text-sm font-semibold text-slate-900">
                      Window
                    </span>
                    <DashboardSelect
                      value={availabilityBlockWindow}
                      onChange={(nextWindow) =>
                        setAvailabilityBlockWindow(
                          nextWindow as AvailabilityWindowKey,
                        )
                      }
                      ariaLabel="Select blocked window"
                      buttonClassName="bg-white"
                      options={[
                        ...AVAILABILITY_GROUPS.map((group) => ({
                          value: `group:${group.id}`,
                          label: group.label,
                        })),
                        ...AVAILABILITY_SLOTS.map((slot) => ({
                          value: `slot:${slot.id}`,
                          label: slot.label,
                        })),
                      ]}
                    />
                  </label>

                  <label className="space-y-2">
                    <span className="text-sm font-semibold text-slate-900">
                      Type
                    </span>
                    <DashboardSelect
                      value={availabilityBlockType}
                      onChange={(nextType) =>
                        setAvailabilityBlockType(
                          nextType as Exclude<
                            AvailabilityBlockType,
                            "scheduled_job"
                          >,
                        )
                      }
                      ariaLabel="Select block type"
                      buttonClassName="bg-white"
                      options={[
                        { value: "closed", label: "Closed" },
                        {
                          value: "manual_hold",
                          label: "Manual booking / hold",
                        },
                      ]}
                    />
                  </label>
                </div>

                <label className="space-y-2">
                  <span className="text-sm font-semibold text-slate-900">
                    Reason
                    <span className="ml-2 text-xs font-medium uppercase tracking-[0.14em] text-slate-400">
                      Optional
                    </span>
                  </span>
                  <input
                    type="text"
                    value={availabilityBlockReason}
                    onChange={(event) =>
                      setAvailabilityBlockReason(event.target.value)
                    }
                    placeholder="Fully booked, no mechanic cover, holiday..."
                    className="min-h-11 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-sky-400 focus:ring-4 focus:ring-sky-100"
                  />
                </label>

                {availabilityBlockError ? (
                  <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                    {availabilityBlockError}
                  </div>
                ) : null}

                <button
                  type="submit"
                  disabled={isSavingAvailabilityBlock}
                  className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-2xl bg-slate-950 px-4 text-sm font-semibold text-white disabled:bg-slate-200 disabled:text-slate-500"
                >
                  {isSavingAvailabilityBlock ? (
                    <>
                      <LoaderCircle className="h-4 w-4 animate-spin" />
                      Saving block...
                    </>
                  ) : (
                    `Block ${selectedAvailabilityBlockDates.length || 0} ${
                      selectedAvailabilityBlockDates.length === 1
                        ? "date"
                        : "dates"
                    }`
                  )}
                </button>
              </form>

              <div className="mt-5 space-y-2">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                    Upcoming manual blocks
                  </p>
                  {availabilityBlocks.length > 0 ? (
                    <button
                      type="button"
                      onClick={() => void handleRemoveAllAvailabilityBlocks()}
                      disabled={
                        isRemovingAllAvailabilityBlocks ||
                        Boolean(removingAvailabilityBlockId)
                      }
                      className="rounded-xl border border-rose-200 bg-white px-3 py-2 text-xs font-semibold text-rose-700 transition hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {isRemovingAllAvailabilityBlocks
                        ? "Removing all"
                        : `Remove all (${availabilityBlocks.length})`}
                    </button>
                  ) : null}
                </div>
                {availabilityBlocks.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-4 py-5 text-sm text-slate-500">
                    No manual closures or holds in the next 45 days.
                  </div>
                ) : (
                  <div className="grid max-h-96 gap-2 overflow-y-auto pr-1">
                    {availabilityBlocks.map((block) => (
                      <div
                        key={block.id}
                        className="rounded-2xl border border-slate-200 bg-white px-4 py-3"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="text-sm font-semibold text-slate-950">
                              {formatBlockWindow(block)}
                            </p>
                            <p className="mt-1 text-xs text-slate-500">
                              {getBlockTypeLabel(block.block_type)}
                              {block.reason ? ` - ${block.reason}` : ""}
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={() =>
                              void handleRemoveAvailabilityBlock(block.id)
                            }
                            disabled={
                              removingAvailabilityBlockId === block.id ||
                              isRemovingAllAvailabilityBlocks
                            }
                            className="shrink-0 rounded-xl border border-slate-300 px-3 py-2 text-xs font-semibold text-slate-700 disabled:opacity-50"
                          >
                            {removingAvailabilityBlockId === block.id
                              ? "Removing"
                              : "Remove"}
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </section>

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
