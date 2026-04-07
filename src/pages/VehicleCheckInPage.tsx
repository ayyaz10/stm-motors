import { useEffect, useMemo, useRef, useState } from "react";
import clsx from "clsx";
import {
  AlertCircle,
  Camera,
  CarFront,
  CheckCircle2,
  ChevronRight,
  ClipboardCheck,
  Gauge,
  ImagePlus,
  LoaderCircle,
  Mail,
  RefreshCw,
  ShieldCheck,
  UserRound,
} from "lucide-react";
import { compressImageForUpload } from "../utils/imageCompression";
import {
  hasVehicleCheckInValidationErrors,
  validateVehicleCheckInForm,
  type VehicleCheckInPhotoType,
  type VehicleCheckInValidationErrors,
} from "../utils/vehicleCheckInValidation";
import {
  buildVehicleCheckInPhotoPath,
  insertVehicleCheckInRecord,
  removeVehicleCheckInPhotos,
  updateVehicleCheckInRecord,
  uploadVehicleCheckInPhoto,
} from "../lib/vehicleCheckIns";
import { fetchJobWorkflowOverview } from "../lib/jobWorkflow";

type YesNoValue = boolean | null;

interface PhotoSelectionState {
  file: File | null;
  previewUrl: string;
  selectedAt: number | null;
  storedPath: string | null;
  previousStoredPath: string | null;
  source: "existing" | "new";
}

type PhotoSelections = Record<VehicleCheckInPhotoType, PhotoSelectionState | null>;

interface VehicleCheckInPageProps {
  jobId?: string;
  jobReference?: string;
  bookingId?: string;
  bookingNumber?: string;
  signedInMechanicName: string;
  signedInMechanicEmail?: string | null;
  isReviewMode?: boolean;
  onOpenChecklist?: () => void;
  onOpenOverview?: () => void;
  onOpenDashboard?: () => void;
}

interface SuccessfulSubmissionState {
  mechanicName: string;
  submittedAt: string;
  headline: string;
  message: string;
}

interface ExistingCheckInSummary {
  id: string;
  submittedAt: string;
}

const PHOTO_SLOTS: Array<{
  key: VehicleCheckInPhotoType;
  label: string;
  instruction: string;
  icon: typeof Gauge;
}> = [
  {
    key: "odometer",
    label: "Odometer / Speedometer",
    instruction: "Capture the current mileage and dashboard reading clearly.",
    icon: Gauge,
  },
  {
    key: "front",
    label: "Front of car",
    instruction: "Show the full front view including bumper and headlights.",
    icon: CarFront,
  },
  {
    key: "rear",
    label: "Rear of car",
    instruction: "Show the full rear view including bumper and tail lights.",
    icon: Camera,
  },
  {
    key: "left",
    label: "Left side of car",
    instruction: "Take a side profile from front wheel to rear wheel.",
    icon: Camera,
  },
  {
    key: "right",
    label: "Right side of car",
    instruction: "Take a side profile from front wheel to rear wheel.",
    icon: Camera,
  },
];

const EMPTY_PHOTO_SELECTIONS: PhotoSelections = {
  odometer: null,
  front: null,
  rear: null,
  left: null,
  right: null,
};

const EMPTY_ERRORS: VehicleCheckInValidationErrors = {
  photos: {},
};

function formatSelectionTimestamp(timestamp: number): string {
  return new Intl.DateTimeFormat(undefined, {
    hour: "numeric",
    minute: "2-digit",
    day: "numeric",
    month: "short",
  }).format(new Date(timestamp));
}

function getPhotoSelectionLabel(photo: PhotoSelectionState): string {
  if (photo.source === "existing" || photo.selectedAt === null) {
    return "Saved from previous check-in";
  }

  return formatSelectionTimestamp(photo.selectedAt);
}

function formatSubmittedTimestamp(timestamp: string): string {
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(timestamp));
}

function revokePreviewUrl(previewUrl: string | undefined): void {
  if (previewUrl) {
    URL.revokeObjectURL(previewUrl);
  }
}

function BooleanChoiceField({
  label,
  value,
  onChange,
  helperText,
  disabled = false,
}: {
  label: string;
  value: YesNoValue;
  onChange: (value: boolean) => void;
  helperText: string;
  disabled?: boolean;
}) {
  return (
    <div className="space-y-3">
      <div>
        <p className="text-sm font-semibold text-slate-900">{label}</p>
        <p className="text-xs text-slate-500">{helperText}</p>
      </div>
      <div className="grid grid-cols-2 gap-3">
        {[
          { label: "Yes", value: true },
          { label: "No", value: false },
        ].map((option) => (
          <button
            key={option.label}
            type="button"
            onClick={() => onChange(option.value)}
            disabled={disabled}
            className={clsx(
              "rounded-2xl border px-4 py-3 text-sm font-semibold transition",
              value === option.value
                ? "border-emerald-600 bg-emerald-50 text-emerald-700 shadow-sm"
                : "border-slate-200 bg-white text-slate-700 hover:border-slate-300",
              disabled && "cursor-not-allowed opacity-60",
            )}
          >
            {option.label}
          </button>
        ))}
      </div>
    </div>
  );
}

function VehicleCheckInPage({
  jobId,
  jobReference,
  bookingId,
  bookingNumber,
  signedInMechanicName,
  signedInMechanicEmail,
  isReviewMode = false,
  onOpenChecklist,
  onOpenOverview,
  onOpenDashboard,
}: VehicleCheckInPageProps) {
  const [visibleDamage, setVisibleDamage] = useState<YesNoValue>(null);
  const [warningLights, setWarningLights] = useState<YesNoValue>(null);
  const [notes, setNotes] = useState("");
  const [photos, setPhotos] = useState<PhotoSelections>(EMPTY_PHOTO_SELECTIONS);
  const [errors, setErrors] = useState<VehicleCheckInValidationErrors>(EMPTY_ERRORS);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [isWorkflowLoading, setIsWorkflowLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStage, setSubmitStage] = useState<string | null>(null);
  const [existingCheckIn, setExistingCheckIn] =
    useState<ExistingCheckInSummary | null>(null);
  const [isCheckInLocked, setIsCheckInLocked] = useState(false);
  const [successState, setSuccessState] =
    useState<SuccessfulSubmissionState | null>(null);
  const fileInputRefs = useRef<
    Partial<Record<VehicleCheckInPhotoType, HTMLInputElement | null>>
  >({});
  const photosRef = useRef<PhotoSelections>(photos);

  const reference = useMemo(
    () => jobId?.trim() || jobReference?.trim() || "",
    [jobId, jobReference],
  );
  const selectedPhotoCount = PHOTO_SLOTS.filter(({ key }) => photos[key]).length;
  const canSubmit = selectedPhotoCount === PHOTO_SLOTS.length && !isSubmitting;
  const displayReference = jobReference?.trim()
    ? `Job ${jobReference.trim()}`
    : bookingNumber?.trim()
      ? `Booking ${bookingNumber.trim()}`
      : jobId?.trim()
        ? `Job ${jobId.trim()}`
        : "Vehicle check-in";
  const resolvedMechanicName =
    signedInMechanicName.trim() ||
    signedInMechanicEmail?.trim() ||
    "Staff user";
  const resolvedMechanicEmail = signedInMechanicEmail?.trim() || null;
  const resolvedJobId = jobId?.trim() || null;
  const isReadOnlyMode = isReviewMode || isCheckInLocked;

  useEffect(() => {
    photosRef.current = photos;
  }, [photos]);

  useEffect(() => {
    return () => {
      Object.values(photosRef.current).forEach((photo) => {
        revokePreviewUrl(photo?.previewUrl);
      });
    };
  }, []);

  useEffect(() => {
    let isActive = true;

    const loadExistingCheckIn = async () => {
      if (!reference) {
        setLoadError("A job reference is required to open vehicle check-in.");
        setIsWorkflowLoading(false);
        return;
      }

      try {
        setIsWorkflowLoading(true);
        setLoadError(null);

        const workflow = await fetchJobWorkflowOverview(reference);

        if (!isActive) {
          return;
        }

        const isLocked =
          workflow.job.status === "completed" ||
          workflow.job.status === "cancelled";

        setIsCheckInLocked(isLocked);
        setSuccessState(null);

        if (workflow.checkIn.id && workflow.checkIn.submittedAt) {
          setExistingCheckIn({
            id: workflow.checkIn.id,
            submittedAt: workflow.checkIn.submittedAt,
          });
          setVisibleDamage(workflow.checkIn.visibleDamage);
          setWarningLights(workflow.checkIn.warningLights);
          setNotes(workflow.checkIn.notes ?? "");
          setPhotos({
            odometer: workflow.checkIn.photoPaths.odometer
              ? {
                  file: null,
                  previewUrl: workflow.checkIn.photos.odometer ?? "",
                  selectedAt: null,
                  storedPath: workflow.checkIn.photoPaths.odometer,
                  previousStoredPath: null,
                  source: "existing",
                }
              : null,
            front: workflow.checkIn.photoPaths.front
              ? {
                  file: null,
                  previewUrl: workflow.checkIn.photos.front ?? "",
                  selectedAt: null,
                  storedPath: workflow.checkIn.photoPaths.front,
                  previousStoredPath: null,
                  source: "existing",
                }
              : null,
            rear: workflow.checkIn.photoPaths.rear
              ? {
                  file: null,
                  previewUrl: workflow.checkIn.photos.rear ?? "",
                  selectedAt: null,
                  storedPath: workflow.checkIn.photoPaths.rear,
                  previousStoredPath: null,
                  source: "existing",
                }
              : null,
            left: workflow.checkIn.photoPaths.left
              ? {
                  file: null,
                  previewUrl: workflow.checkIn.photos.left ?? "",
                  selectedAt: null,
                  storedPath: workflow.checkIn.photoPaths.left,
                  previousStoredPath: null,
                  source: "existing",
                }
              : null,
            right: workflow.checkIn.photoPaths.right
              ? {
                  file: null,
                  previewUrl: workflow.checkIn.photos.right ?? "",
                  selectedAt: null,
                  storedPath: workflow.checkIn.photoPaths.right,
                  previousStoredPath: null,
                  source: "existing",
                }
              : null,
          });
          return;
        }

        setExistingCheckIn(null);
        setVisibleDamage(null);
        setWarningLights(null);
        setNotes("");
        setPhotos(EMPTY_PHOTO_SELECTIONS);
      } catch (error) {
        if (!isActive) {
          return;
        }

        setLoadError(
          error instanceof Error
            ? error.message
            : "Unable to load the vehicle check-in.",
        );
      } finally {
        if (isActive) {
          setIsWorkflowLoading(false);
        }
      }
    };

    void loadExistingCheckIn();

    return () => {
      isActive = false;
    };
  }, [reference, resolvedMechanicName]);

  const handlePhotoSelected = (
    photoType: VehicleCheckInPhotoType,
    file: File | null,
  ) => {
    if (!file) {
      return;
    }

    const previewUrl = URL.createObjectURL(file);

    setPhotos((currentPhotos) => {
      const existingPhoto = currentPhotos[photoType];

      if (existingPhoto?.source === "new") {
        revokePreviewUrl(existingPhoto.previewUrl);
      }

      return {
        ...currentPhotos,
        [photoType]: {
          file,
          previewUrl,
          selectedAt: Date.now(),
          storedPath: null,
          previousStoredPath: existingPhoto?.storedPath ?? null,
          source: "new",
        },
      };
    });

    setErrors((currentErrors) => ({
      ...currentErrors,
      photos: {
        ...currentErrors.photos,
        [photoType]: undefined,
      },
    }));
    setSubmitError(null);
  };

  const handleReplacePhoto = (photoType: VehicleCheckInPhotoType) => {
    fileInputRefs.current[photoType]?.click();
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (isSubmitting || isReadOnlyMode) {
      return;
    }

    if (!resolvedJobId) {
      setSubmitError("A job id is required before the check-in can be saved.");
      return;
    }

    const validationErrors = validateVehicleCheckInForm({
      photos: {
        odometer: Boolean(photos.odometer),
        front: Boolean(photos.front),
        rear: Boolean(photos.rear),
        left: Boolean(photos.left),
        right: Boolean(photos.right),
      },
    });

    setErrors(validationErrors);

    if (hasVehicleCheckInValidationErrors(validationErrors)) {
      setSubmitError("Complete all required photos before submitting.");
      return;
    }

    const submittedAt = new Date().toISOString();
    const uploadedPaths: string[] = [];
    const replacedPaths: string[] = [];

    try {
      setIsSubmitting(true);
      setSubmitError(null);

      const uploadedPhotoPaths = {
        odometer: "",
        front: "",
        rear: "",
        left: "",
        right: "",
      };

      for (let index = 0; index < PHOTO_SLOTS.length; index += 1) {
        const slot = PHOTO_SLOTS[index];
        const selectedPhoto = photos[slot.key];

        if (!selectedPhoto) {
          throw new Error(`Missing required photo: ${slot.label}.`);
        }

        if (selectedPhoto.source === "existing" && selectedPhoto.storedPath) {
          uploadedPhotoPaths[slot.key] = selectedPhoto.storedPath;
          continue;
        }

        if (!selectedPhoto.file || selectedPhoto.selectedAt === null) {
          throw new Error(`Missing required photo: ${slot.label}.`);
        }

        setSubmitStage(`Preparing ${slot.label.toLowerCase()} photo...`);

        const compressedFile = await compressImageForUpload(selectedPhoto.file);
        const uploadPath = buildVehicleCheckInPhotoPath(
          resolvedJobId,
          slot.key,
          selectedPhoto.selectedAt,
        );

        setSubmitStage(
          `Uploading ${index + 1} of ${PHOTO_SLOTS.length}: ${slot.label.toLowerCase()}...`,
        );

        const storedPath = await uploadVehicleCheckInPhoto(
          uploadPath,
          compressedFile,
        );

        uploadedPaths.push(storedPath);
        uploadedPhotoPaths[slot.key] = storedPath;

        if (selectedPhoto.previousStoredPath) {
          replacedPaths.push(selectedPhoto.previousStoredPath);
        }
      }

      setSubmitStage("Saving inspection details...");
      const payload = {
        booking_id: bookingId?.trim() || null,
        job_id: resolvedJobId,
        mechanic_name: resolvedMechanicName,
        mechanic_phone: null,
        visible_damage: visibleDamage,
        warning_lights: warningLights,
        notes: notes.trim() || null,
        odometer_photo_path: uploadedPhotoPaths.odometer,
        front_photo_path: uploadedPhotoPaths.front,
        rear_photo_path: uploadedPhotoPaths.rear,
        left_photo_path: uploadedPhotoPaths.left,
        right_photo_path: uploadedPhotoPaths.right,
        submitted_at: submittedAt,
      };

      const savedCheckInId = existingCheckIn
        ? await updateVehicleCheckInRecord(existingCheckIn.id, payload)
        : await insertVehicleCheckInRecord(payload);

      if (replacedPaths.length > 0) {
        try {
          await removeVehicleCheckInPhotos(replacedPaths);
        } catch (cleanupError) {
          console.error("Failed to remove replaced vehicle check-in photos", cleanupError);
        }
      }

      setSuccessState({
        mechanicName: resolvedMechanicName,
        submittedAt,
        headline: existingCheckIn
          ? "Inspection updated successfully"
          : "Inspection submitted successfully",
        message: existingCheckIn
          ? "The saved vehicle check-in has been updated. Continue to the service checklist or return to the overview and dashboard."
          : "The arrival inspection has been saved. Continue to the service checklist or return to the overview and dashboard.",
      });
      setExistingCheckIn({
        id: savedCheckInId,
        submittedAt,
      });
      setSubmitStage(null);
      setErrors(EMPTY_ERRORS);
    } catch (error) {
      if (uploadedPaths.length > 0) {
        try {
          await removeVehicleCheckInPhotos(uploadedPaths);
        } catch (cleanupError) {
          console.error("Failed to clean up vehicle check-in uploads", cleanupError);
        }
      }

      setSubmitStage(null);
      setSubmitError(
        error instanceof Error
          ? error.message
          : "Something went wrong while submitting the vehicle check-in.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isWorkflowLoading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-100 px-4">
        <div className="flex items-center gap-3 rounded-3xl border border-slate-200 bg-white px-5 py-4 text-sm font-medium text-slate-700 shadow-sm">
          <LoaderCircle className="h-4 w-4 animate-spin" />
          Loading vehicle check-in...
        </div>
      </main>
    );
  }

  if (loadError) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-100 px-4">
        <div className="w-full max-w-lg rounded-3xl border border-rose-200 bg-white p-6 shadow-sm">
          <div className="flex items-start gap-3 text-rose-700">
            <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" />
            <div>
              <h1 className="text-xl font-semibold text-slate-950">
                Unable to open vehicle check-in
              </h1>
              <p className="mt-2 text-sm">{loadError}</p>
            </div>
          </div>
          <div className="mt-5 flex flex-col gap-3 sm:flex-row">
            <button
              type="button"
              onClick={onOpenOverview}
              className="rounded-2xl bg-slate-950 px-4 py-3 text-sm font-semibold text-white"
            >
              Go to Job Overview
            </button>
            <button
              type="button"
              onClick={onOpenDashboard}
              className="rounded-2xl border border-slate-300 px-4 py-3 text-sm font-semibold text-slate-700"
            >
              Go to Dashboard
            </button>
          </div>
        </div>
      </main>
    );
  }

  if (successState) {
    return (
      <main className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(16,185,129,0.12),_transparent_38%),linear-gradient(180deg,_#f8fafc_0%,_#eef4f1_100%)] px-4 py-8 sm:px-6">
        <div className="mx-auto max-w-2xl">
          <div className="rounded-[2rem] border border-emerald-200 bg-white p-6 shadow-[0_24px_80px_-40px_rgba(15,23,42,0.35)] sm:p-8">
            <div className="inline-flex rounded-full bg-emerald-50 p-3 text-emerald-600">
              <ShieldCheck className="h-7 w-7" />
            </div>
            <div className="mt-5 space-y-3">
              <span className="inline-flex items-center rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-emerald-700">
                Step 1 of 2
              </span>
              <h1 className="text-3xl font-semibold tracking-tight text-slate-950">
                {successState.headline}
              </h1>
              <p className="text-sm leading-6 text-slate-600">
                {successState.message}
              </p>
            </div>

            <div className="mt-8 grid gap-4 rounded-3xl border border-slate-200 bg-slate-50 p-5 text-sm text-slate-700 sm:grid-cols-2">
              <div>
                <p className="text-xs font-medium uppercase tracking-[0.14em] text-slate-500">
                  Submitted by
                </p>
                <p className="mt-2 text-base font-semibold text-slate-900">
                  {successState.mechanicName}
                </p>
              </div>
              <div>
                <p className="text-xs font-medium uppercase tracking-[0.14em] text-slate-500">
                  Submitted at
                </p>
                <p className="mt-2 text-base font-semibold text-slate-900">
                  {formatSubmittedTimestamp(successState.submittedAt)}
                </p>
              </div>
            </div>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
              <button
                type="button"
                onClick={onOpenChecklist}
                disabled={!onOpenChecklist}
                className="inline-flex min-h-12 items-center justify-center rounded-2xl bg-slate-950 px-5 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Continue to Service Checklist
              </button>
              <button
                type="button"
                onClick={onOpenOverview}
                disabled={!onOpenOverview}
                className="inline-flex min-h-12 items-center justify-center rounded-2xl border border-slate-300 bg-white px-5 text-sm font-semibold text-slate-700 transition hover:border-slate-400 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Go to Job Overview
              </button>
              <button
                type="button"
                onClick={onOpenDashboard}
                disabled={!onOpenDashboard}
                className="inline-flex min-h-12 items-center justify-center rounded-2xl border border-slate-300 bg-white px-5 text-sm font-semibold text-slate-700 transition hover:border-slate-400 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Go to Dashboard
              </button>
            </div>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(14,165,233,0.12),_transparent_32%),linear-gradient(180deg,_#f8fafc_0%,_#eef4f8_100%)] pb-36">
      <form
        noValidate
        onSubmit={handleSubmit}
        className="mx-auto flex min-h-screen w-full max-w-5xl flex-col px-4 py-6 sm:px-6 sm:py-8"
      >
        <header className="mb-6 flex flex-col gap-3">
          <span className="inline-flex w-fit items-center rounded-full bg-slate-900 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.24em] text-white">
            Step 1 of 2
          </span>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h1 className="text-3xl font-semibold tracking-tight text-slate-950">
                Vehicle Check-In
              </h1>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
                {isReviewMode
                  ? "Review the saved arrival inspection details in read-only mode."
                  : "Complete the arrival inspection before service work begins. Once this step is submitted, the next step is the service checklist."}
              </p>
            </div>
            <div className="flex flex-col gap-3 sm:items-end">
              <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-600 shadow-sm">
                <p className="text-xs font-medium uppercase tracking-[0.14em] text-slate-500">
                  Reference
                </p>
                <p className="mt-1 font-semibold text-slate-900">
                  {displayReference}
                </p>
              </div>
              <button
                type="button"
                onClick={onOpenOverview}
                className="inline-flex min-h-11 items-center justify-center rounded-2xl border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-700"
              >
                Back to Job Overview
              </button>
            </div>
          </div>
        </header>

        <div className="space-y-5">
          {existingCheckIn ? (
            <section
              className={clsx(
                "rounded-[1.75rem] border p-5 shadow-[0_24px_80px_-48px_rgba(15,23,42,0.5)] sm:p-6",
                isCheckInLocked
                  ? "border-slate-200 bg-slate-100"
                  : "border-emerald-200 bg-emerald-50/70",
              )}
            >
              <p className="text-sm font-semibold text-slate-950">
                {isReviewMode
                  ? "Read-only review"
                  : isCheckInLocked
                    ? "Saved check-in is locked"
                    : "Saved check-in loaded"}
              </p>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                {isReviewMode
                  ? `This job has a saved check-in from ${formatSubmittedTimestamp(existingCheckIn.submittedAt)}. Ops and admin can review it here, but mechanic-only edits stay disabled.`
                  : isCheckInLocked
                    ? "This job is already closed, so the saved check-in can still be reviewed but not edited."
                    : `This job already has a saved check-in from ${formatSubmittedTimestamp(existingCheckIn.submittedAt)}. You can review it here, make updates if needed, and then continue back to the checklist.`}
              </p>
            </section>
          ) : null}

          {isReviewMode && !existingCheckIn ? (
            <section className="rounded-[1.75rem] border border-slate-200 bg-slate-100 p-5 shadow-[0_24px_80px_-48px_rgba(15,23,42,0.5)] sm:p-6">
              <p className="text-sm font-semibold text-slate-950">
                Review mode only
              </p>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                The mechanic has not submitted step 1 yet. This page will show
                the saved arrival inspection here once the check-in is
                completed.
              </p>
            </section>
          ) : null}

          <section className="rounded-[1.75rem] border border-slate-200 bg-white p-5 shadow-[0_24px_80px_-48px_rgba(15,23,42,0.5)] sm:p-6">
            <div className="mb-5 flex items-start gap-4">
              <div className="rounded-2xl bg-sky-50 p-3 text-sky-700">
                <ClipboardCheck className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-sky-700">
                  Section A
                </p>
                <h2 className="mt-1 text-xl font-semibold text-slate-950">
                  {isReviewMode ? "Reviewing Staff Account" : "Signed-In Mechanic"}
                </h2>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  {isReviewMode
                    ? "This page is being reviewed by a staff user. Saved inspection details remain read-only in this mode."
                    : "Mechanic identity comes from the signed-in staff account, so no manual name or phone entry is needed here."}
                </p>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
                <p className="flex items-center gap-2 text-sm font-semibold text-slate-900">
                  <UserRound className="h-4 w-4 text-slate-500" />
                  {isReviewMode ? "Reviewer" : "Mechanic"}
                </p>
                <p className="mt-2 text-base font-semibold text-slate-950">
                  {resolvedMechanicName}
                </p>
              </div>

              <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
                <p className="flex items-center gap-2 text-sm font-semibold text-slate-900">
                  <Mail className="h-4 w-4 text-slate-500" />
                  Staff account
                </p>
                <p className="mt-2 text-base font-semibold text-slate-950">
                  {resolvedMechanicEmail ?? "No email available"}
                </p>
              </div>
            </div>
          </section>

          <section className="rounded-[1.75rem] border border-slate-200 bg-white p-5 shadow-[0_24px_80px_-48px_rgba(15,23,42,0.5)] sm:p-6">
            <div className="mb-5 flex items-start gap-4">
              <div className="rounded-2xl bg-emerald-50 p-3 text-emerald-700">
                <Camera className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-700">
                  Section B
                </p>
                <h2 className="mt-1 text-xl font-semibold text-slate-950">
                  Required Photos
                </h2>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  Capture the five required images in order. Each photo is
                  checked before the inspection can be submitted.
                </p>
              </div>
            </div>

            <div className="mb-5 rounded-3xl border border-slate-200 bg-slate-50 p-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-slate-900">
                    Photo progress
                  </p>
                  <p className="text-xs text-slate-500">
                    {selectedPhotoCount} of {PHOTO_SLOTS.length} required photos
                    ready
                  </p>
                </div>
                <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-slate-700 shadow-sm">
                  {Math.round((selectedPhotoCount / PHOTO_SLOTS.length) * 100)}%
                </span>
              </div>
              <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-200">
                <div
                  className="h-full rounded-full bg-emerald-500 transition-all"
                  style={{
                    width: `${(selectedPhotoCount / PHOTO_SLOTS.length) * 100}%`,
                  }}
                />
              </div>
            </div>

            <div className="grid gap-4 min-[460px]:grid-cols-2 xl:grid-cols-3">
              {PHOTO_SLOTS.map((slot, index) => {
                const Icon = slot.icon;
                const selectedPhoto = photos[slot.key];
                const slotHasError = errors.photos[slot.key];

                return (
                  <div
                    key={slot.key}
                    className={clsx(
                      "rounded-3xl border p-4 transition",
                      selectedPhoto
                        ? "border-emerald-200 bg-emerald-50/50"
                        : "border-slate-200 bg-white",
                    )}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-3">
                        <div className="rounded-2xl bg-slate-100 p-2.5 text-slate-600">
                          <Icon className="h-4 w-4" />
                        </div>
                        <div>
                          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                            Photo {index + 1}
                          </p>
                          <h3 className="mt-1 text-base font-semibold text-slate-950">
                            {slot.label}
                          </h3>
                        </div>
                      </div>
                      <span className="rounded-full bg-rose-50 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-rose-700">
                        Required
                      </span>
                    </div>

                    <p className="mt-3 text-sm leading-6 text-slate-600">
                      {slot.instruction}
                    </p>

                    <div className="mt-4 overflow-hidden rounded-3xl border border-dashed border-slate-300 bg-slate-50">
                      {selectedPhoto ? (
                        <img
                          src={selectedPhoto.previewUrl}
                          alt={`${slot.label} preview`}
                          className="aspect-[4/3] w-full object-cover"
                        />
                      ) : (
                        <div className="flex aspect-[4/3] flex-col items-center justify-center gap-3 px-4 text-center text-slate-500">
                          <ImagePlus className="h-7 w-7" />
                          <div>
                            <p className="text-sm font-semibold text-slate-700">
                              No photo selected
                            </p>
                            <p className="mt-1 text-xs leading-5">
                              Open the camera or choose an image from the
                              device.
                            </p>
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="mt-4 space-y-3">
                      {selectedPhoto ? (
                        <div className="flex items-center justify-between rounded-2xl bg-white px-3 py-2 text-sm shadow-sm ring-1 ring-emerald-100">
                          <div className="flex items-center gap-2 text-emerald-700">
                            <CheckCircle2 className="h-4 w-4" />
                            <span className="font-semibold">Photo selected</span>
                          </div>
                          <span className="text-xs text-slate-500">
                            {getPhotoSelectionLabel(selectedPhoto)}
                          </span>
                        </div>
                      ) : null}

                      <input
                        ref={(node) => {
                          fileInputRefs.current[slot.key] = node;
                        }}
                        type="file"
                        accept="image/*"
                        capture="environment"
                        className="hidden"
                        disabled={isReadOnlyMode}
                        onChange={(event) => {
                          handlePhotoSelected(
                            slot.key,
                            event.target.files?.[0] ?? null,
                          );
                        }}
                      />

                      <button
                        type="button"
                        onClick={() => handleReplacePhoto(slot.key)}
                        disabled={isReadOnlyMode}
                        className={clsx(
                          "inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl px-4 text-sm font-semibold transition",
                          selectedPhoto
                            ? "border border-slate-300 bg-white text-slate-800 hover:border-slate-400"
                            : "bg-slate-950 text-white hover:bg-slate-800",
                        )}
                      >
                        {selectedPhoto ? (
                          <>
                            <RefreshCw className="h-4 w-4" />
                            {isReadOnlyMode ? "Photo locked" : "Retake / Replace"}
                          </>
                        ) : (
                          <>
                            <Camera className="h-4 w-4" />
                            {isReadOnlyMode
                              ? "Photo locked"
                              : "Upload / Take photo"}
                          </>
                        )}
                      </button>

                      {slotHasError ? (
                        <p className="flex items-center gap-2 text-sm text-rose-600">
                          <AlertCircle className="h-4 w-4" />
                          {slotHasError}
                        </p>
                      ) : null}
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          <section className="rounded-[1.75rem] border border-slate-200 bg-white p-5 shadow-[0_24px_80px_-48px_rgba(15,23,42,0.5)] sm:p-6">
            <div className="mb-5 flex items-start gap-4">
              <div className="rounded-2xl bg-amber-50 p-3 text-amber-700">
                <ShieldCheck className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-amber-700">
                  Section C
                </p>
                <h2 className="mt-1 text-xl font-semibold text-slate-950">
                  Vehicle Condition
                </h2>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  Capture quick condition notes for the pre-work inspection.
                </p>
              </div>
            </div>

            <div className="grid gap-6">
              <BooleanChoiceField
                label="Any visible damage?"
                value={visibleDamage}
                onChange={setVisibleDamage}
                helperText="Record whether any dents, scratches, or panel damage are visible."
                disabled={isReadOnlyMode}
              />
              <BooleanChoiceField
                label="Any warning lights visible?"
                value={warningLights}
                onChange={setWarningLights}
                helperText="Confirm whether any dashboard warning lights are showing at arrival."
                disabled={isReadOnlyMode}
              />

              <label className="space-y-2">
                <span className="text-sm font-semibold text-slate-900">
                  Notes
                  <span className="ml-2 text-xs font-medium uppercase tracking-[0.14em] text-slate-400">
                    Optional
                  </span>
                </span>
                <textarea
                  value={notes}
                  onChange={(event) => setNotes(event.target.value)}
                  rows={4}
                  placeholder="Add any useful inspection notes for the team."
                  disabled={isReadOnlyMode}
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-base text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-sky-400 focus:bg-white focus:ring-4 focus:ring-sky-100"
                />
              </label>
            </div>
          </section>
        </div>

        <div className="pointer-events-none fixed inset-x-0 bottom-0 z-30 px-3 pb-3 sm:px-6">
          <section className="pointer-events-auto mx-auto w-full max-w-5xl rounded-[1.75rem] border border-slate-200 bg-white/95 p-4 shadow-[0_24px_90px_-40px_rgba(15,23,42,0.55)] backdrop-blur">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="space-y-2">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                  Step 1 of 2
                </p>
                <div>
                  <p className="text-sm font-semibold text-slate-900">
                    {selectedPhotoCount} of {PHOTO_SLOTS.length} required photos
                    ready
                  </p>
                  <p className="text-xs text-slate-500">
                    {isSubmitting
                      ? submitStage || "Submitting vehicle check-in..."
                      : isReviewMode
                        ? "Review mode only. Mechanics complete or update this step."
                        : isCheckInLocked
                        ? "This check-in is locked because the job is already closed."
                        : existingCheckIn
                          ? "Update the saved check-in if anything needs to change."
                          : "Complete all required photos to submit this step."}
                  </p>
                </div>
              </div>

              <button
                type="submit"
                disabled={!canSubmit || isReadOnlyMode}
                className={clsx(
                  "inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl px-5 text-sm font-semibold transition sm:min-w-56",
                  canSubmit && !isReadOnlyMode
                    ? "bg-slate-950 text-white hover:bg-slate-800"
                    : "cursor-not-allowed bg-slate-200 text-slate-500",
                )}
              >
                {isSubmitting ? (
                  <>
                    <LoaderCircle className="h-4 w-4 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  <>
                    {isReviewMode
                      ? "Review only"
                      : existingCheckIn
                        ? "Update Check-In"
                        : "Submit Check-In"}
                    {!isReviewMode ? <ChevronRight className="h-4 w-4" /> : null}
                  </>
                )}
              </button>
            </div>

            {submitError ? (
              <div className="mt-4 flex items-start gap-3 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                <p>{submitError}</p>
              </div>
            ) : null}
          </section>
        </div>
      </form>
    </main>
  );
}

export default VehicleCheckInPage;
