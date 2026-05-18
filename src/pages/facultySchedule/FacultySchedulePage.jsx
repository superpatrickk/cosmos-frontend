import { useMemo, useState } from "react";
import TopBar from "../../components/layout/TopBar";
import AvailabilityGrid from "../../components/facultySchedule/AvailabilityGrid";
import SendScheduleModal from "../../components/facultySchedule/SendScheduleModal";
import SetAvailabilityModal from "../../components/facultySchedule/SetAvailabilityModal";
import {
  CalendarCheck,
  CheckCircle2,
  Clock3,
  Mail,
  Send,
  Settings,
  Users,
} from "lucide-react";

const MOCK_FACULTY_SCHEDULES = [
  {
    id: "F001",
    name: "Dr. Maria Santos",
    email: "maria.santos@pup.edu.ph",
    department: "Computer Science",
    status: "Active",
    lastEmailSent: "2025-04-20T10:30:00",
    availability: {
      Monday: [{ start: "07:00", end: "12:00", maxMeetingMinutes: 300, note: "Preferred for lab blocks" }],
      Tuesday: [{ start: "08:00", end: "12:00", maxMeetingMinutes: 240 }],
      Wednesday: [
        { start: "07:00", end: "12:00", maxMeetingMinutes: 300 },
        { start: "13:00", end: "17:00", maxMeetingMinutes: 240 },
      ],
      Thursday: [{ start: "10:00", end: "16:00", maxMeetingMinutes: 300 }],
      Friday: [{ start: "08:00", end: "12:00", maxMeetingMinutes: 240 }],
      Saturday: [],
    },
    assignedSchedules: [
      { subjectCode: "COMP 019", day: "Monday", startTime: "07:00", endTime: "12:00", room: "RM003", course: "BSIT", section: "3A" },
      { subjectCode: "INTE 301", day: "Thursday", startTime: "10:00", endTime: "13:00", room: "RM002", course: "BSIT", section: "3B" },
      { subjectCode: "GEED 005", day: "Friday", startTime: "08:00", endTime: "11:00", room: "RM006", course: "BSCS", section: "2A" },
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
      Monday: [{ start: "10:00", end: "18:00", maxMeetingMinutes: 300 }],
      Tuesday: [{ start: "08:00", end: "18:00", maxMeetingMinutes: 300 }],
      Wednesday: [],
      Thursday: [{ start: "08:00", end: "18:00", maxMeetingMinutes: 300 }],
      Friday: [{ start: "10:00", end: "16:00", maxMeetingMinutes: 240 }],
      Saturday: [],
    },
    assignedSchedules: [
      { subjectCode: "ELEC IT-F3", day: "Tuesday", startTime: "13:00", endTime: "18:00", room: "RM004", course: "BSIT", section: "3A" },
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
      Monday: [{ start: "08:00", end: "12:00", maxMeetingMinutes: 240 }],
      Tuesday: [{ start: "08:00", end: "18:00", maxMeetingMinutes: 300 }],
      Wednesday: [{ start: "10:00", end: "14:00", maxMeetingMinutes: 240 }],
      Thursday: [{ start: "08:00", end: "12:00", maxMeetingMinutes: 240 }],
      Friday: [{ start: "08:00", end: "16:00", maxMeetingMinutes: 300 }],
      Saturday: [],
    },
    assignedSchedules: [
      { subjectCode: "MATH 201", day: "Monday", startTime: "08:00", endTime: "11:00", room: "RM003", course: "BSCS", section: "2A" },
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
      Monday: [],
      Tuesday: [],
      Wednesday: [{ start: "09:00", end: "11:00", maxMeetingMinutes: 120 }],
      Thursday: [],
      Friday: [],
      Saturday: [],
    },
    assignedSchedules: [
      { subjectCode: "BA105", day: "Wednesday", startTime: "09:00", endTime: "11:00", room: "RM001", course: "BSBA", section: "A" },
    ],
  },
];

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

const normalizeTime = (time) => {
  if (!time) return "";
  const [hour, minute = "00"] = time.split(":");
  return `${String(Number(hour)).padStart(2, "0")}:${minute.padStart(2, "0")}`;
};

const timeToMinutes = (time) => {
  const [hour, minute] = normalizeTime(time).split(":").map(Number);
  return hour * 60 + minute;
};

const getSlotMinutes = (slot) => {
  if (typeof slot === "string") {
    const [start, end] = slot.split("-");
    return timeToMinutes(end) - timeToMinutes(start);
  }
  return timeToMinutes(slot?.end) - timeToMinutes(slot?.start);
};

const getWeeklyCapacityMinutes = (availability) =>
  DAYS.reduce((sum, day) =>
    sum + (availability?.[day] || []).reduce((daySum, slot) => daySum + Math.max(getSlotMinutes(slot), 0), 0), 0);

const getAssignedMinutes = (assignedSchedules = []) =>
  assignedSchedules.reduce((sum, schedule) => sum + Math.max(timeToMinutes(schedule.endTime) - timeToMinutes(schedule.startTime), 0), 0);

const getMaxMeetingMinutes = (availability) =>
  Math.max(
    0,
    ...DAYS.flatMap((day) =>
      (availability?.[day] || []).map((slot) =>
        typeof slot === "string" ? Math.min(getSlotMinutes(slot), 300) : Number(slot.maxMeetingMinutes || getSlotMinutes(slot))
      )
    )
  );

const formatDuration = (minutes) => {
  if (!minutes || minutes <= 0) return "0h";
  const hours = Math.floor(minutes / 60);
  const remainder = minutes % 60;
  return remainder ? `${hours}h ${remainder}m` : `${hours}h`;
};

const FacultySchedulePage = () => {
  const [facultyList, setFacultyList] = useState(MOCK_FACULTY_SCHEDULES);
  const [loading] = useState(false);
  const [error] = useState(null);
  const [search, setSearch] = useState("");
  const [sendModal, setSendModal] = useState({ open: false, faculty: null, mode: "single" });
  const [availModal, setAvailModal] = useState({ open: false, faculty: null });
  const [toast, setToast] = useState(null);

  const filtered = useMemo(() =>
    facultyList.filter((faculty) =>
      [faculty.name, faculty.department, faculty.email]
        .join(" ")
        .toLowerCase()
        .includes(search.toLowerCase())
    ), [facultyList, search]
  );

  const totalAssigned = facultyList.reduce((sum, faculty) => sum + faculty.assignedSchedules.length, 0);
  const emailSentCount = facultyList.filter((faculty) => faculty.lastEmailSent).length;
  const weeklyCapacity = facultyList.reduce((sum, faculty) => sum + getWeeklyCapacityMinutes(faculty.availability), 0);

  const showToast = (message, type = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  const handleSendConfirm = async () => {
    try {
      if (sendModal.mode === "single") {
        await new Promise((resolve) => setTimeout(resolve, 1200));
        setFacultyList((prev) =>
          prev.map((faculty) =>
            faculty.id === sendModal.faculty.id
              ? { ...faculty, lastEmailSent: new Date().toISOString() }
              : faculty
          )
        );
        showToast(`Schedule sent to ${sendModal.faculty.name} successfully.`);
      } else {
        await new Promise((resolve) => setTimeout(resolve, 2000));
        setFacultyList((prev) =>
          prev.map((faculty) => ({ ...faculty, lastEmailSent: new Date().toISOString() }))
        );
        showToast("Schedule sent to all faculty members successfully.");
      }
      setSendModal({ open: false, faculty: null, mode: "single" });
    } catch {
      showToast("Failed to send schedule. Please try again.", "error");
    }
  };

  const handleAvailabilitySubmit = async (facultyId, data) => {
    try {
      await new Promise((resolve) => setTimeout(resolve, 600));
      setFacultyList((prev) =>
        prev.map((faculty) =>
          faculty.id === facultyId ? { ...faculty, availability: data } : faculty
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
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <>
      <TopBar
        title="Faculty Schedule"
        subtitle="Manage teaching availability, assigned classes, and schedule emails"
        search={search}
        onSearch={setSearch}
      />

      {toast && (
        <div className={`fixed top-5 right-5 z-50 flex items-center gap-3 rounded-xl px-5 py-3 text-sm font-medium text-white shadow-lg ${
          toast.type === "success" ? "bg-green-600" : "bg-red-600"
        }`}>
          {toast.type === "success" ? <CheckCircle2 size={18} /> : <Mail size={18} />}
          {toast.message}
        </div>
      )}

      <div className="space-y-5 p-6">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {[
            { label: "Total Faculty", value: facultyList.length, icon: Users, color: "text-pup-maroon", bg: "bg-red-50" },
            { label: "Assigned Classes", value: totalAssigned, icon: CalendarCheck, color: "text-blue-600", bg: "bg-blue-50" },
            { label: "Weekly Availability", value: formatDuration(weeklyCapacity), icon: Clock3, color: "text-amber-600", bg: "bg-amber-50" },
            { label: "Schedules Emailed", value: emailSentCount, icon: Mail, color: "text-green-600", bg: "bg-green-50" },
          ].map((stat) => (
            <div key={stat.label} className="flex items-center gap-4 rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
              <div className={`flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl ${stat.bg}`}>
                <stat.icon size={22} className={stat.color} />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-800">{stat.value}</p>
                <p className="text-sm text-gray-400">{stat.label}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="flex items-center justify-between rounded-2xl bg-pup-maroon p-5">
          <div>
            <h3 className="text-sm font-bold text-white">Send Schedules to All Faculty</h3>
            <p className="mt-0.5 text-xs text-white/70">
              Broadcast the current semester schedule to all {facultyList.length} faculty members via Gmail.
            </p>
          </div>
          <button
            onClick={() => setSendModal({ open: true, faculty: null, mode: "all" })}
            className="ml-4 flex flex-shrink-0 items-center gap-2 rounded-xl bg-white px-4 py-2.5 text-sm font-bold text-pup-maroon transition-colors hover:bg-gray-50"
          >
            <Send size={15} />
            Send to All
          </button>
        </div>

        <div className="space-y-4">
          {loading && [...Array(3)].map((_, index) => (
            <div key={index} className="animate-pulse rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
              <div className="mb-4 flex items-center justify-between">
                <div className="space-y-2">
                  <div className="h-4 w-40 rounded bg-gray-100" />
                  <div className="h-3 w-24 rounded bg-gray-100" />
                </div>
                <div className="flex gap-2">
                  <div className="h-8 w-24 rounded-lg bg-gray-100" />
                  <div className="h-8 w-28 rounded-lg bg-gray-100" />
                </div>
              </div>
              <div className="grid grid-cols-5 gap-3">
                {[...Array(5)].map((__, dayIndex) => (
                  <div key={dayIndex} className="h-16 rounded-xl bg-gray-100" />
                ))}
              </div>
            </div>
          ))}

          {!loading && error && (
            <div className="rounded-2xl border border-red-100 bg-white p-8 text-center">
              <p className="text-sm text-red-400">{error}</p>
            </div>
          )}

          {!loading && !error && filtered.length === 0 && (
            <div className="rounded-2xl border border-gray-100 bg-white p-12 text-center">
              <Users size={36} className="mx-auto mb-2 text-gray-200" />
              <p className="text-sm text-gray-400">No faculty members found.</p>
            </div>
          )}

          {!loading && !error && filtered.map((faculty) => (
            <div key={faculty.id} className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
              <div className="flex flex-col gap-4 border-b border-gray-100 px-6 py-4 lg:flex-row lg:items-center lg:justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-pup-maroon/10 text-sm font-bold text-pup-maroon">
                    {faculty.name.split(" ").map((part) => part[0]).join("").slice(0, 2)}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-bold text-gray-800">{faculty.name}</p>
                      <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                        faculty.status === "Active" ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700"
                      }`}>
                        {faculty.status}
                      </span>
                    </div>
                    <div className="mt-0.5 flex flex-wrap items-center gap-3">
                      <p className="text-xs text-gray-400">{faculty.id} - {faculty.department}</p>
                      <p className="flex items-center gap-1 text-xs text-gray-400">
                        <Mail size={11} />
                        {faculty.email}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  {faculty.lastEmailSent && (
                    <div className="hidden items-center gap-1.5 rounded-lg bg-green-50 px-3 py-1.5 text-xs text-green-600 sm:flex">
                      <CheckCircle2 size={13} />
                      Sent {formatLastSent(faculty.lastEmailSent)}
                    </div>
                  )}
                  <button
                    onClick={() => setAvailModal({ open: true, faculty })}
                    className="flex items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-1.5 text-xs text-gray-600 transition-colors hover:bg-gray-50"
                  >
                    <Settings size={13} />
                    Set Availability
                  </button>
                  <button
                    onClick={() => setSendModal({ open: true, faculty, mode: "single" })}
                    className="flex items-center gap-1.5 rounded-lg bg-pup-maroon px-3 py-1.5 text-xs text-white transition-colors hover:bg-pup-maroon-dark"
                  >
                    <Send size={13} />
                    Send Schedule
                  </button>
                </div>
              </div>

              <div className="px-6 py-4">
                <AvailabilityGrid availability={faculty.availability} assignedSchedules={faculty.assignedSchedules} />
              </div>

              <div className="grid grid-cols-1 gap-3 px-6 pb-4 sm:grid-cols-3">
                <InfoPill label="Weekly Capacity" value={formatDuration(getWeeklyCapacityMinutes(faculty.availability))} />
                <InfoPill label="Assigned Load" value={formatDuration(getAssignedMinutes(faculty.assignedSchedules))} />
                <InfoPill label="Longest Allowed Class" value={formatDuration(getMaxMeetingMinutes(faculty.availability))} />
              </div>

              {faculty.assignedSchedules.length > 0 && (
                <div className="px-6 pb-4">
                  <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-400">
                    Assigned Classes ({faculty.assignedSchedules.length})
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {faculty.assignedSchedules.map((schedule, index) => (
                      <div key={`${schedule.subjectCode}-${index}`} className="flex items-center gap-2 rounded-xl border border-gray-100 bg-gray-50 px-3 py-1.5 text-xs">
                        <span className="font-bold text-pup-maroon">{schedule.subjectCode}</span>
                        <span className="text-gray-400">{schedule.day}</span>
                        <span className="font-medium text-gray-600">{schedule.startTime}-{schedule.endTime}</span>
                        <span className="rounded bg-gray-200 px-1.5 py-0.5 text-xs text-gray-600">{schedule.room}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      <SendScheduleModal
        open={sendModal.open}
        mode={sendModal.mode}
        faculty={sendModal.faculty}
        allFaculty={facultyList}
        onClose={() => setSendModal({ open: false, faculty: null, mode: "single" })}
        onConfirm={handleSendConfirm}
      />

      <SetAvailabilityModal
        open={availModal.open}
        faculty={availModal.faculty}
        onClose={() => setAvailModal({ open: false, faculty: null })}
        onSubmit={handleAvailabilitySubmit}
      />
    </>
  );
};

const InfoPill = ({ label, value }) => (
  <div className="rounded-xl border border-gray-100 bg-gray-50 px-4 py-3">
    <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-400">{label}</p>
    <p className="mt-1 text-sm font-bold text-gray-700">{value}</p>
  </div>
);

export default FacultySchedulePage;
