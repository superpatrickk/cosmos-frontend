import { useEffect, useState, useMemo } from "react";
import TopBar from "../../components/layout/TopBar";
import AvailabilityGrid from "../../components/facultySchedule/AvailabilityGrid";
import SendScheduleModal from "../../components/facultySchedule/SendScheduleModal";
import SetAvailabilityModal from "../../components/facultySchedule/SetAvailabilityModal";
import { facultyScheduleService } from "../../api/services/facultyScheduleService";
import { emailService } from "../../api/services/emailService";
import {
  Users, Mail, CalendarCheck, CheckCircle2,
  Search, Send, Settings,
} from "lucide-react";

// ─── Mock Data ────────────────────────────────────────────────────────────────
const MOCK_FACULTY_SCHEDULES = [
  {
    id: "F001",
    name: "Dr. Maria Santos",
    email: "maria.santos@pup.edu.ph",
    department: "Computer Science",
    status: "Active",
    lastEmailSent: "2025-04-20T10:30:00",
    availability: {
      Monday:    ["8:00-12:00", "14:00-18:00"],
      Tuesday:   ["8:00-12:00"],
      Wednesday: ["8:00-18:00"],
      Thursday:  ["10:00-16:00"],
      Friday:    ["8:00-12:00"],
      Saturday:  [],
    },
    assignedSchedules: [
      { subjectCode: "CS101", day: "Monday",    startTime: "08:00", endTime: "10:00", room: "RM002", course: "BSCS", section: "A" },
      { subjectCode: "CS201", day: "Thursday",  startTime: "08:00", endTime: "10:00", room: "RM002", course: "BSCS", section: "B" },
      { subjectCode: "CS301", day: "Friday",    startTime: "10:00", endTime: "12:00", room: "RM006", course: "BSCS", section: "A" },
    ],
  },
  {
    id: "F002",
    name: "Prof. Juan Reyes",
    email: "juan.reyes@pup.edu.ph",
    department: "Engineering",
    status: "Active",
    lastEmailSent: null,
    availability: {
      Monday:    ["10:00-18:00"],
      Tuesday:   ["8:00-16:00"],
      Wednesday: [],
      Thursday:  ["8:00-18:00"],
      Friday:    ["10:00-16:00"],
      Saturday:  [],
    },
    assignedSchedules: [
      { subjectCode: "EE201", day: "Tuesday",   startTime: "13:00", endTime: "15:00", room: "RM005", course: "BSEE", section: "B" },
    ],
  },
  {
    id: "F003",
    name: "Dr. Ana Cruz",
    email: "ana.cruz@pup.edu.ph",
    department: "Mathematics",
    status: "Active",
    lastEmailSent: "2025-04-18T09:00:00",
    availability: {
      Monday:    ["8:00-12:00"],
      Tuesday:   ["8:00-18:00"],
      Wednesday: ["10:00-14:00"],
      Thursday:  ["8:00-12:00"],
      Friday:    ["8:00-16:00"],
      Saturday:  [],
    },
    assignedSchedules: [
      { subjectCode: "MATH101", day: "Monday",    startTime: "10:00", endTime: "12:00", room: "RM003", course: "BSCS", section: "A" },
    ],
  },
  {
    id: "F004",
    name: "Prof. Carlos Garcia",
    email: "carlos.garcia@pup.edu.ph",
    department: "Business",
    status: "On Leave",
    lastEmailSent: null,
    availability: {
      Monday:    [],
      Tuesday:   [],
      Wednesday: ["9:00-11:00"],
      Thursday:  [],
      Friday:    [],
      Saturday:  [],
    },
    assignedSchedules: [
      { subjectCode: "BA105", day: "Wednesday", startTime: "09:00", endTime: "11:00", room: "RM001", course: "BSBA", section: "A" },
    ],
  },
];
// ──────────────────────────────────────────────────────────────────────────────

const FacultySchedulePage = () => {
  const [facultyList, setFacultyList]     = useState([]);
  const [loading, setLoading]             = useState(true);
  const [error, setError]                 = useState(null);
  const [search, setSearch]               = useState("");
  const [sendModal, setSendModal]         = useState({ open: false, faculty: null, mode: "single" });
  const [availModal, setAvailModal]       = useState({ open: false, faculty: null });
  const [sendingAll, setSendingAll]       = useState(false);
  const [toast, setToast]                 = useState(null);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      // TODO: const res = await facultyScheduleService.getAll(); setFacultyList(res.data);
      await new Promise((r) => setTimeout(r, 700));
      setFacultyList(MOCK_FACULTY_SCHEDULES);
    } catch {
      setError("Failed to load faculty schedules.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const filtered = useMemo(() =>
    facultyList.filter((f) =>
      [f.name, f.department, f.email]
        .join(" ").toLowerCase()
        .includes(search.toLowerCase())
    ), [facultyList, search]
  );

  // Summary stats
  const totalAssigned  = facultyList.reduce((s, f) => s + f.assignedSchedules.length, 0);
  const emailSentCount = facultyList.filter((f) => f.lastEmailSent).length;

  const showToast = (message, type = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  const handleSendSingle = (faculty) => {
    setSendModal({ open: true, faculty, mode: "single" });
  };

  const handleSendAll = () => {
    setSendModal({ open: true, faculty: null, mode: "all" });
  };

  const handleSendConfirm = async () => {
    try {
      if (sendModal.mode === "single") {
        // TODO: await emailService.sendScheduleToFaculty(sendModal.faculty.id);
        await new Promise((r) => setTimeout(r, 1200));
        setFacultyList((prev) =>
          prev.map((f) =>
            f.id === sendModal.faculty.id
              ? { ...f, lastEmailSent: new Date().toISOString() }
              : f
          )
        );
        showToast(`Schedule sent to ${sendModal.faculty.name} successfully.`);
      } else {
        // TODO: await emailService.sendScheduleToAll();
        await new Promise((r) => setTimeout(r, 2000));
        setFacultyList((prev) =>
          prev.map((f) => ({ ...f, lastEmailSent: new Date().toISOString() }))
        );
        showToast("Schedule sent to all faculty members successfully.");
      }
      setSendModal({ open: false, faculty: null, mode: "single" });
    } catch {
      showToast("Failed to send schedule. Please try again.", "error");
    }
  };

  const handleSetAvailability = (faculty) => {
    setAvailModal({ open: true, faculty });
  };

  const handleAvailabilitySubmit = async (facultyId, data) => {
    try {
      // TODO: await facultyScheduleService.setAvailability(facultyId, data);
      await new Promise((r) => setTimeout(r, 600));
      setFacultyList((prev) =>
        prev.map((f) =>
          f.id === facultyId ? { ...f, availability: data } : f
        )
      );
      setAvailModal({ open: false, faculty: null });
      showToast("Availability updated successfully.");
    } catch {
      showToast("Failed to update availability.", "error");
    }
  };

  const formatLastSent = (dateStr) => {
    if (!dateStr) return null;
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-PH", {
      month: "short", day: "numeric", year: "numeric",
      hour: "2-digit", minute: "2-digit",
    });
  };

  return (
    <>
      <TopBar
        title="Faculty Schedule"
        subtitle="Manage and monitor classroom occupancy"
        search={search}
        onSearch={setSearch}
      />

      {/* Toast Notification */}
      {toast && (
        <div className={`fixed top-5 right-5 z-50 flex items-center gap-3 px-5 py-3 rounded-xl shadow-lg text-sm font-medium transition-all ${
          toast.type === "success"
            ? "bg-green-600 text-white"
            : "bg-red-600 text-white"
        }`}>
          {toast.type === "success"
            ? <CheckCircle2 size={18} />
            : <Mail size={18} />
          }
          {toast.message}
        </div>
      )}

      <div className="p-6 space-y-5">

        {/* Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            { label: "Total Faculty",        value: facultyList.length, icon: Users,        color: "text-pup-maroon", bg: "bg-red-50"   },
            { label: "Total Assigned Classes", value: totalAssigned,    icon: CalendarCheck, color: "text-blue-600",  bg: "bg-blue-50"  },
            { label: "Schedules Emailed",    value: emailSentCount,     icon: Mail,          color: "text-green-600", bg: "bg-green-50" },
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

        {/* Send All Banner */}
        <div className="bg-gradient-to-r from-pup-maroon to-pup-maroon-light rounded-2xl p-5 flex items-center justify-between">
          <div>
            <h3 className="text-white font-bold text-sm">
              Send Schedules to All Faculty
            </h3>
            <p className="text-white/70 text-xs mt-0.5">
              Broadcast the current semester schedule to all {facultyList.length} faculty members via Gmail.
            </p>
          </div>
          <button
            onClick={handleSendAll}
            disabled={sendingAll}
            className="flex items-center gap-2 px-4 py-2.5 bg-white text-pup-maroon text-sm font-bold rounded-xl hover:bg-gray-50 transition-colors flex-shrink-0 ml-4"
          >
            <Send size={15} />
            Send to All
          </button>
        </div>

        {/* Faculty Availability Cards */}
        <div className="space-y-4">
          {loading && [...Array(3)].map((_, i) => (
            <div key={i} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 animate-pulse">
              <div className="flex items-center justify-between mb-4">
                <div className="space-y-2">
                  <div className="h-4 bg-gray-100 rounded w-40" />
                  <div className="h-3 bg-gray-100 rounded w-24" />
                </div>
                <div className="flex gap-2">
                  <div className="h-8 w-24 bg-gray-100 rounded-lg" />
                  <div className="h-8 w-28 bg-gray-100 rounded-lg" />
                </div>
              </div>
              <div className="grid grid-cols-5 gap-3">
                {[...Array(5)].map((_, j) => (
                  <div key={j} className="h-16 bg-gray-100 rounded-xl" />
                ))}
              </div>
            </div>
          ))}

          {!loading && error && (
            <div className="bg-white rounded-2xl border border-red-100 p-8 text-center">
              <p className="text-sm text-red-400">{error}</p>
            </div>
          )}

          {!loading && !error && filtered.length === 0 && (
            <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center">
              <Users size={36} className="text-gray-200 mx-auto mb-2" />
              <p className="text-sm text-gray-400">No faculty members found.</p>
            </div>
          )}

          {!loading && !error && filtered.map((faculty) => (
            <div
              key={faculty.id}
              className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden"
            >
              {/* Faculty Card Header */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
                <div className="flex items-center gap-3">
                  {/* Avatar */}
                  <div className="w-10 h-10 rounded-full bg-pup-maroon/10 text-pup-maroon flex items-center justify-center text-sm font-bold flex-shrink-0">
                    {faculty.name.split(" ").map((n) => n[0]).join("").slice(0, 2)}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-bold text-gray-800">{faculty.name}</p>
                      <span className={`px-2 py-0.5 text-xs font-semibold rounded-full ${
                        faculty.status === "Active"
                          ? "bg-green-100 text-green-700"
                          : "bg-yellow-100 text-yellow-700"
                      }`}>
                        {faculty.status}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 mt-0.5">
                      <p className="text-xs text-gray-400">
                        {faculty.id} • {faculty.department}
                      </p>
                      <p className="text-xs text-gray-400 flex items-center gap-1">
                        <Mail size={11} />
                        {faculty.email}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2">
                  {/* Last sent info */}
                  {faculty.lastEmailSent && (
                    <div className="hidden sm:flex items-center gap-1.5 text-xs text-green-600 bg-green-50 px-3 py-1.5 rounded-lg">
                      <CheckCircle2 size={13} />
                      Sent {formatLastSent(faculty.lastEmailSent)}
                    </div>
                  )}

                  {/* Set Availability */}
                  <button
                    onClick={() => handleSetAvailability(faculty)}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs border border-gray-200 text-gray-600 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <Settings size={13} />
                    Set Availability
                  </button>

                  {/* Send Schedule */}
                  <button
                    onClick={() => handleSendSingle(faculty)}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-pup-maroon text-white rounded-lg hover:bg-pup-maroon-dark transition-colors"
                  >
                    <Send size={13} />
                    Send Schedule
                  </button>
                </div>
              </div>

              {/* Availability Grid */}
              <div className="px-6 py-4">
                <AvailabilityGrid
                  availability={faculty.availability}
                  assignedSchedules={faculty.assignedSchedules}
                />
              </div>

              {/* Assigned Classes Summary */}
              {faculty.assignedSchedules.length > 0 && (
                <div className="px-6 pb-4">
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">
                    Assigned Classes ({faculty.assignedSchedules.length})
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {faculty.assignedSchedules.map((s, i) => (
                      <div
                        key={i}
                        className="flex items-center gap-2 px-3 py-1.5 bg-gray-50 border border-gray-100 rounded-xl text-xs"
                      >
                        <span className="font-bold text-pup-maroon">{s.subjectCode}</span>
                        <span className="text-gray-400">{s.day}</span>
                        <span className="text-gray-600 font-medium">{s.startTime}–{s.endTime}</span>
                        <span className="px-1.5 py-0.5 bg-gray-200 text-gray-600 rounded text-xs">{s.room}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Send Schedule Modal */}
      <SendScheduleModal
        open={sendModal.open}
        mode={sendModal.mode}
        faculty={sendModal.faculty}
        allFaculty={facultyList}
        onClose={() => setSendModal({ open: false, faculty: null, mode: "single" })}
        onConfirm={handleSendConfirm}
      />

      {/* Set Availability Modal */}
      <SetAvailabilityModal
        open={availModal.open}
        faculty={availModal.faculty}
        onClose={() => setAvailModal({ open: false, faculty: null })}
        onSubmit={handleAvailabilitySubmit}
      />
    </>
  );
};

export default FacultySchedulePage;