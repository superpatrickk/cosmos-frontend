import { useEffect, useMemo, useState } from "react";
import { BookOpen, CalendarDays, GraduationCap, Plus, Pencil, Trash2, Search, Eye, Loader2 } from "lucide-react";
import TopBar from "../../components/layout/TopBar";
import CurriculumManager from "../../components/curriculum/CurriculumManager";
import AssignScheduleForm from "../../components/curriculum/AssignScheduleForm";
import CourseModal from "../../components/courses/CourseModal";
import SubjectModal from "../../components/subjects/SubjectModal";
import ConfirmDialog from "../../components/common/ConfirmDialog";
import { courseService } from "../../api/services/courseService";
import { subjectService } from "../../api/services/subjectService";
import { curriculumService } from "../../api/services/curriculumService";

const TABS = [
  { key: "assign", label: "Curriculum File", icon: CalendarDays },
  { key: "manage", label: "Manage Curriculum", icon: BookOpen },
    { key: "programs", label: "Manage Program", icon: GraduationCap },
  { key: "courses", label: "Manage Course", icon: BookOpen },
];

const normalizeSubject = (item) => ({
  ...item,
  id: item.id,
  code: item.code || "",
  name: item.name || item.description || "",
  description: item.description || "",
  type: item.type || "Lecture",
  units: Number(item.units || 0),
  lec: Number(item.lec || 0),
  lab: Number(item.lab || 0),
  course: item.course || item.program || "",
  yearLevel: item.yearLevel || "1st Year",
  semester: item.semester || "1st Semester",
  status: item.status || "Active",
});

const ProgramManager = () => {
  const [programs, setPrograms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState("add");
  const [selected, setSelected] = useState(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const fetchPrograms = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await courseService.getAll();
      const data = res?.data ?? res ?? [];
      setPrograms(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err?.response?.data?.message || err?.message || "Failed to load programs.");
      setPrograms([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchPrograms(); }, []);

  const filteredPrograms = useMemo(() => {
    const q = search.toLowerCase();
    return programs.filter((program) =>
      [program.code, program.name, program.duration]
        .join(" ")
        .toLowerCase()
        .includes(q)
    );
  }, [programs, search]);

  const handleSubmit = async (payload) => {
    if (modalMode === "add") {
      await courseService.create(payload);
    } else {
      await courseService.update(selected.id, payload);
    }
    await fetchPrograms();
    setModalOpen(false);
  };

  const handleDeleteConfirm = async () => {
    setDeleteLoading(true);
    try {
      await courseService.delete(deleteTarget.id);
      await fetchPrograms();
      setConfirmOpen(false);
    } finally {
      setDeleteLoading(false);
    }
  };

  return (
    <div className="rounded-2xl border border-white/40 bg-white/70 p-5 shadow-[0_10px_30px_rgba(15,23,42,0.04)] backdrop-blur-[2px]">
      <div className="mb-5 rounded-2xl border border-white/40 bg-white/60 p-4">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-lg font-bold text-gray-800">Program Management</h2>
            <p className="mt-1 text-xs text-gray-500">{filteredPrograms.length} program{filteredPrograms.length === 1 ? "" : "s"} found</p>
          </div>

          <button
            onClick={() => { setSelected(null); setModalMode("add"); setModalOpen(true); }}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-pup-maroon px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:-translate-y-0.5 hover:bg-pup-maroon-dark"
          >
            <Plus size={15} />
            Add Program
          </button>
        </div>

        <div className="mt-4 flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <div className="relative md:w-72">
            <Search size={14} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search program, code, duration..."
              className="w-full rounded-xl border border-gray-200 bg-white py-2.5 pl-9 pr-3 text-sm text-gray-700 shadow-sm focus:border-pup-maroon focus:outline-none focus:ring-2 focus:ring-pup-maroon/20"
            />
          </div>

          {search && (
            <button
              onClick={() => setSearch("")}
              className="text-xs font-semibold text-pup-maroon transition hover:underline"
            >
              Clear filters
            </button>
          )}
        </div>
      </div>

      {error && (
        <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
          {error}
        </div>
      )}
    
      <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-gray-50 text-[11px] font-bold uppercase tracking-[0.08em] text-gray-500">
              <tr>
                <th className="px-4 py-3">Code</th>
                <th className="px-4 py-3">Program Name</th>
                <th className="px-4 py-3">Duration</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={4} className="px-4 py-10 text-center text-sm text-gray-400">
                    <Loader2 size={16} className="mx-auto animate-spin text-gray-400" />
                  </td>
                </tr>
              ) : filteredPrograms.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-4 py-10 text-center text-sm text-gray-400">No programs found.</td>
                </tr>
              ) : (
                filteredPrograms.map((program) => (
                  <tr key={program.id} className="border-t border-gray-200 transition-colors hover:bg-gray-50">
                    <td className="px-4 py-3 align-top">
                      <span className="inline-flex rounded-full bg-pup-maroon/10 px-2 py-1 font-semibold text-pup-maroon">
                        {program.code}
                      </span>
                    </td>
                    <td className="px-4 py-3 align-top text-gray-700">{program.name}</td>
                    <td className="px-4 py-3 align-top text-gray-700">{program.duration}</td>
                    <td className="px-4 py-3 align-top">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => { setSelected(program); setModalMode("edit"); setModalOpen(true); }}
                          className="rounded-lg border border-gray-200 bg-white p-2 text-gray-600 shadow-sm transition-colors hover:bg-gray-50 hover:text-gray-900"
                          aria-label={`Edit ${program.name || program.code}`}
                        >
                          <Pencil size={14} />
                        </button>
                        <button
                          onClick={() => { setDeleteTarget(program); setConfirmOpen(true); }}
                          className="rounded-lg border border-red-200 bg-red-50 p-2 text-red-600 shadow-sm transition-colors hover:bg-red-100"
                          aria-label={`Delete ${program.name || program.code}`}
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <CourseModal
        open={modalOpen}
        mode={modalMode}
        data={selected}
        onClose={() => setModalOpen(false)}
        onSubmit={handleSubmit}
      />

      <ConfirmDialog
        open={confirmOpen}
        title="Delete Program"
        message={`Are you sure you want to delete ${deleteTarget?.name || "this program"}?`}
        confirmLabel="Delete"
        confirmStyle="danger"
        loading={deleteLoading}
        onConfirm={handleDeleteConfirm}
        onCancel={() => setConfirmOpen(false)}
      />
    </div>
  );
};

const CourseManager = () => {
  const [subjects, setSubjects] = useState([]);
  const [programs, setPrograms] = useState([]);
  const [curricula, setCurricula] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterProgram, setFilterProgram] = useState("All Programs");
  const [filterType, setFilterType] = useState("All Types");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(8);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState("add");
  const [selected, setSelected] = useState(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [error, setError] = useState("");

  const fetchData = async () => {
    setLoading(true);
    setError("");
    try {
      const [subjectsRes, coursesRes, curriculaRes] = await Promise.all([
        subjectService.getAll(),
        courseService.getAll(),
        curriculumService.getAll(),
      ]);
      const subjectData = subjectsRes?.data ?? subjectsRes ?? [];
      const courseData = coursesRes?.data ?? coursesRes ?? [];
      const curriculumData = curriculaRes?.data ?? curriculaRes ?? [];
      setSubjects(Array.isArray(subjectData) ? subjectData.map(normalizeSubject) : []);
      setPrograms(Array.isArray(courseData) ? courseData : []);
      setCurricula(Array.isArray(curriculumData) ? curriculumData : []);
    } catch (err) {
      setError(err?.response?.data?.message || err?.message || "Failed to load course data.");
      setSubjects([]);
      setPrograms([]);
      setCurricula([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const programOptions = useMemo(
    () => ["All Programs", ...new Set(programs.map((p) => p.code).filter(Boolean))],
    [programs]
  );

  const typeOptions = useMemo(
    () => ["All Types", ...new Set(subjects.map((subject) => subject.type).filter(Boolean))],
    [subjects]
  );

  const filteredSubjects = useMemo(() => {
    const q = search.toLowerCase();
    return subjects.filter((subject) => {
      const programMatch = filterProgram === "All Programs" || subject.course === filterProgram;
      const typeMatch = filterType === "All Types" || subject.type === filterType;
      const matchSearch = [subject.code, subject.name, subject.description, subject.course, subject.type]
        .join(" ")
        .toLowerCase()
        .includes(q);
      return programMatch && typeMatch && matchSearch;
    });
  }, [subjects, search, filterProgram, filterType]);

  const totalPages = Math.max(1, Math.ceil(filteredSubjects.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const paginatedSubjects = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredSubjects.slice(start, start + pageSize);
  }, [filteredSubjects, currentPage, pageSize]);

  useEffect(() => {
    setPage(1);
  }, [search, filterProgram, filterType, pageSize]);

  const handleSubmit = async (payload) => {
    const data = {
      ...payload,
      units: Number(payload.units || 0),
      lec: Number(payload.lec || 0),
      lab: Number(payload.lab || 0),
    };

    if (modalMode === "add") {
      await subjectService.create(data);
    } else {
      await subjectService.update(selected.id, data);
    }

    await fetchData();
    setModalOpen(false);
  };

  const handleDeleteConfirm = async () => {
    setDeleteLoading(true);
    try {
      await subjectService.delete(deleteTarget.id);
      await fetchData();
      setConfirmOpen(false);
    } finally {
      setDeleteLoading(false);
    }
  };

  const resetFilters = () => {
    setSearch("");
    setFilterProgram("All Programs");
    setFilterType("All Types");
    setPage(1);
  };

  const startItem = filteredSubjects.length === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const endItem = Math.min(currentPage * pageSize, filteredSubjects.length);

  return (
    <div className="rounded-2xl border border-white/40 bg-white/70 p-5 shadow-[0_10px_30px_rgba(15,23,42,0.04)] backdrop-blur-[2px]">
      <div className="mb-5 rounded-2xl border border-white/40 bg-white/60 p-4">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="text-lg font-bold text-gray-800">Course Management</h2>
            <p className="mt-1 text-xs text-gray-500">
              {filteredSubjects.length} course{filteredSubjects.length === 1 ? "" : "s"} found
            </p>
          </div>

          <button
            onClick={() => { setSelected(null); setModalMode("add"); setModalOpen(true); }}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-pup-maroon px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:-translate-y-0.5 hover:bg-pup-maroon-dark"
          >
            <Plus size={15} />
            Add Course
          </button>
        </div>

        <div className="mt-4 flex flex-col gap-2 xl:flex-row xl:items-center xl:justify-between">
          <div className="flex flex-1 flex-col gap-2 md:flex-row md:items-center">
            <div className="relative md:w-72">
              <Search size={14} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search course, code, program..."
                className="w-full rounded-xl border border-gray-200 bg-white py-2.5 pl-9 pr-3 text-sm text-gray-700 shadow-sm focus:border-pup-maroon focus:outline-none focus:ring-2 focus:ring-pup-maroon/20"
              />
            </div>

            <select
              value={filterProgram}
              onChange={(event) => setFilterProgram(event.target.value)}
              className="rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-700 shadow-sm focus:border-pup-maroon focus:outline-none focus:ring-2 focus:ring-pup-maroon/20"
            >
              {programOptions.map((option) => (
                <option key={option} value={option}>{option === "All Programs" ? "All Programs" : option}</option>
              ))}
            </select>

            <select
              value={filterType}
              onChange={(event) => setFilterType(event.target.value)}
              className="rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-700 shadow-sm focus:border-pup-maroon focus:outline-none focus:ring-2 focus:ring-pup-maroon/20"
            >
              {typeOptions.map((option) => (
                <option key={option} value={option}>{option === "All Types" ? "All Types" : option}</option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2 self-start xl:self-auto">
            <label className="text-xs font-medium text-gray-500">Rows</label>
            <select
              value={pageSize}
              onChange={(event) => setPageSize(Number(event.target.value))}
              className="rounded-xl border border-gray-200 bg-white px-2.5 py-2 text-sm text-gray-700 shadow-sm focus:border-pup-maroon focus:outline-none focus:ring-2 focus:ring-pup-maroon/20"
            >
              <option value={5}>5</option>
              <option value={8}>8</option>
              <option value={10}>10</option>
              <option value={20}>20</option>
            </select>

            {(search || filterProgram !== "All Programs" || filterType !== "All Types") && (
              <button
                onClick={resetFilters}
                className="text-xs font-semibold text-pup-maroon transition hover:underline"
              >
                Clear filters
              </button>
            )}
          </div>
        </div>
      </div>

      {error && (
        <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
          {error}
        </div>
      )}

      <div className="mb-3 flex items-center justify-between text-xs text-gray-500">
        <span>
          Showing {startItem}-{endItem} of {filteredSubjects.length}
        </span>
      </div>

      <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-gray-50 text-[11px] font-bold uppercase tracking-[0.08em] text-gray-500">
              <tr>
                <th className="px-4 py-3">Program</th>
                <th className="px-4 py-3">Year</th>
                <th className="px-4 py-3">Code</th>
                <th className="px-4 py-3">Description</th>
                <th className="px-4 py-3">Type</th>
                <th className="px-4 py-3">Lec</th>
                <th className="px-4 py-3">Lab</th>
                <th className="px-4 py-3">Units</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={9} className="px-4 py-10 text-center text-sm text-gray-400">
                    <Loader2 size={16} className="mx-auto animate-spin text-gray-400" />
                  </td>
                </tr>
              ) : paginatedSubjects.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-4 py-10 text-center text-sm text-gray-400">
                    No courses found.
                  </td>
                </tr>
              ) : (
                paginatedSubjects.map((subject) => (
                  <tr key={subject.id} className="border-t border-gray-200 transition-colors hover:bg-gray-50">
                    <td className="px-4 py-3 align-top text-gray-700">{subject.course}</td>
                    <td className="px-4 py-3 align-top text-gray-700">{subject.yearLevel}</td>
                    <td className="px-4 py-3 align-top">
                      <span className="inline-flex rounded-full bg-pup-maroon/10 px-2 py-1 font-semibold text-pup-maroon">
                        {subject.code}
                      </span>
                    </td>
                    <td className="max-w-[220px] px-4 py-3 align-top text-gray-700">{subject.description}</td>
                    <td className="px-4 py-3 align-top text-gray-700">
                      <span className="inline-flex rounded-full border border-gray-200 bg-gray-50 px-2.5 py-1 text-xs font-medium text-gray-600">
                        {subject.type}
                      </span>
                    </td>
                    <td className="px-4 py-3 align-top text-gray-700">{subject.lec}</td>
                    <td className="px-4 py-3 align-top text-gray-700">{subject.lab}</td>
                    <td className="px-4 py-3 align-top font-medium text-gray-700">{subject.units}</td>
                    <td className="px-4 py-3 align-top">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => { setSelected(subject); setModalMode("edit"); setModalOpen(true); }}
                          className="rounded-lg border border-gray-200 bg-white p-2 text-gray-600 shadow-sm transition-colors hover:bg-gray-50 hover:text-gray-900"
                          aria-label={`Edit ${subject.name || subject.code}`}
                        >
                          <Pencil size={14} />
                        </button>
                        <button
                          onClick={() => { setDeleteTarget(subject); setConfirmOpen(true); }}
                          className="rounded-lg border border-red-200 bg-red-50 p-2 text-red-600 shadow-sm transition-colors hover:bg-red-100"
                          aria-label={`Delete ${subject.name || subject.code}`}
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {!loading && filteredSubjects.length > 0 && (
        <div className="mt-4 flex flex-col items-center justify-between gap-3 border-t border-gray-100 pt-4 text-sm text-gray-600 md:flex-row">
          <div className="text-xs font-medium text-gray-500">
            Page {currentPage} of {totalPages}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage((prev) => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
              className="rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-sm text-gray-700 shadow-sm transition-colors disabled:cursor-not-allowed disabled:opacity-40"
            >
              Previous
            </button>
            <button
              onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))}
              disabled={currentPage === totalPages}
              className="rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-sm text-gray-700 shadow-sm transition-colors disabled:cursor-not-allowed disabled:opacity-40"
            >
              Next
            </button>
          </div>
        </div>
      )}

      <SubjectModal
        open={modalOpen}
        mode={modalMode}
        data={selected}
        courses={programs}
        curricula={curricula}
        onClose={() => setModalOpen(false)}
        onSubmit={handleSubmit}
      />

      <ConfirmDialog
        open={confirmOpen}
        title="Delete Course"
        message={`Are you sure you want to delete ${deleteTarget?.name || "this course"}?`}
        confirmLabel="Delete"
        confirmStyle="danger"
        loading={deleteLoading}
        onConfirm={handleDeleteConfirm}
        onCancel={() => setConfirmOpen(false)}
      />
    </div>
  );
};

const CurriculumPage = () => {
  const [activeTab, setActiveTab] = useState("assign");

  return (
    <>
      <TopBar title="Curriculum" subtitle="Manage and monitor classroom occupancy" />

      <div className="space-y-5 p-6">
        <div className="inline-flex items-center gap-1 rounded-xl border border-white/40 bg-white/30 p-1 shadow-[0_10px_25px_rgba(15,23,42,0.05)] backdrop-blur-[2px]">
          {TABS.map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => setActiveTab(key)}
              className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-all ${
                activeTab === key
                  ? "bg-white/70 text-pup-maroon shadow-sm ring-1 ring-pup-maroon/10"
                  : "text-gray-600 hover:bg-white/25 hover:text-gray-800"
              }`}
            >
              <Icon size={15} />
              {label}
            </button>
          ))}
        </div>

        {activeTab === "assign" && <AssignScheduleForm />}
        {activeTab === "manage" && <CurriculumManager />}
        {activeTab === "courses" && <CourseManager />}
        {activeTab === "programs" && <ProgramManager />}
      </div>
    </>
  );
};

export default CurriculumPage;