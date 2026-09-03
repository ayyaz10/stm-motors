import {
  ArrowRight,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Clock,
  X,
} from "lucide-react";
import clsx from "clsx";
import {
  useState,
  useEffect,
  useMemo,
  useRef,
  type ChangeEvent,
  type Dispatch,
  type SetStateAction,
} from "react";
import {
  AVAILABILITY_GROUPS,
  AVAILABILITY_GROUP_WINDOW_TIMES,
  AVAILABILITY_SLOTS,
  getBlockedAvailabilityReason,
  getAvailabilityGroup,
  getAvailabilitySlot,
  isAvailabilityWindowBlocked,
  normalizeAvailabilityDays,
  type AvailabilityBlock,
  type AvailabilityGroupId,
  type AvailabilitySlotId,
  type BookingAvailabilityDay,
  type BookingAvailabilityState,
} from "../../lib/availability";
import { fetchPublicUnavailableWindows } from "../../lib/availabilityBlocks";

interface AvailabilitySelectionProps {
  availability: BookingAvailabilityState;
  setAvailability: Dispatch<SetStateAction<BookingAvailabilityState>>;
  goToNextStep: () => void;
  goToPreviousStep: () => void;
}

const sectionCardClassName =
  "rounded-2xl border border-blue-100 bg-white p-4 shadow-sm sm:p-5 lg:p-6";

const toDateKey = (date: Date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
};

const startOfToday = () => {
  const date = new Date();

  date.setHours(0, 0, 0, 0);
  return date;
};

const addDays = (date: Date, dayCount: number) => {
  const nextDate = new Date(date);

  nextDate.setDate(nextDate.getDate() + dayCount);
  return nextDate;
};

const startOfMonth = (date: Date) => {
  const nextDate = new Date(date.getFullYear(), date.getMonth(), 1);

  nextDate.setHours(0, 0, 0, 0);
  return nextDate;
};

const endOfMonth = (date: Date) => {
  const nextDate = new Date(date.getFullYear(), date.getMonth() + 1, 0);

  nextDate.setHours(0, 0, 0, 0);
  return nextDate;
};

const addMonths = (date: Date, monthCount: number) => {
  const nextDate = new Date(date.getFullYear(), date.getMonth() + monthCount, 1);

  nextDate.setHours(0, 0, 0, 0);
  return nextDate;
};

const getCalendarGridStart = (date: Date) => {
  const firstDayOfMonth = startOfMonth(date);

  return addDays(firstDayOfMonth, -firstDayOfMonth.getDay());
};

const formatRangeDate = (date: Date) =>
  new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
  }).format(date);

const formatMonthLabel = (date: Date) =>
  new Intl.DateTimeFormat("en-GB", {
    month: "long",
    year: "numeric",
  }).format(date);

const formatDateCard = (date: Date) => ({
  day: new Intl.DateTimeFormat("en-GB", { day: "numeric" }).format(date),
  weekday: new Intl.DateTimeFormat("en-GB", { weekday: "short" }).format(date),
  month: new Intl.DateTimeFormat("en-GB", { month: "short" }).format(date),
});

function getEmptyDay(date: string): BookingAvailabilityDay {
  return {
    date,
    grouped_windows: [],
    exact_slots: [],
  };
}

function hasDaySelection(day: BookingAvailabilityDay): boolean {
  return day.grouped_windows.length > 0 || day.exact_slots.length > 0;
}

function getGroupWindow(date: string, groupId: AvailabilityGroupId) {
  const groupWindow = AVAILABILITY_GROUP_WINDOW_TIMES[groupId];

  return {
    date,
    start_time: groupWindow.start_time,
    end_time: groupWindow.end_time,
  };
}

function AvailabilitySelection({
  availability,
  setAvailability,
  goToNextStep,
  goToPreviousStep,
}: AvailabilitySelectionProps) {
  const [visibleStartDate, setVisibleStartDate] = useState(startOfToday);
  const [mobileDayIndex, setMobileDayIndex] = useState(0);
  const [error, setError] = useState("");
  const [blockedWindows, setBlockedWindows] = useState<AvailabilityBlock[]>([]);
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);
  const [calendarMonth, setCalendarMonth] = useState(() =>
    startOfMonth(startOfToday()),
  );
  const [calendarMonthBlocks, setCalendarMonthBlocks] = useState<AvailabilityBlock[]>([]);
  const [isLoadingCalendarMonthBlocks, setIsLoadingCalendarMonthBlocks] =
    useState(false);
  const [calendarMonthLoadError, setCalendarMonthLoadError] = useState("");
  const [isLoadingBlocks, setIsLoadingBlocks] = useState(false);
  const [blockLoadError, setBlockLoadError] = useState("");
  const datePickerRef = useRef<HTMLDivElement | null>(null);
  const todayKey = toDateKey(startOfToday());
  const normalizedDates = normalizeAvailabilityDays(availability.dates, {
    minDate: todayKey,
  });
  const selectedDateCount = normalizedDates.length;
  const daysByDate = new Map(normalizedDates.map((day) => [day.date, day]));
  const visibleDates = useMemo(
    () => Array.from({ length: 7 }, (_, index) => addDays(visibleStartDate, index)),
    [visibleStartDate],
  );
  const visibleRangeLabel = `${formatRangeDate(visibleDates[0])} - ${formatRangeDate(
    visibleDates[visibleDates.length - 1],
  )} ${visibleDates[visibleDates.length - 1].getFullYear()}`;
  const canGoPrevious = toDateKey(visibleStartDate) > todayKey;
  const mobileVisibleDate = visibleDates[mobileDayIndex] ?? visibleDates[0];
  const canGoPreviousDay = mobileDayIndex > 0 || canGoPrevious;
  const visibleRangeStartKey = toDateKey(visibleDates[0]);
  const visibleRangeEndKey = toDateKey(visibleDates[visibleDates.length - 1]);
  const calendarGridDates = useMemo(
    () =>
      Array.from({ length: 42 }, (_, index) =>
        addDays(getCalendarGridStart(calendarMonth), index),
      ),
    [calendarMonth],
  );

  useEffect(() => {
    let isActive = true;

    const loadBlockedWindows = async () => {
      try {
        setIsLoadingBlocks(true);
        setBlockLoadError("");

        const nextBlocks = await fetchPublicUnavailableWindows(
          toDateKey(visibleDates[0]),
          toDateKey(visibleDates[visibleDates.length - 1]),
        );

        if (isActive) {
          setBlockedWindows(nextBlocks);
        }
      } catch (loadError) {
        if (isActive) {
          setBlockedWindows([]);
          setBlockLoadError(
            loadError instanceof Error
              ? loadError.message
              : "Unable to load unavailable times.",
          );
        }
      } finally {
        if (isActive) {
          setIsLoadingBlocks(false);
        }
      }
    };

    void loadBlockedWindows();

    return () => {
      isActive = false;
    };
  }, [visibleDates]);

  useEffect(() => {
    if (!isDatePickerOpen) {
      return;
    }

    let isActive = true;

    const loadCalendarMonthBlocks = async () => {
      try {
        setIsLoadingCalendarMonthBlocks(true);
        setCalendarMonthLoadError("");

        const nextBlocks = await fetchPublicUnavailableWindows(
          toDateKey(startOfMonth(calendarMonth)),
          toDateKey(endOfMonth(calendarMonth)),
        );

        if (isActive) {
          setCalendarMonthBlocks(nextBlocks);
        }
      } catch (loadError) {
        if (isActive) {
          setCalendarMonthBlocks([]);
          setCalendarMonthLoadError(
            loadError instanceof Error
              ? loadError.message
              : "Unable to load calendar availability.",
          );
        }
      } finally {
        if (isActive) {
          setIsLoadingCalendarMonthBlocks(false);
        }
      }
    };

    void loadCalendarMonthBlocks();

    return () => {
      isActive = false;
    };
  }, [calendarMonth, isDatePickerOpen]);

  useEffect(() => {
    if (!isDatePickerOpen) {
      return;
    }

    const handlePointerDown = (event: MouseEvent) => {
      if (!datePickerRef.current?.contains(event.target as Node)) {
        setIsDatePickerOpen(false);
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsDatePickerOpen(false);
      }
    };

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [isDatePickerOpen]);

  const updateAvailabilityDay = (
    date: string,
    updater: (day: BookingAvailabilityDay) => BookingAvailabilityDay,
  ) => {
    setAvailability((currentAvailability) => {
      const currentDays = normalizeAvailabilityDays(currentAvailability.dates, {
        minDate: todayKey,
      });
      const existingDay = currentDays.find((day) => day.date === date) ?? getEmptyDay(date);
      const updatedDay = updater(existingDay);
      const nextDays = currentDays
        .filter((day) => day.date !== date)
        .concat(hasDaySelection(updatedDay) ? updatedDay : []);

      return {
        ...currentAvailability,
        dates: normalizeAvailabilityDays(nextDays, { minDate: todayKey }),
      };
    });
    setError("");
  };

  const toggleGroup = (date: string, groupId: AvailabilityGroupId) => {
    if (isAvailabilityWindowBlocked(getGroupWindow(date, groupId), blockedWindows)) {
      setError("That availability window is currently unavailable.");
      return;
    }

    updateAvailabilityDay(date, (day) => {
      const isSelected = day.grouped_windows.includes(groupId);

      if (groupId === "all_day") {
        return isSelected
          ? getEmptyDay(date)
          : {
              date,
              grouped_windows: ["all_day"],
              exact_slots: [],
            };
      }

      const group = getAvailabilityGroup(groupId);
      const blockedSlotIds = new Set(group?.slotIds ?? []);
      const nextGroups = day.grouped_windows
        .filter((currentGroupId) => currentGroupId !== "all_day" && currentGroupId !== groupId)
        .concat(isSelected ? [] : [groupId]);

      return {
        date,
        grouped_windows: nextGroups,
        exact_slots: day.exact_slots.filter((slot) => !blockedSlotIds.has(slot.id)),
      };
    });
  };

  const toggleSlot = (date: string, slotId: AvailabilitySlotId) => {
    const slot = getAvailabilitySlot(slotId);

    if (!slot) return;

    if (
      isAvailabilityWindowBlocked(
        {
          date,
          start_time: slot.start_time,
          end_time: slot.end_time,
        },
        blockedWindows,
      )
    ) {
      setError("That time slot is currently unavailable.");
      return;
    }

    updateAvailabilityDay(date, (day) => {
      const isSelected = day.exact_slots.some((currentSlot) => currentSlot.id === slotId);
      const containingGroupIds = AVAILABILITY_GROUPS.filter((group) =>
        group.slotIds.includes(slotId),
      ).map((group) => group.id);

      return {
        date,
        grouped_windows: day.grouped_windows.filter(
          (groupId) =>
            groupId !== "all_day" && !containingGroupIds.includes(groupId),
        ),
        exact_slots: isSelected
          ? day.exact_slots.filter((currentSlot) => currentSlot.id !== slotId)
          : [...day.exact_slots, slot],
      };
    });
  };

  const handleNoteChange = (event: ChangeEvent<HTMLTextAreaElement>) => {
    setAvailability((currentAvailability) => ({
      ...currentAvailability,
      mechanicNote: event.target.value,
    }));
  };

  const clearAvailabilityDate = (date: string) => {
    updateAvailabilityDay(date, () => getEmptyDay(date));
  };

  const clearAllAvailability = () => {
    setAvailability((currentAvailability) => ({
      ...currentAvailability,
      dates: [],
    }));
    setError("");
  };

  const handleNext = () => {
    const normalizedAvailability = normalizeAvailabilityDays(availability.dates, {
      minDate: todayKey,
    });

    if (normalizedAvailability.length === 0) {
      setError("Select at least one date and one availability window before continuing.");
      return;
    }

    const hasBlockedSelection = normalizedAvailability.some((day) => {
      const groupedWindowBlocked = day.grouped_windows.some((groupId) =>
        isAvailabilityWindowBlocked(getGroupWindow(day.date, groupId), blockedWindows),
      );
      const exactSlotBlocked = day.exact_slots.some((slot) =>
        isAvailabilityWindowBlocked(
          {
            date: day.date,
            start_time: slot.start_time,
            end_time: slot.end_time,
          },
          blockedWindows,
        ),
      );

      return groupedWindowBlocked || exactSlotBlocked;
    });

    if (hasBlockedSelection) {
      setError(
        "One of your selected windows is no longer available. Please deselect it and choose another time.",
      );
      return;
    }

    setAvailability((currentAvailability) => ({
      ...currentAvailability,
      dates: normalizedAvailability,
    }));
    goToNextStep();
  };

  const showPreviousWeek = () => {
    setVisibleStartDate((current) => addDays(current, -7));
    setMobileDayIndex(0);
  };

  const showNextWeek = () => {
    setVisibleStartDate((current) => addDays(current, 7));
    setMobileDayIndex(0);
  };

  const showPreviousMobileDay = () => {
    if (mobileDayIndex > 0) {
      setMobileDayIndex((current) => current - 1);
      return;
    }

    if (canGoPrevious) {
      setVisibleStartDate((current) => addDays(current, -7));
      setMobileDayIndex(6);
    }
  };

  const showNextMobileDay = () => {
    if (mobileDayIndex < visibleDates.length - 1) {
      setMobileDayIndex((current) => current + 1);
      return;
    }

    setVisibleStartDate((current) => addDays(current, 7));
    setMobileDayIndex(0);
  };

  const openDateJumpPicker = () => {
    setCalendarMonth(startOfMonth(visibleStartDate));
    setIsDatePickerOpen((current) => !current);
  };

  const isDateSelectableInCalendar = (
    dateKey: string,
    blocks: AvailabilityBlock[],
  ) =>
    AVAILABILITY_SLOTS.some(
      (slot) =>
        !isAvailabilityWindowBlocked(
          {
            date: dateKey,
            start_time: slot.start_time,
            end_time: slot.end_time,
          },
          blocks,
        ),
    );

  const handleCalendarDateSelect = (date: Date) => {
    const nextDateValue = toDateKey(date);

    if (nextDateValue < todayKey) {
      return;
    }

    setVisibleStartDate(date);
    setMobileDayIndex(0);
    setIsDatePickerOpen(false);
  };

  const renderDayCard = (date: Date) => {
    const dateKey = toDateKey(date);
    const formattedDate = formatDateCard(date);
    const daySelection = daysByDate.get(dateKey) ?? getEmptyDay(dateKey);
    const dayHasSelection = hasDaySelection(daySelection);

    return (
      <article
        key={dateKey}
        className={clsx(
          "overflow-hidden rounded-2xl border bg-white shadow-sm",
          dayHasSelection ? "border-[#1c69d4]" : "border-slate-200",
        )}
      >
        <div
          className={clsx(
            "border-b px-3 py-4 text-center",
            dayHasSelection
              ? "border-blue-100 bg-blue-50"
              : "border-slate-200 bg-slate-50",
          )}
        >
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
            {formattedDate.month}
          </p>
          <p className="mt-1 text-3xl font-bold tracking-tight text-slate-950">
            {formattedDate.day}
          </p>
          <p className="mt-1 text-sm font-medium text-slate-600">
            {formattedDate.weekday}
          </p>
        </div>

        <div className="space-y-3 p-3">
          <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-1">
            {AVAILABILITY_GROUPS.map((group) => {
              const isSelected = daySelection.grouped_windows.includes(group.id);
              const blockedReason = getBlockedAvailabilityReason(
                getGroupWindow(dateKey, group.id),
                blockedWindows,
              );
              const isBlocked = Boolean(blockedReason);

              return (
                <button
                  key={group.id}
                  type="button"
                  onClick={() => toggleGroup(dateKey, group.id)}
                  disabled={isBlocked}
                  aria-pressed={isSelected}
                  className={clsx(
                    "min-h-12 rounded-xl border px-3 py-2 text-left text-sm font-semibold transition",
                    isSelected
                      ? "border-[#1c69d4] bg-[#1c69d4] text-white shadow-sm"
                      : isBlocked
                        ? "cursor-not-allowed border-slate-200 bg-slate-100 text-slate-400"
                        : "border-slate-200 bg-white text-slate-800 hover:border-[#1c69d4] hover:bg-blue-50 hover:text-[#1557b3]",
                  )}
                >
                  <span className="block">{group.label}</span>
                  <span
                    className={clsx(
                      "mt-0.5 block text-xs font-medium",
                      isSelected
                        ? "text-blue-50"
                        : isBlocked
                          ? "text-slate-400"
                          : "text-slate-500",
                    )}
                  >
                    {blockedReason ?? group.helper}
                  </span>
                </button>
              );
            })}
          </div>

          <div className="border-t border-slate-100 pt-3">
            <p className="mb-2 text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
              Exact slots
            </p>
            <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-1">
              {AVAILABILITY_SLOTS.map((slot) => {
                const isSelected = daySelection.exact_slots.some(
                  (selectedSlot) => selectedSlot.id === slot.id,
                );
                const isCoveredByGroup = daySelection.grouped_windows.some(
                  (groupId) =>
                    getAvailabilityGroup(groupId)?.slotIds.includes(slot.id),
                );
                const blockedReason = getBlockedAvailabilityReason(
                  {
                    date: dateKey,
                    start_time: slot.start_time,
                    end_time: slot.end_time,
                  },
                  blockedWindows,
                );
                const isBlocked = Boolean(blockedReason);

                return (
                  <button
                    key={slot.id}
                    type="button"
                    onClick={() => toggleSlot(dateKey, slot.id)}
                    disabled={isCoveredByGroup || isBlocked}
                    aria-pressed={isSelected}
                    title={blockedReason ?? undefined}
                    className={clsx(
                      "min-h-10 rounded-lg border px-3 text-center text-sm font-medium transition",
                      isSelected
                        ? "border-[#1c69d4] bg-[#1c69d4] text-white"
                        : isBlocked
                          ? "cursor-not-allowed border-slate-200 bg-slate-100 text-slate-400"
                          : isCoveredByGroup
                            ? "cursor-not-allowed border-blue-100 bg-blue-50 text-[#1557b3]"
                            : "border-slate-200 bg-white text-slate-700 hover:border-[#1c69d4] hover:bg-blue-50 hover:text-[#1557b3]",
                    )}
                  >
                    {blockedReason ?? slot.label}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </article>
    );
  };

  return (
    <div className="space-y-6">
      <section className={sectionCardClassName}>
        <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <div className="flex items-center gap-3">
              <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-[#1c69d4] text-sm font-semibold text-white">
                3
              </span>
              <h2 className="text-sm font-semibold uppercase tracking-[0.18em] text-[#1c69d4]">
                When is the vehicle available?
              </h2>
            </div>
            <p className="mt-4 max-w-2xl text-sm leading-6 text-[var(--public-muted)]">
              Select all of the times you are available across multiple days.
              More availability gives the mechanic more scheduling flexibility;
              your final assigned arrival window may differ.
            </p>
          </div>

          <div className="inline-flex items-center gap-2 rounded-full border border-blue-100 bg-blue-50 px-4 py-2 text-sm font-semibold text-[#1557b3]">
            <CalendarDays className="h-4 w-4" />
            {selectedDateCount} {selectedDateCount === 1 ? "date" : "dates"} selected
            {selectedDateCount > 0 ? (
              <button
                type="button"
                onClick={clearAllAvailability}
                className="inline-flex h-6 w-6 items-center justify-center rounded-full text-[#1557b3] transition hover:bg-white/80"
                aria-label="Clear selected availability"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            ) : null}
          </div>
        </div>

        <div className="mt-6 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm leading-6 text-amber-900">
          You are submitting availability windows, not booking an exact
          appointment time. We will confirm a scheduled arrival window after a
          mechanic has been assigned.
        </div>

        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div
            ref={datePickerRef}
            className="relative inline-flex w-full overflow-visible sm:w-auto"
          >
            <div className="inline-flex w-full overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm sm:w-auto">
              <button
                type="button"
                onClick={showPreviousWeek}
                disabled={!canGoPrevious}
                className="inline-flex min-h-11 w-12 items-center justify-center border-r border-slate-200 text-slate-600 disabled:bg-slate-50 disabled:text-slate-300"
                aria-label="Show previous week"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
              <button
                type="button"
                onClick={openDateJumpPicker}
                className="flex min-h-11 flex-1 items-center justify-center px-5 text-sm font-semibold text-slate-950 transition hover:bg-slate-50 sm:min-w-56"
                aria-label="Choose a specific date"
                aria-expanded={isDatePickerOpen}
                aria-haspopup="dialog"
              >
                {visibleRangeLabel}
              </button>
              <button
                type="button"
                onClick={showNextWeek}
                className="inline-flex min-h-11 w-12 items-center justify-center border-l border-slate-200 text-slate-600"
                aria-label="Show next week"
              >
                <ChevronRight className="h-5 w-5" />
              </button>
            </div>

            {isDatePickerOpen ? (
              <div
                className="absolute left-0 top-full z-30 mt-2 w-[19rem] max-w-[calc(100vw-2rem)] rounded-2xl border border-slate-200 bg-white p-3 shadow-[0_28px_80px_-48px_rgba(15,23,42,0.45)] sm:w-[21.5rem]"
                role="dialog"
                aria-label="Choose an available date"
              >
                <div className="flex items-center justify-between gap-3">
                  <button
                    type="button"
                    onClick={() => setCalendarMonth((current) => addMonths(current, -1))}
                    className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 transition hover:border-[#1c69d4] hover:text-[#1c69d4]"
                    aria-label="Show previous month"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </button>
                  <div className="min-w-0 text-center">
                    <p className="text-sm font-semibold text-slate-950">
                      {formatMonthLabel(calendarMonth)}
                    </p>
                    <p className="mt-1 text-xs text-slate-500">
                      Red dates are fully unavailable.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setCalendarMonth((current) => addMonths(current, 1))}
                    className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 transition hover:border-[#1c69d4] hover:text-[#1c69d4]"
                    aria-label="Show next month"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>

                <div className="mt-4 grid grid-cols-7 gap-1 text-center text-xs font-semibold uppercase tracking-[0.12em] text-slate-400">
                  {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((dayLabel) => (
                    <span key={dayLabel} className="py-2">
                      {dayLabel}
                    </span>
                  ))}
                </div>

                <div className="grid grid-cols-7 gap-1">
                  {calendarGridDates.map((date) => {
                    const dateKey = toDateKey(date);
                    const isInCurrentMonth =
                      date.getMonth() === calendarMonth.getMonth() &&
                      date.getFullYear() === calendarMonth.getFullYear();
                    const isPast = dateKey < todayKey;
                    const isWithinVisibleRange =
                      dateKey >= visibleRangeStartKey && dateKey <= visibleRangeEndKey;
                    const isVisibleStartDate = dateKey === toDateKey(visibleStartDate);
                    const canEvaluateAvailability =
                      isInCurrentMonth &&
                      !isPast &&
                      !isLoadingCalendarMonthBlocks &&
                      !calendarMonthLoadError;
                    const isUnavailable =
                      canEvaluateAvailability &&
                      !isDateSelectableInCalendar(dateKey, calendarMonthBlocks);
                    const isDisabled = isPast || isUnavailable;

                    return (
                      <button
                        key={dateKey}
                        type="button"
                        onClick={() => handleCalendarDateSelect(date)}
                        disabled={isDisabled}
                        className={clsx(
                          "inline-flex h-10 items-center justify-center rounded-xl border text-sm font-semibold transition",
                          !isInCurrentMonth
                            ? "border-transparent bg-transparent text-slate-300"
                            : isVisibleStartDate
                              ? "border-[#1c69d4] bg-[#1c69d4] text-white shadow-sm"
                              : isUnavailable
                                ? "cursor-not-allowed border-red-200 bg-red-50 text-red-500"
                                : isPast
                                  ? "cursor-not-allowed border-slate-100 bg-slate-50 text-slate-300"
                                  : isWithinVisibleRange
                                    ? "border-blue-100 bg-blue-50 text-[#1557b3]"
                                    : "border-slate-200 bg-white text-slate-700 hover:border-[#1c69d4] hover:bg-blue-50 hover:text-[#1557b3]",
                          isLoadingCalendarMonthBlocks && isInCurrentMonth && !isPast
                            ? "border-slate-200 bg-slate-50 text-slate-400"
                            : "",
                        )}
                        aria-label={new Intl.DateTimeFormat("en-GB", {
                          weekday: "long",
                          day: "numeric",
                          month: "long",
                          year: "numeric",
                        }).format(date)}
                      >
                        {date.getDate()}
                      </button>
                    );
                  })}
                </div>

                <div className="mt-4 flex items-center justify-between gap-3 text-xs text-slate-500">
                  <div className="flex items-center gap-2">
                    <span className="h-3 w-3 rounded-full bg-red-100 ring-1 ring-red-200" />
                    Fully unavailable
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="h-3 w-3 rounded-full bg-white ring-1 ring-slate-200" />
                    Available
                  </div>
                </div>

                {isLoadingCalendarMonthBlocks ? (
                  <p className="mt-3 text-xs text-slate-500">
                    Checking date availability...
                  </p>
                ) : null}

                {calendarMonthLoadError ? (
                  <p className="mt-3 text-xs text-amber-700">
                    Availability colors could not be loaded right now, but you can still jump to a date.
                  </p>
                ) : null}
              </div>
            ) : null}
          </div>

          <p className="inline-flex items-center gap-2 text-sm text-[var(--public-muted)]">
            <Clock className="h-4 w-4 text-[#1c69d4]" />
            {isLoadingBlocks
              ? "Checking unavailable times..."
              : "Pick grouped windows or exact 2-hour slots."}
          </p>
        </div>

        {blockLoadError ? (
          <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
            Availability blocks could not be checked right now. You can still
            continue, and we will confirm the final arrival window after review.
          </div>
        ) : null}

        <div className="mt-6 md:hidden">
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3 shadow-sm">
            <div className="flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={showPreviousMobileDay}
                disabled={!canGoPreviousDay}
                className="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 disabled:text-slate-300"
                aria-label="Show previous day"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>

              <div className="min-w-0 flex-1 text-center">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#1c69d4]">
                  Selected day
                </p>
                <p className="mt-1 text-sm font-semibold text-slate-950">
                  {new Intl.DateTimeFormat("en-GB", {
                    weekday: "long",
                    day: "numeric",
                    month: "short",
                  }).format(mobileVisibleDate)}
                </p>
              </div>

              <button
                type="button"
                onClick={showNextMobileDay}
                className="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 disabled:text-slate-300"
                aria-label="Show next day"
              >
                <ChevronRight className="h-5 w-5" />
              </button>
            </div>
          </div>

          <div className="mt-3">{renderDayCard(mobileVisibleDate)}</div>
        </div>

        <div className="mt-6 hidden gap-3 md:grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-7">
          {visibleDates.map((date) => renderDayCard(date))}
        </div>

        {normalizedDates.length > 0 ? (
          <div className="mt-5 rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <p className="text-sm font-semibold text-slate-950">
              Selected availability
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              {normalizedDates.map((day) => (
                <span
                  key={day.date}
                  className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-sm"
                >
                  {new Intl.DateTimeFormat("en-GB", {
                    weekday: "short",
                    day: "numeric",
                    month: "short",
                  }).format(new Date(`${day.date}T00:00:00`))}
                  <button
                    type="button"
                    onClick={() => clearAvailabilityDate(day.date)}
                    className="inline-flex h-4 w-4 items-center justify-center rounded-full bg-slate-100 text-slate-500 transition hover:bg-slate-200"
                    aria-label={`Remove availability for ${new Intl.DateTimeFormat("en-GB", {
                      weekday: "short",
                      day: "numeric",
                      month: "short",
                    }).format(new Date(`${day.date}T00:00:00`))}`}
                  >
                    <X className="h-3 w-3" />
                  </button>
                </span>
              ))}
            </div>
          </div>
        ) : null}

        <div className="mt-6 space-y-2">
          <label className="public-label" htmlFor="mechanic-note">
            Add a note for your mechanic
            <span className="ml-2 text-xs font-medium uppercase tracking-[0.14em] text-slate-400">
              Optional
            </span>
          </label>
          <textarea
            id="mechanic-note"
            className="public-input min-h-28 resize-y border border-[var(--public-border)]"
            value={availability.mechanicNote}
            onChange={handleNoteChange}
            placeholder="Access details, parking notes, or anything useful for scheduling."
          />
        </div>
      </section>

      {error ? (
        <div
          className="public-error-banner"
          role="alert"
        >
          {error}
        </div>
      ) : null}

      <div className="grid grid-cols-2 gap-3 sm:flex sm:flex-wrap sm:justify-between">
        <button
          type="button"
          onClick={goToPreviousStep}
          className="public-btn-secondary w-full sm:w-auto"
        >
          Previous
        </button>

        <button
          type="button"
          onClick={handleNext}
          className="public-btn-primary w-full sm:w-auto"
        >
          Continue
          <ArrowRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

export default AvailabilitySelection;
