import { useEffect, useMemo, useState } from "react";
import {
  X,
  Loader2,
  RotateCcw,
  CalendarDays,
  Clock3,
  Copy,
  Plus,
  Trash2,
  AlertCircle,
} from "lucide-react";

// ─────────────────────────────────────
// Constants
// ─────────────────────────────────────
const DAYS = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

const QUICK_PRESETS = [
  {
    label: "Morning",
    slots: [
      {
        start: "07:00",
        end: "12:00",
      },
    ],
  },

  {
    label: "Afternoon",
    slots: [
      {
        start: "13:00",
        end: "17:00",
      },
    ],
  },

  {
    label: "Whole Day",
    slots: [
      {
        start: "08:00",
        end: "18:00",
      },
    ],
  },
];

const EMPTY_AVAIL = {
  Monday: [],
  Tuesday: [],
  Wednesday: [],
  Thursday: [],
  Friday: [],
  Saturday: [],
};

// ─────────────────────────────────────
// Normalize Old + New Data
// ─────────────────────────────────────
const normalizeAvailability = (data) => {
  const normalized = { ...EMPTY_AVAIL };

  DAYS.forEach((day) => {
    const slots = data?.[day] || [];

    normalized[day] = slots.map((slot) => {

      // OLD STRING FORMAT
      // "7:00-9:00"
      if (typeof slot === "string") {
        const [start, end] =
          slot.split("-");

        return {
          start:
            start?.length === 4
              ? `0${start}`
              : start || "",

          end:
            end?.length === 4
              ? `0${end}`
              : end || "",
        };
      }

      // NEW OBJECT FORMAT
      return {
        start:
          slot?.start || "",

        end:
          slot?.end || "",
      };
    });
  });

  return normalized;
};

// ─────────────────────────────────────
// Component
// ─────────────────────────────────────
const SetAvailabilityModal = ({
  open,
  faculty,
  onClose,
  onSubmit,
}) => {

  const [availability, setAvailability] =
    useState(EMPTY_AVAIL);

  const [loading, setLoading] =
    useState(false);

  const [selectedDay, setSelectedDay] =
    useState("Monday");

  // ─────────────────────────────────────
  // Initialize Data
  // ─────────────────────────────────────
  useEffect(() => {
    if (open && faculty) {
      setAvailability(
        faculty.availability
          ? normalizeAvailability(
              faculty.availability
            )
          : EMPTY_AVAIL
      );
    }
  }, [open, faculty]);

  // ─────────────────────────────────────
  // Memo
  // ─────────────────────────────────────
  const totalSlots = useMemo(() => {
    return Object.values(
      availability
    ).reduce(
      (total, day) =>
        total + day.length,
      0
    );
  }, [availability]);

  const activeDays = useMemo(() => {
    return DAYS.filter(
      (day) =>
        availability[day]
          .length > 0
    ).length;
  }, [availability]);

  // IMPORTANT
  // Hooks must stay above return
  if (!open || !faculty)
    return null;

  // ─────────────────────────────────────
  // Slot Actions
  // ─────────────────────────────────────
  const addSlot = (day) => {
    setAvailability((prev) => {

      const last =
        prev[day][
          prev[day].length - 1
        ];

      const nextStart =
        last?.end || "07:00";

      return {
        ...prev,

        [day]: [
          ...prev[day],

          {
            start: nextStart,
            end: "",
          },
        ],
      };
    });
  };

  const updateSlot = (
    day,
    index,
    field,
    value
  ) => {
    setAvailability((prev) => ({
      ...prev,

      [day]: prev[day].map(
        (slot, i) =>
          i === index
            ? {
                ...slot,
                [field]: value,
              }
            : slot
      ),
    }));
  };

  const removeSlot = (
    day,
    index
  ) => {
    setAvailability((prev) => ({
      ...prev,

      [day]: prev[day].filter(
        (_, i) => i !== index
      ),
    }));
  };

  const clearDay = (day) => {
    setAvailability((prev) => ({
      ...prev,

      [day]: [],
    }));
  };

  const clearAll = () => {
    setAvailability(
      EMPTY_AVAIL
    );
  };

  const applyPreset = (
    slots
  ) => {
    setAvailability((prev) => ({
      ...prev,

      [selectedDay]:
        slots,
    }));
  };

  const copyToAllDays = () => {

    const source =
      availability[
        selectedDay
      ];

    if (
      source.length === 0
    )
      return;

    const updated = {};

    DAYS.forEach((day) => {
      updated[day] = [
        ...source,
      ];
    });

    setAvailability(updated);
  };

  // ─────────────────────────────────────
  // Validation
  // ─────────────────────────────────────
  const hasOverlap = (
    slots
  ) => {

    const sorted = [
      ...slots,
    ].sort((a, b) =>
      a.start.localeCompare(
        b.start
      )
    );

    for (
      let i = 1;
      i < sorted.length;
      i++
    ) {
      if (
        sorted[i].start <
        sorted[i - 1].end
      ) {
        return true;
      }
    }

    return false;
  };

  const validateSlots = (
    slots
  ) => {

    for (const slot of slots) {

      if (
        !slot.start ||
        !slot.end
      ) {
        return "Please complete all time fields.";
      }

      if (
        slot.start >=
        slot.end
      ) {
        return "End time must be later than start time.";
      }
    }

    if (
      hasOverlap(slots)
    ) {
      return "Overlapping schedules detected.";
    }

    return null;
  };

  const currentDayError =
    validateSlots(
      availability[
        selectedDay
      ]
    );

  // ─────────────────────────────────────
  // Utilities
  // ─────────────────────────────────────
  const formatTime = (
    time
  ) => {

    if (!time)
      return "--";

    const [
      hour,
      minute,
    ] = time.split(":");

    const h =
      parseInt(hour);

    return `${h % 12 || 12}:${minute} ${
      h >= 12
        ? "PM"
        : "AM"
    }`;
  };

  const getDuration = (
    start,
    end
  ) => {

    if (
      !start ||
      !end
    )
      return "--";

    const [sh, sm] =
      start
        .split(":")
        .map(Number);

    const [eh, em] =
      end
        .split(":")
        .map(Number);

    const mins =
      eh * 60 +
      em -
      (sh * 60 + sm);

    if (mins <= 0)
      return "--";

    const hrs =
      Math.floor(
        mins / 60
      );

    const remaining =
      mins % 60;

    if (remaining > 0) {
      return `${hrs} hr ${remaining} min`;
    }

    return `${hrs} hr${
      hrs > 1
        ? "s"
        : ""
    }`;
  };

  // ─────────────────────────────────────
  // Submit
  // ─────────────────────────────────────
  const handleSubmit =
    async () => {

      const hasErrors =
        DAYS.some(
          (day) =>
            validateSlots(
              availability[
                day
              ]
            )
        );

      if (hasErrors)
        return;

      setLoading(true);

      try {

        await onSubmit(
          faculty.id,
          availability
        );

      } finally {

        setLoading(false);
      }
    };

  // ─────────────────────────────────────
  // UI
  // ─────────────────────────────────────
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">

      <div className="bg-white w-full max-w-6xl rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[95vh]">

        {/* Header */}
        <div className="border-b border-gray-100 px-6 py-5 flex items-center justify-between">

          <div>
            <h2 className="text-xl font-bold text-gray-800">
              Set Faculty Availability
            </h2>

            <div className="flex items-center gap-2 mt-1 text-sm text-gray-500">
              <span>
                {faculty.name}
              </span>

              <span>
                •
              </span>

              <span>
                {activeDays} active day(s)
              </span>

              <span>
                •
              </span>

              <span>
                {totalSlots} slot(s)
              </span>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl hover:bg-gray-100 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Main */}
        <div className="flex flex-1 overflow-hidden">

          {/* Sidebar */}
          <div className="w-[240px] border-r border-gray-100 bg-gray-50 p-4 overflow-y-auto">

            <div className="flex items-center gap-2 mb-4">

              <CalendarDays
                size={16}
                className="text-pup-maroon"
              />

              <h3 className="text-sm font-semibold text-gray-700">
                Days
              </h3>
            </div>

            <div className="space-y-2">

              {DAYS.map(
                (day) => {

                  const active =
                    selectedDay ===
                    day;

                  const hasSlots =
                    availability[
                      day
                    ].length > 0;

                  return (
                    <button
                      key={day}
                      onClick={() =>
                        setSelectedDay(
                          day
                        )
                      }
                      className={`w-full flex items-center justify-between px-3 py-3 rounded-xl border text-sm transition-all ${
                        active
                          ? "bg-pup-maroon text-white border-pup-maroon"
                          : "bg-white border-gray-200 hover:border-pup-maroon/40"
                      }`}
                    >
                      <span>
                        {day}
                      </span>

                      {hasSlots && (
                        <span className={`text-[11px] px-2 py-0.5 rounded-full ${
                          active
                            ? "bg-white/20 text-white"
                            : "bg-green-100 text-green-700"
                        }`}>
                          {
                            availability[
                              day
                            ]
                              .length
                          }
                        </span>
                      )}
                    </button>
                  );
                }
              )}
            </div>

            {/* Actions */}
            <div className="mt-6 space-y-2">

              <button
                onClick={
                  copyToAllDays
                }
                className="w-full flex items-center justify-center gap-2 px-3 py-2.5 border border-gray-200 rounded-xl text-sm hover:bg-white transition-colors"
              >
                <Copy size={14} />

                Copy to All Days
              </button>

              <button
                onClick={
                  clearAll
                }
                className="w-full flex items-center justify-center gap-2 px-3 py-2.5 border border-red-200 text-red-500 rounded-xl text-sm hover:bg-red-50 transition-colors"
              >
                <RotateCcw size={14} />

                Clear All
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6">

            {/* Header */}
            <div className="flex items-center justify-between mb-6">

              <div>
                <h3 className="text-lg font-bold text-gray-800">
                  {selectedDay}
                </h3>

                <p className="text-sm text-gray-500 mt-1">
                  Configure faculty availability
                </p>
              </div>

              {availability[
                selectedDay
              ].length >
                0 && (
                <button
                  onClick={() =>
                    clearDay(
                      selectedDay
                    )
                  }
                  className="text-sm text-red-500 hover:text-red-600 font-medium"
                >
                  Clear Day
                </button>
              )}
            </div>

            {/* Presets */}
            <div className="mb-6">

              <div className="flex items-center gap-2 mb-3">

                <Clock3
                  size={15}
                  className="text-pup-maroon"
                />

                <p className="text-sm font-semibold text-gray-700">
                  Quick Presets
                </p>
              </div>

              <div className="flex flex-wrap gap-2">

                {QUICK_PRESETS.map(
                  (
                    preset
                  ) => (
                    <button
                      key={
                        preset.label
                      }
                      onClick={() =>
                        applyPreset(
                          preset.slots
                        )
                      }
                      className="px-3 py-2 rounded-xl border border-gray-200 text-sm hover:border-pup-maroon hover:text-pup-maroon hover:bg-pup-maroon/5 transition-colors"
                    >
                      {
                        preset.label
                      }
                    </button>
                  )
                )}
              </div>
            </div>

            {/* Error */}
            {currentDayError && (
              <div className="mb-5 flex items-center gap-2 px-4 py-3 rounded-2xl bg-red-50 border border-red-200 text-red-600 text-sm">
                <AlertCircle size={16} />

                {
                  currentDayError
                }
              </div>
            )}

            {/* Slots */}
            <div className="space-y-4">

              {availability[
                selectedDay
              ].map(
                (
                  slot,
                  index
                ) => (
                  <div
                    key={index}
                    className="border border-gray-200 rounded-2xl p-4 bg-white"
                  >

                    <div className="flex flex-col lg:flex-row lg:items-center gap-4">

                      {/* Start */}
                      <div className="flex-1">

                        <label className="text-xs font-medium text-gray-500 mb-1 block">
                          Start Time
                        </label>

                        <input
                          type="time"
                          step="1800"
                          value={
                            slot.start ||
                            ""
                          }
                          onChange={(
                            e
                          ) =>
                            updateSlot(
                              selectedDay,
                              index,
                              "start",
                              e
                                .target
                                .value
                            )
                          }
                          className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-pup-maroon/20 focus:border-pup-maroon"
                        />
                      </div>

                      {/* End */}
                      <div className="flex-1">

                        <label className="text-xs font-medium text-gray-500 mb-1 block">
                          End Time
                        </label>

                        <input
                          type="time"
                          step="1800"
                          value={
                            slot.end ||
                            ""
                          }
                          onChange={(
                            e
                          ) =>
                            updateSlot(
                              selectedDay,
                              index,
                              "end",
                              e
                                .target
                                .value
                            )
                          }
                          className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-pup-maroon/20 focus:border-pup-maroon"
                        />
                      </div>

                      {/* Duration */}
                      <div className="lg:w-[150px]">

                        <label className="text-xs font-medium text-gray-500 mb-1 block">
                          Duration
                        </label>

                        <div className="h-[50px] flex items-center px-4 rounded-xl bg-gray-50 border border-gray-200 text-sm text-gray-700">
                          {getDuration(
                            slot.start,
                            slot.end
                          )}
                        </div>
                      </div>

                      {/* Remove */}
                      <button
                        onClick={() =>
                          removeSlot(
                            selectedDay,
                            index
                          )
                        }
                        className="h-[50px] w-[50px] flex items-center justify-center rounded-xl border border-red-200 text-red-500 hover:bg-red-50 transition-colors mt-auto"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>

                    {/* Preview */}
                    <div className="mt-3 text-sm text-gray-500">
                      {formatTime(
                        slot.start
                      )}{" "}
                      —{" "}
                      {formatTime(
                        slot.end
                      )}
                    </div>
                  </div>
                )
              )}

              {/* Empty */}
              {availability[
                selectedDay
              ].length ===
                0 && (
                <div className="border border-dashed border-gray-200 rounded-2xl py-10 px-6 text-center">

                  <Clock3
                    size={28}
                    className="mx-auto text-gray-300 mb-3"
                  />

                  <h4 className="text-sm font-semibold text-gray-600">
                    No schedules added
                  </h4>

                  <p className="text-sm text-gray-400 mt-1">
                    Add faculty availability time slots.
                  </p>
                </div>
              )}

              {/* Add */}
              <button
                onClick={() =>
                  addSlot(
                    selectedDay
                  )
                }
                className="w-full flex items-center justify-center gap-2 px-4 py-3 border border-dashed border-pup-maroon/30 rounded-2xl text-pup-maroon hover:bg-pup-maroon/5 transition-colors"
              >
                <Plus size={16} />

                Add Time Slot
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-gray-100 px-6 py-4 flex items-center justify-between bg-white">

          <div className="text-sm text-gray-500">

            {totalSlots > 0 ? (
              <span>
                Ready to save availability
              </span>
            ) : (
              <span>
                No schedules added
              </span>
            )}
          </div>

          <div className="flex items-center gap-3">

            <button
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors text-sm font-medium"
            >
              Cancel
            </button>

            <button
              onClick={
                handleSubmit
              }
              disabled={
                loading ||
                totalSlots === 0
              }
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-pup-maroon text-white text-sm font-medium hover:bg-pup-maroon-dark transition-colors disabled:opacity-60"
            >
              {loading && (
                <Loader2
                  size={15}
                  className="animate-spin"
                />
              )}

              {loading
                ? "Saving..."
                : "Save Availability"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SetAvailabilityModal;