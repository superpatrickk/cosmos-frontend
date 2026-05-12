import { X, GraduationCap, Users, Clock, Calendar, BookOpen, Pencil } from "lucide-react";
import StatusBadge from "../common/StatusBadge";

const CourseViewModal = ({ open, data, onClose, onEdit }) => {
  if (!open || !data) return null;

  const stats = [
    { label: "Students Enrolled", value: data.students?.toLocaleString(), icon: Users,        color: "text-blue-600",  bg: "bg-blue-50" },
    { label: "Duration",          value: data.duration,                   icon: Clock,        color: "text-green-600", bg: "bg-green-50" },
    { label: "Year Established",  value: data.yearEstablished,            icon: Calendar,     color: "text-purple-600",bg: "bg-purple-50" },
    { label: "Total Sections",    value: data.totalSections,              icon: BookOpen,     color: "text-orange-600",bg: "bg-orange-50" },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg mx-4 max-h-[90vh] flex flex-col">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-pup-maroon/10 rounded-xl flex items-center justify-center">
              <GraduationCap size={20} className="text-pup-maroon" />
            </div>
            <div>
              <h2 className="text-base font-bold text-gray-800">{data.name}</h2>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="text-xs text-gray-400">{data.id}</span>
                <span className="px-2 py-0.5 bg-pup-maroon/10 text-pup-maroon text-xs font-bold rounded">
                  {data.code}
                </span>
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-5 space-y-5 overflow-y-auto">

          {/* Status + Department */}
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-400 mb-1">Department</p>
              <p className="text-sm font-semibold text-gray-700">{data.department}</p>
            </div>
            <StatusBadge status={data.status} />
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 gap-3">
            {stats.map((s) => (
              <div
                key={s.label}
                className="flex items-center gap-3 p-3 rounded-xl border border-gray-100 bg-gray-50"
              >
                <div className={`w-9 h-9 ${s.bg} rounded-lg flex items-center justify-center flex-shrink-0`}>
                  <s.icon size={17} className={s.color} />
                </div>
                <div>
                  <p className="text-sm font-bold text-gray-800">{s.value}</p>
                  <p className="text-xs text-gray-400">{s.label}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Description */}
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">
              Description
            </p>
            <p className="text-sm text-gray-600 leading-relaxed bg-gray-50 rounded-xl p-4 border border-gray-100">
              {data.description}
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-100 flex-shrink-0">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50 transition-colors"
          >
            Close
          </button>
          <button
            onClick={() => onEdit(data)}
            className="flex items-center gap-2 px-4 py-2 text-sm bg-pup-maroon text-white rounded-lg font-medium hover:bg-pup-maroon-dark transition-colors"
          >
            <Pencil size={14} />
            Edit Course
          </button>
        </div>
      </div>
    </div>
  );
};

export default CourseViewModal;