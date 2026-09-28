import { Clock } from "lucide-react";

const SkeletonRow = () => (
  <div className="flex items-center justify-between px-6 py-4 border-b border-gray-50 animate-pulse">
    <div className="flex items-center gap-4">
      <div className="w-10 h-10 bg-gray-100 rounded-xl" />
      <div className="space-y-2">
        <div className="w-20 h-4 bg-gray-100 rounded" />
        <div className="w-28 h-3 bg-gray-100 rounded" />
      </div>
    </div>
    <div className="text-right space-y-2">
      <div className="w-32 h-4 bg-gray-100 rounded" />
      <div className="w-16 h-3 bg-gray-100 rounded ml-auto" />
    </div>
  </div>
);

const formatTime = (value) => {
  const match = value?.match(/^(\d{1,2}):(\d{2})$/);
  if (!match) return value || "";
  const hour = Number(match[1]);
  const suffix = hour >= 12 ? "PM" : "AM";
  return `${hour % 12 || 12}:${match[2]} ${suffix}`;
};

const TodaySchedule = ({ schedule, loading, error, activeDay }) => {
  if (loading) {
    return (
      <div className="divide-y divide-gray-50">
        {[...Array(4)].map((_, i) => <SkeletonRow key={i} />)}
      </div>
    );
  }

  if (error) {
    return (
      <div className="px-6 py-8 text-center text-sm text-red-400">
        {error}
      </div>
    );
  }

  if (!schedule.length) {
    return (
      <div className="px-6 py-10 text-center">
        <Clock size={32} className="text-gray-200 mx-auto mb-2" />
        <p className="text-sm text-gray-400">
          No classes scheduled for {activeDay}.
        </p>
      </div>
    );
  }

  return (
    <div className="divide-y divide-gray-50">
      {schedule.map((item) => (
        <div
          key={item.id}
          className="flex items-center justify-between px-6 py-4 hover:bg-gray-50 transition-colors"
        >
          {/* Left — Icon + Subject Info */}
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-pup-maroon rounded-xl flex items-center justify-center flex-shrink-0">
              <Clock size={18} className="text-white" />
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-800">
                {item.code}
              </p>
              {item.subjectName && <p className="text-xs text-gray-500 mt-0.5">{item.subjectName}</p>}
              <p className="text-xs text-gray-400 mt-0.5">
                {[item.courseCode, item.section && `Section ${item.section}`, item.faculty].filter(Boolean).join(" · ")}
              </p>
            </div>
          </div>

          {/* Right — Time + Room */}
          <div className="text-right">
            <p className="text-sm font-medium text-gray-700">
              {formatTime(item.startTime)} - {formatTime(item.endTime)}
            </p>
            <p className="text-xs text-gray-400 mt-0.5">{item.room}</p>
          </div>
        </div>
      ))}
    </div>
  );
};

export default TodaySchedule;