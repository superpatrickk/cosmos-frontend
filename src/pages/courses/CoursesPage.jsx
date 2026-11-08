import { useEffect, useState, useMemo } from "react";
import TopBar from "../../components/layout/TopBar";
import StatusBadge from "../../components/common/StatusBadge";
import ConfirmDialog from "../../components/common/ConfirmDialog";
import CourseModal from "../../components/courses/CourseModal";
import CourseViewModal from "../../components/courses/CourseViewModal";
import { courseService } from "../../api/services/courseService";
import {
  Filter, GraduationCap, Users, Clock,
  BookOpen, ChevronLeft, ChevronRight,
} from "lucide-react";
import { Eye, Pencil, Trash2 } from "lucide-react";

const ITEMS_PER_PAGE = 5;

const CoursesPage = () => {
  const [courses, setCourses]           = useState([]);
  const [loading, setLoading]           = useState(true);
  const [error, setError]               = useState(null);
  const [search, setSearch]             = useState("");
  const [filterDept, setFilterDept]     = useState("All Departments");
  const [showFilter, setShowFilter]     = useState(false);
  const [currentPage, setCurrentPage]   = useState(1);
  const [modalOpen, setModalOpen]       = useState(false);
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [modalMode, setModalMode]       = useState("add");
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [confirmOpen, setConfirmOpen]   = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const fetchCourses = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await courseService.getAll();
      const data = Array.isArray(response?.data ?? response ?? []) ? (response?.data ?? response) : [];
      setCourses(data.map((course) => ({
        ...course,
        code: course.code || "",
        name: course.name || "",
        department: course.department || course.college || "N/A",
        duration: course.duration || "N/A",
        students: Number(course.students || 0),
        status: course.status || "Active",
        description: course.description || "",
        totalSections: Number(course.totalSections || 0),
      })));
    } catch (err) {
      setError(err?.response?.data?.message || err?.message || "Failed to load programs.");
      setCourses([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchCourses(); }, []);

  const departmentOptions = useMemo(() => {
    const departments = courses
      .map((course) => course.department)
      .filter(Boolean);

    return ["All Departments", ...new Set(departments)];
  }, [courses]);

  // Filter + Search + Pagination
  const filtered = useMemo(() => {
    return courses.filter((c) => {
      const matchSearch = [c.name, c.code, c.department]
        .join(" ").toLowerCase()
        .includes(search.toLowerCase());
      const matchDept =
        filterDept === "All Departments" || c.department === filterDept;
      return matchSearch && matchDept;
    });
  }, [courses, search, filterDept]);

  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);
  const paginated  = filtered.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  useEffect(() => { setCurrentPage(1); }, [search, filterDept]);

  // Summary stats derived from data
  const totalStudents  = courses.reduce((s, c) => s + Number(c.students || 0), 0);
  const totalSections  = courses.reduce((s, c) => s + Number(c.totalSections || 0), 0);
  const activeCourses  = courses.filter((c) => (c.status || "Active").toLowerCase() === "active").length;

  // Handlers
  const handleAdd = () => {
    setSelectedCourse(null);
    setModalMode("add");
    setModalOpen(true);
  };

  const handleEdit = (course) => {
    setSelectedCourse(course);
    setModalMode("edit");
    setModalOpen(true);
  };

  const handleView = (course) => {
    setSelectedCourse(course);
    setViewModalOpen(true);
  };

  const handleDeleteClick = (course) => {
    setDeleteTarget(course);
    setConfirmOpen(true);
  };

  const handleDeleteConfirm = async () => {
    setDeleteLoading(true);
    try {
      await courseService.delete(deleteTarget.id);
      setCourses((prev) => prev.filter((c) => c.id !== deleteTarget.id));
      setConfirmOpen(false);
    } catch (err) {
      alert(err?.response?.data?.message || err?.message || "Failed to delete program.");
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleModalSubmit = async (formData) => {
    try {
      if (modalMode === "add") {
        const response = await courseService.create(formData);
        const createdCourse = response?.data ?? response ?? formData;
        setCourses((prev) => [
          {
            ...createdCourse,
            department: createdCourse.department || formData.department || "N/A",
            duration: createdCourse.duration || formData.duration || "N/A",
            students: Number(createdCourse.students || 0),
            status: createdCourse.status || "Active",
            description: createdCourse.description || "",
            totalSections: Number(createdCourse.totalSections || 0),
          },
          ...prev,
        ]);
      } else {
        const response = await courseService.update(selectedCourse.id, formData);
        const updatedCourse = response?.data ?? response ?? { ...selectedCourse, ...formData };
        setCourses((prev) =>
          prev.map((c) =>
            c.id === selectedCourse.id
              ? {
                  ...c,
                  ...updatedCourse,
                  department: updatedCourse.department || c.department || "N/A",
                  duration: updatedCourse.duration || c.duration || "N/A",
                  students: Number(updatedCourse.students || c.students || 0),
                  status: updatedCourse.status || c.status || "Active",
                  description: updatedCourse.description || c.description || "",
                  totalSections: Number(updatedCourse.totalSections || c.totalSections || 0),
                }
              : c
          )
        );
      }
      setModalOpen(false);
    } catch (err) {
      alert(err?.response?.data?.message || err?.message || "Failed to save program.");
    }
  };

  return (
    <>
      <TopBar
        title="Programs"
        subtitle="Manage and monitor classroom occupancy"
        onAddNew={handleAdd}
        addNewLabel="Add Program"
        search={search}
        onSearch={setSearch}
      />

      <div className="p-6 space-y-5">

        {/* Summary Cards */}
        
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            {
              label: "Total Programs", value: courses.length,
              icon: GraduationCap, color: "text-pup-maroon", bg: "bg-red-50",
            },
            {
              label: "Total Students", value: totalStudents.toLocaleString(),
              icon: Users, color: "text-blue-600", bg: "bg-blue-50",
            },
            {
              label: "Total Sections", value: totalSections,
              icon: BookOpen, color: "text-green-600", bg: "bg-green-50",
            },
          ].map((s) => (
            <div
              key={s.label}
              className="rounded-2xl border border-white/25 bg-white/45 p-5 shadow-[0_8px_20px_rgba(15,23,42,0.04)] backdrop-blur-[1px] flex items-center gap-4"
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

        {/* Table Card */}
        <div className="rounded-2xl border border-white/25 bg-white/45 shadow-[0_8px_20px_rgba(15,23,42,0.04)] backdrop-blur-[1px]">

          {/* Table Header */}
          <div className="flex items-center justify-between border-b border-white/25 px-6 py-4">
            <div>
              <h2 className="text-base font-bold text-gray-800">Program Management</h2>
              <p className="text-xs text-gray-400 mt-0.5">
                {filtered.length} program{filtered.length !== 1 ? "s" : ""} found
              </p>
            </div>
            <div className="relative">
              <button
                onClick={() => setShowFilter((v) => !v)}
                className={`flex items-center gap-2 px-3 py-1.5 text-sm border rounded-lg transition-colors ${
                  showFilter || filterDept !== "All Departments"
                    ? "border-pup-maroon text-pup-maroon bg-red-50"
                    : "border-gray-200 text-gray-600 hover:bg-gray-50"
                }`}
              >
                <Filter size={14} />
                Filter
                {filterDept !== "All Departments" && (
                  <span className="w-2 h-2 bg-pup-maroon rounded-full" />
                )}
              </button>

              {/* Filter Dropdown */}
              {showFilter && (
                <div className="absolute right-0 mt-2 w-56 border border-white/30 bg-white/70 rounded-xl shadow-lg z-10 p-3 space-y-1 backdrop-blur-[1px]">
                  <p className="text-xs font-semibold text-gray-400 uppercase px-2 mb-2">
                    Filter by Department
                  </p>
                  {departmentOptions.map((dept) => (
                    <button
                      key={dept}
                      onClick={() => { setFilterDept(dept); setShowFilter(false); }}
                      className={`w-full text-left px-3 py-2 text-sm rounded-lg transition-colors ${
                        filterDept === dept
                          ? "bg-pup-maroon text-white"
                          : "hover:bg-gray-50 text-gray-700"
                      }`}
                    >
                      {dept}
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
                  <th className="text-left px-6 py-3 font-semibold">Code</th>
                  <th className="text-left px-6 py-3 font-semibold">Program Name</th>
                  <th className="text-left px-6 py-3 font-semibold">Department</th>
                  <th className="text-left px-6 py-3 font-semibold">Duration</th>
                  <th className="text-left px-6 py-3 font-semibold">Students</th>
                  <th className="text-left px-6 py-3 font-semibold">Status</th>
                  <th className="text-left px-6 py-3 font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading && [...Array(5)].map((_, i) => (
                  <tr key={i} className="border-b border-gray-50 animate-pulse">
                    {[...Array(7)].map((_, j) => (
                      <td key={j} className="px-6 py-4">
                        <div className="h-4 bg-gray-100 rounded w-24" />
                      </td>
                    ))}
                  </tr>
                ))}

                {!loading && error && (
                  <tr>
                    <td colSpan={7} className="px-6 py-10 text-center text-sm text-red-400">
                      {error}
                    </td>
                  </tr>
                )}

                {!loading && !error && paginated.length === 0 && (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center">
                      <GraduationCap size={36} className="text-gray-200 mx-auto mb-2" />
                      <p className="text-sm text-gray-400">No programs found.</p>
                    </td>
                  </tr>
                )}

                {!loading && !error && paginated.map((course) => (
                  <tr
                    key={course.id}
                    className="border-b border-gray-50 hover:bg-gray-50 transition-colors group"
                  >
                    <td className="px-6 py-4">
                      <span className="px-2.5 py-1 bg-pup-maroon/10 text-pup-maroon text-xs font-bold rounded-lg">
                        {course.code}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div>
                        <p className="font-semibold text-gray-800 leading-tight">
                          {course.name}
                        </p>
                        <p className="text-xs text-gray-400 mt-0.5 line-clamp-1">
                          {course.description}
                        </p>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-gray-600 text-xs">{course.department}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1.5 text-gray-600 text-xs">
                        <Clock size={13} className="text-gray-400" />
                        {course.duration}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1.5 text-gray-600 text-xs">
                        <Users size={13} className="text-gray-400" />
                        {course.students.toLocaleString()}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <StatusBadge status={course.status} />
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => handleView(course)}
                          className="p-1.5 text-gray-400 hover:text-blue-500 hover:bg-blue-50 rounded-lg transition-colors"
                          title="View Details"
                        >
                          <Eye size={15} />
                        </button>
                        <button
                          onClick={() => handleEdit(course)}
                          className="p-1.5 text-gray-400 hover:text-pup-maroon hover:bg-red-50 rounded-lg transition-colors"
                          title="Edit"
                        >
                          <Pencil size={15} />
                        </button>
                        <button
                          onClick={() => handleDeleteClick(course)}
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
                {filtered.length} programs
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

      {/* Add / Edit Modal */}
      <CourseModal
        open={modalOpen}
        mode={modalMode}
        data={selectedCourse}
        onClose={() => setModalOpen(false)}
        onSubmit={handleModalSubmit}
      />

      {/* View Modal */}
      <CourseViewModal
        open={viewModalOpen}
        data={selectedCourse}
        onClose={() => setViewModalOpen(false)}
        onEdit={(course) => {
          setViewModalOpen(false);
          setSelectedCourse(course);
          setModalMode("edit");
          setModalOpen(true);
        }}
      />

      {/* Delete Confirm */}
      <ConfirmDialog
        open={confirmOpen}
        title="Delete Program"
        message={`Are you sure you want to delete "${deleteTarget?.name}"? All associated subjects and schedules may be affected.`}
        confirmLabel="Delete"
        confirmStyle="danger"
        loading={deleteLoading}
        onConfirm={handleDeleteConfirm}
        onCancel={() => setConfirmOpen(false)}
      />
    </>
  );
};

export default CoursesPage;