import { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  BookOpen,
  CalendarDays,
  CheckCircle2,
  Clock3,
  DoorOpen,
  Loader2,
  Plus,
  RefreshCw,
  UserRound,
} from "lucide-react";
import { curriculumService } from "../../api/services/curriculumService";
import TimeField, { isHalfHourTime } from "./TimeField";

const EMPTY_FORM = {
  schoolYear: "",
  curriculum: "",
  program: "",
  yearLevel: "",
  section: "",
  course: "",
  faculty: "",
  type: "",
  day: "",
  day2: "",
  startTime: "",
  endTime: "",
  startTime2: "",
  endTime2: "",
  room: "",
};

const SCHOOL_YEARS = ["2024-2025", "2025-2026", "2026-2027"];
const YEAR_LEVELS = ["1st Year", "2nd Year", "3rd Year", "4th Year", "5th Year"];
const SECTION_OPTIONS = ["Section 1", "Section 2", "Section 3", "Section 4"];
const SCHEDULE_TYPES = ["Lecture", "Laboratory", "Lec/Lab"];

const normalizeText = (value) => String(value ?? "").replace(/\s+/g, " ").trim();
const formatTimeLabel = (time) => {
  if (!time) return "";
  const [hours, minutes] = time.split(":").map(Number);
  if (!Number.isInteger(hours) || !Number.isInteger(minutes)) return time;
  const period = hours < 12 ? "AM" : "PM";
  return `${hours % 12 || 12}:${String(minutes).padStart(2, "0")} ${period}`;
};
const normalizeProgram = (value) => normalizeText(value).replace(/^program\s+/i, "").toUpperCase();
const normalizeFacultyProgram = (value) => normalizeText(value).replace(/\s*\([^)]*\)/g, "").trim().toUpperCase();
const parseProgramList = (value) => String(value ?? "")
  .split(/[\n,]+/)
  .map((part) => normalizeFacultyProgram(part))
  .filter(Boolean);

const SelectField = ({ label, name, options, valueKey = null, labelKey = null, form, errors, onChange, disabled = false, placeholder, helpText }) => (
  <div className="flex flex-col gap-1">
    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">{label}</label>
    <select
      name={name}
      value={form[name] ?? ""}
      onChange={onChange}
      disabled={disabled}
      className={`px-3 py-2.5 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-pup-maroon/20 focus:border-pup-maroon transition bg-white ${
        errors[name] ? "border-red-400 bg-red-50" : "border-gray-200"
      }`}
    >
      <option value="">{placeholder || `Select ${label}`}</option>
      {options.map((option) => {
        const optionValue = valueKey ? option[valueKey] : option;
        const labelText = labelKey
          ? Array.isArray(labelKey)
            ? labelKey.map((key) => option[key]).filter(Boolean).join(" – ")
            : option[labelKey]
          : option;

        return (
          <option key={String(optionValue ?? labelText)} value={optionValue ?? ""}>
            {labelText}
          </option>
        );
      })}
    </select>
    {errors[name] && <p className="text-xs text-red-500">{errors[name]}</p>}
    {helpText && <p className="text-xs text-red-500" role="alert">{helpText}</p>}
  </div>
);

const InputField = ({ label, name, type = "text", form, errors, onChange, placeholder = "", step = undefined }) => (
  <div className="flex flex-col gap-1">
    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">{label}</label>
    <input
      type={type}
      name={name}
      value={form[name] ?? ""}
      onChange={onChange}
      placeholder={placeholder}
      step={step}
      className={`px-3 py-2.5 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-pup-maroon/20 focus:border-pup-maroon transition ${
        errors[name] ? "border-red-400 bg-red-50" : "border-gray-200"
      }`}
    />
    {errors[name] && <p className="text-xs text-red-500">{errors[name]}</p>}
  </div>
);

const RoomField = ({ form, errors, rooms, onChange, roomsLoading, roomsError }) => {
  const roomGroups = useMemo(() => {
    const groups = {};
    rooms.forEach((room) => {
      const floor = normalizeText(room.floor) || "Other";
      if (!groups[floor]) groups[floor] = [];
      groups[floor].push(room);
    });
    return Object.entries(groups).sort(([a], [b]) => {
      const order = ["Basement", "First Floor", "Second Floor", "Court"];
      return (order.indexOf(a) === -1 ? 99 : order.indexOf(a)) - (order.indexOf(b) === -1 ? 99 : order.indexOf(b));
    });
  }, [rooms]);

  return (
    <div className="flex flex-col gap-1">
      <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Room</label>
      <select
        name="room"
        value={form.room ?? ""}
        onChange={onChange}
        disabled={roomsLoading || Boolean(roomsError) || rooms.length === 0}
        className={`px-3 py-2.5 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-pup-maroon/20 focus:border-pup-maroon transition bg-white ${
          errors.room ? "border-red-400 bg-red-50" : "border-gray-200"
        }`}
      >
        <option value="">{roomsLoading ? "Loading rooms..." : roomsError ? "Rooms unavailable" : rooms.length ? "Select Room" : "No rooms available"}</option>
        {roomGroups.map(([floor, groupedRooms]) => (
          <optgroup key={floor} label={floor}>
            {groupedRooms.map((room) => (
              <option key={room.id ?? room.code} value={String(room.id ?? room.code)}>
                {room.code} {room.name ? `- ${room.name}` : ""}
              </option>
            ))}
          </optgroup>
        ))}
      </select>
      {errors.room && <p className="text-xs text-red-500">{errors.room}</p>}
      {roomsError && <p className="text-xs text-red-500" role="alert">{roomsError}</p>}
    </div>
  );
};

const ScheduleForm = ({
  subjects, faculty, facultyLoading, facultyError, rooms, roomsLoading, roomsError, days,
  onCheckConflicts, onAddSchedule, loading, conflictResult, onClearConflict,
}) => {
  const [form, setForm] = useState(EMPTY_FORM);
  const [errors, setErrors] = useState({});
  const [checking, setChecking] = useState(false);
  const [curricula, setCurricula] = useState([]);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [pendingSchedule, setPendingSchedule] = useState(null);

  useEffect(() => {
    let active = true;
    const fetchCurricula = async () => {
      try {
        const res = await curriculumService.getAll();
        const data = res?.data ?? res ?? [];
        if (active) {
          setCurricula(Array.isArray(data) ? data : []);
        }
      } catch (err) {
        console.error("Failed to load curriculum options:", err);
        if (active) setCurricula([]);
      }
    };

    fetchCurricula();
    return () => { active = false; };
  }, []);

  const programOptions = useMemo(() => {
    const options = new Set();
    curricula.forEach((curriculum) => {
      if (curriculum?.program) options.add(curriculum.program);
    });
    return [...options];
  }, [curricula]);

  const yearLevelOptions = useMemo(() => {
    if (!form.program) return YEAR_LEVELS;
    const matching = curricula.filter((curriculum) => normalizeProgram(curriculum?.program) === normalizeProgram(form.program));
    const yearLevels = matching.flatMap((curriculum) => {
      if (Array.isArray(curriculum?.yearLevels) && curriculum.yearLevels.length) {
        return curriculum.yearLevels;
      }
      return String(curriculum?.yearLevel ?? "").split(/\s*(?:,|&|\band\b)\s*/i);
    }).filter(Boolean);
    if (yearLevels.length) return [...new Set(yearLevels)];
    return YEAR_LEVELS;
  }, [curricula, form.program]);

  const selectedCurriculum = useMemo(
    () => curricula.find((curriculum) => String(curriculum.id) === String(form.curriculum)) ?? null,
    [curricula, form.curriculum]
  );

  const filteredCourses = useMemo(() => {
    if (!form.program || !form.yearLevel) return [];
    return subjects
      .filter((subject) => {
        const subjectProgram = subject.course ?? subject.program ?? subject.department;
        const matchesProgram = normalizeProgram(subjectProgram) === normalizeProgram(form.program);
        const matchesYearLevel = normalizeText(subject.yearLevel).toLowerCase()
          === normalizeText(form.yearLevel).toLowerCase();
        const matchesSemester = !selectedCurriculum?.semester
          || normalizeText(subject.semester).toLowerCase()
            === normalizeText(selectedCurriculum.semester).toLowerCase();
        const isActive = !subject.status || String(subject.status).toLowerCase() === "active";
        return matchesProgram && matchesYearLevel && matchesSemester && isActive;
      })
      .map((subject) => ({
        ...subject,
        name: subject.name || subject.description || subject.code,
      }));
  }, [subjects, form.program, form.yearLevel, selectedCurriculum]);

  const filteredFaculty = useMemo(() => {
    if (!form.program) return faculty;
    return faculty.filter((member) => {
      const type = normalizeText(member?.type ?? "");
      const isGEED = type === "GEED (Full-time)" || type === "GEED (Part-time)" || type === "GEED";
      const assignedPrograms = Array.isArray(member?.programs)
        ? member.programs.flatMap((program) => parseProgramList(program))
        : parseProgramList(member?.department ?? "");
      const matchesProgram = assignedPrograms.includes(normalizeProgram(form.program));
      return isGEED || matchesProgram;
    });
  }, [faculty, form.program]);

  const buildPayload = () => {
    const selectedCourse = subjects.find((subject) => String(subject?.id ?? subject?.code) === String(form.course)) ??
      subjects.find((subject) => normalizeText(subject?.code) === normalizeText(form.course)) ??
      null;
    const selectedFaculty = faculty.find((member) => String(member?.id ?? member?.name) === String(form.faculty)) ??
      faculty.find((member) => normalizeText(member?.name) === normalizeText(form.faculty)) ??
      null;
    const selectedRoom = rooms.find((room) => String(room?.id ?? room?.code) === String(form.room)) ??
      rooms.find((room) => normalizeText(room?.code) === normalizeText(form.room)) ??
      null;
    return {
      schoolYear: form.schoolYear,
      curriculumId: form.curriculum,
      curriculumName: selectedCurriculum?.curriculum ?? selectedCurriculum?.name ?? "",
      program: form.program,
      yearLevel: form.yearLevel,
      section: form.section,
      subjectCode: selectedCourse?.code ?? form.course,
      subjectName: selectedCourse?.name ?? selectedCourse?.code ?? form.course,
      facultyName: selectedFaculty?.name ?? form.faculty,
      roomName: selectedRoom?.name ?? selectedRoom?.code ?? form.room,
      roomId: selectedRoom?.id ?? null,
      day: form.day,
      day2: form.day2,
      startTime: form.startTime,
      endTime: form.endTime,
      startTime2: form.startTime2,
      endTime2: form.endTime2,
      type: form.type,
      courseCode: form.program,
      semester: selectedCurriculum?.semester ?? "1st Semester",
      academicYear: form.schoolYear || selectedCurriculum?.academicYear || "2025-2026",
      status: "Active",
    };
  };

  const validate = () => {
    const nextErrors = {};

    if (!form.schoolYear) nextErrors.schoolYear = "Required";
    if (!form.curriculum) nextErrors.curriculum = "Required";
    if (!form.program) nextErrors.program = "Required";
    if (!form.yearLevel) nextErrors.yearLevel = "Required";
    if (!form.section) nextErrors.section = "Required";
    if (!form.course) nextErrors.course = "Required";
    if (!form.faculty) nextErrors.faculty = "Required";
    if (!form.type) nextErrors.type = "Required";
    if (!form.day) nextErrors.day = "Required";
    if (!form.startTime) nextErrors.startTime = "Required";
    if (!form.endTime) nextErrors.endTime = "Required";
    if (form.startTime && !isHalfHourTime(form.startTime)) {
      nextErrors.startTime = "Choose a time in 30-minute increments.";
    }
    if (form.endTime && !isHalfHourTime(form.endTime)) {
      nextErrors.endTime = "Choose a time in 30-minute increments.";
    }
    if (!form.room) nextErrors.room = "Required";

    if (form.startTime && form.endTime && form.startTime >= form.endTime) {
      nextErrors.endTime = "End time must be after start time.";
    }

    if (form.type === "Lec/Lab") {
      if (!form.day2) nextErrors.day2 = "Required";
      if (form.day2 && form.day2 === form.day) nextErrors.day2 = "Second day must be different from the first day.";
      if (!form.startTime2) nextErrors.startTime2 = "Required";
      if (!form.endTime2) nextErrors.endTime2 = "Required";
      if (form.startTime2 && !isHalfHourTime(form.startTime2)) {
        nextErrors.startTime2 = "Choose a time in 30-minute increments.";
      }
      if (form.endTime2 && !isHalfHourTime(form.endTime2)) {
        nextErrors.endTime2 = "Choose a time in 30-minute increments.";
      }
      if (form.startTime2 && form.endTime2 && form.startTime2 >= form.endTime2) {
        nextErrors.endTime2 = "Second end time must be after the second start time.";
      }
    }

    return nextErrors;
  };

  const handleChange = (event) => {
    const { name, value } = event.target;

    setForm((prev) => {
      const next = { ...prev, [name]: value };

      if (name === "curriculum") {
        const selectedCurriculum = curricula.find((curriculum) => String(curriculum.id) === String(value));
        if (selectedCurriculum) {
          next.program = "";
          const years = Array.isArray(selectedCurriculum.yearLevels) && selectedCurriculum.yearLevels.length
            ? selectedCurriculum.yearLevels
            : String(selectedCurriculum.yearLevel ?? "").split(/\s*(?:,|&|\band\b)\s*/i).filter(Boolean);
          next.yearLevel = years.length === 1 ? years[0] : "";
          next.program = selectedCurriculum.program ?? prev.program;
          next.schoolYear = selectedCurriculum.academicYear ?? prev.schoolYear;
        }
      }

      if (["curriculum", "program", "yearLevel"].includes(name)) {
        next.course = "";
      }

      if (name === "type" && value !== "Lec/Lab") {
        next.day2 = "";
        next.startTime2 = "";
        next.endTime2 = "";
      }

      return next;
    });

    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: null }));
    }

    if (name === "day2" || name === "startTime2" || name === "endTime2") {
      setErrors((prev) => ({ ...prev, [name]: null }));
    }

    onClearConflict();
  };

  const handleCheckConflicts = async () => {
    const nextErrors = validate();
    if (Object.keys(nextErrors).length) {
      setErrors(nextErrors);
      return;
    }

    setChecking(true);
    try {
      await onCheckConflicts(buildPayload());
    } finally {
      setChecking(false);
    }
  };

  const handleSubmit = async () => {
    const nextErrors = validate();
    if (Object.keys(nextErrors).length) {
      setErrors(nextErrors);
      return;
    }

    if (!conflictResult) {
      setErrors({ general: "Please check for conflicts before adding the schedule." });
      return;
    }

    if (conflictResult.hasConflict) {
      setErrors({ general: "Resolve conflicts before adding the schedule." });
      return;
    }

    setPendingSchedule(buildPayload());
    setConfirmOpen(true);
  };

  const handleConfirmAdd = async () => {
    if (!pendingSchedule) return;

    const success = await onAddSchedule(pendingSchedule);
    if (success) {
      setForm(EMPTY_FORM);
      setErrors({});
      setConfirmOpen(false);
      setPendingSchedule(null);
    }
  };

  const handleReset = () => {
    setForm(EMPTY_FORM);
    setErrors({});
    setPendingSchedule(null);
    setConfirmOpen(false);
    onClearConflict();
  };

  return (
    <div className="rounded-2xl border border-white/40 bg-white/70 shadow-[0_10px_25px_rgba(15,23,42,0.05)] backdrop-blur-[1px]">
      <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
        <div>
          <h2 className="text-base font-bold text-gray-800">Create New Schedule</h2>
          <p className="text-xs text-gray-400 mt-0.5">Assign faculty, course, room, and time for a section.</p>
        </div>
        <button
          onClick={handleReset}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-gray-500 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
        >
          <RefreshCw size={13} />
          Reset
        </button>
      </div>

      <div className="px-6 py-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <SelectField
          label="School Year"
          name="schoolYear"
          options={SCHOOL_YEARS}
          form={form}
          errors={errors}
          onChange={handleChange}
          placeholder="Select School Year"
        />

        <SelectField
          label="Curriculum"
          name="curriculum"
          options={curricula}
          valueKey="id"
          labelKey={["academicYear", "program", "yearLevel"]}
          form={form}
          errors={errors}
          onChange={handleChange}
          placeholder="Select Curriculum"
        />

        <SelectField
          label="Year Level"
          name="yearLevel"
          options={yearLevelOptions}
          form={form}
          errors={errors}
          onChange={handleChange}
          placeholder="Select Year Level"
        />

        <SelectField
          label="Section"
          name="section"
          options={SECTION_OPTIONS}
          form={form}
          errors={errors}
          onChange={handleChange}
          placeholder="Select Section"
        />

        <SelectField
          label="Program"
          name="program"
          options={programOptions}
          form={form}
          errors={errors}
          onChange={handleChange}
          placeholder={form.section ? "Select Program" : "Select a section first"}
          disabled={!form.section}
        />

        <SelectField
          label="Course"
          name="course"
          options={filteredCourses}
          valueKey="id"
          labelKey={["code", "name"]}
          form={form}
          errors={errors}
          onChange={handleChange}
          placeholder={filteredCourses.length ? "Select Course" : "No matching courses"}
          disabled={filteredCourses.length === 0}
        />

        <SelectField
          label="Faculty"
          name="faculty"
          options={filteredFaculty}
          valueKey="id"
          labelKey="name"
          form={form}
          errors={errors}
          onChange={handleChange}
          placeholder={facultyLoading ? "Loading faculty..." : facultyError ? "Faculty unavailable" : filteredFaculty.length ? "Select Faculty" : "No faculty available"}
          disabled={facultyLoading || Boolean(facultyError) || filteredFaculty.length === 0}
          helpText={facultyError}
        />

        <SelectField
          label="Type"
          name="type"
          options={SCHEDULE_TYPES}
          form={form}
          errors={errors}
          onChange={handleChange}
          placeholder="Select Type"
        />

        <SelectField
          label="Day"
          name="day"
          options={days}
          form={form}
          errors={errors}
          onChange={handleChange}
          placeholder="Select Day"
        />

        <TimeField label="Start Time" name="startTime" value={form.startTime} error={errors.startTime} onChange={handleChange} />
        <TimeField label="End Time" name="endTime" value={form.endTime} error={errors.endTime} onChange={handleChange} />

        {form.type === "Lec/Lab" && (
          <>
            <div className="lg:col-start-1">
              <TimeField label="Second Start Time" name="startTime2" value={form.startTime2} error={errors.startTime2} onChange={handleChange} />
            </div>
            <TimeField label="Second End Time" name="endTime2" value={form.endTime2} error={errors.endTime2} onChange={handleChange} />
            <SelectField
              label="Second Day"
              name="day2"
              options={days}
              form={form}
              errors={errors}
              onChange={handleChange}
              placeholder="Select Second Day"
            />
          </>
        )}

        <div className="sm:col-span-2 lg:col-span-3">
          <RoomField
            form={form}
            errors={errors}
            rooms={rooms}
            roomsLoading={roomsLoading}
            roomsError={roomsError}
            onChange={handleChange}
          />
        </div>
      </div>

      {errors.general && (
        <div className="mx-6 mb-4 px-4 py-3 bg-red-50 border border-red-200 rounded-xl flex items-center gap-2">
          <AlertTriangle size={15} className="text-red-500 flex-shrink-0" />
          <p className="text-sm text-red-600">{errors.general}</p>
        </div>
      )}

      <ConflictChecker result={conflictResult} />

      <div className="flex items-center gap-3 px-6 py-4 border-t border-gray-100">
        <button
          onClick={handleCheckConflicts}
          disabled={checking}
          className="flex items-center gap-2 px-4 py-2.5 bg-pup-maroon text-white text-sm font-medium rounded-lg hover:bg-pup-maroon-dark transition-colors disabled:opacity-60"
        >
          {checking ? <Loader2 size={15} className="animate-spin" /> : <RefreshCw size={15} />}
          {checking ? "Checking..." : "Check Availability & Conflicts"}
        </button>
        <button
          onClick={handleSubmit}
          disabled={loading || !conflictResult || conflictResult.hasConflict}
          className="flex items-center gap-2 px-4 py-2.5 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? <Loader2 size={15} className="animate-spin" /> : <Plus size={15} />}
          {loading ? "Adding..." : "Assign"}
        </button>
        <button
          onClick={handleReset}
          className="px-4 py-2.5 text-sm border border-gray-200 text-gray-600 rounded-lg hover:bg-gray-50 transition-colors"
        >
          Cancel
        </button>
      </div>

      {confirmOpen && pendingSchedule && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-white/10 p-4 backdrop-blur-[2px]"
          role="presentation"
        >
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="schedule-confirm-title"
            className="w-full max-w-lg overflow-hidden rounded-2xl border border-white/70 bg-white shadow-[0_24px_70px_rgba(15,23,42,0.18)]"
          >
            <header className="flex items-start gap-3 border-b border-slate-100 px-6 py-5">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-pup-maroon/10 text-pup-maroon">
                <CalendarDays size={20} />
              </div>
              <div>
                <h2 id="schedule-confirm-title" className="text-base font-bold text-slate-800">
                  Confirm schedule
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  Review the assignment details before adding it.
                </p>
              </div>
            </header>

            <div className="max-h-[65vh] space-y-4 overflow-y-auto px-6 py-5">
              <div className="rounded-xl border border-pup-maroon/15 bg-pup-maroon/[0.04] p-4">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded-md bg-pup-maroon px-2 py-1 text-xs font-bold text-white">
                    {pendingSchedule.subjectCode}
                  </span>
                  <span className="text-xs font-medium text-slate-500">
                    {pendingSchedule.type}
                  </span>
                </div>
                <p className="mt-2 text-base font-semibold text-slate-800">
                  {pendingSchedule.subjectName}
                </p>
                <p className="mt-1 text-sm text-slate-600">
                  {pendingSchedule.program} <span className="text-slate-300">/</span>{" "}
                  {pendingSchedule.yearLevel} <span className="text-slate-300">/</span>{" "}
                  {pendingSchedule.section}
                </p>
              </div>

              <div>
                <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Meeting time{pendingSchedule.day2 ? "s" : ""}
                </h3>
                <div className="space-y-2">
                  {[
                    {
                      day: pendingSchedule.day,
                      start: pendingSchedule.startTime,
                      end: pendingSchedule.endTime,
                    },
                    ...(pendingSchedule.day2
                      ? [{
                          day: pendingSchedule.day2,
                          start: pendingSchedule.startTime2,
                          end: pendingSchedule.endTime2,
                        }]
                      : []),
                  ].map((meeting, index) => (
                    <div
                      key={`${meeting.day}-${meeting.start}-${index}`}
                      className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3"
                    >
                      <div className="flex items-center gap-2.5">
                        <CalendarDays size={16} className="text-pup-maroon" />
                        <span className="text-sm font-semibold text-slate-700">{meeting.day}</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-sm text-slate-600">
                        <Clock3 size={15} className="text-slate-400" />
                        <span>{formatTimeLabel(meeting.start)} – {formatTimeLabel(meeting.end)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-xl bg-slate-50 p-3.5">
                  <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                    <UserRound size={15} /> Faculty
                  </div>
                  <p className="mt-2 text-sm font-medium text-slate-800">{pendingSchedule.facultyName}</p>
                </div>
                <div className="rounded-xl bg-slate-50 p-3.5">
                  <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                    <DoorOpen size={15} /> Room
                  </div>
                  <p className="mt-2 text-sm font-medium text-slate-800">{pendingSchedule.roomName}</p>
                </div>
              </div>

              <div className="flex items-start gap-2.5 rounded-xl border border-slate-100 px-3.5 py-3 text-sm text-slate-600">
                <BookOpen size={16} className="mt-0.5 shrink-0 text-slate-400" />
                <div>
                  <p className="font-medium text-slate-700">
                    {pendingSchedule.curriculumName || "Curriculum"}
                  </p>
                  <p className="mt-0.5 text-xs text-slate-500">
                    {pendingSchedule.semester} · School Year {pendingSchedule.schoolYear}
                  </p>
                </div>
              </div>
            </div>

            <footer className="flex justify-end gap-3 border-t border-slate-100 bg-slate-50/70 px-6 py-4">
              <button
                type="button"
                onClick={() => {
                  setConfirmOpen(false);
                  setPendingSchedule(null);
                }}
                disabled={loading}
                className="rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-600 transition hover:bg-slate-50 disabled:opacity-60"
              >
                Back to form
              </button>
              <button
                type="button"
                onClick={handleConfirmAdd}
                disabled={loading}
                className="inline-flex items-center gap-2 rounded-lg bg-pup-maroon px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-pup-maroon-dark disabled:cursor-wait disabled:opacity-60"
              >
                {loading && <Loader2 size={15} className="animate-spin" />}
                {loading ? "Adding schedule..." : "Confirm and add"}
              </button>
            </footer>
          </section>
        </div>
      )}
    </div>
  );
};

const ConflictChecker = ({ result }) => {
  if (!result) return null;

  if (!result.hasConflict) {
    return (
      <div className="mx-6 mb-4 px-4 py-3 bg-green-50 border border-green-200 rounded-xl flex items-center gap-3">
        <CheckCircle2 size={18} className="text-green-500 flex-shrink-0" />
        <div>
          <p className="text-sm font-semibold text-green-700">No Conflicts Found</p>
          <p className="text-xs text-green-600 mt-0.5">The selected faculty, room, and section are available at this time.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-6 mb-4 space-y-3">
      <div className="px-4 py-3 bg-red-50 border border-red-200 rounded-xl flex items-center gap-3">
        <AlertTriangle size={18} className="text-red-500 flex-shrink-0" />
        <div>
          <p className="text-sm font-semibold text-red-700">
            {result.conflicts.length} Conflict{result.conflicts.length > 1 ? "s" : ""} Detected
          </p>
          <p className="text-xs text-red-600 mt-0.5">The following schedules conflict with the selected faculty, room, or section.</p>
        </div>
      </div>

      {result.conflicts.map((conflict) => (
        <div key={conflict.id ?? `${conflict.day}-${conflict.startTime}-${conflict.room}`} className="px-4 py-3 bg-white border border-red-100 rounded-xl flex items-center justify-between">
          <div>
            <span className="px-2 py-0.5 bg-pup-maroon/10 text-pup-maroon text-xs font-bold rounded">{conflict.subjectCode}</span>
            <p className="text-xs text-gray-500 mt-1">{conflict.faculty}</p>
          </div>
          <div className="text-right">
            <p className="text-xs font-semibold text-gray-700">{conflict.startTime} – {conflict.endTime}</p>
            <p className="text-xs text-gray-400">{conflict.day} • {conflict.room}</p>
          </div>
        </div>
      ))}
    </div>
  );
};

export default ScheduleForm;