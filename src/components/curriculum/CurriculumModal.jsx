import { useState, useEffect } from "react";
import {
  AlertCircle,
  X,
} from "lucide-react";
import { courseService } from "../../api/services/courseService";

const YEARS = ["1st Year", "2nd Year", "3rd Year", "4th Year"];
const SEMESTERS = ["1st Semester", "2nd Semester", "Summer"];
const parseYearLevels = (values) => {
  const source = Array.isArray(values) ? values : String(values ?? "").split(/\s*(?:,|&|\band\b)\s*/i);
  return YEARS.filter((year) => source.some((value) => String(value).trim().toLowerCase() === year.toLowerCase()));
};
const EMPTY_FORM = {
  program: "",
  yearLevels: [],
  academicYear: "",
  semester: "1st Semester",
  description: "",
  status: "Active",
  subjects: [],
};

const cloneForm = (form = {}) => ({
  ...EMPTY_FORM,
  ...form,
  yearLevels: parseYearLevels(form?.yearLevels?.length ? form.yearLevels : form?.yearLevel),
  description: form?.description ?? "",
  subjects: Array.isArray(form?.subjects) ? form.subjects : [],
});

const CurriculumModal = ({ open, mode, data, onClose, onSubmit }) => {
  if (!open) return null;

  return (
    <CurriculumModalContent
      key={`${mode}-${data?.id ?? "new"}`}
      mode={mode}
      data={data}
      onClose={onClose}
      onSubmit={onSubmit}
    />
  );
};

const CurriculumModalContent = ({ mode, data, onClose, onSubmit }) => {
  const [form, setForm] = useState(() => cloneForm(data));
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [submitError, setSubmitError] = useState(null);
  const [programOptions, setProgramOptions] = useState([]);
  const [programsLoading, setProgramsLoading] = useState(true);
  const [programsError, setProgramsError] = useState(null);

  useEffect(() => {
    let mounted = true;

    const loadPrograms = async () => {
      setProgramsLoading(true);
      setProgramsError(null);
      try {
        const response = await courseService.getAll();
        const data = response?.data ?? response ?? [];
        if (!Array.isArray(data)) {
          throw new Error("The program list returned an unexpected response.");
        }
        if (mounted) {
          const programs = [...new Map(
            data
              .map((item) => [item.code || item.program || item.department, item])
              .filter(([code]) => Boolean(code))
          ).values()];
          setProgramOptions(programs);
        }
      } catch (error) {
        if (mounted) {
          setProgramOptions([]);
          setProgramsError(error?.response?.data?.message || error?.message || "Failed to load programs.");
        }
      } finally {
        if (mounted) setProgramsLoading(false);
      }
    };

    loadPrograms();

    return () => { mounted = false; };
  }, []);

  const updateForm = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const validate = () => {
    const messages = [];

    if (!form.program) messages.push("Program is required.");
    if (!form.yearLevels.length) messages.push("Select at least one year level.");
    if (!form.academicYear.trim()) messages.push("Academic year is required.");
    if (!form.semester) messages.push("Semester is required.");

    return messages;
  };

  const handleSubmit = async () => {
    const validationMessages = validate();
    if (validationMessages.length) {
      setErrors({ summary: validationMessages });
      return;
    }

    setLoading(true);
    setSubmitError(null);
    try {
      const payload = {
        ...form,
        yearLevel: form.yearLevels.join(", "),
        yearLevels: form.yearLevels,
        description: form.description?.trim() || "",
        semester: form.semester || "1st Semester",
        status: form.status || "Active",
        subjects: Array.isArray(form.subjects) ? form.subjects : [],
      };

      await onSubmit(payload);
    } catch (err) {
      setSubmitError(err?.message || "Failed to save curriculum");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-white/10 backdrop-blur-[2px]">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg mx-4 max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 flex-shrink-0">
          <div>
            <h2 className="text-base font-bold text-gray-800">
              {mode === "add" ? "Add New Curriculum" : "Edit Curriculum"}
            </h2>
            <p className="text-xs text-gray-400 mt-0.5">
              Fill in the curriculum details below
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </div>

        <div className="px-6 py-5 overflow-y-auto">
          {errors.summary?.length > 0 && (
            <div className="mb-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3">
              <div className="flex items-start gap-2.5">
                <AlertCircle size={16} className="mt-0.5 text-red-500" />
                <div>
                  <p className="text-sm font-semibold text-red-700">Please review these items</p>
                  <ul className="mt-1 space-y-1 text-xs text-red-600">
                    {errors.summary.map((message) => (
                      <li key={message}>{message}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )}

          {submitError && (
            <div className="mb-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3">
              <div className="flex items-start gap-2.5">
                <AlertCircle size={16} className="mt-0.5 text-red-500" />
                <div>
                  <p className="text-sm font-semibold text-red-700">Save failed</p>
                  <p className="mt-1 text-xs text-red-600">{submitError}</p>
                </div>
              </div>
            </div>
          )}

          {programsError && (
            <div className="mb-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3">
              <p className="text-sm font-semibold text-red-700">Programs could not be loaded</p>
              <p className="mt-1 text-xs text-red-600">{programsError}</p>
            </div>
          )}
          <div className="grid grid-cols-2 gap-4">
            <TextInput
              label="Curriculum"
              value={form.academicYear}
              onChange={(value) => updateForm("academicYear", value)}
              placeholder="e.g. 2026-2027"
              span={2}
            />
            <Select
              label="Semester"
              value={form.semester}
              onChange={(value) => updateForm("semester", value)}
              options={SEMESTERS}
              placeholder="Select Semester"
              span={2}
            />
            <Select
              label="Program"
              value={form.program}
              onChange={(value) => updateForm("program", value)}
              options={[...new Set([
                ...programOptions.map((program) => program.code || program.program || program.department),
                ...(form.program ? [form.program] : []),
              ])]}
              disabled={programsLoading || Boolean(programsError) || programOptions.length === 0}
              placeholder={
                programsLoading
                  ? "Loading programs..."
                  : programsError
                    ? "Programs unavailable"
                    : programOptions.length
                      ? "Select Program"
                      : "Add a program first"
              }
              span={2}
            />
            <div className="col-span-2 flex flex-col gap-2">
              <label className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">
                Year Level
              </label>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                {YEARS.map((year) => {
                  const selected = form.yearLevels.includes(year);
                  return (
                    <label
                      key={year}
                      className={`flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-2.5 text-sm transition ${
                        selected
                          ? "border-pup-maroon bg-pup-maroon/5 text-pup-maroon"
                          : "border-gray-200 bg-white text-slate-600 hover:bg-gray-50"
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={selected}
                        onChange={() => {
                          const nextYears = selected
                            ? form.yearLevels.filter((item) => item !== year)
                            : [...form.yearLevels, year];
                          updateForm("yearLevels", YEARS.filter((item) => nextYears.includes(item)));
                        }}
                        className="accent-pup-maroon"
                      />
                      <span>{year}</span>
                    </label>
                  );
                })}
              </div>
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
            disabled={loading || programsLoading || Boolean(programsError) || programOptions.length === 0}
            className="px-4 py-2 text-sm bg-pup-maroon text-white rounded-lg font-medium hover:bg-pup-maroon-dark transition-colors disabled:opacity-60"
          >
            {loading ? "Saving..." : mode === "add" ? "Add Curriculum" : "Save Changes"}
          </button>
        </div>
      </div>
    </div>
  );
};

const Select = ({
  label,
  value,
  onChange,
  options,
  span = 1,
  disabled = false,
  placeholder = `Select ${label}`,
}) => (
  <div className={`flex flex-col gap-1 ${span === 2 ? "col-span-2" : ""}`}>
    <label className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">{label}</label>
    <div className="relative">
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        disabled={disabled}
        className="w-full appearance-none rounded-lg border border-gray-200 bg-white px-3 py-2.5 pr-9 text-sm text-slate-700 transition focus:border-pup-maroon focus:outline-none focus:ring-2 focus:ring-pup-maroon/20 disabled:cursor-not-allowed disabled:bg-gray-50 disabled:text-gray-400"
      >
        {!value && <option value="">{placeholder}</option>}
        {options.map((option) => (
          <option key={option} value={option}>{option}</option>
        ))}
      </select>
      <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-slate-400">
        <svg viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
          <path fillRule="evenodd" d="M5.25 7.5 10 12.25 14.75 7.5H5.25Z" clipRule="evenodd" />
        </svg>
      </span>
    </div>
  </div>
);

const TextInput = ({ label, value, onChange, placeholder, maxLength, span = 1 }) => (
  <div className={`flex flex-col gap-1 ${span === 2 ? "col-span-2" : ""}`}>
    <label className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">{label}</label>
    <input
      type="text"
      value={value}
      onChange={(event) => onChange(event.target.value)}
      placeholder={placeholder}
      maxLength={maxLength}
      className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm text-slate-700 transition placeholder:text-slate-400 focus:border-pup-maroon focus:outline-none focus:ring-2 focus:ring-pup-maroon/20"
    />
  </div>
);

export default CurriculumModal;
