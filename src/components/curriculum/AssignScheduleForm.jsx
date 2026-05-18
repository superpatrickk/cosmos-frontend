import { useMemo, useState } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  ChevronDown,
  Eye,
  FileDown,
  Loader2,
  RotateCcw,
  Save,
  Search,
  Send,
  Wand2,
} from "lucide-react";
import ConfirmDialog from "../common/ConfirmDialog"; // Assuming this path is correct
import AssignPreviewModal from "./AssignPreviewModal"; // Assuming this path is correct
import { loadCurricula, normalizeSchedulingCurriculum } from "../../data/curriculumStore"; // Assuming this path is correct

// --- Mock Data (Keep as is) ---
const MOCK_PROGRAMS = ["BSIT", "BSCS", "BSEE", "BSBA", "BSMath"];
const MOCK_YEARS = ["1st Year", "2nd Year", "3rd Year", "4th Year"];
const MOCK_SEMS = ["1st Semester", "2nd Semester", "Summer"];
const MOCK_AY = ["2024-2025", "2025-2026", "2026-2027"];
const MOCK_SECTIONS = ["A", "B", "C", "D"];
const MOCK_DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

const MOCK_ROOMS = [
  { id: "RM001", name: "Conference Room A", type: "Lecture", capacity: 50 },
  { id: "RM002", name: "Lecture Hall 1", type: "Lecture", capacity: 100 },
  { id: "RM003", name: "Lab Room 101", type: "Laboratory", capacity: 30 },
  { id: "RM004", name: "Networking Lab", type: "Laboratory", capacity: 32 }, // Specific type for labs
  { id: "RM005", name: "Auditorium", type: "Lecture", capacity: 200 },
  { id: "RM006", name: "Seminar Room 1", type: "Lecture", capacity: 40 },
];

const MOCK_FACULTY = [
  {
    id: "F001",
    name: "Dr. Maria Santos",
    specializations: ["software", "web", "research", "general"],
    maxLoad: 18,
    currentLoad: 6,
    availability: {
      Monday: [["07:00", "12:00"], ["13:00", "17:00"]],
      Tuesday: [["08:00", "12:00"]],
      Thursday: [["08:00", "12:00"]],
      Friday: [["10:00", "17:00"]],
    },
  },
  {
    id: "F002",
    name: "Prof. Juan Reyes",
    specializations: ["software", "systems", "management"],
    maxLoad: 15,
    currentLoad: 9,
    availability: {
      Monday: [["07:00", "10:00"], ["13:00", "18:00"]],
      Wednesday: [["09:00", "17:00"]],
      Thursday: [["08:00", "12:00"]],
      Saturday: [["07:00", "12:00"]],
    },
  },
  {
    id: "F003",
    name: "Dr. Ana Cruz",
    specializations: ["algorithms", "math", "software", "general"],
    maxLoad: 18,
    currentLoad: 7,
    availability: {
      Monday: [["09:00", "17:00"]],
      Tuesday: [["08:00", "15:00"]],
      Wednesday: [["09:00", "14:00"]],
      Friday: [["07:00", "12:00"]],
    },
  },
  {
    id: "F004",
    name: "Prof. Carlos Garcia",
    specializations: ["security", "systems", "environment"],
    maxLoad: 12,
    currentLoad: 6,
    availability: {
      Tuesday: [["10:00", "17:00"]],
      Wednesday: [["13:00", "18:00"]],
      Friday: [["10:00", "18:00"]],
      Saturday: [["08:00", "13:00"]],
    },
  },
];

const EXISTING_SCHEDULES = [
  { faculty: "Dr. Maria Santos", room: "RM002", section: "Section B", day: "Monday", timeSlot: "09:00-11:00" },
  { faculty: "Prof. Juan Reyes", room: "RM003", section: "Section A", day: "Wednesday", timeSlot: "09:00-11:00" },
  { faculty: "Dr. Ana Cruz", room: "RM006", section: "Section C", day: "Tuesday", timeSlot: "10:00-12:00" },
];

const EMPTY_ASSIGNMENT = {
  faculty: "",
  day: "",
  timeSlot: "",
  room: "",
};

// --- Utility Functions (Keep as is) ---
const toMinutes = (time) => {
  const [hours, minutes] = time.split(":").map(Number);
  return hours * 60 + minutes;
};

const toTime = (minutes) => {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${String(hours).padStart(2, "0")}:${String(mins).padStart(2, "0")}`;
};

const formatTime = (time) => {
  if (!time) return "";
  const [h, m] = time.split(":");
  const hour = Number(h);
  return `${hour % 12 || 12}:${m} ${hour >= 12 ? "PM" : "AM"}`;
};

const formatSlot = (slot) => {
  if (!slot) return "";
  const [start, end] = slot.split("-");
  return `${formatTime(start)} - ${formatTime(end)}`;
};

const slotsOverlap = (slotA, slotB) => {
  if (!slotA || !slotB) return false;
  const [startA, endA] = slotA.split("-").map(toMinutes);
  const [startB, endB] = slotB.split("-").map(toMinutes);
  return startA < endB && startB < endA;
};

const getSubjectMinutes = (subject) => {
  const contactHours = Number(subject.lec || 0) + Number(subject.lab || 0);
  return Math.max(contactHours, 1) * 60; // Ensure at least a 1-hour slot if no units specified
};

// Updated to map subject.type to MOCK_ROOMS types more accurately
const getRoomType = (subject) => {
  if (subject.type === "Laboratory") return "Laboratory";
  if (subject.type === "Lecture/Lab") return "Laboratory"; // Often these need lab rooms too
  return "Lecture";
};

const isFacultyQualified = (faculty, subject) =>
  subject.tags?.some((tag) => faculty.specializations.includes(tag)) || subject.tags?.includes("general"); // Added general as a fallback

const getFacultyProjectedLoad = (facultyName, assignments, curriculum) => {
  const addedLoad = curriculum.reduce((sum, subject) => {
    const assignment = assignments[subject.id];
    return assignment?.faculty === facultyName ? sum + Number(subject.units || 0) : sum;
  }, 0);
  const faculty = MOCK_FACULTY.find((item) => item.name === facultyName);
  return (faculty?.currentLoad || 0) + addedLoad;
};

const generateSlotsFromRanges = (ranges, durationMinutes) => {
  const slots = [];
  ranges.forEach(([rangeStart, rangeEnd]) => {
    const start = toMinutes(rangeStart);
    const end = toMinutes(rangeEnd);
    for (let cursor = start; cursor + durationMinutes <= end; cursor += 30) { // Check every 30 mins
      slots.push(`${toTime(cursor)}-${toTime(cursor + durationMinutes)}`);
    }
  });
  return slots;
};

// --- Conflict Mapping (Enhanced for Room Type and Room Availability) ---
const buildConflictMap = (curriculum, assignments, filters) => {
  const conflicts = {};
  const rows = curriculum
    .map((subject) => ({ subject, assignment: assignments[subject.id] || EMPTY_ASSIGNMENT }))
    .filter(({ assignment }) => assignment.day && assignment.timeSlot);

  const addConflict = (subjectId, message) => {
    conflicts[subjectId] = [...(conflicts[subjectId] || []), message];
  };

  rows.forEach(({ subject, assignment }, index) => {
    const room = MOCK_ROOMS.find((item) => item.id === assignment.room);
    const subjectRoomType = getRoomType(subject);

    // 1. Room Type Mismatch
    if (room && room.type !== subjectRoomType) {
      addConflict(subject.id, `Room ${room.name} (${room.type}) does not match subject requirement (${subjectRoomType}).`);
    }

    // 2. Faculty Load Check
    const faculty = MOCK_FACULTY.find((item) => item.name === assignment.faculty);
    if (faculty && getFacultyProjectedLoad(faculty.name, assignments, curriculum) > faculty.maxLoad) {
      addConflict(subject.id, "Faculty teaching load would exceed the maximum.");
    }

    // 3. Conflicts with Existing Schedules
    EXISTING_SCHEDULES.forEach((schedule) => {
      if (schedule.day !== assignment.day || !slotsOverlap(schedule.timeSlot, assignment.timeSlot)) return;
      if (assignment.faculty && schedule.faculty === assignment.faculty) {
        addConflict(subject.id, `Faculty ${assignment.faculty} is already assigned at this time in another schedule.`);
      }
      if (assignment.room && schedule.room === assignment.room) {
        addConflict(subject.id, `Room ${assignment.room} is already used at this time in another schedule.`);
      }
      if (filters.section && schedule.section === filters.section) {
        addConflict(subject.id, `Section ${filters.section} already has a class at this time in another schedule.`);
      }
    });

    // 4. Conflicts within the current draft
    rows.slice(index + 1).forEach(({ subject: otherSubject, assignment: other }) => {
      if (assignment.day !== other.day || !slotsOverlap(assignment.timeSlot, other.timeSlot)) return;

      // Faculty Overlap
      if (assignment.faculty && assignment.faculty === other.faculty) {
        addConflict(subject.id, "Faculty overlaps with another subject in this draft.");
        addConflict(otherSubject.id, "Faculty overlaps with another subject in this draft.");
      }
      // Room Overlap
      if (assignment.room && assignment.room === other.room) {
        addConflict(subject.id, "Room overlaps with another subject in this draft.");
        addConflict(otherSubject.id, "Room overlaps with another subject in this draft.");
      }
      // Section Overlap (if multiple sections are being scheduled simultaneously)
      if (filters.section && filters.section === other.section) {
        addConflict(subject.id, "Section has overlapping subjects in this draft.");
        addConflict(otherSubject.id, "Section has overlapping subjects in this draft.");
      }
    });
  });

  return conflicts;
};

// --- AssignScheduleForm Component ---
const AssignScheduleForm = () => {
  const [filters, setFilters] = useState({
    academicYear: "",
    semester: "",
    program: "",
    yearLevel: "",
    section: "",
    curriculumId: "",
  });
  const [curriculum, setCurriculum] = useState([]);
  const [assignments, setAssignments] = useState({});
  const [loadingCurr, setLoadingCurr] = useState(false);
  const [currLoaded, setCurrLoaded] = useState(false);
  const [saving, setSaving] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [publishConfirmOpen, setPublishConfirmOpen] = useState(false);
  const [savedMode, setSavedMode] = useState("");
  const [subjectSearch, setSubjectSearch] = useState("");
  const [availableCurricula] = useState(() =>
    loadCurricula().map(normalizeSchedulingCurriculum)
  );

  const curriculumOptions = useMemo(() =>
    availableCurricula.filter((item) =>
      (!filters.program || item.program === filters.program) &&
      (!filters.yearLevel || item.yearLevel === filters.yearLevel) &&
      (!filters.semester || item.semester === filters.semester)
    ), [availableCurricula, filters.program, filters.yearLevel, filters.semester]
  );

  const conflictMap = useMemo(
    () => buildConflictMap(curriculum, assignments, filters),
    [curriculum, assignments, filters]
  );

  const conflictCount = Object.values(conflictMap).reduce((sum, messages) => sum + messages.length, 0);

  const visibleCurriculum = useMemo(() => {
    const q = subjectSearch.trim().toLowerCase();
    if (!q) return curriculum;
    return curriculum.filter((subject) =>
      [subject.code, subject.description, subject.type]
        .join(" ")
        .toLowerCase()
        .includes(q)
    );
  }, [curriculum, subjectSearch]);

  const totalSubjects = curriculum.length;
  const assignedCount = Object.values(assignments).filter(
    (assignment) => assignment.faculty && assignment.day && assignment.timeSlot && assignment.room
  ).length;
  const allAssigned = totalSubjects > 0 && assignedCount === totalSubjects;
  const canSave = allAssigned && conflictCount === 0; // Only save if all assigned AND no conflicts
  const selectedCurriculum = availableCurricula.find((item) => item.id === filters.curriculumId);

  const updateFilter = (key, value) => {
    setFilters((prev) => {
      const next = { ...prev, [key]: value };
      // Reset curriculum selection if program, year, or semester changes
      if (["program", "yearLevel", "semester"].includes(key)) {
        next.curriculumId = "";
      }
      return next;
    });
    setCurrLoaded(false);
    setCurriculum([]);
    setAssignments({});
    setSavedMode("");
  };

  const canLoad = filters.academicYear && filters.semester && filters.program &&
    filters.yearLevel && filters.section && filters.curriculumId;

  const handleLoadCurriculum = async () => {
    if (!canLoad) return;
    setLoadingCurr(true);
    setCurrLoaded(false);
    setSavedMode("");
    try {
      // Simulate API call or data loading
      await new Promise((resolve) => setTimeout(resolve, 500));
      const subjects = selectedCurriculum?.subjects ?? [];
      setCurriculum(subjects);
      // Initialize assignments for loaded subjects
      setAssignments(Object.fromEntries(subjects.map((subject) => [subject.id, { ...EMPTY_ASSIGNMENT }])));
      setCurrLoaded(true);
    } finally {
      setLoadingCurr(false);
    }
  };

  const updateAssignment = (subjectId, field, value) => {
    setAssignments((prev) => {
      const currentAssignment = prev[subjectId] || EMPTY_ASSIGNMENT;
      let nextAssignment = { ...currentAssignment, [field]: value };

      // Reset subsequent fields when a preceding one is changed
      if (field === "faculty") {
        nextAssignment.day = "";
        nextAssignment.timeSlot = "";
        nextAssignment.room = "";
      } else if (field === "day") {
        nextAssignment.timeSlot = "";
        nextAssignment.room = "";
      } else if (field === "timeSlot") {
        nextAssignment.room = "";
      }
      return {
        ...prev,
        [subjectId]: nextAssignment,
      };
    });
    setSavedMode(""); // Reset saved mode when changes are made
  };

  const getQualifiedFaculty = (subject) =>
    MOCK_FACULTY.filter((faculty) =>
      isFacultyQualified(faculty, subject) &&
      // Check if adding this subject's units exceeds max load
      getFacultyProjectedLoad(faculty.name, assignments, curriculum) + Number(subject.units || 0) <= faculty.maxLoad
    );

  const getAvailableDays = (subject) => {
    const facultyName = assignments[subject.id]?.faculty;
    const faculty = MOCK_FACULTY.find((item) => item.name === facultyName);
    if (!faculty) return [];
    // Filter days where faculty has *any* availability
    return MOCK_DAYS.filter((day) => faculty.availability[day]?.length > 0);
  };

  const getAvailableTimes = (subject) => {
    const assignment = assignments[subject.id] || EMPTY_ASSIGNMENT;
    const faculty = MOCK_FACULTY.find((item) => item.name === assignment.faculty);
    if (!faculty || !assignment.day) return [];

    const duration = getSubjectMinutes(subject);
    const facultyAvailabilityRanges = faculty.availability[assignment.day] || [];
    const potentialSlots = generateSlotsFromRanges(facultyAvailabilityRanges, duration);

    // Filter slots based on conflicts with other assignments in draft and existing schedules
    return potentialSlots.filter((slot) => {
      // Temporarily assign this slot to check conflicts
      const draftAssignment = { ...assignment, timeSlot: slot };
      const draftAssignmentsWithCurrent = { ...assignments, [subject.id]: draftAssignment };

      const subjectConflicts = buildConflictMap(curriculum, draftAssignmentsWithCurrent, filters)[subject.id] || [];

      // Check if any conflict message is relevant to this subject's assignment (Faculty, Section, Room)
      const hasConflict = subjectConflicts.some(message =>
        message.includes("Faculty") || message.includes("Section") || message.includes("Room")
      );
      return !hasConflict;
    });
  };

  const getRoomsForSubject = (subject, assignment) => {
    const subjectRoomType = getRoomType(subject);

    return MOCK_ROOMS.filter((room) => {
      // First, check if room type matches subject requirement
      if (room.type !== subjectRoomType) return false;

      // If day and time are not selected yet, just show rooms of correct type
      if (!assignment.day || !assignment.timeSlot) return true;

      // If day and time are selected, check for room availability conflicts
      const draftAssignment = { ...assignment, room: room.id };
      const draftAssignmentsWithCurrent = { ...assignments, [subject.id]: draftAssignment };
      const subjectConflicts = buildConflictMap(curriculum, draftAssignmentsWithCurrent, filters)[subject.id] || [];

      // Check if any conflict message is related to the room for this subject
      const hasRoomConflict = subjectConflicts.some(message => message.includes("Room"));
      return !hasRoomConflict;
    });
  };

  const handleAutoSchedule = () => {
    const nextAssignments = {};
    let potentialConflicts = false;

    curriculum.forEach((subject) => {
      let assignedSuccessfully = false;
      const qualifiedFaculty = MOCK_FACULTY.filter((faculty) => isFacultyQualified(faculty, subject));

      for (const faculty of qualifiedFaculty) {
        // Skip if adding this subject exceeds faculty load
        if (getFacultyProjectedLoad(faculty.name, { ...assignments, ...nextAssignments }, curriculum) + Number(subject.units || 0) > faculty.maxLoad) {
          continue;
        }

        const days = MOCK_DAYS.filter((day) => faculty.availability[day]?.length > 0);
        for (const day of days) {
          const duration = getSubjectMinutes(subject);
          const facultyAvailabilityRanges = faculty.availability[day] || [];
          const slots = generateSlotsFromRanges(facultyAvailabilityRanges, duration);

          for (const timeSlot of slots) {
            const rooms = MOCK_ROOMS.filter((room) => room.type === getRoomType(subject));
            for (const room of rooms) {
              const draftAssignment = { faculty: faculty.name, day, timeSlot, room: room.id };
              const draft = { ...assignments, ...nextAssignments, [subject.id]: draftAssignment };

              // Check for conflicts for this specific assignment
              const conflictsForThisSubject = buildConflictMap(curriculum, draft, filters)[subject.id] || [];
              if (conflictsForThisSubject.length === 0) {
                nextAssignments[subject.id] = draftAssignment;
                assignedSuccessfully = true;
                break; // Found a valid slot, move to next subject
              } else {
                potentialConflicts = true; // Mark that auto-schedule found potential issues
              }
            }
            if (assignedSuccessfully) break;
          }
          if (assignedSuccessfully) break;
        }
        if (assignedSuccessfully) break;
      }

      // If no valid assignment found, keep it empty
      if (!assignedSuccessfully) {
        nextAssignments[subject.id] = EMPTY_ASSIGNMENT;
      }
    });

    setAssignments(nextAssignments);
    setSavedMode("");
    if (potentialConflicts) {
      alert("Auto-scheduling completed with potential conflicts. Please review the schedule.");
    }
  };

  const handleReset = () => {
    // Reset assignments to empty for all loaded subjects
    setAssignments(Object.fromEntries(curriculum.map((subject) => [subject.id, { ...EMPTY_ASSIGNMENT }])));
    setSavedMode("");
  };

  const handleSave = async (mode) => {
    setSaving(true);
    setConfirmOpen(false);
    setPublishConfirmOpen(false);
    try {
      // Prepare payload for backend (example)
      const payload = curriculum.map((subject) => ({
        subjectId: subject.id,
        subjectCode: subject.code,
        ...assignments[subject.id], // Contains faculty, day, timeSlot, room
        program: filters.program,
        yearLevel: filters.yearLevel,
        section: filters.section,
        semester: filters.semester,
        academicYear: filters.academicYear,
        curriculumId: filters.curriculumId,
        status: mode, // 'draft' or 'published'
      }));
      console.info("Schedule payload ready for backend:", payload);
      // Simulate saving data
      await new Promise((resolve) => setTimeout(resolve, 900));
      setSavedMode(mode);
      alert(`Schedule ${mode}d successfully!`); // Feedback to user
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-5">
      {/* Top Filter Section */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
        <div className="flex items-start justify-between gap-4 mb-5">
          <div>
            <h2 className="text-base font-bold text-gray-800">Create New Schedule</h2>
            <p className="text-xs text-gray-400 mt-0.5">
              Select academic details to load curriculum and start assigning faculty, days, times, and rooms.
            </p>
          </div>
          {/* This section might be better as part of the curriculum manager or a separate setup */}
          {/* <div className="hidden lg:grid grid-cols-4 gap-2 text-[11px] text-gray-500">
            {["Program", "Curriculum", "Faculty", "Time"].map((step, index) => (
              <div key={step} className="flex items-center gap-2">
                <span className="grid h-5 w-5 place-items-center rounded-full bg-pup-maroon/10 text-pup-maroon font-bold">
                  {index + 1}
                </span>
                {step}
              </div>
            ))}
          </div> */}
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-6 gap-4 mb-5">
          <SelectField label="School Year" value={filters.academicYear} onChange={(value) => updateFilter("academicYear", value)} options={MOCK_AY} placeholder="Select year" />
          <SelectField label="Semester" value={filters.semester} onChange={(value) => updateFilter("semester", value)} options={MOCK_SEMS} placeholder="Select semester" />
          <SelectField label="Program" value={filters.program} onChange={(value) => updateFilter("program", value)} options={MOCK_PROGRAMS} placeholder="Select program" />
          <SelectField label="Year Level" value={filters.yearLevel} onChange={(value) => updateFilter("yearLevel", value)} options={MOCK_YEARS} placeholder="Select year" />
          <SelectField label="Section" value={filters.section} onChange={(value) => updateFilter("section", value)} options={MOCK_SECTIONS.map((section) => `Section ${section}`)} placeholder="Select section" />
          <SelectField
            label="Curriculum"
            value={filters.curriculumId}
            onChange={(value) => updateFilter("curriculumId", value)}
            options={curriculumOptions.map((item) => ({ value: item.id, label: item.version }))}
            placeholder={curriculumOptions.length ? "Select version" : "No match"}
            disabled={!filters.program || !filters.yearLevel || !filters.semester} // Enable only when program, year, sem are set
          />
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={handleLoadCurriculum}
            disabled={!canLoad || loadingCurr}
            className="flex items-center gap-2 px-5 py-2.5 bg-pup-maroon text-white text-sm font-semibold rounded-xl hover:bg-pup-maroon-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loadingCurr ? <><Loader2 size={15} className="animate-spin" /> Loading...</> : "Load Curriculum"}
          </button>
          {!canLoad && (
            <p className="text-xs text-gray-400">
              Complete all filters (AY, Sem, Program, Year, Section, Curriculum) to retrieve curriculum subjects.
            </p>
          )}
        </div>
      </div>

      {/* Curriculum Display and Assignment Section */}
      {currLoaded && curriculum.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          {/* Header for loaded curriculum */}
          <div className="px-6 py-4 border-b border-gray-100">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <h2 className="text-base font-bold text-gray-800">
                  {selectedCurriculum?.version || "Curriculum Details"}
                </h2>
                <p className="text-xs text-gray-400 mt-0.5">
                  {filters.academicYear} - {filters.program} - {filters.yearLevel} - {filters.semester} - {filters.section}
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <div className="relative">
                  <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    value={subjectSearch}
                    onChange={(event) => setSubjectSearch(event.target.value)}
                    placeholder="Search subjects..."
                    className="w-52 rounded-xl border border-gray-200 py-2 pl-9 pr-3 text-sm focus:border-pup-maroon focus:outline-none focus:ring-2 focus:ring-pup-maroon/20"
                  />
                </div>
                <button
                  onClick={handleAutoSchedule}
                  className="flex items-center gap-2 px-3 py-2 text-sm border border-gray-200 text-gray-600 rounded-xl hover:bg-gray-50 transition-colors"
                >
                  <Wand2 size={15} />
                  Auto Schedule
                </button>
                <button
                  onClick={handleReset}
                  className="flex items-center gap-2 px-3 py-2 text-sm border border-gray-200 text-gray-600 rounded-xl hover:bg-gray-50 transition-colors"
                >
                  <RotateCcw size={15} />
                  Reset Assignments
                </button>
              </div>
            </div>

            <div className="mt-4 grid gap-3 sm:grid-cols-3">
              <StatusPill label="Assigned" value={`${assignedCount}/${totalSubjects}`} tone={allAssigned ? "green" : "maroon"} />
              <StatusPill label="Conflicts" value={conflictCount} tone={conflictCount ? "red" : "green"} />
              <StatusPill label="Status" value={savedMode ? (savedMode === "published" ? "Published" : "Draft Saved") : "Unsaved"} tone={savedMode ? "green" : "gray"} />
            </div>
          </div>

          {/* The main scheduling table */}
          <div className="overflow-x-auto max-h-[620px]">
            <table className="w-full text-left border-collapse">
              <thead className="sticky top-0 z-10 bg-gray-50 border-b border-gray-300 text-xs font-bold uppercase tracking-wide">
                <tr>
                  <th className="p-3 w-8">#</th>
                  <th className="p-3 min-w-[100px]">Subject Code</th>
                  <th className="p-3 w-1/4 min-w-[220px]">Description</th>
                  <th className="p-3 text-center">Lec</th>
                  <th className="p-3 text-center">Lab</th>
                  <th className="p-3 text-center">Unit</th>
                  <th className="p-3 min-w-[180px]">Faculty</th>
                  <th className="p-3 min-w-[130px]">Day</th>
                  <th className="p-3 min-w-[165px]">Time</th>
                  <th className="p-3 min-w-[165px]">Room</th>
                  <th className="p-3 min-w-[190px]">Status</th>
                </tr>
              </thead>
              <tbody>
                {visibleCurriculum.map((subject, index) => {
                  const assignment = assignments[subject.id] || EMPTY_ASSIGNMENT;
                  const isComplete = assignment.faculty && assignment.day && assignment.timeSlot && assignment.room;
                  const rowConflicts = conflictMap[subject.id] || [];
                  const qualifiedFaculty = getQualifiedFaculty(subject);
                  const availableDays = getAvailableDays(subject);
                  const availableTimes = getAvailableTimes(subject);
                  const rooms = getRoomsForSubject(subject, assignment);

                  // Determine row background color based on status/conflicts
                  let rowClass = "hover:bg-gray-50";
                  if (rowConflicts.length > 0) {
                    rowClass = "bg-red-50/70 text-red-700";
                  } else if (isComplete) {
                    rowClass = "bg-green-50/30";
                  }

                  return (
                    <tr key={subject.id} className={`border-b transition-colors ${rowClass}`}>
                      <td className="p-3 text-xs text-gray-400 font-medium">{index + 1}</td>
                      <td className="p-3">
                        <span className="px-2 py-1 bg-pup-maroon/10 text-pup-maroon text-xs font-bold rounded-lg whitespace-nowrap">
                          {subject.code}
                        </span>
                      </td>
                      <td className="p-3">
                        <p className="text-sm text-gray-700 font-medium leading-tight">{subject.description}</p>
                        <p className="mt-1 text-[11px] text-gray-400">{subject.type} - needs {getSubjectMinutes(subject) / 60} hour slot</p>
                      </td>
                      <td className="p-3 text-center font-semibold text-gray-600">{subject.lec}</td>
                      <td className="p-3 text-center font-semibold text-gray-600">{subject.lab}</td>
                      <td className="p-3 text-center font-bold text-gray-800">{subject.units}</td>

                      {/* Faculty Selection */}
                      <td className="p-3">
                        <select
                          value={assignment.faculty}
                          onChange={(event) => updateAssignment(subject.id, "faculty", event.target.value)}
                          className="min-w-[180px] rounded-lg border border-gray-200 bg-white px-2 py-1.5 text-xs focus:border-pup-maroon focus:outline-none focus:ring-2 focus:ring-pup-maroon/20"
                        >
                          <option value="">{qualifiedFaculty.length ? "Select available prof" : "No qualified faculty"}</option>
                          {qualifiedFaculty.map((faculty) => (
                            <option key={faculty.id} value={faculty.name}>
                              {faculty.name} ({faculty.currentLoad}/{faculty.maxLoad})
                            </option>
                          ))}
                        </select>
                      </td>

                      {/* Day Selection */}
                      <td className="p-3">
                        <select
                          value={assignment.day}
                          onChange={(event) => updateAssignment(subject.id, "day", event.target.value)}
                          disabled={!assignment.faculty}
                          className="min-w-[130px] rounded-lg border border-gray-200 bg-white px-2 py-1.5 text-xs focus:border-pup-maroon focus:outline-none focus:ring-2 focus:ring-pup-maroon/20 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          <option value="">{assignment.faculty ? "Select day" : "Select prof first"}</option>
                          {availableDays.map((day) => <option key={day}>{day}</option>)}
                        </select>
                      </td>

                      {/* Time Slot Selection */}
                      <td className="p-3">
                        <select
                          value={assignment.timeSlot}
                          onChange={(event) => updateAssignment(subject.id, "timeSlot", event.target.value)}
                          disabled={!assignment.day}
                          className="min-w-[165px] rounded-lg border border-gray-200 bg-white px-2 py-1.5 text-xs focus:border-pup-maroon focus:outline-none focus:ring-2 focus:ring-pup-maroon/20 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          <option value="">{assignment.day ? "Select time" : "Select day first"}</option>
                          {availableTimes.map((slot) => (
                            <option key={slot} value={slot}>{formatSlot(slot)}</option>
                          ))}
                        </select>
                      </td>

                      {/* Room Selection (CRITICAL ENHANCEMENT) */}
                      <td className="p-3">
                        <select
                          value={assignment.room}
                          onChange={(event) => updateAssignment(subject.id, "room", event.target.value)}
                          disabled={!assignment.timeSlot}
                          className={`min-w-[165px] rounded-lg border px-2 py-1.5 text-xs disabled:cursor-not-allowed disabled:opacity-50
                            ${assignment.room && rowConflicts.some(msg => msg.includes("Room")) ? "border-red-300 bg-red-50 text-red-700" :
                            assignment.room ? "border-gray-200 bg-white focus:border-pup-maroon focus:ring-pup-maroon/20" :
                            "border-gray-200 bg-white focus:border-pup-maroon focus:ring-pup-maroon/20"
                          }`}
                        >
                          <option value="">{assignment.timeSlot ? "Select room" : "Select time first"}</option>
                          {rooms.map((room) => (
                            <option key={room.id} value={room.id}>
                              {room.id} - {room.name}
                            </option>
                          ))}
                        </select>
                      </td>

                      {/* Status Cell */}
                      <td className="p-3">
                        {rowConflicts.length > 0 ? (
                          <div className="space-y-1 text-xs text-red-600">
                            <div className="flex items-center gap-1 font-semibold">
                              <AlertTriangle size={14} />
                              Conflict
                            </div>
                            <p>{rowConflicts[0]}</p> {/* Display first conflict */}
                          </div>
                        ) : isComplete ? (
                          <div className="flex items-center gap-1 text-xs font-semibold text-green-600">
                            <CheckCircle2 size={14} />
                            Ready
                          </div>
                        ) : (
                          <span className="text-xs text-gray-400">Incomplete</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Action Buttons Section */}
          <div className="flex flex-col gap-3 border-t border-gray-100 bg-gray-50 px-6 py-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="text-sm text-gray-500">
              {conflictCount > 0 ? (
                <span className="flex items-center gap-2 font-medium text-red-600">
                  <AlertTriangle size={16} />
                  Resolve {conflictCount} conflict{conflictCount !== 1 ? "s" : ""} before saving.
                </span>
              ) : allAssigned ? (
                <span className="flex items-center gap-2 font-medium text-green-600">
                  <CheckCircle2 size={16} />
                  All subjects are ready to save.
                </span>
              ) : (
                <span className="flex items-center gap-2 text-gray-400">
                  <AlertTriangle size={16} className="text-yellow-500" />
                  {totalSubjects - assignedCount} subject{totalSubjects - assignedCount !== 1 ? "s" : ""} still need assignment.
                </span>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <button
                onClick={() => setPreviewOpen(true)}
                disabled={assignedCount === 0} // Can preview even if not all assigned
                className="flex items-center gap-2 px-4 py-2 text-sm border border-gray-200 text-gray-600 rounded-xl hover:bg-white transition-colors disabled:opacity-40"
              >
                <Eye size={15} />
                Preview
              </button>
              <button
                disabled // Placeholder for export functionality
                className="flex items-center gap-2 px-4 py-2 text-sm border border-gray-200 text-gray-400 rounded-xl disabled:opacity-60"
                title="Backend export endpoint can connect here."
              >
                <FileDown size={15} />
                Export
              </button>
              <button
                onClick={() => setConfirmOpen(true)}
                disabled={!canSave || saving} // Only enable if all assigned, no conflicts, and not saving
                className="flex items-center gap-2 px-4 py-2 text-sm border border-pup-maroon text-pup-maroon rounded-xl font-semibold hover:bg-red-50 transition-colors disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Save size={15} />
                Save Draft
              </button>
              <button
                onClick={() => setPublishConfirmOpen(true)}
                disabled={!canSave || saving} // Only enable if all assigned, no conflicts, and not saving
                className="flex items-center gap-2 px-4 py-2 text-sm bg-pup-maroon text-white rounded-xl font-semibold hover:bg-pup-maroon-dark transition-colors disabled:cursor-not-allowed disabled:opacity-50"
              >
                {saving ? <Loader2 size={15} className="animate-spin" /> : <Send size={15} />}
                Publish
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modals for confirmation and preview */}
      <AssignPreviewModal
        open={previewOpen}
        curriculum={curriculum}
        assignments={assignments}
        filters={filters}
        conflicts={conflictMap}
        onClose={() => setPreviewOpen(false)}
        onConfirm={() => { setPreviewOpen(false); setPublishConfirmOpen(true); }} // Option to confirm from preview
      />

      <ConfirmDialog
        open={confirmOpen}
        title="Save Draft Schedule"
        message={`Save this draft schedule for ${filters.program} ${filters.yearLevel} ${filters.section} - ${filters.semester}?`}
        confirmLabel="Save Draft"
        confirmStyle="primary"
        loading={saving}
        onConfirm={() => handleSave("draft")}
        onCancel={() => setConfirmOpen(false)}
      />

      <ConfirmDialog
        open={publishConfirmOpen}
        title="Publish Schedule"
        message="Publishing will finalize this schedule and make it available. Continue?"
        confirmLabel="Publish"
        confirmStyle="primary"
        loading={saving}
        onConfirm={() => handleSave("published")}
        onCancel={() => setPublishConfirmOpen(false)}
      />
    </div>
  );
};

// --- Helper Components (Keep as is) ---
const SelectField = ({ label, value, onChange, options, placeholder, disabled = false }) => (
  <div className="flex flex-col gap-1">
    <label className="block text-xs font-bold mb-1 uppercase tracking-wide text-gray-500">{label}</label>
    <div className="relative">
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        disabled={disabled}
        className="w-full appearance-none rounded-lg border border-gray-200 bg-white py-2.5 pl-3 pr-8 text-sm transition focus:border-pup-maroon focus:outline-none focus:ring-2 focus:ring-pup-maroon/20 disabled:cursor-not-allowed disabled:opacity-50"
      >
        <option value="">{placeholder}</option>
        {options.map((option) => {
          const item = typeof option === "string" ? { value: option, label: option } : option;
          return <option key={item.value || item.label} value={item.value || item.label}>{item.label || item.value}</option>;
        })}
      </select>
      <ChevronDown size={14} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" />
    </div>
  </div>
);

const StatusPill = ({ label, value, tone }) => {
  const tones = {
    green: "bg-green-50 text-green-700 border-green-100",
    red: "bg-red-50 text-red-700 border-red-100",
    maroon: "bg-red-50 text-pup-maroon border-red-100",
    gray: "bg-gray-50 text-gray-600 border-gray-100",
  };

  return (
    <div className={`rounded-xl border px-4 py-3 ${tones[tone]}`}>
      <p className="text-[11px] uppercase tracking-wide opacity-70">{label}</p>
      <p className="mt-1 text-sm font-bold">{value}</p>
    </div>
  );
};

export default AssignScheduleForm;