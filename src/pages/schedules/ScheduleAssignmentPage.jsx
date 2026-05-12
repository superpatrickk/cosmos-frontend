import { useEffect, useState, useMemo } from "react";
import TopBar from "../../components/layout/TopBar";
import ConfirmDialog from "../../components/common/ConfirmDialog";
import StatusBadge from "../../components/common/StatusBadge";
// import ConflictChecker from "../../components/schedules/ConflictChecker";
import ScheduleForm from "../../components/schedules/ScheduleForm";
import ScheduleEditModal from "../../components/schedules/ScheduleEditModal";
import { scheduleService } from "../../api/services/scheduleService";
import {
  CalendarDays, Clock, DoorOpen, Users,
  ChevronLeft, ChevronRight, Pencil, Trash2,
  AlertTriangle, CheckCircle2, Filter,
} from "lucide-react";

// ─── Mock Data ────────────────────────────────────────────────────────────────
const MOCK_SUBJECTS = [
  { id: "S001", code: "CS101",   name: "Introduction to Programming" },
  { id: "S002", code: "MATH101", name: "Calculus I" },
  { id: "S003", code: "EE201",   name: "Circuit Analysis" },
  { id: "S004", code: "BA105",   name: "Principles of Management" },
  { id: "S005", code: "CS201",   name: "Data Structures" },
  { id: "S006", code: "CS301",   name: "Database Management Systems" },
];

const MOCK_FACULTY = [
  { id: "F001", name: "Dr. Maria Santos" },
  { id: "F002", name: "Prof. Juan Reyes" },
  { id: "F003", name: "Dr. Ana Cruz" },
  { id: "F004", name: "Prof. Carlos Garcia" },
];

const MOCK_ROOMS = [
  { id: "RM001", name: "Conference Room A",  capacity: 50  },
  { id: "RM002", name: "Lecture Hall 1",     capacity: 100 },
  { id: "RM003", name: "Lab Room 101",       capacity: 30  },
  { id: "RM005", name: "Auditorium",         capacity: 200 },
  { id: "RM006", name: "Seminar Room 1",     capacity: 40  },
];

const MOCK_COURSES = [
  { id: "C001", code: "BSCS" },
  { id: "C002", code: "BSEE" },
  { id: "C003", code: "BSBA" },
  { id: "C004", code: "BSMath" },
  { id: "C005", code: "BSIT" },
];

const MOCK_SCHEDULES = [
  {
    id: "SCH001", subjectCode: "CS101", subjectName: "Introduction to Programming",
    faculty: "Dr. Maria Santos", room: "RM002", roomName: "Lecture Hall 1",
    day: "Monday", startTime: "08:00", endTime: "10:00",
    course: "BSCS", section: "A", semester: "1st Semester",
    academicYear: "2025-2026", status: "Active",
  },
  {
    id: "SCH002", subjectCode: "MATH101", subjectName: "Calculus I",
    faculty: "Dr. Ana Cruz", room: "RM003", roomName: "Lab Room 101",
    day: "Monday", startTime: "10:00", endTime: "12:00",
    course: "BSCS", section: "A", semester: "1st Semester",
    academicYear: "2025-2026", status: "Active",
  },
  {
    id: "SCH003", subjectCode: "EE201", subjectName: "Circuit Analysis",
    faculty: "Prof. Juan Reyes", room: "RM005", roomName: "Auditorium",
    day: "Tuesday", startTime: "13:00", endTime: "15:00",
    course: "BSEE", section: "B", semester: "1st Semester",
    academicYear: "2025-2026", status: "Active",
  },
  {
    id: "SCH004", subjectCode: "BA105", subjectName: "Principles of Management",
    faculty: "Prof. Carlos Garcia", room: "RM001", roomName: "Conference Room A",
    day: "Wednesday", startTime: "09:00", endTime: "11:00",
    course: "BSBA", section: "A", semester: "1st Semester",
    academicYear: "2025-2026", status: "Active",
  },
  {
    id: "SCH005", subjectCode: "CS201", subjectName: "Data Structures",
    faculty: "Dr. Maria Santos", room: "RM002", roomName: "Lecture Hall 1",
    day: "Thursday", startTime: "08:00", endTime: "10:00",
    course: "BSCS", section: "B", semester: "1st Semester",
    academicYear: "2025-2026", status: "Active",
  },
  {
    id: "SCH006", subjectCode: "CS301", subjectName: "Database Management Systems",
    faculty: "Dr. Maria Santos", room: "RM006", roomName: "Seminar Room 1",
    day: "Friday", startTime: "10:00", endTime: "12:00",
    course: "BSCS", section: "A", semester: "1st Semester",
    academicYear: "2025-2026", status: "Active",
  },
];

const DAYS         = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const ITEMS_PER_PAGE = 5;
// ──────────────────────────────────────────────────────────────────────────────

const ScheduleAssignmentPage = () => {
  const [schedules, setSchedules]       = useState([]);
  const [loading, setLoading]           = useState(true);
  const [error, setError]               = useState(null);
  const [search, setSearch]             = useState("");
  const [filterDay, setFilterDay]       = useState("All Days");
  const [showFilter, setShowFilter]     = useState(false);
  const [currentPage, setCurrentPage]   = useState(1);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [selectedSchedule, setSelectedSchedule] = useState(null);
  const [confirmOpen, setConfirmOpen]   = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [formLoading, setFormLoading]   = useState(false);
  const [conflictResult, setConflictResult] = useState(null);

  // Dropdown options state
  const [subjects] = useState(MOCK_SUBJECTS);
  const [faculty]  = useState(MOCK_FACULTY);
  const [rooms]    = useState(MOCK_ROOMS);
  const [courses]  = useState(MOCK_COURSES);

  const fetchSchedules = async () => {
    setLoading(true);
    setError(null);
    try {
      // TODO: const res = await scheduleService.getAll(); setSchedules(res.data);
      await new Promise((r) => setTimeout(r, 700));
      setSchedules(MOCK_SCHEDULES);
    } catch {
      setError("Failed to load schedules.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchSchedules(); }, []);

  const filtered = useMemo(() => {
    return schedules.filter((s) => {
      const matchSearch = [
        s.subjectCode, s.subjectName, s.faculty,
        s.room, s.course, s.section,
      ].join(" ").toLowerCase().includes(search.toLowerCase());
      const matchDay = filterDay === "All Days" || s.day === filterDay;
      return matchSearch && matchDay;
    });
  }, [schedules, search, filterDay]);

  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);
  const paginated  = filtered.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  useEffect(() => { setCurrentPage(1); }, [search, filterDay]);

  // Summary stats
  const totalSchedules = schedules.length;
  const uniqueRooms    = new Set(schedules.map((s) => s.room)).size;
  const uniqueFaculty  = new Set(schedules.map((s) => s.faculty)).size;

  // Handlers
  const handleCheckConflicts = async (formData) => {
    setConflictResult(null);
    try {
      // TODO: const res = await scheduleService.checkConflicts(formData);
      // MOCK conflict check logic
      await new Promise((r) => setTimeout(r, 800));
      const conflicts = schedules.filter(
        (s) =>
          s.day === formData.day &&
          s.room === formData.room &&
          s.id !== formData.id &&
          !(formData.endTime <= s.startTime || formData.startTime >= s.endTime)
      );
      setConflictResult({
        hasConflict: conflicts.length > 0,
        conflicts,
      });
    } catch {
      alert("Failed to check conflicts.");
    }
  };

  const handleAddSchedule = async (formData) => {
    setFormLoading(true);
    try {
      // TODO: await scheduleService.create(formData);
      await new Promise((r) => setTimeout(r, 600));
      const newSchedule = {
        ...formData,
        id: `SCH00${schedules.length + 1}`,
        subjectName: subjects.find((s) => s.code === formData.subjectCode)?.name ?? "",
        roomName: rooms.find((r) => r.id === formData.room)?.name ?? "",
        status: "Active",
      };
      setSchedules((prev) => [...prev, newSchedule]);
      setConflictResult(null);
      return true;
    } catch {
      alert("Failed to add schedule.");
      return false;
    } finally {
      setFormLoading(false);
    }
  };

  const handleEditSubmit = async (formData) => {
    try {
      // TODO: await scheduleService.update(selectedSchedule.id, formData);
      await new Promise((r) => setTimeout(r, 500));
      setSchedules((prev) =>
        prev.map((s) =>
          s.id === selectedSchedule.id
            ? {
                ...s, ...formData,
                subjectName: subjects.find((sub) => sub.code === formData.subjectCode)?.name ?? s.subjectName,
                roomName: rooms.find((r) => r.id === formData.room)?.name ?? s.roomName,
              }
            : s
        )
      );
      setEditModalOpen(false);
    } catch {
      alert("Failed to update schedule.");
    }
  };

  const handleDeleteConfirm = async () => {
    setDeleteLoading(true);
    try {
      // TODO: await scheduleService.delete(deleteTarget.id);
      await new Promise((r) => setTimeout(r, 500));
      setSchedules((prev) => prev.filter((s) => s.id !== deleteTarget.id));
      setConfirmOpen(false);
    } catch {
      alert("Failed to delete schedule.");
    } finally {
      setDeleteLoading(false);
    }
  };

  const formatTime = (t) => {
    if (!t) return "";
    const [h, m] = t.split(":");
    const hour = parseInt(h);
    const ampm = hour >= 12 ? "PM" : "AM";
    const h12  = hour % 12 || 12;
    return `${h12}:${m} ${ampm}`;
  };

  const DAY_COLORS = {
    Monday:    "bg-blue-50 text-blue-700",
    Tuesday:   "bg-purple-50 text-purple-700",
    Wednesday: "bg-green-50 text-green-700",
    Thursday:  "bg-orange-50 text-orange-700",
    Friday:    "bg-pink-50 text-pink-700",
    Saturday:  "bg-yellow-50 text-yellow-700",
  };

  return (
    <>
      <TopBar
        title="Schedule Assignment"
        subtitle="Manage and monitor classroom occupancy"
        search={search}
        onSearch={setSearch}
      />

      <div className="p-6 space-y-5">

        {/* Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            { label: "Total Schedules",   value: totalSchedules, icon: CalendarDays, color: "text-pup-maroon", bg: "bg-red-50"   },
            { label: "Rooms in Use",      value: uniqueRooms,    icon: DoorOpen,     color: "text-blue-600",  bg: "bg-blue-50"  },
            { label: "Faculty Assigned",  value: uniqueFaculty,  icon: Users,        color: "text-green-600", bg: "bg-green-50" },
          ].map((s) => (
            <div key={s.label} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex items-center gap-4">
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

        {/* Schedule Form + Conflict Checker */}
        <ScheduleForm
          subjects={subjects}
          faculty={faculty}
          rooms={rooms}
          courses={courses}
          days={DAYS}
          onCheckConflicts={handleCheckConflicts}
          onAddSchedule={handleAddSchedule}
          loading={formLoading}
          conflictResult={conflictResult}
          onClearConflict={() => setConflictResult(null)}
        />

        {/* Current Schedules Table */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100">

          {/* Table Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
            <div>
              <h2 className="text-base font-bold text-gray-800">Current Schedules</h2>
              <p className="text-xs text-gray-400 mt-0.5">
                {filtered.length} schedule{filtered.length !== 1 ? "s" : ""} found
              </p>
            </div>
            <div className="relative">
              <button
                onClick={() => setShowFilter((v) => !v)}
                className={`flex items-center gap-2 px-3 py-1.5 text-sm border rounded-lg transition-colors ${
                  filterDay !== "All Days"
                    ? "border-pup-maroon text-pup-maroon bg-red-50"
                    : "border-gray-200 text-gray-600 hover:bg-gray-50"
                }`}
              >
                <Filter size={14} />
                Filter by Day
                {filterDay !== "All Days" && (
                  <span className="w-2 h-2 bg-pup-maroon rounded-full" />
                )}
              </button>

              {showFilter && (
                <div className="absolute right-0 mt-2 w-44 bg-white border border-gray-100 rounded-xl shadow-lg z-10 p-2 space-y-1">
                  {["All Days", ...DAYS].map((d) => (
                    <button
                      key={d}
                      onClick={() => { setFilterDay(d); setShowFilter(false); }}
                      className={`w-full text-left px-3 py-2 text-sm rounded-lg transition-colors ${
                        filterDay === d
                          ? "bg-pup-maroon text-white"
                          : "hover:bg-gray-50 text-gray-700"
                      }`}
                    >
                      {d}
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
                  <th className="text-left px-6 py-3 font-semibold">ID</th>
                  <th className="text-left px-6 py-3 font-semibold">Subject</th>
                  <th className="text-left px-6 py-3 font-semibold">Faculty</th>
                  <th className="text-left px-6 py-3 font-semibold">Room</th>
                  <th className="text-left px-6 py-3 font-semibold">Day</th>
                  <th className="text-left px-6 py-3 font-semibold">Time</th>
                  <th className="text-left px-6 py-3 font-semibold">Course & Section</th>
                  <th className="text-left px-6 py-3 font-semibold">Status</th>
                  <th className="text-left px-6 py-3 font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading && [...Array(5)].map((_, i) => (
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
                      <CalendarDays size={36} className="text-gray-200 mx-auto mb-2" />
                      <p className="text-sm text-gray-400">No schedules found.</p>
                    </td>
                  </tr>
                )}

                {!loading && !error && paginated.map((sched) => (
                  <tr
                    key={sched.id}
                    className="border-b border-gray-50 hover:bg-gray-50 transition-colors"
                  >
                    <td className="px-6 py-4 text-xs text-gray-400 font-medium">
                      {sched.id}
                    </td>
                    <td className="px-6 py-4">
                      <div>
                        <span className="px-2 py-0.5 bg-pup-maroon/10 text-pup-maroon text-xs font-bold rounded">
                          {sched.subjectCode}
                        </span>
                        <p className="text-xs text-gray-500 mt-1 max-w-[160px] truncate">
                          {sched.subjectName}
                        </p>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm font-medium text-gray-700">{sched.faculty}</p>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1.5">
                        <DoorOpen size={13} className="text-gray-400" />
                        <div>
                          <p className="text-xs font-semibold text-gray-700">{sched.room}</p>
                          <p className="text-xs text-gray-400">{sched.roomName}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${DAY_COLORS[sched.day] ?? "bg-gray-100 text-gray-600"}`}>
                        {sched.day}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1.5">
                        <Clock size={13} className="text-gray-400" />
                        <span className="text-xs font-medium text-gray-700">
                          {formatTime(sched.startTime)} – {formatTime(sched.endTime)}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div>
                        <span className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs font-semibold rounded">
                          {sched.course}
                        </span>
                        <span className="text-xs text-gray-400 ml-1.5">
                          Sec {sched.section}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <StatusBadge status={sched.status} />
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => {
                            setSelectedSchedule(sched);
                            setEditModalOpen(true);
                          }}
                          className="p-1.5 text-gray-400 hover:text-pup-maroon hover:bg-red-50 rounded-lg transition-colors"
                          title="Edit"
                        >
                          <Pencil size={15} />
                        </button>
                        <button
                          onClick={() => { setDeleteTarget(sched); setConfirmOpen(true); }}
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
                {filtered.length} schedules
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

      {/* Edit Modal */}
      <ScheduleEditModal
        open={editModalOpen}
        data={selectedSchedule}
        subjects={subjects}
        faculty={faculty}
        rooms={rooms}
        courses={courses}
        days={DAYS}
        onClose={() => setEditModalOpen(false)}
        onSubmit={handleEditSubmit}
      />

      {/* Delete Confirm */}
      <ConfirmDialog
        open={confirmOpen}
        title="Delete Schedule"
        message={`Are you sure you want to delete the schedule for "${deleteTarget?.subjectCode}" on ${deleteTarget?.day}? This cannot be undone.`}
        confirmLabel="Delete"
        confirmStyle="danger"
        loading={deleteLoading}
        onConfirm={handleDeleteConfirm}
        onCancel={() => setConfirmOpen(false)}
      />
    </>
  );
};

export default ScheduleAssignmentPage;