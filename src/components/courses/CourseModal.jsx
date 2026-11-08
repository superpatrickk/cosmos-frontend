import { useEffect, useState } from "react";
import { X } from "lucide-react";

const EMPTY_FORM = {
  code: "",
  name: "",
  duration: "",
};

const DURATIONS = [2, 3, 4, 5];

const DurationField = ({ value, onChange }) => {
  const numericValue = Number(String(value || "").match(/\d+/)?.[0] || 0);

  const setDuration = (nextYears) => {
    const safeYears = Math.max(1, Math.min(10, Number(nextYears) || 1));
    onChange(`${safeYears} ${safeYears === 1 ? "year" : "years"}`);
  };

  return (
    <div className="flex flex-col gap-2">
      <label className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">Duration</label>

      <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3.5 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="flex-1">
            <label className="mb-1 block text-[10px] font-medium uppercase tracking-[0.12em] text-slate-400">
              Program length
            </label>
            <div className="flex items-center overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
              <input
                type="number"
                min="1"
                max="10"
                value={numericValue || ""}
                onChange={(event) => setDuration(event.target.value || "")}
                className="w-20 border-0 bg-transparent px-3 py-2.5 text-lg font-semibold text-slate-800 outline-none"
              />
              <div className="flex h-10 items-center border-l border-slate-200 bg-slate-50 px-3 text-sm font-medium text-slate-600">
                {!numericValue ? "years" : numericValue === 1 ? "year" : "years"}
              </div>
            </div>
          </div>

          <div className="w-px self-stretch bg-slate-200" />

          <div className="flex flex-wrap gap-2">
            {DURATIONS.map((years) => (
              <button
                key={years}
                type="button"
                onClick={() => setDuration(years)}
                className={`rounded-full border px-2.5 py-1.5 text-xs font-semibold transition ${
                  numericValue === years
                    ? "border-pup-maroon bg-pup-maroon text-white shadow-sm"
                    : "border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-100"
                }`}
              >
                {years} yrs
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

const InputField = ({
  label,
  name,
  type = "text",
  options,
  span = 1,
  form,
  errors,
  onChange,
}) => (
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
          className={`w-full appearance-none rounded-lg border bg-white px-3 py-2.5 pr-9 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-pup-maroon/20 focus:border-pup-maroon transition ${
            errors[name] ? "border-red-400" : "border-gray-200"
          }`}
        >
          {!form[name] && <option value="">Select {label}</option>}

          {options.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
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
        className={`resize-none rounded-lg border bg-white px-3 py-2.5 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-pup-maroon/20 focus:border-pup-maroon transition ${
          errors[name] ? "border-red-400" : "border-gray-200"
        }`}
      />
    ) : (
      <input
        type={type}
        name={name}
        value={form[name]}
        onChange={onChange}
        placeholder={`Enter ${label.toLowerCase()}...`}
        className={`rounded-lg border bg-white px-3 py-2.5 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-pup-maroon/20 focus:border-pup-maroon transition ${
          errors[name] ? "border-red-400" : "border-gray-200"
        }`}
      />
    )}

    {errors[name] && (
      <p className="text-xs text-red-500">{errors[name]}</p>
    )}
  </div>
);

const CourseModal = ({ open, mode, data, onClose, onSubmit }) => {
  const [form, setForm] = useState(EMPTY_FORM);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open) {
      setForm(data ? { ...data } : { ...EMPTY_FORM });
      setErrors({});
    }
  }, [open, data]);

  if (!open) return null;

  const title = mode === "add" ? "Add New Program" : "Edit Program";

  const validate = () => {
    const e = {};

    if (!form.code.trim()) {
      e.code = "Program code is required.";
    }

    if (!form.name.trim()) {
      e.name = "Program name is required.";
    }

    if (!form.duration.trim()) {
      e.duration = "Duration is required.";
    }

    return e;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;

    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));

    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: null,
      }));
    }
  };

  const handleSubmit = async () => {
    const validationErrors = validate();

    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setLoading(true);

    try {
      await onSubmit(form);
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
              {title}
            </h2>
            <p className="text-xs text-gray-400 mt-0.5">
              Fill in the program details below
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        <div className="px-6 py-5 overflow-y-auto">
          <div className="grid grid-cols-2 gap-4">

          <InputField
            label="Code"
            name="code"
            span={1}
            form={form}
            errors={errors}
            onChange={handleChange}
          />

          <div className="col-span-2">
            <DurationField
              value={form.duration}
              onChange={(nextValue) => setForm((prev) => ({ ...prev, duration: nextValue }))}
            />
          </div>

          <InputField
            label="Program Name"
            name="name"
            span={2}
            form={form}
            errors={errors}
            onChange={handleChange}
          />
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-100 flex-shrink-0">

          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={handleSubmit}
            disabled={loading}
            className="px-4 py-2 text-sm bg-pup-maroon text-white rounded-lg font-medium hover:bg-pup-maroon-dark transition-colors disabled:opacity-60"
          >
            {loading
              ? "Saving..."
              : mode === "add"
                ? "Add Program"
                : "Save Changes"}
          </button>

        </div>
      </div>
    </div>
  );
};

export default CourseModal;