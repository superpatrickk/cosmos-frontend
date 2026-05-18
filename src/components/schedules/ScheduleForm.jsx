import { useState, useEffect } from "react";
import {
  AlertTriangle, CheckCircle2, Loader2,
  Plus, RefreshCw,
} from "lucide-react";

const EMPTY_FORM = {
  subjectCode: "",
  faculty: "",
  room: "",
  day: "",
  startTime: "",
  endTime: "",
  course: "",
  section: "",
  semester: "1st Semester",
  academicYear: "2025-2026",
};

const SEMESTERS     = ["1st Semester", "2nd Semester", "Summer"];
const ACADEMIC_YEARS = ["2024-2025", "2025-2026", "2026-2027"];

const ScheduleForm = ({
  subjects, faculty, rooms, courses, days,
  onCheckConflicts, onAddSchedule,
  loading, conflictResult, onClearConflict,
}) => {
  const [form, setForm]           = useState(EMPTY_FORM);
  const [errors, setErrors]       = useState({});
  const [checking, setChecking]   = useState(false);

  const validate = () => {
    const e = {};
    if (!form.subjectCode) e.subjectCode = "Required";
    if (!form.faculty)     e.faculty     = "Required";
    if (!form.room)        e.room        = "Required";
    if (!form.day)         e.day         = "Required";
    if (!form.startTime)   e.startTime   = "Required";
    if (!form.endTime)     e.endTime     = "Required";
    if (!form.course)      e.course      = "Required";
    if (!form.section.trim()) e.section  = "Required";
    if (form.startTime && form.endTime && form.startTime >= form.endTime)
      e.endTime = "End time must be after start time.";
    return e;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: null }));
    onClearConflict();
  };

  const handleCheckConflicts = async () => {
    const e = validate();
    if (Object.keys(e).length) { setErrors(e); return; }
    setChecking(true);
    await onCheckConflicts(form);
    setChecking(false);
  };

  const handleSubmit = async () => {
    const e = validate();
    if (Object.keys(e).length) { setErrors(e); return; }
    if (!conflictResult) {
      setErrors({ general: "Please check for conflicts before adding the schedule." });
      return;
    }
    if (conflictResult.hasConflict) {
      setErrors({ general: "Resolve conflicts before adding the schedule." });
      return;
    }
    const success = await onAddSchedule(form);
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

  const SelectField = ({ label, name, options, valueKey = null, labelKey = null }) => (
    <div className="flex flex-col gap-1">
      <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
        {label}
      </label>
      <select
        name={name}
        value={form[name]}
        onChange={handleChange}
        className={`px-3 py-2.5 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-pup-maroon/20 focus:border-pup-maroon transition bg-white ${
          errors[name] ? "border-red-400 bg-red-50" : "border-gray-200"
        }`}
      >
        <option value="">Select {label}</option>
        {options.map((o) => (
          <option key={valueKey ? o[valueKey] : o} value={valueKey ? o[valueKey] : o}>
            {labelKey
              ? (Array.isArray(labelKey)
                  ? labelKey.map((k) => o[k]).join(" – ")
                  : o[labelKey])
              : o}
          </option>
        ))}
      </select>
      {errors[name] && (
        <p className="text-xs text-red-500">{errors[name]}</p>
      )}
    </div>
  );

  const InputField = ({ label, name, type = "text" }) => (
    <div className="flex flex-col gap-1">
      <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
        {label}
      </label>
      <input
        type={type}
        name={name}
        value={form[name]}
        onChange={handleChange}
        placeholder={`e.g. ${name === "section" ? "A, B, C" : ""}`}
        step={type === "time" ? 1800 : undefined}
        className={`px-3 py-2.5 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-pup-maroon/20 focus:border-pup-maroon transition ${
          errors[name] ? "border-red-400 bg-red-50" : "border-gray-200"
        }`}
      />
      {errors[name] && (
        <p className="text-xs text-red-500">{errors[name]}</p>
      )}
    </div>
  );

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100">

      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
        <div>
          <h2 className="text-base font-bold text-gray-800">Create New Schedule</h2>
          <p className="text-xs text-gray-400 mt-0.5">
            Fill in all fields and check conflicts before saving
          </p>
        </div>
        <button
          onClick={handleReset}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-gray-500 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
        >
          <RefreshCw size={13} />
          Reset
        </button>
      </div>

      {/* Form Grid */}
      <div className="px-6 py-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <SelectField
          label="Subject"
          name="subjectCode"
          options={subjects}
          valueKey="code"
          labelKey={["code", "name"]}
        />
        <SelectField
          label="Faculty"
          name="faculty"
          options={faculty}
          valueKey="name"
          labelKey="name"
        />
        <SelectField
          label="Room"
          name="room"
          options={rooms}
          valueKey="id"
          labelKey="name"
        />
        <SelectField
          label="Day"
          name="day"
          options={days}
        />
        <InputField label="Start Time" name="startTime" type="time" />
        <InputField label="End Time"   name="endTime"   type="time" />
        <SelectField
          label="Course"
          name="course"
          options={courses}
          valueKey="code"
          labelKey="code"
        />
        <InputField label="Section" name="section" />
        <SelectField
          label="Semester"
          name="semester"
          options={SEMESTERS}
        />
      </div>

      {/* General Error */}
      {errors.general && (
        <div className="mx-6 mb-4 px-4 py-3 bg-red-50 border border-red-200 rounded-xl flex items-center gap-2">
          <AlertTriangle size={15} className="text-red-500 flex-shrink-0" />
          <p className="text-sm text-red-600">{errors.general}</p>
        </div>
      )}

      {/* Conflict Result Panel */}
      <ConflictChecker result={conflictResult} />

      {/* Action Buttons */}
      <div className="flex items-center gap-3 px-6 py-4 border-t border-gray-100">
        <button
          onClick={handleCheckConflicts}
          disabled={checking}
          className="flex items-center gap-2 px-4 py-2.5 bg-pup-maroon text-white text-sm font-medium rounded-lg hover:bg-pup-maroon-dark transition-colors disabled:opacity-60"
        >
          {checking
            ? <Loader2 size={15} className="animate-spin" />
            : <RefreshCw size={15} />
          }
          {checking ? "Checking..." : "Check Availability & Conflicts"}
        </button>
        <button
          onClick={handleSubmit}
          disabled={loading || !conflictResult || conflictResult.hasConflict}
          className="flex items-center gap-2 px-4 py-2.5 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading
            ? <Loader2 size={15} className="animate-spin" />
            : <Plus size={15} />
          }
          {loading ? "Adding..." : "Add Schedule"}
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

// ─── Inline Conflict Checker Component ───────────────────────────────────────
const ConflictChecker = ({ result }) => {
  if (!result) return null;

  if (!result.hasConflict) {
    return (
      <div className="mx-6 mb-4 px-4 py-3 bg-green-50 border border-green-200 rounded-xl flex items-center gap-3">
        <CheckCircle2 size={18} className="text-green-500 flex-shrink-0" />
        <div>
          <p className="text-sm font-semibold text-green-700">No Conflicts Found</p>
          <p className="text-xs text-green-600 mt-0.5">
            The room and time slot are available. You can proceed to add the schedule.
          </p>
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
          <p className="text-xs text-red-600 mt-0.5">
            The following schedules overlap with your selected room and time slot.
          </p>
        </div>
      </div>

      {result.conflicts.map((c) => (
        <div
          key={c.id}
          className="px-4 py-3 bg-white border border-red-100 rounded-xl flex items-center justify-between"
        >
          <div>
            <span className="px-2 py-0.5 bg-pup-maroon/10 text-pup-maroon text-xs font-bold rounded">
              {c.subjectCode}
            </span>
            <p className="text-xs text-gray-500 mt-1">{c.faculty}</p>
          </div>
          <div className="text-right">
            <p className="text-xs font-semibold text-gray-700">
              {c.startTime} – {c.endTime}
            </p>
            <p className="text-xs text-gray-400">{c.day} • {c.room}</p>
          </div>
        </div>
      ))}
    </div>
  );
};

export default ScheduleForm;