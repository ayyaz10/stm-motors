import {
  getAvailabilityWindowTimes,
  normalizeAvailabilityDays,
  type BookingAvailabilityDay,
} from "./availability";

describe("availability normalization", () => {
  test("deduplicates dates, grouped windows, and exact slots", () => {
    const result = normalizeAvailabilityDays([
      {
        date: "2026-05-06",
        grouped_windows: ["morning", "morning"],
        exact_slots: [
          {
            id: "16:00-18:00",
            label: "4-6 PM",
            start_time: "16:00",
            end_time: "18:00",
          },
          {
            id: "16:00-18:00",
            label: "4-6 PM",
            start_time: "16:00",
            end_time: "18:00",
          },
        ],
      },
      {
        date: "2026-05-06",
        grouped_windows: [],
        exact_slots: [
          {
            id: "18:00-20:00",
            label: "6-8 PM",
            start_time: "18:00",
            end_time: "20:00",
          },
        ],
      },
    ]);

    expect(result).toEqual([
      {
        date: "2026-05-06",
        grouped_windows: ["morning"],
        exact_slots: [
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
        ],
      },
    ]);
  });

  test("treats all day as the canonical superseding selection", () => {
    const result = normalizeAvailabilityDays([
      {
        date: "2026-05-06",
        grouped_windows: ["morning", "all_day", "evening"],
        exact_slots: [
          {
            id: "08:00-10:00",
            label: "8-10 AM",
            start_time: "08:00",
            end_time: "10:00",
          },
        ],
      },
    ]);

    expect(result).toEqual([
      {
        date: "2026-05-06",
        grouped_windows: ["all_day"],
        exact_slots: [],
      },
    ]);
  });

  test("removes exact slots covered by selected grouped windows", () => {
    const result = normalizeAvailabilityDays([
      {
        date: "2026-05-06",
        grouped_windows: ["morning"],
        exact_slots: [
          {
            id: "08:00-10:00",
            label: "8-10 AM",
            start_time: "08:00",
            end_time: "10:00",
          },
          {
            id: "12:00-14:00",
            label: "12-2 PM",
            start_time: "12:00",
            end_time: "14:00",
          },
        ],
      },
    ]);

    expect(result[0]?.exact_slots.map((slot) => slot.id)).toEqual([
      "12:00-14:00",
    ]);
  });

  test("keeps exact-slot-only availability valid and canonical", () => {
    const result = normalizeAvailabilityDays([
      {
        date: "2026-05-06",
        grouped_windows: [],
        exact_slots: [
          {
            id: "08:00-10:00",
            label: "Wrong label is replaced",
            start_time: "00:00",
            end_time: "00:00",
          },
        ],
      },
    ]);

    expect(result).toEqual([
      {
        date: "2026-05-06",
        grouped_windows: [],
        exact_slots: [
          {
            id: "08:00-10:00",
            label: "8-10 AM",
            start_time: "08:00",
            end_time: "10:00",
          },
        ],
      },
    ]);
  });

  test("rejects malformed dates and unknown slots", () => {
    const result = normalizeAvailabilityDays([
      {
        date: "2026-02-31",
        grouped_windows: ["morning"],
        exact_slots: [],
      },
      {
        date: "2026-05-06",
        grouped_windows: ["not_real"],
        exact_slots: ["bad-slot"],
      },
    ] as unknown as BookingAvailabilityDay[]);

    expect(result).toEqual([]);
  });

  test("can filter dates before the minimum selectable date", () => {
    const result = normalizeAvailabilityDays(
      [
        {
          date: "2026-05-05",
          grouped_windows: ["morning"],
          exact_slots: [],
        },
        {
          date: "2026-05-06",
          grouped_windows: ["evening"],
          exact_slots: [],
        },
      ],
      { minDate: "2026-05-06" },
    );

    expect(result.map((day) => day.date)).toEqual(["2026-05-06"]);
  });
});

describe("availability window parsing", () => {
  test("parses exact slot keys that contain colon characters", () => {
    expect(getAvailabilityWindowTimes("slot:08:00-10:00")).toEqual({
      start_time: "08:00",
      end_time: "10:00",
    });
  });

  test("parses grouped window keys", () => {
    expect(getAvailabilityWindowTimes("group:afternoon")).toEqual({
      start_time: "12:00",
      end_time: "16:00",
    });
  });

  test("rejects unknown window keys", () => {
    expect(getAvailabilityWindowTimes("slot:08")).toBeNull();
    expect(getAvailabilityWindowTimes("group:not-real")).toBeNull();
  });
});
