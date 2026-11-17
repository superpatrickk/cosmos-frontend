import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { normalizeCurriculumYearLevels } from "../../data/curriculumStore";

const EMPTY_FORM = {
  academicYear: "",
  program: "",
  yearLevel: "1st Year",
  code: "",
  name: "",
  prerequisite: "None",
  semester: "1st Semester",
  description: "",
  type: "Lec",
  lec: 0,
  lab: 0,
  units: 1,
};

const TYPES = ["Lec", "Lab", "Lec/Lab"];
const YEAR_LEVELS = ["1st Year", "2nd Year", "3rd Year", "4th Year", "5th Year"];
const SEMESTERS = ["1st Semester", "2nd Semester", "Summer"];

const Field = ({ label, name, type = "text", options, placeholder, disabled, helpText, span = 1, form, errors, onChange }) => (
  <div className={`flex flex-col gap-1 ${span === 2 ? "col-span-2" : ""}`}>
    <label className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">
      {label}
    </label>
    {options ? (
      <div className="relative">
        <select
          name={name}
          value={form[name]}
          onChange={onChange}
          disabled={disabled}
          className={`w-full appearance-none rounded-lg border bg-white px-3 py-2.5 pr-9 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-pup-maroon/20 focus:border-pup-maroon transition ${errors[name] ? "border-red-400" : "border-gray-200"}`}
        >
          {placeholder && <option value="">{placeholder}</option>}
          {options.map((option) => {
            const value = typeof option === "string" ? option : option.value;
            const label = typeof option === "string" ? option : option.label;
            return <option key={value} value={value}>{label}</option>;
          })}
        </select>
        <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-slate-400">
          <svg viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
            <path fillRule="evenodd" d="M5.25 7.5 10 12.25 14.75 7.5H5.25Z" clipRule="evenodd" />
          </svg>
        </span>
      </div>
    ) : type === "textarea" ? (
      <textarea
        name={name}
        value={form[name]}
        onChange={onChange}
        rows={3}
        placeholder={`Enter ${label.toLowerCase()}...`}
        className={`resize-none rounded-lg border bg-white px-3 py-2.5 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-pup-maroon/20 focus:border-pup-maroon transition ${errors[name] ? "border-red-400" : "border-gray-200"}`}
      />
    ) : (
      <input
        type={type}
        name={name}
        value={form[name]}
        onChange={onChange}
        placeholder={`Enter ${label.toLowerCase()}...`}
        className={`rounded-lg border bg-white px-3 py-2.5 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-pup-maroon/20 focus:border-pup-maroon transition ${errors[name] ? "border-red-400" : "border-gray-200"}`}
      />
    )}
    {errors[name] && <p className="text-xs text-red-500">{errors[name]}</p>}
    {helpText && <p className="text-xs text-red-500">{helpText}</p>}
  </div>
);

const SubjectModal = ({
  open,
  mode,
  data,
  courses = [],
  curricula = [],
  coursesLoading = false,
  coursesError,
  curriculaLoading = false,
  curriculaError,
  onClose,
  onSubmit,
}) => {
  const [form, setForm] = useState(EMPTY_FORM);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [submitError, setSubmitError] = useState("");

  const dedupeOptions = (items) => {
    const seen = new Map();
    items.forEach((item) => {
      const value = String(item?.value ?? item ?? "").trim();
      if (!value) return;
      const label = String(item?.label ?? item ?? value).trim() || value;
      if (!seen.has(value)) {
        seen.set(value, { value, label });
      }
    });
    return [...seen.values()];
  };

  const activeCourses = Array.isArray(courses)
    ? courses.filter((course) => (course.status || "Active").toLowerCase() === "active")
    : [];

  const courseOptions = dedupeOptions([
    ...activeCourses.map((course) => {
      const value = String(course.code || course.name || "").trim();
      const label = [course.code, course.name].filter(Boolean).join(" - ") || value;
      return { value, label };
    }),
    ...(form.program ? [{ value: String(form.program).trim(), label: String(form.program).trim() }] : []),
  ]);

  const curriculumOptions = dedupeOptions(
    [
      ...(Array.isArray(curricula) ? curricula : [])
        .filter((curriculum) => curriculum?.academicYear)
        .filter((curriculum) => !form.program || String(curriculum.program || "").trim().toUpperCase() === form.program.trim().toUpperCase())
        .map((curriculum) => {
          const academicYear = String(curriculum.academicYear).trim();
          return { value: academicYear, label: academicYear };
        }),
      ...(form.academicYear ? [{ value: String(form.academicYear).trim(), label: String(form.academicYear).trim() }] : []),
    ]
  );

  useEffect(() => {
    if (open) {
      setForm(data
        ? {
            ...EMPTY_FORM,
            ...data,
            academicYear: data.academicYear || data.curriculum || "",
            program: data.program || data.course || "",
          }
        : EMPTY_FORM);
      setErrors({});
      setSubmitError("");
    }
  }, [open, data]);

  useEffect(() => {
    if (open && mode === "edit" && !form.academicYear && form.program && curricula.length > 0) {
      const selectedCurriculum = curricula.find((curriculum) => {
        const sameProgram = String(curriculum.program || "").trim().toUpperCase() === form.program.trim().toUpperCase();
        const sameSemester = String(curriculum.semester || "").trim().toUpperCase() === form.semester.trim().toUpperCase();
        const hasYearLevel = normalizeCurriculumYearLevels(curriculum)
          .some((yearLevel) => yearLevel.trim().toUpperCase() === form.yearLevel.trim().toUpperCase());
        return sameProgram && sameSemester && hasYearLevel;
      });
      if (selectedCurriculum?.academicYear) {
        setForm((prev) => prev.academicYear
          ? prev
          : { ...prev, academicYear: selectedCurriculum.academicYear });
      }
    }
  }, [open, mode, form.academicYear, form.program, form.yearLevel, form.semester, curricula]);

  if (!open) return null;

  const validate = () => {
    const e = {};
    const matchingCurriculum = curricula.some((curriculum) => {
      const sameProgram = String(curriculum.program || "").trim().toUpperCase() === form.program.trim().toUpperCase();
      const sameAcademicYear = String(curriculum.academicYear || "").trim() === form.academicYear.trim();
      const sameSemester = String(curriculum.semester || "").trim().toUpperCase() === form.semester.trim().toUpperCase();
      const hasYearLevel = normalizeCurriculumYearLevels(curriculum)
        .some((yearLevel) => yearLevel.trim().toUpperCase() === form.yearLevel.trim().toUpperCase());
      return sameProgram && sameAcademicYear && sameSemester && hasYearLevel;
    });
    if (!form.academicYear.trim() || !matchingCurriculum) {
      e.academicYear = "Select a curriculum matching the program, year level, and semester.";
    }
    if (!form.program.trim()) e.program = "Program is required.";
    if (!form.yearLevel.trim()) e.yearLevel = "Year level is required.";
    if (!form.code.trim()) e.code = "Course code is required.";
    if (!form.name.trim()) e.name = "Course name is required.";
    if (!form.semester.trim()) e.semester = "Semester is required.";
    if (!form.units || form.units < 1) e.units = "Units must be at least 1.";
    return e;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: null }));
  };

  const clampHoursToUnits = (nextState, changedField) => {
    const units = Math.max(1, Number(nextState.units || 1));
    const nextLec = Math.max(0, Number(nextState.lec || 0));
    const nextLab = Math.max(0, Number(nextState.lab || 0));

    if (nextState.type === "Lec") {
      return { ...nextState, lec: Math.min(nextLec, units), lab: 0 };
    }

    if (nextState.type === "Lab") {
      return { ...nextState, lab: Math.min(nextLab, units), lec: 0 };
    }

    let lec = nextLec;
    let lab = nextLab;

    if (lec + lab > units) {
      if (changedField === "lec") {
        lec = Math.max(0, units - lab);
      } else if (changedField === "lab") {
        lab = Math.max(0, units - lec);
      } else {
        lab = Math.max(0, units - lec);
      }
    }

    return { ...nextState, lec, lab };
  };

  const updateNumericValue = (field, delta) => {
    setForm((prev) => {
      const nextValue = Math.max(0, Number(prev[field] || 0) + delta);
      const nextState = { ...prev, [field]: nextValue };

      if (field === "lec" && prev.type === "Lec") {
        nextState.lab = 0;
      }

      if (field === "lab" && prev.type === "Lab") {
        nextState.lec = 0;
      }

      if (field === "units") {
        const units = Math.max(1, Number(nextState.units || 1));
        nextState.units = units;
        return clampHoursToUnits(nextState, field);
      }

      return clampHoursToUnits(nextState, field);
    });
  };

  const TypeSelector = ({ value, onChange }) => (
    <div className="flex flex-col gap-2">
      <label className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">Type</label>
      <div className="grid grid-cols-3 gap-2 rounded-2xl border border-slate-200 bg-slate-50 p-1.5">
        {TYPES.map((option) => {
          const active = value === option;
          return (
            <button
              key={option}
              type="button"
              onClick={() => onChange(option)}
              className={`rounded-xl px-3 py-2.5 text-sm font-semibold transition-all ${
                active
                  ? "bg-white text-pup-maroon shadow-sm ring-1 ring-pup-maroon/20"
                  : "text-slate-500 hover:bg-white/70 hover:text-slate-700"
              }`}
            >
              {option}
            </button>
          );
        })}
      </div>
    </div>
  );

  const StepperCard = ({ label, value, hint, onDecrease, onIncrease, disabled = false }) => (
    <div className={`rounded-2xl border ${disabled ? "border-slate-200 bg-slate-100/80" : "border-slate-200 bg-slate-50 shadow-sm"}`}>
      <div className="flex items-center justify-between gap-3 px-3 py-3">
        <div className="flex flex-col min-w-0">
          <span className="text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-500">{label}</span>
          {hint && <span className="text-[11px] text-slate-400">{hint}</span>}
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onDecrease}
            disabled={disabled}
            className={`flex h-9 w-9 items-center justify-center rounded-xl border text-xl font-medium transition ${
              disabled
                ? "cursor-not-allowed border-slate-200 bg-slate-100 text-slate-300"
                : "border-slate-200 bg-white text-slate-700 hover:bg-slate-100"
            }`}
          >
            −
          </button>

          <div className="min-w-[42px] text-center text-xl font-bold text-slate-800">{value}</div>

          <button
            type="button"
            onClick={onIncrease}
            disabled={disabled}
            className={`flex h-9 w-9 items-center justify-center rounded-xl border text-xl font-medium transition ${
              disabled
                ? "cursor-not-allowed border-slate-200 bg-slate-100 text-slate-300"
                : "border-slate-200 bg-white text-slate-700 hover:bg-slate-100"
            }`}
          >
            +
          </button>
        </div>
      </div>
    </div>
  );

  const handleTypeChange = (value) => {
    setForm((prev) => {
      const next = { ...prev, type: value };
      if (value === "Lec") {
        next.lab = 0;
        next.lec = Math.min(Number(next.lec || 0), Number(next.units || 1));
      }
      if (value === "Lab") {
        next.lec = 0;
        next.lab = Math.min(Number(next.lab || 0), Number(next.units || 1));
      }
      if (value === "Lec/Lab") {
        const units = Math.max(1, Number(next.units || 1));
        if (Number(next.lec || 0) + Number(next.lab || 0) > units) {
          const excess = Number(next.lec || 0) + Number(next.lab || 0) - units;
          next.lab = Math.max(0, Number(next.lab || 0) - excess);
        }
      }
      return next;
    });
  };

  const handleSubmit = async () => {
    const e = validate();
    if (Object.keys(e).length) { setErrors(e); return; }
    setLoading(true);
    setSubmitError("");
    try {
      const payload = {
        ...form,
        course: form.program,
        program: form.program,
        prerequisite: form.prerequisite?.trim() || "None",
        description: form.description?.trim() || form.name.trim(),
        type: form.type,
        lec: Number(form.lec || 0),
        lab: Number(form.lab || 0),
        units: Number(form.units || 0),
        status: "Active",
      };
      await onSubmit(payload);
    } catch (err) {
      const responseMessage = err?.response?.data?.message;
      if (responseMessage && typeof responseMessage === "object" && !Array.isArray(responseMessage)) {
        const fieldErrors = Object.fromEntries(
          Object.entries(responseMessage).filter(([, message]) => typeof message === "string")
        );
        setErrors((prev) => ({ ...prev, ...fieldErrors }));
        setSubmitError(
          Object.keys(fieldErrors).length
            ? "Please correct the highlighted fields."
            : "Failed to save subject."
        );
      } else {
        setSubmitError(
          (typeof responseMessage === "string" && responseMessage)
            || err?.message
            || "Failed to save subject."
        );
      }
    } finally { setLoading(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-white/10 backdrop-blur-[2px]">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg mx-4 max-h-[90vh] flex flex-col">

        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 flex-shrink-0">
          <div>
            <h2 className="text-base font-bold text-gray-800">
              {mode === "add" ? "Add New Subject" : "Edit Subject"}
            </h2>
            <p className="text-xs text-gray-400 mt-0.5">
              Fill in the subject details below
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        <div className="px-6 py-5 overflow-y-auto">
          {submitError && (
            <p className="mb-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {submitError}
            </p>
          )}
          <div className="grid grid-cols-2 gap-4">
                <Field
                  label="Curriculum"
                  name="academicYear"
              options={curriculumOptions}
              placeholder={
                curriculaLoading
                  ? "Loading curricula..."
                  : curriculaError
                    ? "Curricula unavailable"
                    : curriculumOptions.length
                      ? "Select curriculum"
                      : "No curriculum available"
              }
              disabled={curriculaLoading || Boolean(curriculaError) || curriculumOptions.length === 0}
              helpText={curriculaError ? "Curriculum options could not be loaded from the database." : ""}
              form={form}
              errors={errors}
              onChange={handleChange}
            />
            <Field
              label="Program"
              name="program"
              options={courseOptions}
              placeholder={coursesLoading ? "Loading programs..." : coursesError ? "Programs unavailable" : "Select program"}
              disabled={coursesLoading || Boolean(coursesError) || (!activeCourses.length && !form.program)}
              helpText={coursesError ? "Program options could not be loaded from the database." : ""}
              form={form}
              errors={errors}
              onChange={handleChange}
            />
            <Field label="Year Level" name="yearLevel" options={YEAR_LEVELS} form={form} errors={errors} onChange={handleChange} />
            <Field label="Code" name="code" form={form} errors={errors} onChange={handleChange} />
            <Field label="Course Name" name="name" span={2} form={form} errors={errors} onChange={handleChange} />
            <Field label="Semester" name="semester" options={SEMESTERS} form={form} errors={errors} onChange={handleChange} />
            <div className="col-span-2">
              <TypeSelector value={form.type} onChange={handleTypeChange} />
            </div>

            <div className="col-span-2 grid gap-3">
              {(form.type === "Lec" || form.type === "Lec/Lab") && (
                <StepperCard
                  label="Lecture Hours"
                  hint="Contact time"
                  value={form.lec}
                  onDecrease={() => updateNumericValue("lec", -1)}
                  onIncrease={() => updateNumericValue("lec", 1)}
                />
              )}

              {(form.type === "Lab" || form.type === "Lec/Lab") && (
                <StepperCard
                  label="Laboratory Hours"
                  hint="Practical time"
                  value={form.lab}
                  onDecrease={() => updateNumericValue("lab", -1)}
                  onIncrease={() => updateNumericValue("lab", 1)}
                />
              )}

              <StepperCard
                label="Units"
                hint="Max hours"
                value={form.units}
                onDecrease={() => updateNumericValue("units", -1)}
                onIncrease={() => updateNumericValue("units", 1)}
              />
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-100 flex-shrink-0">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="px-4 py-2 text-sm bg-pup-maroon text-white rounded-lg font-medium hover:bg-pup-maroon-dark transition-colors disabled:opacity-60"
          >
            {loading ? "Saving..." : mode === "add" ? "Add Subject" : "Save Changes"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default SubjectModal;