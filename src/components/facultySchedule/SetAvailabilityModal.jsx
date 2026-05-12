import { useEffect, useState } from "react";
import { X, Loader2 } from "lucide-react";

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

const TIME_SLOTS = [
  "7:00-9:00", "8:00-10:00", "9:00-11:00",
  "10:00-12:00", "11:00-13:00", "12:00-14:00",
  "13:00-15:00", "14:00-16:00", "15:00-17:00",
  "16:00-18:00", "17:00-19:00", "8:00-12:00",
  "13:00-17:00", "8:00-18:00", "14:00-18:00",
];

const EMPTY_AVAIL = {
  Monday: [], Tuesday: [], Wednesday: [],
  Thursday: [], Friday: [], Saturday: [],
};

const SetAvailabilityModal = ({ open, faculty, onClose, onSubmit }) => {
  const [availability, setAvailability] = useState(EMPTY_AVAIL);
  const [loading, setLoading]           = useState(false);

  useEffect(() => {
    if (open && faculty) {
      setAvailability(
        faculty.availability
          ? { ...EMPTY_AVAIL, ...faculty.availability }
          : EMPTY_AVAIL
      );
    }
  }, [open, faculty]);

  if (!open || !faculty) return null;

  const toggleSlot = (day, slot) => {
    setAvailability((prev) => ({
      ...prev,
      [day]: prev[day].includes(slot)
        ? prev[day].filter((s) => s !== slot)
        : [...prev[day], slot],
    }));
  };

  const clearDay = (day) => {
    setAvailability((prev) => ({ ...prev, [day]: [] }));
  };

  const handleSubmit = async () => {
    setLoading(true);
    try { await onSubmit(faculty.id, availability); }
    finally { setLoading(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl mx-4 max-h-[90vh] flex flex-col">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 flex-shrink-0">
          <div>
            <h2 className="text-base font-bold text-gray-800">
              Set Availability — {faculty.name}
            </h2>
            <p className="text-xs text-gray-400 mt-0.5">
              Select available time slots per day
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-5 overflow-y-auto space-y-5">
          {DAYS.map((day) => (
            <div key={day}>
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-bold text-gray-700">{day}</p>
                {availability[day].length > 0 && (
                  <button
                    onClick={() => clearDay(day)}
                    className="text-xs text-red-400 hover:text-red-600 transition-colors"
                  >
                    Clear
                  </button>
                )}
              </div>
              <div className="flex flex-wrap gap-2">
                {TIME_SLOTS.map((slot) => (
                  <button
                    key={slot}
                    onClick={() => toggleSlot(day, slot)}
                    className={`px-3 py-1.5 text-xs rounded-lg border font-medium transition-colors ${
                      availability[day].includes(slot)
                        ? "bg-green-500 text-white border-green-500"
                        : "border-gray-200 text-gray-600 hover:border-green-400 hover:text-green-600"
                    }`}
                  >
                    {slot}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-gray-100 flex-shrink-0">
          <p className="text-xs text-gray-400">
            {Object.values(availability).flat().length} slot{Object.values(availability).flat().length !== 1 ? "s" : ""} selected
          </p>
          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={loading}
              className="flex items-center gap-2 px-4 py-2 text-sm bg-pup-maroon text-white rounded-lg font-medium hover:bg-pup-maroon-dark transition-colors disabled:opacity-60"
            >
              {loading && <Loader2 size={14} className="animate-spin" />}
              {loading ? "Saving..." : "Save Availability"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SetAvailabilityModal;