const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

const normalizeTime = (time) => {
  if (!time) return "";
  const [hour, minute = "00"] = time.split(":");
  return `${String(Number(hour)).padStart(2, "0")}:${minute.padStart(2, "0")}`;
};

const toMinutes = (time) => {
  const [hour, minute] = normalizeTime(time).split(":").map(Number);
  return hour * 60 + minute;
};

const formatDuration = (minutes) => {
  if (!minutes || minutes <= 0) return "--";
  const hours = Math.floor(minutes / 60);
  const remainder = minutes % 60;
  if (!remainder) return `${hours}h`;
  return `${hours}h ${remainder}m`;
};

const normalizeSlot = (slot) => {
  if (typeof slot === "string") {
    const [start, end] = slot.split("-");
    const duration = toMinutes(end) - toMinutes(start);
    return {
      start: normalizeTime(start),
      end: normalizeTime(end),
      maxMeetingMinutes: Math.min(duration, 300),
      note: "",
    };
  }

  const start = normalizeTime(slot?.start);
  const end = normalizeTime(slot?.end);
  const duration = toMinutes(end) - toMinutes(start);
  return {
    start,
    end,
    maxMeetingMinutes: slot?.maxMeetingMinutes || Math.min(duration, 300),
    note: slot?.note || "",
  };
};

const AvailabilityGrid = ({ availability, assignedSchedules }) => {
  const getAssignedForDay = (day) =>
    (assignedSchedules ?? []).filter((schedule) => schedule.day === day);

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-6">
      {DAYS.map((day) => {
        const slots = (availability?.[day] ?? []).map(normalizeSlot);
        const assigned = getAssignedForDay(day);
        const availableMinutes = slots.reduce((sum, slot) => sum + Math.max(toMinutes(slot.end) - toMinutes(slot.start), 0), 0);
        const isOff = slots.length === 0;

        return (
          <div key={day} className="rounded-xl border border-gray-100 bg-gray-50 p-3">
            <div className="mb-2 flex items-center justify-between">
              <p className="text-xs font-bold uppercase tracking-wide text-gray-500">{day.slice(0, 3)}</p>
              <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                isOff ? "bg-gray-100 text-gray-400" : "bg-green-100 text-green-700"
              }`}>
                {isOff ? "Off" : formatDuration(availableMinutes)}
              </span>
            </div>

            <div className="space-y-1.5">
              {isOff ? (
                <div className="rounded-lg border border-gray-100 bg-white px-2 py-3 text-center">
                  <p className="text-xs text-gray-400">Not Available</p>
                </div>
              ) : (
                slots.map((slot, index) => (
                  <div key={`${slot.start}-${index}`} className="rounded-lg border border-green-100 bg-green-50 px-2 py-2">
                    <p className="text-xs font-bold text-green-700">{slot.start}-{slot.end}</p>
                    <p className="mt-0.5 text-[11px] text-green-700/70">
                      Max class {formatDuration(slot.maxMeetingMinutes)}
                    </p>
                    {slot.note && <p className="mt-1 truncate text-[11px] text-green-700/60">{slot.note}</p>}
                  </div>
                ))
              )}

              {assigned.map((schedule, index) => (
                <div key={`${schedule.subjectCode}-${index}`} className="rounded-lg border border-pup-maroon/20 bg-pup-maroon/10 px-2 py-2">
                  <p className="text-xs font-bold text-pup-maroon">{schedule.subjectCode}</p>
                  <p className="text-[11px] text-pup-maroon/70">{schedule.startTime}-{schedule.endTime}</p>
                  <p className="text-[11px] text-pup-maroon/70">{schedule.course} {schedule.section} - {schedule.room}</p>
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default AvailabilityGrid;
