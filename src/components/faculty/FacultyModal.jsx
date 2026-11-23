import { useEffect, useState } from "react";
import { X } from "lucide-react";

const EMPTY_FORM = {
  name: "",
  type: "",
  programs: [],
  email: "",
  status: "Active",
};

const FACULTY_TYPES = [
  {
    label: "Full Time",
    options: ["Full Time Faculty Core", "Full Time Faculty Allied"],
  },
  {
    label: "Part Time",
    options: ["Part Time Faculty Core", "Part Time Faculty Allied"],
  },
];

const STATUSES = ["Active", "On Leave", "Inactive"];

const normalizeType = (type) => {
  const legacyTypes = {
    "FULL TIME FACULTY CORE": "Full Time Faculty Core",
    "FULL TIME FACULTY ALLIED": "Full Time Faculty Allied",
    "PART TIME FACULTY CORE": "Part Time Faculty Core",
    "PART TIME FACULTY ALLIED": "Part Time Faculty Allied",
    "FULL TIME PART TIME FACULTY CORE": "Full Time Faculty Core",
    "FULL TIME PART TIME FACULTY ALLIED": "Full Time Faculty Allied",
  };
  return legacyTypes[type] || type || "";
};

const FacultyTypeField = ({ value, error, isView, onChange }) => (
  <fieldset className="col-span-2">
    <div className="mb-2">
      <legend className="text-xs font-semibold uppercase tracking-wide text-gray-500">
        Faculty Type
      </legend>
      {!isView && (
        <p className="mt-0.5 text-xs text-gray-400">
          Choose the employment type and faculty category.
        </p>
      )}
    </div>
    {isView ? (
      <p className="text-sm font-medium text-gray-800 py-1">{value || "—"}</p>
    ) : (
      <div className="grid grid-cols-2 gap-2" role="radiogroup" aria-label="Faculty type">
        {FACULTY_TYPES.flatMap((group) =>
          group.options.map((option) => {
            const category = option.endsWith("Core") ? "Core" : "Allied";
            const selected = value === option;
            return (
              <label
                key={option}
                className={`flex cursor-pointer items-center gap-3 rounded-lg border px-3 py-2.5 transition focus-within:border-pup-maroon focus-within:ring-2 focus-within:ring-pup-maroon/20 ${
                  selected
                    ? "border-pup-maroon bg-pup-maroon/5 ring-1 ring-pup-maroon"
                    : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                } ${error ? "border-red-400" : ""}`}
              >
                <input
                  type="radio"
                  name="type"
                  value={option}
                  checked={selected}
                  onChange={onChange}
                  className="accent-pup-maroon focus:outline-none"
                />
                <span>
                  <span className="block text-sm font-semibold text-gray-800">{group.label}</span>
                  <span className="block text-xs text-gray-500">{category}</span>
                </span>
              </label>
            );
          })
        )}
      </div>
    )}
    {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
  </fieldset>
);

const Field = ({ label, name, type = "text", options, form, errors, onChange, isView }) => (
  <div className="flex flex-col gap-1">
    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
      {label}
    </label>
    {isView ? (
      <p className="text-sm text-gray-800 font-medium py-1">
        {form[name] || "—"}
      </p>
    ) : options ? (
      <select
        name={name}
        value={form[name]}
        onChange={onChange}
        className={`px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-pup-maroon/20 focus:border-pup-maroon transition ${errors[name] ? "border-red-400" : "border-gray-200"}`}
      >
        <option value="">Select {label}</option>
        {options.map((opt) => (
          <option key={opt} value={opt}>{opt}</option>
        ))}
      </select>
    ) : (
      <input
        type={type}
        name={name}
        value={form[name]}
        onChange={onChange}
        placeholder={
          name === "email" ? "e.g. faculty@pup.edu.ph" : undefined
        }
        className={`px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-pup-maroon/20 focus:border-pup-maroon transition ${errors[name] ? "border-red-400" : "border-gray-200"}`}
      />
    )}
    {!isView && name === "email" && (
      <p className="text-xs text-gray-400">
        Optional. Schedule notifications can be sent when an email is provided.
      </p>
    )}
    {errors[name] && (
      <p className="text-xs text-red-500">{errors[name]}</p>
    )}
  </div>
);

const ProgramField = ({ programs, selected, isView, loading, error, onToggle, fieldError }) => {
  if (isView) {
    const selectedPrograms = selected.map((code) => {
      const program = programs.find((item) => item.code === code);
      return program ? `${program.code} - ${program.name}` : code;
    });
    return (
      <div className="col-span-2 flex flex-col gap-1">
        <span className="text-xs font-semibold uppercase tracking-wide text-gray-500">Program</span>
        <p className="py-1 text-sm font-medium text-gray-800">{selectedPrograms.join(", ") || "—"}</p>
      </div>
    );
  }

  return (
    <fieldset className="col-span-2 flex flex-col gap-2">
      <legend className="text-xs font-semibold uppercase tracking-wide text-gray-500">Program</legend>
      {!loading && !error && programs.length > 0 && (
        <p className="text-xs text-gray-400">Select one or more programs.</p>
      )}
      {loading ? (
        <p className="text-sm text-gray-500">Loading programs...</p>
      ) : error ? (
        <p className="text-sm text-red-600" role="alert">{error}</p>
      ) : programs.length === 0 ? (
        <p className="text-sm text-gray-500">No active programs found.</p>
      ) : (
        <div className={`grid max-h-36 grid-cols-2 gap-2 overflow-y-auto rounded-lg border p-3 ${fieldError ? "border-red-400" : "border-gray-200"}`}>
          {programs.map((program) => (
            <label
              key={program.id}
              className={`flex cursor-pointer items-start gap-2 rounded-md px-2 py-1.5 text-sm transition hover:bg-gray-50 ${
                selected.includes(program.code) ? "bg-pup-maroon/5 text-pup-maroon" : "text-gray-700"
              }`}
            >
              <input
                type="checkbox"
                checked={selected.includes(program.code)}
                onChange={() => onToggle(program.code)}
                className="mt-0.5 accent-pup-maroon focus-visible:outline-none"
              />
              <span>
                <span className="block text-xs font-bold">{program.code}</span>
                <span className="block text-xs leading-tight text-gray-500">{program.name}</span>
              </span>
            </label>
          ))}
        </div>
      )}
      {fieldError && <p className="text-xs text-red-500">{fieldError}</p>}
    </fieldset>
  );
};

const FacultyModal = ({ open, mode, data, programs = [], programsLoading = false, programsError, onClose, onSubmit }) => {
  const [form, setForm]     = useState(EMPTY_FORM);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors]   = useState({});
  const [submitError, setSubmitError] = useState("");

  useEffect(() => {
    if (open) {
      const selectedPrograms = data?.programs?.length
        ? data.programs
        : data?.department?.split(",").map((program) => program.trim()).filter(Boolean) ?? [];
      setForm(data
        ? { ...EMPTY_FORM, ...data, programs: selectedPrograms, email: data.email || "", type: normalizeType(data.type) }
        : { ...EMPTY_FORM, programs: [] }
      );
      setErrors({});
      setSubmitError("");
    }
  }, [open, data]);

  if (!open) return null;

  const isView = mode === "view";
  const title  = mode === "add" ? "Add Faculty" : mode === "edit" ? "Edit Faculty" : "Faculty Details";

  const validate = () => {
    const e = {};
    if (!form.name.trim()) {
      e.name = "Name is required.";
    }
    if (!form.type) {
      e.type = "Faculty type is required.";
    }
    if (!form.programs.length) {
      e.programs = "Select at least one program.";
    }
    if (form.email.trim() && !/\S+@\S+\.\S+/.test(form.email)) e.email = "Invalid email format.";
    return e;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: null }));
  };

  const toggleProgram = (programCode) => {
    setForm((prev) => ({
      ...prev,
      programs: prev.programs.includes(programCode)
        ? prev.programs.filter((program) => program !== programCode)
        : [...prev.programs, programCode],
    }));
    if (errors.programs) setErrors((prev) => ({ ...prev, programs: null }));
  };

  const handleSubmit = async () => {
    const e = validate();
    if (Object.keys(e).length) { setErrors(e); return; }
    setLoading(true);
    setSubmitError("");
    try {
      const selectedPrograms = form.programs;
      await onSubmit({
        name: form.name.trim(),
        type: form.type,
        programs: selectedPrograms,
        department: selectedPrograms.join(", "),
        email: form.email.trim() || "",
        status: form.status,
      });
    } catch (err) {
      setSubmitError(err?.response?.data?.message || err?.message || "Failed to save faculty member.");
    } finally {
      setLoading(false);
    }
  };
  

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg mx-4">

        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="text-base font-bold text-gray-800">{title}</h2>
          <button
            onClick={onClose}
            type="button"
            aria-label="Close faculty modal"
            title="Close"
            className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="px-6 py-5 grid grid-cols-2 gap-4">
          {submitError && (
            <p className="col-span-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {submitError}
            </p>
          )}
          <div className="col-span-2">
            <Field label="Full Name" name="name" form={form} errors={errors} onChange={handleChange} isView={isView} />
          </div>
          <FacultyTypeField
            value={form.type}
            error={errors.type}
            isView={isView}
            onChange={handleChange}
          />
          <ProgramField
            programs={programs}
            selected={form.programs}
            isView={isView}
            loading={programsLoading}
            error={programsError}
            fieldError={errors.programs}
            onToggle={toggleProgram}
          />
          <div className="col-span-2">
            <Field label="Email" name="email" type="email" form={form} errors={errors} onChange={handleChange} isView={isView} />
          </div>
          <Field label="Status" name="status" options={STATUSES} form={form} errors={errors} onChange={handleChange} isView={isView} />
        </div>

        {/* Modal Footer */}
        {!isView && (
          <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-100">
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
              {loading ? "Saving..." : mode === "add" ? "Add Faculty" : "Save Changes"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default FacultyModal;