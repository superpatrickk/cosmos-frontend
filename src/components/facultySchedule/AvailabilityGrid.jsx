const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

const AvailabilityGrid = ({ availability, assignedSchedules }) => {
  const getAssignedForDay = (day) =>
    (assignedSchedules ?? []).filter((s) => s.day === day);

  return (
    <div className="grid grid-cols-6 gap-2">
      {DAYS.map((day) => {
        const slots    = availability?.[day] ?? [];
        const assigned = getAssignedForDay(day);
        const isOff    = slots.length === 0;

        return (
          <div key={day} className="flex flex-col gap-1.5">
            <p className="text-xs font-semibold text-gray-500 text-center">
              {day.slice(0, 3)}
            </p>

            <div className="flex flex-col gap-1">
              {/* Availability Slots */}
              {isOff ? (
                <div className="px-2 py-2 bg-gray-50 border border-gray-100 rounded-lg text-center">
                  <p className="text-xs text-gray-400">Not Available</p>
                </div>
              ) : (
                slots.map((slot, i) => (
                  <div
                    key={i}
                    className="px-2 py-1.5 bg-green-50 border border-green-100 rounded-lg text-center"
                  >
                    <p className="text-xs text-green-700 font-medium">{slot}</p>
                  </div>
                ))
              )}

              {/* Assigned Classes on that day */}
              {assigned.map((s, i) => (
                <div
                  key={i}
                  className="px-2 py-1.5 bg-pup-maroon/10 border border-pup-maroon/20 rounded-lg text-center"
                >
                  <p className="text-xs text-pup-maroon font-bold">{s.subjectCode}</p>
                  <p className="text-xs text-pup-maroon/70">{s.startTime}–{s.endTime}</p>
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