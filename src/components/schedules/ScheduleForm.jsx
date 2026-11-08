import { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  Loader2,
  Plus,
  RefreshCw,
} from "lucide-react";
import { curriculumService } from "../../api/services/curriculumService";

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
const SECTION_OPTIONS = ["Section 1", "Section 2", "Section 3"];
const SCHEDULE_TYPES = ["Lecture", "Laboratory", "Lec/Lab"];

const normalizeText = (value) => String(value ?? "").replace(/\s+/g, " ").trim();
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
  subjects, faculty, facultyLoading, facultyError, rooms, roomsLoading, roomsError, courses, days,
  onCheckConflicts, onAddSchedule, loading, conflictResult, onClearConflict,
}) => {
  const [form, setForm] = useState(EMPTY_FORM);
  const [errors, setErrors] = useState({});
  const [checking, setChecking] = useState(false);
  const [curricula, setCurricula] = useState([]);

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
    const yearLevels = matching.map((curriculum) => curriculum?.yearLevel).filter(Boolean);
    if (yearLevels.length) return [...new Set(yearLevels)];
    return YEAR_LEVELS;
  }, [curricula, form.program]);

  const filteredCourses = useMemo(() => {
    if (!form.program) return courses;
    return courses.filter((course) => {
      const department = normalizeProgram(course?.department ?? course?.program ?? "");
      return !department || department === normalizeProgram(form.program);
    });
  }, [courses, form.program]);

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
    const selectedCourse = courses.find((course) => String(course?.id ?? course?.code) === String(form.course)) ??
      courses.find((course) => normalizeText(course?.code) === normalizeText(form.course)) ??
      null;
    const selectedFaculty = faculty.find((member) => String(member?.id ?? member?.name) === String(form.faculty)) ??
      faculty.find((member) => normalizeText(member?.name) === normalizeText(form.faculty)) ??
      null;
    const selectedRoom = rooms.find((room) => String(room?.id ?? room?.code) === String(form.room)) ??
      rooms.find((room) => normalizeText(room?.code) === normalizeText(form.room)) ??
      null;
    const selectedCurriculum = curricula.find((curriculum) => String(curriculum?.id) === String(form.curriculum)) ?? null;

    return {
      schoolYear: form.schoolYear,
      curriculumId: form.curriculum,
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
      courseCode: selectedCourse?.code ?? form.course,
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
    if (!form.room) nextErrors.room = "Required";

    if (form.startTime && form.endTime && form.startTime >= form.endTime) {
      nextErrors.endTime = "End time must be after start time.";
    }

    if (form.type === "Lec/Lab") {
      if (!form.day2) nextErrors.day2 = "Required";
      if (!form.startTime2) nextErrors.startTime2 = "Required";
      if (!form.endTime2) nextErrors.endTime2 = "Required";
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
          next.program = selectedCurriculum.program ?? prev.program;
          next.yearLevel = selectedCurriculum.yearLevel ?? prev.yearLevel;
          next.schoolYear = selectedCurriculum.academicYear ?? prev.schoolYear;
        }
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

    const success = await onAddSchedule(buildPayload());
    if (success) {
      setForm(EMPTY_FORM);
      setErrors({});
    }
  };

  const handleReset = () => {
    setForm(EMPTY_FORM);
    setErrors({});
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
          label="Program"
          name="program"
          options={programOptions}
          form={form}
          errors={errors}
          onChange={handleChange}
          placeholder="Select Program"
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

        <InputField label="Start Time" name="startTime" type="time" form={form} errors={errors} onChange={handleChange} step={1800} />
        <InputField label="End Time" name="endTime" type="time" form={form} errors={errors} onChange={handleChange} step={1800} />

        {form.type === "Lec/Lab" && (
          <>
            <SelectField
              label="Second Day"
              name="day2"
              options={days}
              form={form}
              errors={errors}
              onChange={handleChange}
              placeholder="Select Second Day"
            />
            <InputField label="Second Start Time" name="startTime2" type="time" form={form} errors={errors} onChange={handleChange} step={1800} />
            <InputField label="Second End Time" name="endTime2" type="time" form={form} errors={errors} onChange={handleChange} step={1800} />
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
          <p className="text-xs text-green-600 mt-0.5">The selected room and time slot are available.</p>
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
          <p className="text-xs text-red-600 mt-0.5">The following schedules overlap with the selected room and time slot.</p>
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