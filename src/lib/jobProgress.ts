import type { JobStatus } from "./jobs";

export type DerivedJobProgressStatus =
  | "assigned"
  | "scheduled"
  | "check_in_pending"
  | "checked_in"
  | "in_progress"
  | "work_completed"
  | "completed"
  | "cancelled";

export function deriveJobProgressStatus(
  jobStatus: JobStatus,
  hasCheckIn: boolean,
  completedChecklistItems: number,
  totalChecklistItems: number,
): DerivedJobProgressStatus {
  if (jobStatus === "cancelled") {
    return "cancelled";
  }

  if (jobStatus === "completed") {
    return "completed";
  }

  if (jobStatus === "scheduled") {
    return hasCheckIn ? "checked_in" : "scheduled";
  }

  if (!hasCheckIn) {
    return "check_in_pending";
  }

  if (jobStatus === "in_progress") {
    if (totalChecklistItems === 0) {
      return "in_progress";
    }

    if (completedChecklistItems >= totalChecklistItems) {
      return "work_completed";
    }

    return "in_progress";
  }

  if (totalChecklistItems === 0) {
    return "checked_in";
  }

  if (completedChecklistItems === 0) {
    return "checked_in";
  }

  if (completedChecklistItems < totalChecklistItems) {
    return "in_progress";
  }

  return "work_completed";
}

const visibleLocationStatuses = new Set<DerivedJobProgressStatus>([
  "assigned",
  "scheduled",
  "check_in_pending",
  "checked_in",
  "in_progress",
]);

export function canViewJobLocation(status: DerivedJobProgressStatus): boolean {
  return visibleLocationStatuses.has(status);
}
