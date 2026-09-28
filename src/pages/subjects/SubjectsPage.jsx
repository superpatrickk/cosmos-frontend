import { useEffect, useState, useMemo } from "react";
import TopBar from "../../components/layout/TopBar";
import StatusBadge from "../../components/common/StatusBadge";
import ConfirmDialog from "../../components/common/ConfirmDialog";
import SubjectModal from "../../components/subjects/SubjectModal";
import SubjectViewModal from "../../components/subjects/SubjectViewModal";
import { subjectService } from "../../api/services/subjectService";
import { courseService } from "../../api/services/courseService";
import {
  BookMarked, FlaskConical, BookOpen,
  Filter, ChevronLeft, ChevronRight,
  Eye, Pencil, Trash2,
} from "lucide-react";

const SUBJECT_TYPES  = ["All Types", "Lecture", "Lecture/Lab", "Laboratory"];
const ALL_COURSES = "All Courses";
const ITEMS_PER_PAGE = 6;

const normalizeSubject = (subject) => ({
  ...subject,
  name: subject.name || subject.description || "",
  units: Number(subject.units || 0),
  prerequisite: subject.prerequisite || "None",
});

const SubjectsPage = () => {
  const [subjects, setSubjects]         = useState([]);
  const [courses, setCourses]           = useState([]);
  const [coursesLoading, setCoursesLoading] = useState(true);
  const [coursesError, setCoursesError] = useState(null);
  const [loading, setLoading]           = useState(true);
  const [error, setError]               = useState(null);
  const [search, setSearch]             = useState("");
  const [filterType, setFilterType]     = useState("All Types");
  const [filterCourse, setFilterCourse] = useState(ALL_COURSES);
  const [showFilter, setShowFilter]     = useState(false);
  const [currentPage, setCurrentPage]   = useState(1);
  const [modalOpen, setModalOpen]       = useState(false);
  const [viewOpen, setViewOpen]         = useState(false);
  const [modalMode, setModalMode]       = useState("add");
  const [selected, setSelected]         = useState(null);
  const [confirmOpen, setConfirmOpen]   = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [actionError, setActionError] = useState(null);

  const fetchSubjects = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await subjectService.getAll();
      const data = response?.data ?? response;
      setSubjects(Array.isArray(data) ? data.map(normalizeSubject) : []);
    } catch (err) {
      setError(err?.response?.data?.message || err?.message || "Failed to load subjects.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchSubjects(); }, []);

  useEffect(() => {
    let mounted = true;
    const fetchCourses = async () => {
      setCoursesLoading(true);
      setCoursesError(null);
      try {
        const response = await courseService.getAll();
        const data = response?.data ?? response;
        if (mounted) setCourses(Array.isArray(data) ? data : []);
      } catch (err) {
        if (mounted) setCoursesError(err?.response?.data?.message || err?.message || "Failed to load courses.");
      } finally {
        if (mounted) setCoursesLoading(false);
      }
    };
    fetchCourses();
    return () => { mounted = false; };
  }, []);

  const courseByCode = useMemo(() =>
    new Map(courses.map((course) => [course.code, course])),
  [courses]);

  const filtered = useMemo(() => {
    return subjects.filter((s) => {
      const matchSearch = [s.name, s.code, s.course, s.prerequisite]
        .join(" ").toLowerCase()
        .includes(search.toLowerCase());
      const matchType =
        filterType === "All Types" || s.type === filterType;
      const matchCourse = filterCourse === ALL_COURSES || s.course === filterCourse;
      return matchSearch && matchType && matchCourse;
    });
  }, [subjects, search, filterType, filterCourse]);

  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);
  const paginated  = filtered.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  useEffect(() => { setCurrentPage(1); }, [search, filterType, filterCourse]);

  // Summary stats
  const lectureCount    = subjects.filter((s) => s.type === "Lecture").length;
  const labCount        = subjects.filter((s) => s.type === "Lecture/Lab" || s.type === "Laboratory").length;
  const totalUnits      = subjects.reduce((sum, s) => sum + s.units, 0);

  // Handlers
  const handleAdd = () => {
    setSelected(null);
    setModalMode("add");
    setModalOpen(true);
  };

  const handleEdit = (subject) => {
    setSelected(subject);
    setModalMode("edit");
    setModalOpen(true);
  };

  const handleView = (subject) => {
    setSelected(subject);
    setViewOpen(true);
  };

  const handleDeleteClick = (subject) => {
    setDeleteTarget(subject);
    setConfirmOpen(true);
  };

  const handleDeleteConfirm = async () => {
    setDeleteLoading(true);
    try {
      await subjectService.delete(deleteTarget.id);
      setSubjects((prev) => prev.filter((s) => s.id !== deleteTarget.id));
      setConfirmOpen(false);
      setDeleteTarget(null);
      setActionError(null);
    } catch (err) {
      setActionError(err?.response?.data?.message || err?.message || "Failed to delete subject.");
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleModalSubmit = async (formData) => {
    const response = modalMode === "add"
      ? await subjectService.create(formData)
      : await subjectService.update(selected.id, formData);
    const savedSubject = normalizeSubject(response?.data ?? response);
    setSubjects((prev) => modalMode === "add"
      ? [...prev, savedSubject]
      : prev.map((subject) => subject.id === selected.id ? savedSubject : subject)
    );
    setModalOpen(false);
  };

  const TYPE_STYLES = {
    "Lecture":     "bg-blue-50 text-blue-700",
    "Lecture/Lab": "bg-purple-50 text-purple-700",
    "Laboratory":  "bg-green-50 text-green-700",
  };

  return (
    <>
      <TopBar
        title="Subjects"
        subtitle="Manage and monitor classroom occupancy"
        onAddNew={handleAdd}
        addNewLabel="Add Subject"
        search={search}
        onSearch={setSearch}
      />

      <div className="p-6 space-y-5">

        {/* Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            {
              label: "Total Subjects", value: subjects.length,
              icon: BookMarked, color: "text-pup-maroon", bg: "bg-red-50",
            },
            {
              label: "Lecture Subjects", value: lectureCount,
              icon: BookOpen, color: "text-blue-600", bg: "bg-blue-50",
            },
            {
              label: "Lab / Mixed Subjects", value: labCount,
              icon: FlaskConical, color: "text-purple-600", bg: "bg-purple-50",
            },
          ].map((s) => (
            <div
              key={s.label}
              className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex items-center gap-4"
            >
              <div className={`w-11 h-11 ${s.bg} rounded-xl flex items-center justify-center flex-shrink-0`}>
                <s.icon size={22} className={s.color} />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-800">{s.value}</p>
                <p className="text-sm text-gray-400">{s.label}</p>
              </div>
            </div>
          ))}
        </div>

        {actionError && (
          <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {actionError}
          </p>
        )}

        {/* Table Card */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100">

          {/* Table Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
            <div>
              <h2 className="text-base font-bold text-gray-800">Subject Management</h2>
              <p className="text-xs text-gray-400 mt-0.5">
                {filtered.length} subject{filtered.length !== 1 ? "s" : ""} found
              </p>
            </div>
            <div className="relative">
              <button
                onClick={() => setShowFilter((v) => !v)}
                className={`flex items-center gap-2 px-3 py-1.5 text-sm border rounded-lg transition-colors ${
                  showFilter || filterType !== "All Types" || filterCourse !== ALL_COURSES
                    ? "border-pup-maroon text-pup-maroon bg-red-50"
                    : "border-gray-200 text-gray-600 hover:bg-gray-50"
                }`}
              >
                <Filter size={14} />
                Filter
                {(filterType !== "All Types" || filterCourse !== ALL_COURSES) && (
                  <span className="w-2 h-2 bg-pup-maroon rounded-full" />
                )}
              </button>

              {showFilter && (
                <div className="absolute right-0 mt-2 w-56 max-h-96 overflow-y-auto bg-white border border-gray-100 rounded-xl shadow-lg z-10 p-3 space-y-1">
                  <p className="text-xs font-semibold text-gray-400 uppercase px-2 mb-2">
                    Subject Type
                  </p>
                  {SUBJECT_TYPES.map((type) => (
                    <button
                      key={type}
                      onClick={() => setFilterType(type)}
                      className={`w-full text-left px-3 py-2 text-sm rounded-lg transition-colors ${
                        filterType === type
                          ? "bg-pup-maroon text-white"
                          : "hover:bg-gray-50 text-gray-700"
                      }`}
                    >
                      {type}
                    </button>
                  ))}
                  <p className="text-xs font-semibold text-gray-400 uppercase px-2 pt-3 mb-2">
                    Program / Course
                  </p>
                  {[ALL_COURSES, ...courses].map((course) => (
                    <button
                      key={course === ALL_COURSES ? ALL_COURSES : course.id}
                      onClick={() => setFilterCourse(course === ALL_COURSES ? ALL_COURSES : course.code)}
                      className={`w-full text-left px-3 py-2 text-sm rounded-lg transition-colors ${
                        filterCourse === (course === ALL_COURSES ? ALL_COURSES : course.code)
                          ? "bg-pup-maroon text-white"
                          : "hover:bg-gray-50 text-gray-700"
                      }`}
                    >
                      {course === ALL_COURSES
                        ? "All Courses"
                        : `${course.code}${course.name ? ` - ${course.name}` : ""}`}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 text-xs text-gray-400 uppercase tracking-wide">
                  <th className="text-left px-6 py-3 font-semibold">Subject ID</th>
                  <th className="text-left px-6 py-3 font-semibold">Code</th>
                  <th className="text-left px-6 py-3 font-semibold">Subject Name</th>
                  <th className="text-left px-6 py-3 font-semibold">Units</th>
                  <th className="text-left px-6 py-3 font-semibold">Type</th>
                  <th className="text-left px-6 py-3 font-semibold">Prerequisite</th>
                  <th className="text-left px-6 py-3 font-semibold">Course</th>
                  <th className="text-left px-6 py-3 font-semibold">Status</th>
                  <th className="text-left px-6 py-3 font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading && [...Array(6)].map((_, i) => (
                  <tr key={i} className="border-b border-gray-50 animate-pulse">
                    {[...Array(9)].map((_, j) => (
                      <td key={j} className="px-6 py-4">
                        <div className="h-4 bg-gray-100 rounded w-20" />
                      </td>
                    ))}
                  </tr>
                ))}

                {!loading && error && (
                  <tr>
                    <td colSpan={9} className="px-6 py-10 text-center text-sm text-red-400">
                      {error}
                    </td>
                  </tr>
                )}

                {!loading && !error && paginated.length === 0 && (
                  <tr>
                    <td colSpan={9} className="px-6 py-12 text-center">
                      <BookMarked size={36} className="text-gray-200 mx-auto mb-2" />
                      <p className="text-sm text-gray-400">No subjects found.</p>
                    </td>
                  </tr>
                )}

                {!loading && !error && paginated.map((subject) => (
                  <tr
                    key={subject.id}
                    className="border-b border-gray-50 hover:bg-gray-50 transition-colors"
                  >
                    <td className="px-6 py-4 text-xs text-gray-400 font-medium">
                      {subject.id}
                    </td>
                    <td className="px-6 py-4">
                      <span className="px-2.5 py-1 bg-pup-maroon/10 text-pup-maroon text-xs font-bold rounded-lg">
                        {subject.code}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div>
                        <p className="font-semibold text-gray-800 leading-tight">
                          {subject.name}
                        </p>
                        <p className="text-xs text-gray-400 mt-0.5">
                          {subject.yearLevel} • {subject.semester}
                        </p>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="font-bold text-gray-700">
                        {subject.units}
                      </span>
                      <span className="text-xs text-gray-400 ml-1">units</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${TYPE_STYLES[subject.type] ?? "bg-gray-100 text-gray-500"}`}>
                        {subject.type}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {subject.prerequisite === "None" ? (
                        <span className="text-xs text-gray-400 italic">None</span>
                      ) : (
                        <span className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded font-medium">
                          {subject.prerequisite}
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <span className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded font-medium">
                        {courseByCode.get(subject.course)?.name || subject.course}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <StatusBadge status={subject.status} />
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => handleView(subject)}
                          className="p-1.5 text-gray-400 hover:text-blue-500 hover:bg-blue-50 rounded-lg transition-colors"
                          title="View"
                        >
                          <Eye size={15} />
                        </button>
                        <button
                          onClick={() => handleEdit(subject)}
                          className="p-1.5 text-gray-400 hover:text-pup-maroon hover:bg-red-50 rounded-lg transition-colors"
                          title="Edit"
                        >
                          <Pencil size={15} />
                        </button>
                        <button
                          onClick={() => handleDeleteClick(subject)}
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

          {/* Pagination */}
          {!loading && !error && filtered.length > ITEMS_PER_PAGE && (
            <div className="flex items-center justify-between px-6 py-4 border-t border-gray-100">
              <p className="text-xs text-gray-400">
                Showing {(currentPage - 1) * ITEMS_PER_PAGE + 1}–
                {Math.min(currentPage * ITEMS_PER_PAGE, filtered.length)} of{" "}
                {filtered.length} subjects
              </p>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="p-1.5 rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 disabled:opacity-40 transition-colors"
                >
                  <ChevronLeft size={15} />
                </button>
                {[...Array(totalPages)].map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setCurrentPage(i + 1)}
                    className={`w-8 h-8 text-xs rounded-lg border transition-colors ${
                      currentPage === i + 1
                        ? "bg-pup-maroon text-white border-pup-maroon"
                        : "border-gray-200 text-gray-600 hover:bg-gray-50"
                    }`}
                  >
                    {i + 1}
                  </button>
                ))}
                <button
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="p-1.5 rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 disabled:opacity-40 transition-colors"
                >
                  <ChevronRight size={15} />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Modals */}
      <SubjectModal
        open={modalOpen}
        mode={modalMode}
        data={selected}
        courses={courses}
        coursesLoading={coursesLoading}
        coursesError={coursesError}
        onClose={() => setModalOpen(false)}
        onSubmit={handleModalSubmit}
      />

      <SubjectViewModal
        open={viewOpen}
        data={selected}
        onClose={() => setViewOpen(false)}
        onEdit={(s) => {
          setViewOpen(false);
          setSelected(s);
          setModalMode("edit");
          setModalOpen(true);
        }}
      />

      <ConfirmDialog
        open={confirmOpen}
        title="Delete Subject"
        message={`Are you sure you want to delete "${deleteTarget?.name}"? This may affect existing schedules.`}
        confirmLabel="Delete"
        confirmStyle="danger"
        loading={deleteLoading}
        onConfirm={handleDeleteConfirm}
        onCancel={() => setConfirmOpen(false)}
      />
    </>
  );
};

export default SubjectsPage;