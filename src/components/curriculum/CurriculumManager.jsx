import { useState, useMemo } from "react";
import { Plus, Pencil, Trash2, BookOpen, Eye, Layers3, Users } from "lucide-react";
import ConfirmDialog from "../common/ConfirmDialog";
import CurriculumModal from "./CurriculumModal";
import CurriculumViewModal from "./CurriculumViewModal";
import { loadCurricula, saveCurricula } from "../../data/curriculumStore";

const MOCK_PROGRAMS = ["BSIT","BSCS","BSEE","BSBA","BSMath"];
const MOCK_FACULTY = [
  "Dr. Maria Santos",
  "Prof. Juan Reyes",
  "Dr. Ana Cruz",
  "Prof. Carlos Garcia",
  "Prof. Liza Mendoza",
];

const getSubjectDefaults = (subject) => ({
  ...subject,
  roomType: subject.roomType || subject.type || "Lecture",
  faculty: subject.faculty || "Unassigned",
});

const summarizeUnique = (items, limit = 2) => {
  const values = [...new Set(items.filter(Boolean))];
  if (values.length === 0) return "None";
  if (values.length <= limit) return values.join(", ");
  return `${values.slice(0, limit).join(", ")} +${values.length - limit}`;
};

const buildCurriculumRecord = (formData, id) => {
  const subjects = (formData.subjects ?? []).map(getSubjectDefaults);
  return {
    ...formData,
    id,
    subjects,
    totalSubjects: subjects.length,
    totalUnits: subjects.reduce((sum, subject) => sum + Number(subject.units || 0), 0),
    status: formData.status || "Active",
  };
};

const CurriculumManager = () => {
  const [curricula, setCurricula]     = useState(() => loadCurricula());
  const [loading]                     = useState(false);
  const [search, setSearch]           = useState("");
  const [filterProgram, setFilterProgram] = useState("All");
  const [filterFaculty, setFilterFaculty] = useState("All");
  const [showFilter, setShowFilter]   = useState(false);
  const [modalOpen, setModalOpen]     = useState(false);
  const [viewOpen, setViewOpen]       = useState(false);
  const [modalMode, setModalMode]     = useState("add");
  const [selected, setSelected]       = useState(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const filtered = useMemo(() =>
    curricula.filter((c) => {
      const subjectText = (c.subjects ?? [])
        .flatMap((subject) => [subject.code, subject.description, subject.faculty, subject.roomType])
        .join(" ");
      const matchSearch = [c.program, c.yearLevel, c.semester, c.academicYear, subjectText]
        .join(" ").toLowerCase().includes(search.toLowerCase());
      const matchProgram = filterProgram === "All" || c.program === filterProgram;
      const matchFaculty = filterFaculty === "All" || c.subjects?.some((subject) => subject.faculty === filterFaculty);
      return matchSearch && matchProgram && matchFaculty;
    }), [curricula, search, filterProgram, filterFaculty]
  );

  const handleDeleteConfirm = async () => {
    setDeleteLoading(true);
    await new Promise((r) => setTimeout(r, 500));
    setCurricula((prev) => {
      const next = prev.filter((c) => c.id !== deleteTarget.id);
      saveCurricula(next);
      return next;
    });
    setConfirmOpen(false);
    setDeleteLoading(false);
  };

  const handleModalSubmit = async (formData) => {
    if (modalMode === "bulk") {
      setCurricula((prev) => {
        const next = [
          ...prev,
          ...formData.map((item, index) => buildCurriculumRecord(item, `CUR${String(prev.length + index + 1).padStart(3, "0")}`)),
        ];
        saveCurricula(next);
        return next;
      });
    } else if (modalMode === "add") {
      setCurricula((prev) => {
        const next = [
          ...prev,
          buildCurriculumRecord(formData, `CUR${String(prev.length + 1).padStart(3, "0")}`),
        ];
        saveCurricula(next);
        return next;
      });
    } else {
      setCurricula((prev) => {
        const next = prev.map((c) => c.id === selected.id ? buildCurriculumRecord(formData, selected.id) : c);
        saveCurricula(next);
        return next;
      });
    }
    setModalOpen(false);
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm">

      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
        <div>
          <h2 className="text-base font-bold text-gray-800">Curriculum Management</h2>
          <p className="text-xs text-gray-400 mt-0.5">
            {filtered.length} curriculum{filtered.length !== 1 ? "s" : ""} found
          </p>
        </div>
        <div className="flex items-center gap-2">

          <input
            type="text"
            placeholder="Search..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="px-3 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-pup-maroon/20 focus:border-pup-maroon w-44"
          />

          <div className="relative">
            <button
              onClick={() => setShowFilter((v) => !v)}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-sm border rounded-lg transition-colors ${
                filterProgram !== "All"
                  ? "border-pup-maroon text-pup-maroon bg-red-50"
                  : "border-gray-200 text-gray-600 hover:bg-gray-50"
              }`}
            >
              Program
              {filterProgram !== "All" && (
                <span className="w-1.5 h-1.5 bg-pup-maroon rounded-full" />
              )}
            </button>
            {showFilter && (
              <div className="absolute right-0 mt-2 w-44 bg-white border border-gray-100 rounded-xl shadow-lg z-10 p-2">
                {["All", ...MOCK_PROGRAMS].map((p) => (
                  <button
                    key={p}
                    onClick={() => { setFilterProgram(p); setShowFilter(false); }}
                    className={`w-full text-left px-3 py-2 text-sm rounded-lg transition-colors ${
                      filterProgram === p
                        ? "bg-pup-maroon text-white"
                        : "hover:bg-gray-50 text-gray-700"
                    }`}
                  >
                    {p === "All" ? "All Programs" : p}
                  </button>
                ))}
              </div>
            )}
          </div>

          <select
            value={filterFaculty}
            onChange={(e) => setFilterFaculty(e.target.value)}
            className={`px-3 py-1.5 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-pup-maroon/20 focus:border-pup-maroon bg-white ${
              filterFaculty !== "All" ? "border-pup-maroon text-pup-maroon bg-red-50" : "border-gray-200 text-gray-600"
            }`}
          >
            <option value="All">All Faculty</option>
            {MOCK_FACULTY.map((faculty) => (
              <option key={faculty}>{faculty}</option>
            ))}
          </select>

          <button
            onClick={() => { setSelected(null); setModalMode("add"); setModalOpen(true); }}
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-pup-maroon text-white rounded-lg hover:bg-pup-maroon-dark transition-colors font-medium"
          >
            <Plus size={14} />
            Add Curriculum
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100 text-xs text-gray-400 uppercase tracking-wide bg-gray-50">
              <th className="text-left px-6 py-3 font-semibold">ID</th>
              <th className="text-left px-6 py-3 font-semibold">Program</th>
              <th className="text-left px-6 py-3 font-semibold">Year Level</th>
              <th className="text-left px-6 py-3 font-semibold">Semester</th>
              <th className="text-left px-6 py-3 font-semibold">Academic Year</th>
              <th className="text-center px-6 py-3 font-semibold">Subjects</th>
              <th className="text-center px-6 py-3 font-semibold">Total Units</th>
              <th className="text-left px-6 py-3 font-semibold">Faculty</th>
              <th className="text-left px-6 py-3 font-semibold">Room Types</th>
              <th className="text-left px-6 py-3 font-semibold">Status</th>
              <th className="text-left px-6 py-3 font-semibold">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading && [...Array(3)].map((_, i) => (
              <tr key={i} className="border-b border-gray-50 animate-pulse">
                {[...Array(11)].map((_, j) => (
                  <td key={j} className="px-6 py-4">
                    <div className="h-4 bg-gray-100 rounded w-20" />
                  </td>
                ))}
              </tr>
            ))}

            {!loading && filtered.length === 0 && (
              <tr>
                <td colSpan={11} className="px-6 py-12 text-center">
                  <BookOpen size={32} className="text-gray-200 mx-auto mb-2" />
                  <p className="text-sm text-gray-400">No curricula found.</p>
                </td>
              </tr>
            )}

            {!loading && filtered.map((c) => (
              <tr key={c.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                <td className="px-6 py-4 text-xs text-gray-400 font-medium">{c.id}</td>
                <td className="px-6 py-4">
                  <span className="px-2 py-1 bg-pup-maroon/10 text-pup-maroon text-xs font-bold rounded-lg">
                    {c.program}
                  </span>
                </td>
                <td className="px-6 py-4 text-sm text-gray-700">{c.yearLevel}</td>
                <td className="px-6 py-4 text-sm text-gray-700">{c.semester}</td>
                <td className="px-6 py-4 text-sm text-gray-700">{c.academicYear}</td>
                <td className="px-6 py-4 text-center">
                  <span className="font-bold text-gray-700">{c.totalSubjects}</span>
                </td>
                <td className="px-6 py-4 text-center">
                  <span className="font-bold text-gray-700">{c.totalUnits}</span>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2 text-xs text-gray-600 max-w-[220px]">
                    <Users size={14} className="text-gray-300 flex-shrink-0" />
                    <span className="truncate">{summarizeUnique(c.subjects?.map((subject) => subject.faculty))}</span>
                  </div>
                </td>
                <td className="px-6 py-4 text-xs text-gray-600">
                  {summarizeUnique(c.subjects?.map((subject) => subject.roomType))}
                </td>
                <td className="px-6 py-4">
                  <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                    c.status === "Active"
                      ? "bg-green-100 text-green-700"
                      : "bg-gray-100 text-gray-500"
                  }`}>
                    {c.status}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => { setSelected(c); setViewOpen(true); }}
                      className="p-1.5 text-gray-400 hover:text-blue-500 hover:bg-blue-50 rounded-lg transition-colors"
                      title="View"
                    >
                      <Eye size={15} />
                    </button>
                    <button
                      onClick={() => { setSelected(c); setModalMode("edit"); setModalOpen(true); }}
                      className="p-1.5 text-gray-400 hover:text-pup-maroon hover:bg-red-50 rounded-lg transition-colors"
                      title="Edit"
                    >
                      <Pencil size={15} />
                    </button>
                    <button
                      onClick={() => { setDeleteTarget(c); setConfirmOpen(true); }}
                      className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                      title="Delete"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modals */}
      <CurriculumModal
        open={modalOpen}
        mode={modalMode}
        data={selected}
        onClose={() => setModalOpen(false)}
        onSubmit={handleModalSubmit}
      />

      <CurriculumViewModal
        open={viewOpen}
        data={selected}
        onClose={() => setViewOpen(false)}
        onEdit={(c) => {
          setViewOpen(false);
          setSelected(c);
          setModalMode("edit");
          setModalOpen(true);
        }}
      />

      <ConfirmDialog
        open={confirmOpen}
        title="Delete Curriculum"
        message={`Are you sure you want to delete the ${deleteTarget?.program} ${deleteTarget?.yearLevel} curriculum? This cannot be undone.`}
        confirmLabel="Delete"
        confirmStyle="danger"
        loading={deleteLoading}
        onConfirm={handleDeleteConfirm}
        onCancel={() => setConfirmOpen(false)}
      />
    </div>
  );
};

export default CurriculumManager;
