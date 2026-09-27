import { X, CheckCircle2, AlertTriangle } from "lucide-react";

const formatTime = (time) => {
  if (!time) return "";
  const [h, m] = time.split(":");
  const hour = Number(h);
  return `${hour % 12 || 12}:${m} ${hour >= 12 ? "PM" : "AM"}`;
};

const formatSlot = (slot) => {
  if (!slot) return "-";
  const [start, end] = slot.split("-");
  return `${formatTime(start)} - ${formatTime(end)}`;
};

const AssignPreviewModal = ({
  open,
  curriculum,
  assignments,
  filters,
  conflicts = {},
  onClose,
  onConfirm,
}) => {
  if (!open) return null;

  const complete = curriculum.filter((subject) => {
    const assignment = assignments[subject.id];
    return assignment?.faculty && assignment?.day && assignment?.timeSlot && assignment?.room;
  });
  const incomplete = curriculum.filter((subject) => {
    const assignment = assignments[subject.id];
    return !assignment?.faculty || !assignment?.day || !assignment?.timeSlot || !assignment?.room;
  });
  const conflictRows = curriculum.filter((subject) => conflicts[subject.id]?.length > 0);
  const canConfirm = incomplete.length === 0 && conflictRows.length === 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 flex-shrink-0">
          <div>
            <h2 className="text-base font-bold text-gray-800">Schedule Preview</h2>
            <p className="text-xs text-gray-400 mt-0.5">
              {filters.program} - {filters.yearLevel} - {filters.semester}
              {filters.section && ` - ${filters.section}`}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        <div className="flex flex-wrap items-center gap-4 px-6 py-3 bg-gray-50 border-b border-gray-100 flex-shrink-0">
          <div className="flex items-center gap-2 text-sm text-green-600 font-medium">
            <CheckCircle2 size={15} />
            {complete.length} Complete
          </div>
          {incomplete.length > 0 && (
            <div className="flex items-center gap-2 text-sm text-yellow-600 font-medium">
              <AlertTriangle size={15} />
              {incomplete.length} Incomplete
            </div>
          )}
          {conflictRows.length > 0 && (
            <div className="flex items-center gap-2 text-sm text-red-600 font-medium">
              <AlertTriangle size={15} />
              {conflictRows.length} With Conflicts
            </div>
          )}
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-4">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 text-xs text-gray-400 uppercase tracking-wide">
                <th className="text-left py-2 pr-4 font-semibold">#</th>
                <th className="text-left py-2 pr-4 font-semibold">Code</th>
                <th className="text-left py-2 pr-4 font-semibold">Subject</th>
                <th className="text-left py-2 pr-4 font-semibold">Day</th>
                <th className="text-left py-2 pr-4 font-semibold">Time</th>
                <th className="text-left py-2 pr-4 font-semibold">Faculty</th>
                <th className="text-left py-2 pr-4 font-semibold">Room</th>
                <th className="text-left py-2 font-semibold">Status</th>
              </tr>
            </thead>
            <tbody>
              {curriculum.map((subject, index) => {
                const assignment = assignments[subject.id] || {};
                const done = assignment.faculty && assignment.day && assignment.timeSlot && assignment.room;
                const rowConflicts = conflicts[subject.id] || [];

                return (
                  <tr
                    key={subject.id}
                    className={`border-b border-gray-50 ${
                      rowConflicts.length ? "bg-red-50" : done ? "" : "opacity-50"
                    }`}
                  >
                    <td className="py-3 pr-4 text-xs text-gray-400">{index + 1}</td>
                    <td className="py-3 pr-4">
                      <span className="px-2 py-0.5 bg-pup-maroon/10 text-pup-maroon text-xs font-bold rounded">
                        {subject.code}
                      </span>
                    </td>
                    <td className="py-3 pr-4 text-xs text-gray-600 max-w-[180px] truncate">
                      {subject.description}
                    </td>
                    <td className="py-3 pr-4 text-xs text-gray-700 font-medium">
                      {assignment.day || "-"}
                    </td>
                    <td className="py-3 pr-4 text-xs text-gray-700 whitespace-nowrap">
                      {formatSlot(assignment.timeSlot)}
                    </td>
                    <td className="py-3 pr-4 text-xs text-gray-700">
                      {assignment.faculty || "-"}
                    </td>
                    <td className="py-3 pr-4 text-xs text-gray-700">
                      {assignment.room || "-"}
                    </td>
                    <td className="py-3 text-xs">
                      {rowConflicts.length ? (
                        <span className="flex items-center gap-1 font-medium text-red-600">
                          <AlertTriangle size={15} />
                          {rowConflicts[0]}
                        </span>
                      ) : done ? (
                        <span className="flex items-center gap-1 font-medium text-green-600">
                          <CheckCircle2 size={15} />
                          Ready
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 font-medium text-yellow-600">
                          <AlertTriangle size={15} />
                          Incomplete
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-100 flex-shrink-0">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm border border-gray-200 rounded-xl text-gray-600 hover:bg-gray-50 transition-colors"
          >
            Back to Edit
          </button>
          {canConfirm && (
            <button
              onClick={onConfirm}
              className="px-4 py-2 text-sm bg-pup-maroon text-white rounded-xl font-semibold hover:bg-pup-maroon-dark transition-colors"
            >
              Confirm & Publish
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default AssignPreviewModal;
