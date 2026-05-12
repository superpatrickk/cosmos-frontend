import { useEffect, useState, useMemo, useRef } from "react";
import TopBar from "../../components/layout/TopBar";
import { printableService } from "../../api/services/printableService";
import {
  Printer, Download, Filter,
  ChevronDown, Loader2, FileText,
} from "lucide-react";

// ─── Mock Data ────────────────────────────────────────────────────────────────
const MOCK_SCHEDULE_DATA = [
  {
    id: "SCH001", subjectCode: "CS101", subjectName: "Introduction to Programming",
    faculty: "Dr. Maria Santos", facultyId: "F001",
    room: "RM002", roomName: "Lecture Hall 1",
    day: "Monday", startTime: "08:00", endTime: "10:00",
    course: "BSCS", section: "A",
    semester: "1st Semester", academicYear: "2025-2026",
  },
  {
    id: "SCH002", subjectCode: "MATH101", subjectName: "Calculus I",
    faculty: "Dr. Ana Cruz", facultyId: "F003",
    room: "RM003", roomName: "Lab Room 101",
    day: "Monday", startTime: "10:00", endTime: "12:00",
    course: "BSCS", section: "A",
    semester: "1st Semester", academicYear: "2025-2026",
  },
  {
    id: "SCH003", subjectCode: "EE201", subjectName: "Circuit Analysis",
    faculty: "Prof. Juan Reyes", facultyId: "F002",
    room: "RM005", roomName: "Auditorium",
    day: "Tuesday", startTime: "13:00", endTime: "15:00",
    course: "BSEE", section: "B",
    semester: "1st Semester", academicYear: "2025-2026",
  },
  {
    id: "SCH004", subjectCode: "BA105", subjectName: "Principles of Management",
    faculty: "Prof. Carlos Garcia", facultyId: "F004",
    room: "RM001", roomName: "Conference Room A",
    day: "Wednesday", startTime: "09:00", endTime: "11:00",
    course: "BSBA", section: "A",
    semester: "1st Semester", academicYear: "2025-2026",
  },
  {
    id: "SCH005", subjectCode: "CS201", subjectName: "Data Structures",
    faculty: "Dr. Maria Santos", facultyId: "F001",
    room: "RM002", roomName: "Lecture Hall 1",
    day: "Thursday", startTime: "08:00", endTime: "10:00",
    course: "BSCS", section: "B",
    semester: "1st Semester", academicYear: "2025-2026",
  },
  {
    id: "SCH006", subjectCode: "CS301", subjectName: "Database Management Systems",
    faculty: "Dr. Maria Santos", facultyId: "F001",
    room: "RM006", roomName: "Seminar Room 1",
    day: "Friday", startTime: "10:00", endTime: "12:00",
    course: "BSCS", section: "A",
    semester: "1st Semester", academicYear: "2025-2026",
  },
  {
    id: "SCH007", subjectCode: "MATH101", subjectName: "Calculus I",
    faculty: "Dr. Ana Cruz", facultyId: "F003",
    room: "RM003", roomName: "Lab Room 101",
    day: "Wednesday", startTime: "13:00", endTime: "15:00",
    course: "BSEE", section: "B",
    semester: "1st Semester", academicYear: "2025-2026",
  },
  {
    id: "SCH008", subjectCode: "CS101", subjectName: "Introduction to Programming",
    faculty: "Dr. Maria Santos", facultyId: "F001",
    room: "RM002", roomName: "Lecture Hall 1",
    day: "Wednesday", startTime: "08:00", endTime: "10:00",
    course: "BSCS", section: "B",
    semester: "1st Semester", academicYear: "2025-2026",
  },
];

const DAYS           = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const TIME_SLOTS     = [
  "07:00-08:00", "08:00-10:00", "10:00-12:00",
  "12:00-13:00", "13:00-15:00", "15:00-17:00",
  "17:00-19:00",
];
const COURSES        = ["All Courses", "BSCS", "BSEE", "BSBA", "BSMath", "BSIT"];
const FACULTY_LIST   = ["All Faculty", "Dr. Maria Santos", "Prof. Juan Reyes", "Dr. Ana Cruz", "Prof. Carlos Garcia"];
const ROOMS_LIST     = ["All Rooms", "RM001", "RM002", "RM003", "RM005", "RM006"];
const SEMESTERS      = ["1st Semester", "2nd Semester", "Summer"];
const ACADEMIC_YEARS = ["2024-2025", "2025-2026", "2026-2027"];
// ──────────────────────────────────────────────────────────────────────────────

const PrintableSchedulePage = () => {
  const [schedules, setSchedules]       = useState([]);
  const [loading, setLoading]           = useState(true);
  const [exporting, setExporting]       = useState(false);
  const [error, setError]               = useState(null);
  const [filterCourse, setFilterCourse] = useState("All Courses");
  const [filterFaculty, setFilterFaculty] = useState("All Faculty");
  const [filterRoom, setFilterRoom]     = useState("All Rooms");
  const [semester, setSemester]         = useState("1st Semester");
  const [academicYear, setAcademicYear] = useState("2025-2026");
  const printRef = useRef(null);

  const fetchSchedules = async () => {
    setLoading(true);
    setError(null);
    try {
      // TODO: const res = await printableService.getSchedule({ semester, academicYear });
      // setSchedules(res.data);
      await new Promise((r) => setTimeout(r, 700));
      setSchedules(MOCK_SCHEDULE_DATA);
    } catch {
      setError("Failed to load schedule data.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchSchedules(); }, [semester, academicYear]);

  // Apply filters
  const filtered = useMemo(() => {
    return schedules.filter((s) => {
      const matchCourse  = filterCourse  === "All Courses" || s.course  === filterCourse;
      const matchFaculty = filterFaculty === "All Faculty" || s.faculty === filterFaculty;
      const matchRoom    = filterRoom    === "All Rooms"   || s.room    === filterRoom;
      return matchCourse && matchFaculty && matchRoom;
    });
  }, [schedules, filterCourse, filterFaculty, filterRoom]);

  // Build schedule grid — map time slots to days
  const scheduleGrid = useMemo(() => {
    const grid = {};
    TIME_SLOTS.forEach((slot) => {
      grid[slot] = {};
      DAYS.forEach((day) => { grid[slot][day] = []; });
    });

    filtered.forEach((sched) => {
      TIME_SLOTS.forEach((slot) => {
        const [slotStart, slotEnd] = slot.split("-");
        const schedStart = sched.startTime.substring(0, 5);
        const schedEnd   = sched.endTime.substring(0, 5);
        if (
          (schedStart >= slotStart && schedStart < slotEnd) ||
          (schedEnd   >  slotStart && schedEnd   <= slotEnd) ||
          (schedStart <= slotStart && schedEnd   >= slotEnd)
        ) {
          grid[slot][sched.day].push(sched);
        }
      });
    });
    return grid;
  }, [filtered]);

  const formatTime = (t) => {
    const [h, m] = t.split(":");
    const hour = parseInt(h);
    return `${hour % 12 || 12}:${m} ${hour >= 12 ? "PM" : "AM"}`;
  };

  const formatSlot = (slot) => {
    const [s, e] = slot.split("-");
    return `${formatTime(s)} – ${formatTime(e)}`;
  };

  const hasActiveFilter =
    filterCourse !== "All Courses" ||
    filterFaculty !== "All Faculty" ||
    filterRoom !== "All Rooms";

  const clearFilters = () => {
    setFilterCourse("All Courses");
    setFilterFaculty("All Faculty");
    setFilterRoom("All Rooms");
  };

  // Print handler
  const handlePrint = () => {
    window.print();
  };

  // Export PDF handler
  const handleExportPdf = async () => {
    setExporting(true);
    try {
      // TODO: const blob = await printableService.exportPdf({ semester, academicYear, filterCourse, filterFaculty, filterRoom });
      // const url = window.URL.createObjectURL(new Blob([blob.data]));
      // const a = document.createElement("a"); a.href = url;
      // a.download = `COSMOS_Schedule_${semester}_${academicYear}.pdf`;
      // a.click(); window.URL.revokeObjectURL(url);

      // MOCK
      await new Promise((r) => setTimeout(r, 1500));
      alert("PDF export will be connected to backend.");
    } catch {
      alert("Export failed.");
    } finally {
      setExporting(false);
    }
  };

  const SelectFilter = ({ label, value, onChange, options }) => (
    <div className="flex flex-col gap-1">
      <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
        {label}
      </label>
      <div className="relative">
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full pl-3 pr-8 py-2 text-sm border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-pup-maroon/20 focus:border-pup-maroon transition appearance-none"
        >
          {options.map((o) => <option key={o}>{o}</option>)}
        </select>
        <ChevronDown size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
      </div>
    </div>
  );

  return (
    <>
      <TopBar
        title="Printable Schedule"
        subtitle="Manage and monitor classroom occupancy"
      />

      <div className="p-6 space-y-5">

        {/* Controls Card */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
          <div className="flex flex-col lg:flex-row lg:items-end gap-4">

            {/* Filters */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 flex-1">
              <SelectFilter
                label="Academic Year"
                value={academicYear}
                onChange={setAcademicYear}
                options={ACADEMIC_YEARS}
              />
              <SelectFilter
                label="Semester"
                value={semester}
                onChange={setSemester}
                options={SEMESTERS}
              />
              <SelectFilter
                label="Filter by Course"
                value={filterCourse}
                onChange={setFilterCourse}
                options={COURSES}
              />
              <SelectFilter
                label="Filter by Faculty"
                value={filterFaculty}
                onChange={setFilterFaculty}
                options={FACULTY_LIST}
              />
              <SelectFilter
                label="Filter by Room"
                value={filterRoom}
                onChange={setFilterRoom}
                options={ROOMS_LIST}
              />
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-2 flex-shrink-0">
              {hasActiveFilter && (
                <button
                  onClick={clearFilters}
                  className="px-3 py-2 text-xs text-red-500 border border-red-200 rounded-lg hover:bg-red-50 transition-colors"
                >
                  Clear Filters
                </button>
              )}
              <button
                onClick={handleExportPdf}
                disabled={exporting || loading}
                className="flex items-center gap-2 px-4 py-2 text-sm border border-gray-200 text-gray-600 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
              >
                {exporting
                  ? <Loader2 size={14} className="animate-spin" />
                  : <Download size={14} />
                }
                {exporting ? "Exporting..." : "Export PDF"}
              </button>
              <button
                onClick={handlePrint}
                disabled={loading}
                className="flex items-center gap-2 px-4 py-2 text-sm bg-pup-maroon text-white rounded-lg hover:bg-pup-maroon-dark transition-colors disabled:opacity-50"
              >
                <Printer size={14} />
                Print Schedule
              </button>
            </div>
          </div>

          {/* Active filter summary */}
          {hasActiveFilter && (
            <div className="mt-3 flex items-center gap-2 flex-wrap">
              <span className="text-xs text-gray-400">Active filters:</span>
              {filterCourse !== "All Courses" && (
                <span className="px-2 py-0.5 bg-pup-maroon/10 text-pup-maroon text-xs rounded-full font-medium">
                  {filterCourse}
                </span>
              )}
              {filterFaculty !== "All Faculty" && (
                <span className="px-2 py-0.5 bg-pup-maroon/10 text-pup-maroon text-xs rounded-full font-medium">
                  {filterFaculty}
                </span>
              )}
              {filterRoom !== "All Rooms" && (
                <span className="px-2 py-0.5 bg-pup-maroon/10 text-pup-maroon text-xs rounded-full font-medium">
                  {filterRoom}
                </span>
              )}
            </div>
          )}
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-3 gap-4">
          {[
            { label: "Total Classes",    value: filtered.length },
            { label: "Days Covered",     value: new Set(filtered.map((s) => s.day)).size },
            { label: "Rooms Used",       value: new Set(filtered.map((s) => s.room)).size },
          ].map((s) => (
            <div key={s.label} className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 text-center">
              <p className="text-xl font-bold text-gray-800">{loading ? "—" : s.value}</p>
              <p className="text-xs text-gray-400 mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Printable Schedule Table */}
        <div
          ref={printRef}
          className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden"
          id="print-area"
        >
          {/* PUP Header — shown in print */}
          <div className="px-6 pt-6 pb-4 text-center border-b border-gray-100">
            <p className="text-pup-maroon font-bold text-lg tracking-wide">
              Polytechnic University of the Philippines
            </p>
            <p className="text-gray-700 font-semibold text-base mt-0.5">
              Bataan Campus — Class Schedule
            </p>
            <p className="text-gray-500 text-sm mt-1">
              Academic Year {academicYear} • {semester}
            </p>
            {hasActiveFilter && (
              <p className="text-gray-400 text-xs mt-1">
                {filterCourse !== "All Courses" && `Course: ${filterCourse}`}
                {filterFaculty !== "All Faculty" && ` | Faculty: ${filterFaculty}`}
                {filterRoom !== "All Rooms" && ` | Room: ${filterRoom}`}
              </p>
            )}
          </div>

          {/* Loading State */}
          {loading && (
            <div className="flex items-center justify-center py-20 gap-3">
              <Loader2 size={20} className="animate-spin text-pup-maroon" />
              <p className="text-sm text-gray-400">Loading schedule...</p>
            </div>
          )}

          {/* Error State */}
          {!loading && error && (
            <div className="py-16 text-center">
              <p className="text-sm text-red-400">{error}</p>
            </div>
          )}

          {/* Empty State */}
          {!loading && !error && filtered.length === 0 && (
            <div className="py-16 text-center">
              <FileText size={36} className="text-gray-200 mx-auto mb-2" />
              <p className="text-sm text-gray-400">No schedules match the selected filters.</p>
              {hasActiveFilter && (
                <button
                  onClick={clearFilters}
                  className="mt-2 text-xs text-pup-maroon hover:underline"
                >
                  Clear filters
                </button>
              )}
            </div>
          )}

          {/* Schedule Grid */}
          {!loading && !error && filtered.length > 0 && (
            <div className="overflow-x-auto">
              <table className="w-full text-xs border-collapse">
                <thead>
                  <tr>
                    <th className="bg-pup-maroon text-white px-4 py-3 text-left font-semibold w-32 border border-pup-maroon/20">
                      Time
                    </th>
                    {DAYS.map((day) => (
                      <th
                        key={day}
                        className="bg-pup-maroon text-white px-4 py-3 text-center font-semibold border border-pup-maroon/20"
                      >
                        {day}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {TIME_SLOTS.map((slot, si) => (
                    <tr
                      key={slot}
                      className={si % 2 === 0 ? "bg-white" : "bg-gray-50/60"}
                    >
                      {/* Time Column */}
                      <td className="px-4 py-3 border border-gray-100 text-gray-500 font-medium whitespace-nowrap align-top">
                        {formatSlot(slot)}
                      </td>

                      {/* Day Columns */}
                      {DAYS.map((day) => {
                        const cells = scheduleGrid[slot]?.[day] ?? [];
                        return (
                          <td
                            key={day}
                            className="px-2 py-2 border border-gray-100 align-top min-w-[120px]"
                          >
                            {cells.length === 0 ? (
                              <div className="text-gray-200 text-center py-1">–</div>
                            ) : (
                              <div className="space-y-1">
                                {cells.map((c) => (
                                  <div
                                    key={c.id}
                                    className="px-2 py-2 bg-pup-maroon/5 border border-pup-maroon/15 rounded-lg"
                                  >
                                    <p className="font-bold text-pup-maroon leading-tight">
                                      {c.subjectCode}
                                    </p>
                                    <p className="text-gray-600 leading-tight mt-0.5 text-xs">
                                      {c.faculty}
                                    </p>
                                    <p className="text-gray-500 leading-tight text-xs">
                                      {c.room}
                                    </p>
                                    <div className="flex items-center gap-1 mt-1">
                                      <span className="px-1.5 py-0.5 bg-pup-maroon/10 text-pup-maroon rounded text-xs font-semibold">
                                        {c.course}
                                      </span>
                                      <span className="text-gray-400 text-xs">
                                        Sec {c.section}
                                      </span>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Print Footer */}
          {!loading && !error && filtered.length > 0 && (
            <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-between">
              <p className="text-xs text-gray-400">
                Generated by COSMOS — Classroom Occupancy and Student Monitoring and Oversight System
              </p>
              <p className="text-xs text-gray-400">
                PUP Bataan Campus • {new Date().toLocaleDateString("en-PH", { year: "numeric", month: "long", day: "numeric" })}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Print Styles */}
      <style>{`
        @media print {
          body * { visibility: hidden; }
          #print-area, #print-area * { visibility: visible; }
          #print-area {
            position: fixed;
            top: 0; left: 0;
            width: 100%;
            border: none !important;
            box-shadow: none !important;
            border-radius: 0 !important;
          }
          @page { margin: 1cm; size: landscape; }
        }
      `}</style>
    </>
  );
};

export default PrintableSchedulePage;