import { useEffect, useState, useMemo, useRef } from "react";
import TopBar from "../../components/layout/TopBar";
import { printableService } from "../../api/services/printableService";
import { courseService } from "../../api/services/courseService";
import { facultyService } from "../../api/services/facultyService";
import { roomService } from "../../api/services/roomService";
import {
  Printer, Download, Filter,
  ChevronDown, Loader2, FileText,
} from "lucide-react";

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const TIME_SLOTS = [
  "07:00-07:30", "07:30-08:00", "08:00-08:30", "08:30-09:00",
  "09:00-09:30", "09:30-10:00", "10:00-10:30", "10:30-11:00",
  "11:00-11:30", "11:30-12:00", "12:00-12:30", "12:30-13:00",
  "13:00-13:30", "13:30-14:00", "14:00-14:30", "14:30-15:00",
  "15:00-15:30", "15:30-16:00", "16:00-16:30", "16:30-17:00",
  "17:00-17:30", "17:30-18:00",
];
const SEMESTERS = ["1st Semester", "2nd Semester", "Summer"];
const ACADEMIC_YEARS = ["2024-2025", "2025-2026", "2026-2027"];

const PrintableSchedulePage = () => {
  const [schedules, setSchedules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState(null);
  const [filterCourse, setFilterCourse] = useState("All Programs");
  const [filterFaculty, setFilterFaculty] = useState("All Faculty");
  const [filterRoom, setFilterRoom] = useState("All Rooms");
  const [semester, setSemester] = useState("1st Semester");
  const [academicYear, setAcademicYear] = useState("2025-2026");
  const [courseOptions, setCourseOptions] = useState(["All Programs"]);
  const [facultyOptions, setFacultyOptions] = useState(["All Faculty"]);
  const [roomOptions, setRoomOptions] = useState(["All Rooms"]);
  const printRef = useRef(null);

  const fetchSchedules = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await printableService.getSchedule({ semester, academicYear });
      const data = response?.data ?? response ?? [];
      setSchedules(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err?.response?.data?.message || err?.message || "Failed to load schedule data.");
      setSchedules([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchSchedules(); }, [semester, academicYear]);

  useEffect(() => {
    let active = true;
    const fetchFilters = async () => {
      try {
        const [coursesRes, facultyRes, roomsRes] = await Promise.all([
          courseService.getAll(),
          facultyService.getAll(),
          roomService.getAll(),
        ]);
        if (!active) return;

        const coursesData = Array.isArray(coursesRes?.data ?? coursesRes ?? []) ? coursesRes?.data ?? coursesRes ?? [] : [];
        const facultyData = Array.isArray(facultyRes?.data ?? facultyRes ?? []) ? facultyRes?.data ?? facultyRes ?? [] : [];
        const roomsData = Array.isArray(roomsRes?.data ?? roomsRes ?? []) ? roomsRes?.data ?? roomsRes ?? [] : [];

        setCourseOptions(["All Programs", ...new Set(coursesData.map((course) => course.code || course.name).filter(Boolean))]);
        setFacultyOptions(["All Faculty", ...new Set(facultyData.map((person) => person.name || person.fullName).filter(Boolean))]);
        setRoomOptions(["All Rooms", ...new Set(roomsData.map((room) => room.code || room.name).filter(Boolean))]);
      } catch (err) {
        console.error("Failed to load printable schedule filters:", err);
        if (active) {
          setCourseOptions(["All Programs"]);
          setFacultyOptions(["All Faculty"]);
          setRoomOptions(["All Rooms"]);
        }
      }
    };

    fetchFilters();
    return () => { active = false; };
  }, []);

  // Apply filters
  const filtered = useMemo(() => {
    return schedules.filter((s) => {
      const matchCourse  = filterCourse  === "All Programs" || s.course  === filterCourse;
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
    filterCourse !== "All Programs" ||
    filterFaculty !== "All Faculty" ||
    filterRoom !== "All Rooms";

  const clearFilters = () => {
    setFilterCourse("All Programs");
    setFilterFaculty("All Faculty");
    setFilterRoom("All Rooms");
  };

  // Print handler
  const handlePrint = () => {
    window.print();
  };

  const handleExportPdf = async () => {
    setExporting(true);
    try {
      const response = await printableService.exportPdf({
        semester,
        academicYear,
        course: filterCourse !== "All Programs" ? filterCourse : undefined,
        faculty: filterFaculty !== "All Faculty" ? filterFaculty : undefined,
        room: filterRoom !== "All Rooms" ? filterRoom : undefined,
      });

      const blob = new Blob([response.data ?? response], { type: "application/pdf" });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `COSMOS_Schedule_${semester}_${academicYear}.pdf`;
      link.click();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Failed to export printable schedule PDF:", err);
      alert(err?.response?.data?.message || err?.message || "Export failed.");
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
          className="w-full rounded-lg border border-gray-200/80 bg-white/70 py-2 pl-3 pr-8 text-sm transition appearance-none focus:border-pup-maroon focus:outline-none focus:ring-2 focus:ring-pup-maroon/20"
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
        <div className="rounded-2xl border border-white/40 bg-white/70 p-5 shadow-[0_10px_25px_rgba(15,23,42,0.05)] backdrop-blur-[1px]">
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
                label="Filter by Program"
                value={filterCourse}
                onChange={setFilterCourse}
                options={courseOptions}
              />
              <SelectFilter
                label="Filter by Faculty"
                value={filterFaculty}
                onChange={setFilterFaculty}
                options={facultyOptions}
              />
              <SelectFilter
                label="Filter by Room"
                value={filterRoom}
                onChange={setFilterRoom}
                options={roomOptions}
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
              {filterCourse !== "All Programs" && (
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
            <div key={s.label} className="rounded-xl border border-white/40 bg-white/70 p-4 text-center shadow-[0_10px_25px_rgba(15,23,42,0.04)] backdrop-blur-[1px]">
              <p className="text-xl font-bold text-gray-800">{loading ? "—" : s.value}</p>
              <p className="text-xs text-gray-400 mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Printable Schedule Table */}
        <div
          ref={printRef}
          className="overflow-hidden rounded-2xl border border-white/40 bg-white/70 shadow-[0_10px_25px_rgba(15,23,42,0.05)] backdrop-blur-[1px]"
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
                {filterCourse !== "All Programs" && `Program: ${filterCourse}`}
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
                Generated by COSMOS — Classroom Occupancy and Scheduling Management Optimization System
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