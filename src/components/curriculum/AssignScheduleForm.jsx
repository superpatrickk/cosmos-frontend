import { useMemo, useState, useEffect } from "react";
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
import {
  normalizeCurriculumYearLevels,
  normalizeSchedulingCurriculum,
} from "../../data/curriculumStore";
import { curriculumService } from "../../api/services/curriculumService";
import { scheduleService } from "../../api/services/scheduleService";
import { roomService } from "../../api/services/roomService";
import { facultyService } from "../../api/services/facultyService";
import { subjectService } from "../../api/services/subjectService";

const EMPTY_ASSIGNMENT = {
  faculty: "",
  day: "",
  timeSlot: "",
  room: "",
};

const normalizeSection = (section) =>
  String(section || "").replace(/^section\s+/i, "").trim().toUpperCase();

const expandYearLevels = (yearLevels) => {
  const values = Array.isArray(yearLevels)
    ? yearLevels
    : String(yearLevels ?? "").split(/\s*(?:,|&|\band\b)\s*/i);
  return values.map((year) => String(year ?? "").trim().toLowerCase()).filter(Boolean);
};

const normalizeCurriculumKeyPart = (value) => String(value ?? "")
  .normalize("NFKC")
  .replace(/[\u2010-\u2015\u2212]/g, "-")
  .replace(/\s*-\s*/g, "-")
  .trim()
  .toUpperCase();

const mergeCurricula = (curricula) => {
  const grouped = new Map();

  curricula.forEach((curriculum) => {
    const key = [
      normalizeCurriculumKeyPart(curriculum.program),
      normalizeCurriculumKeyPart(curriculum.academicYear),
      normalizeCurriculumKeyPart(curriculum.semester),
    ].join("|");
    const existing = grouped.get(key);

    if (!existing) {
      const yearLevels = normalizeCurriculumYearLevels(curriculum);
      grouped.set(key, {
        ...curriculum,
        yearLevels,
        yearLevel: yearLevels.join(", "),
        subjects: [...(curriculum.subjects || [])],
      });
      return;
    }

    existing.yearLevels = [...new Set([
      ...existing.yearLevels,
      ...normalizeCurriculumYearLevels(curriculum),
    ])];
    existing.yearLevel = existing.yearLevels.join(", ");

    const subjectsByCode = new Map();
    [...existing.subjects, ...(curriculum.subjects || [])].forEach((subject) => {
      const subjectKey = normalizeCurriculumKeyPart(subject.code || subject.id);
      if (subjectKey && !subjectsByCode.has(subjectKey)) {
        subjectsByCode.set(subjectKey, subject);
      }
    });
    existing.subjects = [...subjectsByCode.values()];
  });

  return [...grouped.values()];
};

const normalizeYearLevelLabel = (yearLevel) => {
  const value = String(yearLevel ?? "").trim();
  const supportedYears = ["1st Year", "2nd Year", "3rd Year", "4th Year"];
  return supportedYears.find((year) => year.toLowerCase() === value.toLowerCase()) || value;
};

// Rooms fetched from backend
const useRooms = () => {
  const [rooms, setRooms] = useState([]);
  const [roomsLoading, setRoomsLoading] = useState(false);
  const [roomsError, setRoomsError] = useState(null);

  useEffect(() => {
    let mounted = true;
    const fetchRooms = async () => {
      setRoomsLoading(true);
      setRoomsError(null);
      try {
        const res = await roomService.getAll();
        const data = res?.data ?? res;
        if (!mounted) return;
        setRooms(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error("Failed to load rooms:", err);
        if (mounted) setRoomsError(err?.message || "Failed to load rooms");
      } finally {
        if (mounted) setRoomsLoading(false);
      }
    };
    fetchRooms();
    return () => { mounted = false; };
  }, []);

  return { rooms, roomsLoading, roomsError };
};

const useExistingSchedules = (filters) => {
  const [existing, setExisting] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const hasFilters = Boolean(filters.program || filters.yearLevel || filters.semester || filters.section);

  useEffect(() => {
    let mounted = true;
    const fetchExisting = async () => {
      setLoading(true);
      setError(null);
      try {
        const params = {};
        if (filters.program) params.program = filters.program;
        if (filters.yearLevel) params.yearLevel = filters.yearLevel;
        if (filters.semester) params.semester = filters.semester;
        if (filters.section) params.section = filters.section;
        if (filters.academicYear) params.academicYear = filters.academicYear;
        const res = await scheduleService.getAll(params);
        const data = res?.data ?? res;
        if (!mounted) return;
        setExisting(Array.isArray(data) ? data.map((schedule) => ({
          ...schedule,
          faculty: schedule.facultyName || schedule.faculty || "",
          room: String(schedule.roomId ?? schedule.room ?? ""),
          section: normalizeSection(schedule.section),
          timeSlot: schedule.timeSlot || `${schedule.startTime}-${schedule.endTime}`,
        })) : []);
      } catch (err) {
        console.error("Failed to load existing schedules:", err);
        if (mounted) setError(err?.message || "Failed to load schedules");
      } finally {
        if (mounted) setLoading(false);
      }
    };
    // fetch when key filters are present
    if (hasFilters) fetchExisting();
    return () => { mounted = false; };
  }, [filters.program, filters.yearLevel, filters.semester, filters.section, filters.academicYear, hasFilters]);

  return { existing: hasFilters ? existing : [], loading, error };
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

const getRoomType = (subject) => {
  if (subject.type === "Laboratory") return "Laboratory";
  if (subject.type === "Lecture/Lab") return "Laboratory"; // Often these need lab rooms too
  return "Lecture";
};

const isFacultyQualified = (faculty, subject) => {
  const specializationList = Array.isArray(faculty?.specializations) ? faculty.specializations : [];
  return subject.tags?.some((tag) => specializationList.includes(tag)) || subject.tags?.includes("general");
};

const getFacultyProjectedLoad = (facultyName, assignments, curriculum, facultyList = []) => {
  const addedLoad = curriculum.reduce((sum, subject) => {
    const assignment = assignments[subject.id];
    return assignment?.faculty === facultyName ? sum + Number(subject.units || 0) : sum;
  }, 0);
  const faculty = facultyList.find((item) => item.name === facultyName || item.fullName === facultyName);
  return (Number(faculty?.currentLoad || faculty?.load || 0)) + addedLoad;
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
const buildConflictMap = (curriculum, assignments, filters, facultyList = []) => {
  const conflicts = {};
  const rows = curriculum
    .map((subject) => ({ subject, assignment: assignments[subject.id] || EMPTY_ASSIGNMENT }))
    .filter(({ assignment }) => assignment.day && assignment.timeSlot);

  const addConflict = (subjectId, message) => {
    conflicts[subjectId] = [...(conflicts[subjectId] || []), message];
  };

  rows.forEach(({ subject, assignment }, index) => {
  const room = (filters.roomsList || []).find((item) => String(item.id) === String(assignment.room));
  const existingSchedules = filters.existingSchedules || [];
    const subjectRoomType = getRoomType(subject);

    // 1. Room Type Mismatch — skip if room has no type (backend removed `type`)
    if (room && room.type && room.type !== subjectRoomType) {
      addConflict(subject.id, `Room ${room.name} (${room.type}) does not match subject requirement (${subjectRoomType}).`);
    }

    // 2. Faculty Load Check
    const faculty = facultyList.find((item) => item.name === assignment.faculty || item.fullName === assignment.faculty);
    if (faculty && getFacultyProjectedLoad(faculty.name || faculty.fullName, assignments, curriculum, facultyList) > Number(faculty.maxLoad || faculty.load || 0)) {
      addConflict(subject.id, "Faculty teaching load would exceed the maximum.");
    }

    // 3. Conflicts with Existing Schedules
    existingSchedules.forEach((schedule) => {
      if (
        (filters.academicYear && schedule.academicYear !== filters.academicYear) ||
        (filters.semester && schedule.semester !== filters.semester)
      ) return;
      if (schedule.day !== assignment.day || !slotsOverlap(schedule.timeSlot, assignment.timeSlot)) return;
      if (assignment.faculty && schedule.faculty === assignment.faculty) {
        addConflict(subject.id, `Faculty ${assignment.faculty} is already assigned at this time in another schedule.`);
      }
      if (assignment.room && schedule.room === assignment.room) {
        addConflict(subject.id, `Room ${assignment.room} is already used at this time in another schedule.`);
      }
      if (
        filters.section &&
        schedule.courseCode === filters.program &&
        schedule.yearLevel === filters.yearLevel &&
        schedule.section === normalizeSection(filters.section)
      ) {
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
  const [availableCurricula, setAvailableCurricula] = useState([]);
  const [availableSubjects, setAvailableSubjects] = useState([]);
  const [subjectsLoading, setSubjectsLoading] = useState(false);
  const [subjectsError, setSubjectsError] = useState(null);
  const [facultyList, setFacultyList] = useState([]);
  const [availLoading, setAvailLoading] = useState(false);
  const [availError, setAvailError] = useState(null);
  const { rooms, roomsLoading, roomsError } = useRooms();

  useEffect(() => {
    let mounted = true;
    const fetchFaculty = async () => {
      try {
        const res = await facultyService.getAll();
        const data = res?.data ?? res ?? [];
        if (!mounted) return;
        setFacultyList(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error("Failed to load faculty data from backend:", err);
        if (mounted) setFacultyList([]);
      }
    };
    fetchFaculty();
    return () => { mounted = false; };
  }, []);

  useEffect(() => {
    let mounted = true;
    const fetchAvailable = async () => {
      try {
        setAvailLoading(true);
        setAvailError(null);
        const res = await curriculumService.getAll();
        const data = res?.data ?? res;
        if (!mounted) return;
        if (Array.isArray(data)) {
          setAvailableCurricula(mergeCurricula(data.map(normalizeSchedulingCurriculum)));
        } else {
          setAvailableCurricula([]);
        }
      } catch (err) {
        console.error("Failed to fetch curriculum catalog:", err);
        if (mounted) {
          setAvailableCurricula([]);
          setAvailError(err?.message || "Failed to load curriculum catalog");
        }
      } finally { if (mounted) setAvailLoading(false); }
    };
    fetchAvailable();
    return () => { mounted = false; };
  }, []);

  useEffect(() => {
    let mounted = true;
    const fetchSubjects = async () => {
      setSubjectsLoading(true);
      try {
        const res = await subjectService.getAll();
        const data = res?.data ?? res;
        if (!Array.isArray(data)) {
          throw new Error("The subject catalog returned an unexpected response.");
        }
        if (mounted) {
          setAvailableSubjects(data);
          setSubjectsError(null);
        }
      } catch (err) {
        console.error("Failed to fetch subjects for curriculum files:", err);
        if (mounted) {
          setAvailableSubjects([]);
          setSubjectsError(err?.response?.data?.message || err?.message || "Failed to load subjects.");
        }
      } finally {
        if (mounted) setSubjectsLoading(false);
      }
    };

    fetchSubjects();
    return () => { mounted = false; };
  }, []);

  const programOptions = useMemo(
    () => [...new Set(availableCurricula.map((item) => item.program).filter(Boolean))],
    [availableCurricula]
  );

  const curriculumOptions = useMemo(
    () => (filters.program
      ? availableCurricula.filter((item) => item.program === filters.program)
      : availableCurricula),
    [availableCurricula, filters.program]
  );
  const curriculumYearCounts = useMemo(
    () => curriculumOptions.reduce((counts, item) => {
      const year = normalizeCurriculumKeyPart(item.academicYear);
      counts.set(year, (counts.get(year) || 0) + 1);
      return counts;
    }, new Map()),
    [curriculumOptions]
  );

  const { existing: existingSchedules, loading: existingLoading, error: existingError } = useExistingSchedules(filters);

  const conflictMap = useMemo(
    () => buildConflictMap(curriculum, assignments, { ...filters, roomsList: rooms, existingSchedules }, facultyList),
    [curriculum, assignments, filters, rooms, existingSchedules, facultyList]
  );

  const conflictCount = Object.values(conflictMap).reduce((sum, messages) => sum + messages.length, 0);

  const totalSubjects = curriculum.length;
  const assignedCount = Object.values(assignments).filter(
    (assignment) => assignment.faculty && assignment.day && assignment.timeSlot && assignment.room
  ).length;
  const allAssigned = totalSubjects > 0 && assignedCount === totalSubjects;
  const canSave = allAssigned && conflictCount === 0; // Only save if all assigned AND no conflicts
  const selectedCurriculum = availableCurricula.find(
    (item) => String(item.id) === String(filters.curriculumId)
  );
  const selectedCurriculumYearLevels = selectedCurriculum
    ? (selectedCurriculum.yearLevels?.length
      ? selectedCurriculum.yearLevels
      : expandYearLevels(selectedCurriculum.yearLevel))
    : [];
  const yearLevelOptions = selectedCurriculumYearLevels.map((yearLevel) => {
    const text = normalizeYearLevelLabel(yearLevel);
    return {
      value: text,
      label: text,
    };
  });
  const curriculumSubjects = useMemo(() => {
    if (!selectedCurriculum) return [];
    const normalize = (value) => String(value ?? "").trim().toUpperCase();
    const selectedYear = normalize(filters.yearLevel);
    if (!selectedYear) return [];

    const embeddedSubjects = (selectedCurriculum.subjects || [])
      .filter((subject) => !subject.yearLevel || normalize(subject.yearLevel) === selectedYear)
      .map((subject) => ({
        ...subject,
        description: subject.description || subject.name || "",
        units: Number(subject.units || 0),
        yearLevel: subject.yearLevel || filters.yearLevel,
        semester: subject.semester || selectedCurriculum.semester,
      }));

    const catalogSubjects = availableSubjects
      .filter((subject) => {
        const active = !subject.status || String(subject.status).toLowerCase() === "active";
        const program = subject.course || subject.program || subject.department;
        const matchesProgram = normalize(program) === normalize(selectedCurriculum.program);
        const matchesYear = normalize(subject.yearLevel) === selectedYear;
        const matchesSemester = normalize(subject.semester) === normalize(selectedCurriculum.semester);
        const matchesAcademicYear = !subject.academicYear
          || normalize(subject.academicYear) === normalize(selectedCurriculum.academicYear);
        return active && matchesProgram && matchesYear && matchesSemester && matchesAcademicYear;
      })
      .map((subject) => ({
        ...subject,
        description: subject.description || subject.name || "",
        units: Number(subject.units || 0),
        yearLevel: subject.yearLevel || filters.yearLevel,
        semester: subject.semester || selectedCurriculum.semester,
      }));

    const seenCodes = new Set();
    return [...embeddedSubjects, ...catalogSubjects].filter((subject) => {
      const key = normalize(subject.code) || String(subject.id ?? "");
      if (!key || seenCodes.has(key)) return !key;
      seenCodes.add(key);
      return true;
    });
  }, [availableSubjects, filters.yearLevel, selectedCurriculum]);

  const courseGroups = useMemo(() => {
    const groups = new Map();
    const yearOrder = ["1st Year", "2nd Year", "3rd Year", "4th Year"];

    curriculum.forEach((subject) => {
      const rawYear = String(subject.yearLevel || subject.year || subject.level || subject.yearName || "").trim();
      const normalizedYear = (rawYear || filters.yearLevel || "Courses")
        .replace(/\s+/g, " ")
        .trim();

      if (!groups.has(normalizedYear)) {
        groups.set(normalizedYear, []);
      }
      groups.get(normalizedYear).push(subject);
    });

    const orderedEntries = [...groups.entries()].sort(([a], [b]) => {
      const aIndex = yearOrder.indexOf(a);
      const bIndex = yearOrder.indexOf(b);
      if (aIndex !== -1 && bIndex !== -1) return aIndex - bIndex;
      if (aIndex !== -1) return -1;
      if (bIndex !== -1) return 1;
      return a.localeCompare(b);
    });

    return orderedEntries.map(([label, subjects]) => ({ label, subjects }));
  }, [curriculum, filters.yearLevel]);

  const updateFilter = (key, value) => {
    setFilters((prev) => {
      const next = { ...prev, [key]: value };
      if (key === "curriculumId" && value) {
        const selected = availableCurricula.find((item) => String(item.id) === String(value));
        if (selected) {
          next.program = selected.program || "";
          const years = selected.yearLevels?.length
            ? selected.yearLevels
            : expandYearLevels(selected.yearLevel);
          next.yearLevel = years.length === 1 ? normalizeYearLevelLabel(years[0]) : "";
          next.semester = selected.semester || "";
          next.academicYear = selected.academicYear || "";
        }
      } else if (key === "program") {
        next.curriculumId = "";
        next.yearLevel = "";
        next.semester = "";
        next.academicYear = "";
      } else if (key === "semester") {
        next.curriculumId = "";
      }
      return next;
    });
    setCurrLoaded(false);
    setCurriculum([]);
    setAssignments({});
    setSavedMode("");
  };

  const canLoad = Boolean(filters.program && filters.curriculumId && filters.yearLevel);

  const handleLoadCurriculum = async () => {
    if (!canLoad) return;
    setLoadingCurr(true);
    setCurrLoaded(false);
    setSavedMode("");
    try {
      const subjects = curriculumSubjects;
      setCurriculum(subjects);
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
    facultyList.filter((faculty) =>
      isFacultyQualified(faculty, subject) &&
      getFacultyProjectedLoad(faculty.name || faculty.fullName, assignments, curriculum, facultyList) + Number(subject.units || 0) <= Number(faculty.maxLoad || faculty.load || 0)
    );

  const getAvailableDays = (subject) => {
    const facultyName = assignments[subject.id]?.faculty;
    const faculty = facultyList.find((item) => item.name === facultyName || item.fullName === facultyName);
    if (!faculty) return [];
    const availability = faculty.availability ?? {};
    return Object.keys(availability).filter((day) => Array.isArray(availability[day]) && availability[day].length > 0);
  };

  const getAvailableTimes = (subject) => {
    const assignment = assignments[subject.id] || EMPTY_ASSIGNMENT;
    const faculty = facultyList.find((item) => item.name === assignment.faculty || item.fullName === assignment.faculty);
    if (!faculty || !assignment.day) return [];

    const duration = getSubjectMinutes(subject);
    const facultyAvailabilityRanges = faculty.availability?.[assignment.day] || [];
    const potentialSlots = generateSlotsFromRanges(facultyAvailabilityRanges, duration);

    // Filter slots based on conflicts with other assignments in draft and existing schedules
    return potentialSlots.filter((slot) => {
      // Temporarily assign this slot to check conflicts
      const draftAssignment = { ...assignment, timeSlot: slot };
      const draftAssignmentsWithCurrent = { ...assignments, [subject.id]: draftAssignment };

      const subjectConflicts = buildConflictMap(curriculum, draftAssignmentsWithCurrent, { ...filters, roomsList: rooms, existingSchedules })[subject.id] || [];

      // Check if any conflict message is relevant to this subject's assignment (Faculty, Section, Room)
      const hasConflict = subjectConflicts.some(message =>
        message.includes("Faculty") || message.includes("Section") || message.includes("Room")
      );
      return !hasConflict;
    });
  };

  const getRoomsForSubject = (subject, assignment) => {
    const subjectRoomType = getRoomType(subject);

    return rooms.filter((room) => {
      // First, check if room type matches subject requirement — if room has no type, allow it
      if (room.type && room.type !== subjectRoomType) return false;

      // If day and time are not selected yet, just show rooms of correct type
      if (!assignment.day || !assignment.timeSlot) return true;

      // If day and time are selected, check for room availability conflicts
      const draftAssignment = { ...assignment, room: room.id };
      const draftAssignmentsWithCurrent = { ...assignments, [subject.id]: draftAssignment };
      const subjectConflicts = buildConflictMap(curriculum, draftAssignmentsWithCurrent, { ...filters, roomsList: rooms, existingSchedules })[subject.id] || [];

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
      const qualifiedFaculty = facultyList.filter((faculty) => isFacultyQualified(faculty, subject));

      for (const faculty of qualifiedFaculty) {
        const facultyName = faculty.name || faculty.fullName;
        if (getFacultyProjectedLoad(facultyName, { ...assignments, ...nextAssignments }, curriculum, facultyList) + Number(subject.units || 0) > Number(faculty.maxLoad || faculty.load || 0)) {
          continue;
        }

        const days = Object.keys(faculty.availability || {}).filter((day) => Array.isArray(faculty.availability[day]) && faculty.availability[day].length > 0);
        for (const day of days) {
          const duration = getSubjectMinutes(subject);
          const facultyAvailabilityRanges = faculty.availability[day] || [];
          const slots = generateSlotsFromRanges(facultyAvailabilityRanges, duration);

          for (const timeSlot of slots) {
            const eligibleRooms = rooms.filter((room) => !room.type || room.type === getRoomType(subject));
            for (const room of eligibleRooms) {
              const draftAssignment = { faculty: facultyName, day, timeSlot, room: room.id };
              const draft = { ...assignments, ...nextAssignments, [subject.id]: draftAssignment };

              const conflictsForThisSubject = buildConflictMap(curriculum, draft, { ...filters, roomsList: rooms, existingSchedules }, facultyList)[subject.id] || [];
              if (conflictsForThisSubject.length === 0) {
                nextAssignments[subject.id] = draftAssignment;
                assignedSuccessfully = true;
                break;
              } else {
                potentialConflicts = true;
              }
            }
            if (assignedSuccessfully) break;
          }
          if (assignedSuccessfully) break;
        }
        if (assignedSuccessfully) break;
      }

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
      // Send to backend
      try {
        await curriculumService.saveSchedules(payload);
        setSavedMode(mode);
        alert(`Schedule ${mode}d successfully!`);
      } catch (err) {
        console.error("Failed to save schedule to backend:", err);
        alert("Failed to save schedule. See console for details.");
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-5">
      {/* Curriculum File Section */}
      <div className="rounded-2xl border border-white/40 bg-white/60 p-6 shadow-[0_10px_25px_rgba(15,23,42,0.05)] backdrop-blur-[2px]">
        <div className="mb-5">
          <h2 className="text-base font-bold text-gray-800">Curriculum File</h2>
          <p className="mt-0.5 text-xs text-gray-400">
            Select a curriculum, year level, and program to view its courses.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <SelectField
            label="Curriculum"
            value={filters.curriculumId}
            onChange={(value) => updateFilter("curriculumId", value)}
            options={curriculumOptions.map((item) => ({
              value: String(item.id),
              label: curriculumYearCounts.get(normalizeCurriculumKeyPart(item.academicYear)) > 1
                ? `${item.academicYear || "-"} (${item.semester})`
                : item.academicYear || "-",
            }))}
            placeholder={curriculumOptions.length ? "Select curriculum" : "No curriculum available"}
            disabled={availLoading || Boolean(availError) || curriculumOptions.length === 0}
          />

          <SelectField
            label="Year Level"
            value={filters.yearLevel}
            onChange={(value) => updateFilter("yearLevel", value)}
            options={yearLevelOptions}
            placeholder={selectedCurriculum ? "Select year level" : "Select a curriculum first"}
            disabled={!selectedCurriculum || yearLevelOptions.length === 0}
          />

          <SelectField
            label="Program"
            value={filters.program}
            onChange={(value) => updateFilter("program", value)}
            options={programOptions.map((program) => ({ value: program, label: program }))}
            placeholder="Select program"
          />
        </div>

        {availLoading && <div className="mt-3 text-xs text-gray-400">Loading curriculum file...</div>}
        {availError && <div className="mt-3 text-xs text-red-600">{availError}</div>}
        {subjectsError && <div className="mt-3 text-xs text-red-600">Could not load course details: {subjectsError}</div>}

        <div className="mt-5 flex flex-wrap items-center gap-3">
          <button
            onClick={handleLoadCurriculum}
            disabled={!canLoad || loadingCurr || availLoading || subjectsLoading}
            className="flex items-center gap-2 rounded-xl bg-pup-maroon px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-pup-maroon-dark disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loadingCurr || subjectsLoading
              ? <><Loader2 size={15} className="animate-spin" /> Loading...</>
              : "View Curriculum File"}
          </button>
          {!canLoad && (
            <p className="text-xs text-gray-400">
              Select a curriculum and year level. Its program and academic year will be filled in automatically.
            </p>
          )}
        </div>
      </div>

      {/* Curriculum Display and Assignment Section */}
      {currLoaded && (
        <div className="overflow-hidden rounded-md border border-[#2f2f2f] bg-white shadow-sm">
          <div className="border-b border-[#2f2f2f] bg-[#efefef] px-3 py-2.5 text-center">
            <h3 className="text-[15px] font-black uppercase tracking-tight text-[#1f1f1f]">
              {selectedCurriculum?.description || selectedCurriculum?.program || filters.program}
            </h3>
            <p className="mt-1 text-xs text-gray-600">
              {[selectedCurriculum?.program, filters.yearLevel, selectedCurriculum?.semester, selectedCurriculum?.academicYear]
                .filter(Boolean)
                .join(" • ")}
            </p>
          </div>

          {curriculum.length === 0 ? (
            <div className="px-6 py-10 text-center">
              <p className="text-sm font-semibold text-gray-700">No courses found for this curriculum.</p>
              <p className="mt-1 text-xs text-gray-500">
                Add active courses for {selectedCurriculum?.program} {filters.yearLevel} in Course Management, then try again.
              </p>
            </div>
          ) : (
          <div className="p-0">
            {courseGroups.map(({ label, subjects }) => (
              <div key={label} className="border-b border-[#2f2f2f] last:border-b-0">
                <div className="border-b border-[#2f2f2f] bg-[#f3f3f3] px-3 py-2 text-left text-[12px] font-black uppercase tracking-wide text-[#1f1f1f]">
                  {label}
                </div>

                <table className="w-full border-collapse text-left text-[12px] text-[#1f1f1f]">
                  <thead className="bg-[#e5e7eb] text-[11px] font-black uppercase tracking-wide text-[#1f1f1f]">
                    <tr>
                      <th className="border border-[#2f2f2f] px-3 py-2">Code</th>
                      <th className="border border-[#2f2f2f] px-3 py-2">Description</th>
                      <th className="border border-[#2f2f2f] px-3 py-2 text-center">Lec</th>
                      <th className="border border-[#2f2f2f] px-3 py-2 text-center">Lab</th>
                      <th className="border border-[#2f2f2f] px-3 py-2 text-center">Units</th>
                      <th className="border border-[#2f2f2f] px-3 py-2">Type</th>
                    </tr>
                  </thead>
                  <tbody>
                    {subjects.map((subject) => (
                      <tr key={subject.id} className="align-top">
                        <td className="border border-[#2f2f2f] px-3 py-2 font-medium text-[#2f2f2f]">
                          {subject.code}
                        </td>
                        <td className="border border-[#2f2f2f] px-3 py-2 text-[#2f2f2f]">
                          {subject.description}
                        </td>
                        <td className="border border-[#2f2f2f] px-3 py-2 text-center text-[#2f2f2f]">
                          {subject.lec ?? "—"}
                        </td>
                        <td className="border border-[#2f2f2f] px-3 py-2 text-center text-[#2f2f2f]">
                          {subject.lab ?? "—"}
                        </td>
                        <td className="border border-[#2f2f2f] px-3 py-2 text-center font-semibold text-[#1f1f1f]">
                          {subject.units ?? 0}
                        </td>
                        <td className="border border-[#2f2f2f] px-3 py-2 text-[#2f2f2f]">
                          {subject.type || "—"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ))}
          </div>
          )}
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