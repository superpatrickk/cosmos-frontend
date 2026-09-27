import { X, Pencil, BookOpen, Users } from "lucide-react";

const summarizeUnique = (items) => {
  const values = [...new Set((items ?? []).filter(Boolean))];
  return values.length ? values.join(", ") : "None";
};

const CurriculumViewModal = ({ open, data, onClose, onEdit }) => {
  if (!open || !data) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-5xl max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-pup-maroon/10 rounded-xl flex items-center justify-center">
              <BookOpen size={18} className="text-pup-maroon" />
            </div>
            <div>
              <h2 className="text-base font-bold text-gray-800">
                {data.program} - {data.yearLevel}
              </h2>
              <p className="text-xs text-gray-400 mt-0.5">
                {data.semester} - {data.academicYear} - {data.id}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 text-gray-400 hover:bg-gray-100 rounded-lg transition-colors">
            <X size={18} />
          </button>
        </div>

        <div className="flex items-center gap-6 px-6 py-3 bg-gray-50 border-b border-gray-100 flex-shrink-0">
          <div className="text-center">
            <p className="text-lg font-bold text-gray-800">{data.totalSubjects}</p>
            <p className="text-xs text-gray-400">Subjects</p>
          </div>
          <div className="text-center">
            <p className="text-lg font-bold text-gray-800">{data.totalUnits}</p>
            <p className="text-xs text-gray-400">Total Units</p>
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 text-sm font-semibold text-gray-700">
              <Users size={15} className="text-pup-maroon" />
              Faculty Included
            </div>
            <p className="text-xs text-gray-400 truncate">
              {summarizeUnique(data.subjects?.map((subject) => subject.faculty))}
            </p>
          </div>
          <div className="text-center">
            <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
              data.status === "Active"
                ? "bg-green-100 text-green-700"
                : "bg-gray-100 text-gray-500"
            }`}>
              {data.status}
            </span>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-4">
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[900px]">
              <thead>
                <tr className="border-b border-gray-100 text-xs text-gray-400 uppercase tracking-wide">
                  <th className="text-left py-2 pr-4 font-semibold">#</th>
                  <th className="text-left py-2 pr-4 font-semibold">Code</th>
                  <th className="text-left py-2 pr-4 font-semibold">Description</th>
                  <th className="text-center py-2 pr-4 font-semibold">Lec</th>
                  <th className="text-center py-2 pr-4 font-semibold">Lab</th>
                  <th className="text-center py-2 pr-4 font-semibold">Units</th>
                  <th className="text-left py-2 pr-4 font-semibold">Type</th>
                  <th className="text-left py-2 pr-4 font-semibold">Room Type</th>
                  <th className="text-left py-2 font-semibold">Professor</th>
                </tr>
              </thead>
              <tbody>
                {data.subjects?.map((subject, index) => (
                  <tr key={`${subject.code}-${index}`} className="border-b border-gray-50 hover:bg-gray-50">
                    <td className="py-3 pr-4 text-xs text-gray-400">{index + 1}</td>
                    <td className="py-3 pr-4">
                      <span className="px-2 py-0.5 bg-pup-maroon/10 text-pup-maroon text-xs font-bold rounded">
                        {subject.code}
                      </span>
                    </td>
                    <td className="py-3 pr-4 text-xs text-gray-700">{subject.description}</td>
                    <td className="py-3 pr-4 text-center text-xs font-medium text-gray-600">{subject.lec}</td>
                    <td className="py-3 pr-4 text-center text-xs font-medium text-gray-600">{subject.lab}</td>
                    <td className="py-3 pr-4 text-center text-xs font-bold text-gray-800">{subject.units}</td>
                    <td className="py-3 pr-4">
                      <span className={`px-2 py-0.5 text-xs font-semibold rounded-full ${
                        subject.type === "Lecture/Lab" ? "bg-purple-50 text-purple-700"
                        : subject.type === "Laboratory" ? "bg-green-50 text-green-700"
                        : "bg-blue-50 text-blue-700"
                      }`}>
                        {subject.type}
                      </span>
                    </td>
                    <td className="py-3 pr-4 text-xs text-gray-700">{subject.roomType || subject.type || "Lecture"}</td>
                    <td className="py-3 text-xs font-medium text-gray-700">{subject.faculty || "Unassigned"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-100 flex-shrink-0">
          <button onClick={onClose} className="px-4 py-2 text-sm border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50 transition-colors">
            Close
          </button>
          <button
            onClick={() => onEdit(data)}
            className="flex items-center gap-2 px-4 py-2 text-sm bg-pup-maroon text-white rounded-lg font-medium hover:bg-pup-maroon-dark transition-colors"
          >
            <Pencil size={14} />
            Edit Curriculum
          </button>
        </div>
      </div>
    </div>
  );
};

export default CurriculumViewModal;
