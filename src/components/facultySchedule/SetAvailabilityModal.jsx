import { useMemo, useState } from "react";
import {
  AlertCircle,
  CheckCircle2,
  Copy,
  Loader2,
  Plus,
  Trash2,
  X,
} from "lucide-react";

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const SCHOOL_START = "07:00";
const SCHOOL_END = "21:00";
const INTERVAL_MINUTES = 30;

const DURATION_OPTIONS = [
  { label: "1 hr", value: 60 },
  { label: "2 hrs", value: 120 },
  { label: "3 hrs", value: 180 },
  { label: "4 hrs", value: 240 },
  { label: "5 hrs", value: 300 },
  { label: "6 hrs", value: 360 },
];

const PRESETS = [
  { label: "Morning", start: "07:00", end: "12:00", maxMeetingMinutes: 300 },
  { label: "Afternoon", start: "13:00", end: "18:00", maxMeetingMinutes: 300 },
  { label: "Whole Day", start: "08:00", end: "17:00", maxMeetingMinutes: 300 },
];

const toMinutes = (time) => {
  const [hour, minute] = (time || "00:00").split(":").map(Number);
  return hour * 60 + minute;
};

const toTime = (minutes) => {
  const hour = Math.floor(minutes / 60);
  const minute = minutes % 60;
  return `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
};

const normalizeTime = (time) => {
  if (!time) return "";
  const [hour, minute = "00"] = time.split(":");
  return `${String(Number(hour)).padStart(2, "0")}:${minute.padStart(2, "0")}`;
};

const formatTime = (time) => {
  if (!time) return "--";
  const [rawHour, minute] = time.split(":");
  const hour = Number(rawHour);
  return `${hour % 12 || 12}:${minute} ${hour >= 12 ? "PM" : "AM"}`;
};

const formatDuration = (minutes) => {
  if (!minutes || minutes <= 0) return "0 hr";
  const hours = Math.floor(minutes / 60);
  const remainder = minutes % 60;
  return remainder ? `${hours} hr ${remainder} min` : `${hours} hr${hours > 1 ? "s" : ""}`;
};

const getDuration = (slot) => toMinutes(slot.end) - toMinutes(slot.start);

const normalizeAvailability = (data) => {
  const normalized = DAYS.reduce((map, day) => ({ ...map, [day]: [] }), {});

  DAYS.forEach((day) => {
    normalized[day] = (data?.[day] || []).map((slot) => {
      if (typeof slot === "string") {
        const [start, end] = slot.split("-");
        const duration = toMinutes(normalizeTime(end)) - toMinutes(normalizeTime(start));
        return {
          start: normalizeTime(start),
          end: normalizeTime(end),
          maxMeetingMinutes: Math.min(Math.max(duration, 60), 300),
        };
      }

      const start = normalizeTime(slot?.start);
      const end = normalizeTime(slot?.end);
      const duration = toMinutes(end) - toMinutes(start);
      return {
        start,
        end,
        maxMeetingMinutes: Number(slot?.maxMeetingMinutes || Math.min(Math.max(duration, 60), 300)),
      };
    });
  });

  return normalized;
};

const getAssignedForDay = (assignedSchedules, day) =>
  (assignedSchedules || [])
    .filter((schedule) => schedule.day === day)
    .map((schedule) => ({
      ...schedule,
      start: normalizeTime(schedule.startTime),
      end: normalizeTime(schedule.endTime),
    }));

const validateSlots = (slots, assignedSchedules, day) => {
  for (const slot of slots) {
    if (!slot.start || !slot.end) return "Complete all start and end times.";
    if (slot.start >= slot.end) return "End time must be later than start time.";
    if (slot.start < SCHOOL_START || slot.end > SCHOOL_END) return "Use times between 7:00 AM and 9:00 PM.";
    if (toMinutes(slot.start) % INTERVAL_MINUTES || toMinutes(slot.end) % INTERVAL_MINUTES) {
      return "Use 30-minute time intervals.";
    }
    if (slot.maxMeetingMinutes > getDuration(slot)) return "Max class length cannot be longer than the available block.";
  }

  const sorted = [...slots].sort((a, b) => a.start.localeCompare(b.start));
  for (let index = 1; index < sorted.length; index += 1) {
    if (sorted[index].start < sorted[index - 1].end) return "Availability blocks cannot overlap.";
  }

  const assigned = getAssignedForDay(assignedSchedules, day);
  const uncovered = assigned.find((schedule) =>
    !slots.some((slot) => slot.start <= schedule.start && slot.end >= schedule.end)
  );
  if (uncovered) return `${uncovered.subjectCode} is already assigned outside this availability.`;

  return "";
};

const SetAvailabilityModal = ({ open, faculty, onClose, onSubmit }) => {
  if (!open || !faculty) return null;

  return (
    <SetAvailabilityModalContent
      key={faculty.id}
      faculty={faculty}
      onClose={onClose}
      onSubmit={onSubmit}
    />
  );
};

const SetAvailabilityModalContent = ({ faculty, onClose, onSubmit }) => {
  const [availability, setAvailability] = useState(() => normalizeAvailability(faculty.availability));
  const [selectedDay, setSelectedDay] = useState("Monday");
  const [loading, setLoading] = useState(false);

  const assignedSchedules = useMemo(() => faculty.assignedSchedules || [], [faculty.assignedSchedules]);
  const currentSlots = availability[selectedDay];
  const selectedAssigned = getAssignedForDay(assignedSchedules, selectedDay);

  const errorMap = useMemo(() => {
    const errors = {};
    DAYS.forEach((day) => {
      errors[day] = validateSlots(availability[day], assignedSchedules, day);
    });
    return errors;
  }, [availability, assignedSchedules]);

  const totalSlots = Object.values(availability).reduce((sum, slots) => sum + slots.length, 0);
  const hasErrors = Object.values(errorMap).some(Boolean);
  const currentError = errorMap[selectedDay];

  const updateDay = (day, slots) => {
    setAvailability((prev) => ({ ...prev, [day]: slots }));
  };

  const addSlot = (durationMinutes = 300) => {
    setAvailability((prev) => {
      const slots = prev[selectedDay];
      const last = slots[slots.length - 1];
      const start = last?.end || SCHOOL_START;
      const end = toTime(Math.min(toMinutes(start) + durationMinutes, toMinutes(SCHOOL_END)));
      const duration = toMinutes(end) - toMinutes(start);

      return {
        ...prev,
        [selectedDay]: [
          ...slots,
          { start, end, maxMeetingMinutes: Math.min(duration, durationMinutes) },
        ],
      };
    });
  };

  const updateSlot = (index, patch) => {
    updateDay(selectedDay, currentSlots.map((slot, slotIndex) => {
      if (slotIndex !== index) return slot;
      const next = { ...slot, ...patch };
      return {
        ...next,
        maxMeetingMinutes: Math.min(Number(next.maxMeetingMinutes || 60), Math.max(getDuration(next), 60)),
      };
    }));
  };

  const removeSlot = (index) => {
    updateDay(selectedDay, currentSlots.filter((_, slotIndex) => slotIndex !== index));
  };

  const applyPreset = (preset) => {
    updateDay(selectedDay, [{
      start: preset.start,
      end: preset.end,
      maxMeetingMinutes: preset.maxMeetingMinutes,
    }]);
  };

  const copyToWeekdays = () => {
    if (!currentSlots.length) return;
    setAvailability((prev) => {
      const next = { ...prev };
      ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"].forEach((day) => {
        next[day] = currentSlots.map((slot) => ({ ...slot }));
      });
      return next;
    });
  };

  const handleSubmit = async () => {
    if (hasErrors) return;
    setLoading(true);
    try {
      await onSubmit(faculty.id, availability);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="flex max-h-[92vh] w-full max-w-4xl flex-col overflow-hidden rounded-2xl bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
          <div>
            <h2 className="text-base font-bold text-gray-800">Set Availability</h2>
            <p className="text-sm text-gray-500">{faculty.name}</p>
          </div>
          <button onClick={onClose} className="rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-700">
            <X size={18} />
          </button>
        </div>

        <div className="border-b border-gray-100 px-6 py-3">
          <div className="flex flex-wrap gap-2">
            {DAYS.map((day) => (
              <button
                key={day}
                onClick={() => setSelectedDay(day)}
                className={`rounded-lg border px-3 py-2 text-sm ${
                  selectedDay === day
                    ? "border-pup-maroon bg-pup-maroon text-white"
                    : errorMap[day]
                    ? "border-red-200 bg-red-50 text-red-600"
                    : "border-gray-200 text-gray-600 hover:bg-gray-50"
                }`}
              >
                {day.slice(0, 3)} ({availability[day].length})
              </button>
            ))}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-5">
          <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h3 className="text-base font-bold text-gray-800">{selectedDay}</h3>
              <p className="text-sm text-gray-500">Add the times when this faculty member can teach.</p>
            </div>
            <div className="flex flex-wrap gap-2">
              {PRESETS.map((preset) => (
                <button
                  key={preset.label}
                  onClick={() => applyPreset(preset)}
                  className="rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-600 hover:bg-gray-50"
                >
                  {preset.label}
                </button>
              ))}
              <button
                onClick={copyToWeekdays}
                disabled={!currentSlots.length}
                className="flex items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-600 hover:bg-gray-50 disabled:opacity-50"
              >
                <Copy size={14} />
                Copy to Weekdays
              </button>
            </div>
          </div>

          {selectedAssigned.length > 0 && (
            <div className="mb-4 rounded-xl border border-blue-100 bg-blue-50 px-4 py-3">
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-blue-700">Assigned classes</p>
              <div className="flex flex-wrap gap-2">
                {selectedAssigned.map((schedule, index) => (
                  <span key={`${schedule.subjectCode}-${index}`} className="rounded-lg bg-white px-3 py-1.5 text-xs text-blue-700">
                    {schedule.subjectCode} {formatTime(schedule.start)} - {formatTime(schedule.end)}
                  </span>
                ))}
              </div>
            </div>
          )}

          {currentError && (
            <div className="mb-4 flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
              <AlertCircle size={16} />
              {currentError}
            </div>
          )}

          <div className="space-y-3">
            {currentSlots.map((slot, index) => {
              const duration = Math.max(getDuration(slot), 0);

              return (
                <div key={`${slot.start}-${index}`} className="rounded-xl border border-gray-200 p-4">
                  <div className="grid gap-3 lg:grid-cols-[1fr_1fr_180px_44px] lg:items-end">
                    <TimeField label="Start Time" value={slot.start} onChange={(value) => updateSlot(index, { start: value })} />
                    <TimeField label="End Time" value={slot.end} onChange={(value) => updateSlot(index, { end: value })} />
                    <div>
                      <label className="mb-1 block text-xs font-medium text-gray-500">Max Class Length</label>
                      <select
                        value={slot.maxMeetingMinutes}
                        onChange={(event) => updateSlot(index, { maxMeetingMinutes: Number(event.target.value) })}
                        className="h-11 w-full rounded-lg border border-gray-200 bg-white px-3 text-sm focus:border-pup-maroon focus:outline-none focus:ring-2 focus:ring-pup-maroon/20"
                      >
                        {DURATION_OPTIONS.filter((option) => option.value <= Math.max(duration, 60)).map((option) => (
                          <option key={option.value} value={option.value}>{option.label}</option>
                        ))}
                      </select>
                    </div>
                    <button
                      onClick={() => removeSlot(index)}
                      className="flex h-11 w-11 items-center justify-center rounded-lg border border-red-200 text-red-500 hover:bg-red-50"
                      title="Remove time block"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                  <p className="mt-2 text-xs text-gray-500">
                    {formatTime(slot.start)} - {formatTime(slot.end)} ({formatDuration(duration)})
                  </p>
                </div>
              );
            })}

            {!currentSlots.length && (
              <div className="rounded-xl border border-dashed border-gray-200 px-6 py-8 text-center">
                <p className="text-sm font-semibold text-gray-600">No availability for {selectedDay}</p>
                <p className="mt-1 text-sm text-gray-400">Add a time block or use a preset.</p>
              </div>
            )}
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            <button
              onClick={() => addSlot(120)}
              className="flex items-center gap-2 rounded-lg border border-pup-maroon/30 px-4 py-2 text-sm font-medium text-pup-maroon hover:bg-pup-maroon/5"
            >
              <Plus size={15} />
              Add 2-Hour Block
            </button>
            <button
              onClick={() => addSlot(300)}
              className="flex items-center gap-2 rounded-lg border border-pup-maroon/30 px-4 py-2 text-sm font-medium text-pup-maroon hover:bg-pup-maroon/5"
            >
              <Plus size={15} />
              Add 5-Hour Block
            </button>
            <button
              onClick={() => updateDay(selectedDay, [])}
              disabled={!currentSlots.length}
              className="rounded-lg border border-red-200 px-4 py-2 text-sm text-red-500 hover:bg-red-50 disabled:opacity-50"
            >
              Clear Day
            </button>
          </div>
        </div>

        <div className="flex flex-col gap-3 border-t border-gray-100 px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2 text-sm">
            {hasErrors ? (
              <>
                <AlertCircle size={16} className="text-red-500" />
                <span className="text-red-600">Fix errors before saving.</span>
              </>
            ) : (
              <>
                <CheckCircle2 size={16} className="text-green-600" />
                <span className="text-gray-500">{totalSlots} availability block(s) ready.</span>
              </>
            )}
          </div>

          <div className="flex items-center gap-3">
            <button onClick={onClose} className="rounded-lg border border-gray-200 px-5 py-2.5 text-sm text-gray-600 hover:bg-gray-50">
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={loading || totalSlots === 0 || hasErrors}
              className="flex items-center gap-2 rounded-lg bg-pup-maroon px-5 py-2.5 text-sm font-medium text-white hover:bg-pup-maroon-dark disabled:opacity-60"
            >
              {loading && <Loader2 size={15} className="animate-spin" />}
              {loading ? "Saving..." : "Save Availability"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const TimeField = ({ label, value, onChange }) => (
  <div>
    <label className="mb-1 block text-xs font-medium text-gray-500">{label}</label>
    <input
      type="time"
      step="1800"
      min={SCHOOL_START}
      max={SCHOOL_END}
      value={value || ""}
      onChange={(event) => onChange(event.target.value)}
      className="h-11 w-full rounded-lg border border-gray-200 px-3 text-sm focus:border-pup-maroon focus:outline-none focus:ring-2 focus:ring-pup-maroon/20"
    />
  </div>
);

export default SetAvailabilityModal;
