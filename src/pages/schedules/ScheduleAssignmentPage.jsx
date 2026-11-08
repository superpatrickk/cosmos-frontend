import { useEffect, useState, useMemo } from "react";
import TopBar from "../../components/layout/TopBar";
import ConfirmDialog from "../../components/common/ConfirmDialog";
import StatusBadge from "../../components/common/StatusBadge";
// import ConflictChecker from "../../components/schedules/ConflictChecker";
import ScheduleForm from "../../components/schedules/ScheduleForm";
import ScheduleEditModal from "../../components/schedules/ScheduleEditModal";
import { scheduleService } from "../../api/services/scheduleService";
import { facultyService } from "../../api/services/facultyService";
import { roomService } from "../../api/services/roomService";
import { subjectService } from "../../api/services/subjectService";
import { courseService } from "../../api/services/courseService";
import {
  CalendarDays, Clock, DoorOpen, Users,
  ChevronLeft, ChevronRight, Pencil, Trash2,
  AlertTriangle, CheckCircle2, Filter,
} from "lucide-react";

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const ITEMS_PER_PAGE = 5;

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
  const [faculty, setFaculty] = useState([]);
  const [facultyLoading, setFacultyLoading] = useState(true);
  const [facultyError, setFacultyError] = useState(null);
  const [rooms, setRooms] = useState([]);
  const [roomsLoading, setRoomsLoading] = useState(true);
  const [roomsError, setRoomsError] = useState(null);

  const [subjects, setSubjects] = useState([]);
  const [courses, setCourses] = useState([]);

  const fetchSchedules = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await scheduleService.getAll();
      const data = response?.data ?? response ?? [];
      setSchedules(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err?.response?.data?.message || err?.message || "Failed to load schedules.");
      setSchedules([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchSchedules(); }, []);

  useEffect(() => {
    let active = true;
    const fetchMetadata = async () => {
      try {
        const [subjectsResponse, coursesResponse] = await Promise.all([
          subjectService.getAll(),
          courseService.getAll(),
        ]);
        if (!active) return;
        setSubjects(Array.isArray(subjectsResponse?.data ?? subjectsResponse ?? []) ? (subjectsResponse?.data ?? subjectsResponse) : []);
        setCourses(Array.isArray(coursesResponse?.data ?? coursesResponse ?? []) ? (coursesResponse?.data ?? coursesResponse) : []);
      } catch (err) {
        console.error("Failed to load metadata for schedule assignment:", err);
        if (active) {
          setSubjects([]);
          setCourses([]);
        }
      }
    };
    fetchMetadata();
    return () => { active = false; };
  }, []);

  useEffect(() => {
    let active = true;
    const fetchFaculty = async () => {
      setFacultyLoading(true);
      setFacultyError(null);
      try {
        const response = await facultyService.getAll();
        const data = response?.data ?? response;
        if (active) setFaculty(Array.isArray(data) ? data : []);
      } catch (err) {
        if (active) setFacultyError(err?.response?.data?.message || err?.message || "Failed to load faculty members.");
      } finally {
        if (active) setFacultyLoading(false);
      }
    };
    fetchFaculty();
    return () => { active = false; };
  }, []);

  useEffect(() => {
    let active = true;
    const fetchRooms = async () => {
      setRoomsLoading(true);
      setRoomsError(null);
      try {
        const response = await roomService.getAll();
        const data = response?.data ?? response;
        if (active) setRooms(Array.isArray(data) ? data : []);
      } catch (err) {
        if (active) setRoomsError(err?.response?.data?.message || err?.message || "Failed to load rooms.");
      } finally {
        if (active) setRoomsLoading(false);
      }
    };
    fetchRooms();
    return () => { active = false; };
  }, []);

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
      const response = await scheduleService.checkConflicts(formData);
      const payload = response?.data ?? response ?? { hasConflict: false, conflicts: [] };
      setConflictResult({
        hasConflict: Boolean(payload.hasConflict ?? payload.conflicts?.length > 0),
        conflicts: Array.isArray(payload.conflicts) ? payload.conflicts : [],
      });
    } catch (err) {
      console.error("Failed to check conflicts:", err);
      alert(err?.response?.data?.message || err?.message || "Failed to check conflicts.");
    }
  };

  const handleAddSchedule = async (formData) => {
    setFormLoading(true);
    try {
      await scheduleService.create(formData);
      await fetchSchedules();
      setConflictResult(null);
      return true;
    } catch (err) {
      console.error("Failed to add schedule:", err);
      alert(err?.response?.data?.message || err?.message || "Failed to add schedule.");
      return false;
    } finally {
      setFormLoading(false);
    }
  };

  const handleEditSubmit = async (formData) => {
    try {
      await scheduleService.update(selectedSchedule.id, formData);
      await fetchSchedules();
      setEditModalOpen(false);
    } catch (err) {
      console.error("Failed to update schedule:", err);
      alert(err?.response?.data?.message || err?.message || "Failed to update schedule.");
    }
  };

  const handleDeleteConfirm = async () => {
    setDeleteLoading(true);
    try {
      await scheduleService.delete(deleteTarget.id);
      await fetchSchedules();
      setConfirmOpen(false);
    } catch (err) {
      console.error("Failed to delete schedule:", err);
      alert(err?.response?.data?.message || err?.message || "Failed to delete schedule.");
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
            <div key={s.label} className="rounded-2xl border border-white/40 bg-white/70 p-5 shadow-[0_10px_25px_rgba(15,23,42,0.05)] backdrop-blur-[1px] flex items-center gap-4">
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
          facultyLoading={facultyLoading}
          facultyError={facultyError}
          rooms={rooms}
          roomsLoading={roomsLoading}
          roomsError={roomsError}
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
                  <th className="text-left px-6 py-3 font-semibold">Program & Section</th>
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
        roomsLoading={roomsLoading}
        roomsError={roomsError}
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