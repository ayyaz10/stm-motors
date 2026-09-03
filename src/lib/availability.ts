export type AvailabilityGroupId =
  | "all_day"
  | "morning"
  | "afternoon"
  | "evening";

export type AvailabilitySlotId =
  | "08:00-10:00"
  | "10:00-12:00"
  | "12:00-14:00"
  | "14:00-16:00"
  | "16:00-18:00"
  | "18:00-20:00";

export interface AvailabilitySlot {
  id: AvailabilitySlotId;
  label: string;
  start_time: string;
  end_time: string;
}

export interface AvailabilityGroup {
  id: AvailabilityGroupId;
  label: string;
  helper: string;
  slotIds: AvailabilitySlotId[];
}

export interface BookingAvailabilityDay {
  date: string;
  grouped_windows: AvailabilityGroupId[];
  exact_slots: AvailabilitySlot[];
}

export interface BookingAvailabilityState {
  dates: BookingAvailabilityDay[];
  mechanicNote: string;
}

interface NormalizeAvailabilityOptions {
  minDate?: string;
}

export interface AvailabilityWindow {
  date: string;
  start_time: string;
  end_time: string;
}

export type AvailabilityWindowKey =
  | `group:${AvailabilityGroupId}`
  | `slot:${AvailabilitySlotId}`;

export type AvailabilityBlockType = "closed" | "manual_hold" | "scheduled_job";

export interface AvailabilityBlock extends AvailabilityWindow {
  id: string;
  block_type: AvailabilityBlockType;
  reason: string | null;
  source_job_id?: string | null;
  created_at?: string;
}

export interface AvailabilityScheduleOption extends AvailabilityWindow {
  id: string;
  label: string;
  dateLabel: string;
  source: "customer_availability";
}

export const AVAILABILITY_GROUP_WINDOW_TIMES: Record<
  AvailabilityGroupId,
  { start_time: string; end_time: string }
> = {
  all_day: {
    start_time: "08:00",
    end_time: "20:00",
  },
  morning: {
    start_time: "08:00",
    end_time: "12:00",
  },
  afternoon: {
    start_time: "12:00",
    end_time: "16:00",
  },
  evening: {
    start_time: "16:00",
    end_time: "20:00",
  },
};

export const AVAILABILITY_SLOTS: AvailabilitySlot[] = [
  {
    id: "08:00-10:00",
    label: "8-10 AM",
    start_time: "08:00",
    end_time: "10:00",
  },
  {
    id: "10:00-12:00",
    label: "10-12 AM",
    start_time: "10:00",
    end_time: "12:00",
  },
  {
    id: "12:00-14:00",
    label: "12-2 PM",
    start_time: "12:00",
    end_time: "14:00",
  },
  {
    id: "14:00-16:00",
    label: "2-4 PM",
    start_time: "14:00",
    end_time: "16:00",
  },
  {
    id: "16:00-18:00",
    label: "4-6 PM",
    start_time: "16:00",
    end_time: "18:00",
  },
  {
    id: "18:00-20:00",
    label: "6-8 PM",
    start_time: "18:00",
    end_time: "20:00",
  },
];

export const AVAILABILITY_GROUPS: AvailabilityGroup[] = [
  {
    id: "all_day",
    label: "All day",
    helper: "Any time on this date",
    slotIds: AVAILABILITY_SLOTS.map((slot) => slot.id),
  },
  {
    id: "morning",
    label: "Morning",
    helper: "8 AM to 12 PM",
    slotIds: ["08:00-10:00", "10:00-12:00"],
  },
  {
    id: "afternoon",
    label: "Afternoon",
    helper: "12 PM to 4 PM",
    slotIds: ["12:00-14:00", "14:00-16:00"],
  },
  {
    id: "evening",
    label: "Evening",
    helper: "4 PM to 8 PM",
    slotIds: ["16:00-18:00", "18:00-20:00"],
  },
];

export const INITIAL_BOOKING_AVAILABILITY: BookingAvailabilityState = {
  dates: [],
  mechanicNote: "",
};

const slotById = new Map(AVAILABILITY_SLOTS.map((slot) => [slot.id, slot]));
const groupById = new Map(AVAILABILITY_GROUPS.map((group) => [group.id, group]));
const dateKeyPattern = /^\d{4}-\d{2}-\d{2}$/;

export function getAvailabilitySlot(slotId: string): AvailabilitySlot | null {
  return slotById.get(slotId as AvailabilitySlotId) ?? null;
}

export function getAvailabilityGroup(
  groupId: string,
): AvailabilityGroup | null {
  return groupById.get(groupId as AvailabilityGroupId) ?? null;
}

export function getAvailabilityWindowTimes(
  windowKey: string,
): { start_time: string; end_time: string } | null {
  const separatorIndex = windowKey.indexOf(":");

  if (separatorIndex < 1) {
    return null;
  }

  const type = windowKey.slice(0, separatorIndex);
  const value = windowKey.slice(separatorIndex + 1);

  if (type === "group" && isAvailabilityGroupId(value)) {
    return AVAILABILITY_GROUP_WINDOW_TIMES[value];
  }

  if (type === "slot") {
    const slot = getAvailabilitySlot(value);

    return slot
      ? {
          start_time: slot.start_time,
          end_time: slot.end_time,
        }
      : null;
  }

  return null;
}

export function isAvailabilitySlotId(
  slotId: string,
): slotId is AvailabilitySlotId {
  return slotById.has(slotId as AvailabilitySlotId);
}

export function isAvailabilityGroupId(
  groupId: string,
): groupId is AvailabilityGroupId {
  return groupById.has(groupId as AvailabilityGroupId);
}

export function isAvailabilityDateKey(date: string): boolean {
  if (!dateKeyPattern.test(date)) {
    return false;
  }

  const parsedDate = new Date(`${date}T00:00:00`);

  return !Number.isNaN(parsedDate.getTime()) && toDateKey(parsedDate) === date;
}

function toDateKey(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

export function formatAvailabilityDate(date: string): string {
  return new Intl.DateTimeFormat("en-GB", {
    weekday: "short",
    day: "numeric",
    month: "short",
  }).format(new Date(`${date}T00:00:00`));
}

export function normalizeAvailabilityDays(
  dates: BookingAvailabilityDay[],
  options: NormalizeAvailabilityOptions = {},
): BookingAvailabilityDay[] {
  const normalizedByDate = new Map<string, BookingAvailabilityDay>();

  dates.forEach((day) => {
    if (
      !day ||
      !isAvailabilityDateKey(day.date) ||
      (options.minDate && day.date < options.minDate)
    ) {
      return;
    }

    const existingDay = normalizedByDate.get(day.date) ?? {
      date: day.date,
      grouped_windows: [],
      exact_slots: [],
    };
    const groupedWindows = Array.isArray(day.grouped_windows)
      ? (day.grouped_windows as unknown[])
      : [];
    const exactSlots = Array.isArray(day.exact_slots)
      ? (day.exact_slots as unknown[])
      : [];

    normalizedByDate.set(day.date, {
      date: day.date,
      grouped_windows: [
        ...existingDay.grouped_windows,
        ...groupedWindows.filter(
          (groupId): groupId is AvailabilityGroupId =>
            typeof groupId === "string" && isAvailabilityGroupId(groupId),
        ),
      ],
      exact_slots: [
        ...existingDay.exact_slots,
        ...exactSlots
          .map((slot) => {
            if (typeof slot === "string") {
              return getAvailabilitySlot(slot);
            }

            if (slot && typeof slot === "object" && "id" in slot) {
              return getAvailabilitySlot(String(slot.id));
            }

            return null;
          })
          .filter((slot): slot is AvailabilitySlot => Boolean(slot)),
      ],
    });
  });

  return Array.from(normalizedByDate.values())
    .map((day) => {
      const hasAllDay = day.grouped_windows.includes("all_day");
      const grouped_windows = hasAllDay
        ? (["all_day"] as AvailabilityGroupId[])
        : Array.from(
            new Set(
              day.grouped_windows.filter((groupId) => groupId !== "all_day"),
            ),
          );
      const coveredSlotIds = new Set(
        grouped_windows.flatMap((groupId) => groupById.get(groupId)?.slotIds ?? []),
      );
      const exact_slots = hasAllDay
        ? []
        : Array.from(
            new Set(
              day.exact_slots
                .map((slot) => slot.id)
                .filter((slotId) => slotById.has(slotId) && !coveredSlotIds.has(slotId)),
            ),
          )
            .map((slotId) => slotById.get(slotId))
            .filter((slot): slot is AvailabilitySlot => Boolean(slot));

      return {
        date: day.date,
        grouped_windows,
        exact_slots,
      };
    })
    .filter(
      (day) =>
        day.grouped_windows.length > 0 || day.exact_slots.length > 0,
    )
    .sort((left, right) => left.date.localeCompare(right.date));
}

export function isAvailabilityComplete(
  availability: BookingAvailabilityState,
): boolean {
  return normalizeAvailabilityDays(availability.dates).length > 0;
}

export function getAvailabilityDateCount(
  availability: BookingAvailabilityState,
): number {
  return normalizeAvailabilityDays(availability.dates).length;
}

export function formatAvailabilityDaySummary(
  day: BookingAvailabilityDay,
): string {
  const normalizedDay = normalizeAvailabilityDays([day])[0];

  if (!normalizedDay) {
    return "";
  }

  const groupLabels = normalizedDay.grouped_windows
    .map((groupId) => getAvailabilityGroup(groupId)?.label)
    .filter(Boolean);
  const slotLabels = normalizedDay.exact_slots.map((slot) => slot.label);

  return [...groupLabels, ...slotLabels].join(", ");
}

export function buildAvailabilityScheduleOptions(
  availability: BookingAvailabilityDay[],
): AvailabilityScheduleOption[] {
  return availability.flatMap((day) => {
    const dateLabel = formatAvailabilityDate(day.date);
    const groupOptions = day.grouped_windows.map((groupId) => {
      const group = getAvailabilityGroup(groupId);
      const windowTimes = AVAILABILITY_GROUP_WINDOW_TIMES[groupId];

      return {
        id: `${day.date}-${groupId}`,
        source: "customer_availability" as const,
        date: day.date,
        dateLabel,
        start_time: windowTimes.start_time,
        end_time: windowTimes.end_time,
        label: group?.label ?? groupId,
      };
    });
    const slotOptions = day.exact_slots.map((slot) => ({
      id: `${day.date}-${slot.id}`,
      source: "customer_availability" as const,
      date: day.date,
      dateLabel,
      start_time: slot.start_time,
      end_time: slot.end_time,
      label: slot.label,
    }));

    return [...groupOptions, ...slotOptions];
  });
}

export function doAvailabilityWindowsOverlap(
  left: AvailabilityWindow,
  right: AvailabilityWindow,
): boolean {
  if (left.date !== right.date) {
    return false;
  }

  return left.start_time < right.end_time && right.start_time < left.end_time;
}

export function isAvailabilityWindowBlocked(
  window: AvailabilityWindow,
  blocks: AvailabilityBlock[],
): boolean {
  return blocks.some((block) => doAvailabilityWindowsOverlap(window, block));
}

export function getBlockedAvailabilityReason(
  window: AvailabilityWindow,
  blocks: AvailabilityBlock[],
): string | null {
  const block = blocks.find((item) => doAvailabilityWindowsOverlap(window, item));

  if (!block) return null;
  if (block.block_type === "scheduled_job") return "Booked";
  if (block.block_type === "manual_hold") return "On hold";

  return "Unavailable";
}
