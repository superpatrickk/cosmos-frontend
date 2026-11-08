import { useState, useEffect } from "react";
import {
  AlertCircle,
  X,
} from "lucide-react";
import { curriculumService } from "../../api/services/curriculumService";

const YEARS = ["1st Year", "2nd Year", "3rd Year", "4th Year"];
const EMPTY_FORM = {
  curriculum: "",
  program: "",
  yearLevel: "",
  academicYear: "",
  description: "",
  status: "Active",
  subjects: [],
};

const cloneForm = (form = {}) => ({
  ...EMPTY_FORM,
  ...form,
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
  const [curriculumOptions, setCurriculumOptions] = useState([]);
  const [academicYearOptions, setAcademicYearOptions] = useState([]);

  useEffect(() => {
    let mounted = true;

    const loadOptions = async () => {
      try {
        const response = await curriculumService.getAll();
        const data = response?.data ?? response ?? [];
        const programs = Array.isArray(data)
          ? [...new Set(data.map((item) => item.program).filter(Boolean))]
          : [];
        const curriculumItems = Array.isArray(data)
          ? [...new Set(data.map((item) => {
              const program = item.program;
              const academicYear = item.academicYear;
              if (!program || !academicYear) return null;
              return `${program} • ${academicYear}`;
            }).filter(Boolean))]
          : [];
        const academicYears = Array.isArray(data)
          ? [...new Set(data.map((item) => item.academicYear).filter(Boolean))]
          : [];

        if (mounted) {
          setProgramOptions(programs);
          setCurriculumOptions(curriculumItems);
          setAcademicYearOptions(academicYears);
        }
      } catch {
        if (mounted) {
          setProgramOptions([]);
          setCurriculumOptions([]);
          setAcademicYearOptions([]);
        }
      }
    };

    loadOptions();

    setForm(cloneForm(data));
    setErrors({});
    setSubmitError(null);

    return () => { mounted = false; };
  }, [data, mode]);

  const updateForm = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const validate = () => {
    const messages = [];

    if (!form.curriculum) messages.push("Curriculum is required.");
    if (!form.program) messages.push("Program is required.");
    if (!form.yearLevel) messages.push("Year level is required.");
    if (!form.academicYear) messages.push("Academic year is required.");

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
        description: form.curriculum,
        semester: "1st Semester",
        status: "Active",
        subjects: [],
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

          <div className="grid grid-cols-2 gap-4">
            <Select
              label="Curriculum"
              value={form.curriculum}
              onChange={(value) => updateForm("curriculum", value)}
              options={curriculumOptions}
              span={2}
            />
            <Select
              label="Program"
              value={form.program}
              onChange={(value) => updateForm("program", value)}
              options={programOptions}
              span={2}
            />
            <Select
              label="Year Level"
              value={form.yearLevel}
              onChange={(value) => updateForm("yearLevel", value)}
              options={YEARS}
            />
            <Select
              label="Academic Year"
              value={form.academicYear}
              onChange={(value) => updateForm("academicYear", value)}
              options={academicYearOptions}
            />
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
            {loading ? "Saving..." : mode === "add" ? "Add Curriculum" : "Save Changes"}
          </button>
        </div>
      </div>
    </div>
  );
};

const Select = ({ label, value, onChange, options, span = 1 }) => (
  <div className={`flex flex-col gap-1 ${span === 2 ? "col-span-2" : ""}`}>
    <label className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">{label}</label>
    <div className="relative">
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="w-full appearance-none rounded-lg border border-gray-200 bg-white px-3 py-2.5 pr-9 text-sm text-slate-700 transition focus:border-pup-maroon focus:outline-none focus:ring-2 focus:ring-pup-maroon/20"
      >
        {!value && <option value="">Select {label}</option>}
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

export default CurriculumModal;
