import { useEffect, useState } from "react";
import { X } from "lucide-react";

const EMPTY_FORM = {
  name: "",
  programs: [],
  email: "",
  specialization: "",
  status: "Active",
};

const STATUSES = ["Active", "On Leave", "Inactive"];

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
      {loading ? (
        <p className="text-sm text-gray-500">Loading programs...</p>
      ) : error ? (
        <p className="text-sm text-red-600" role="alert">{error}</p>
      ) : programs.length === 0 ? (
        <p className="text-sm text-gray-500">No active programs found.</p>
      ) : (
        <div className="grid max-h-36 grid-cols-2 gap-2 overflow-y-auto rounded-lg border border-gray-200 p-3">
          {programs.map((program) => (
            <label key={program.id} className="flex items-start gap-2 text-sm text-gray-700">
              <input
                type="checkbox"
                checked={selected.includes(program.code)}
                onChange={() => onToggle(program.code)}
                className="mt-0.5 accent-pup-maroon"
              />
              <span>{program.code} - {program.name}</span>
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
        ? { ...EMPTY_FORM, ...data, programs: selectedPrograms, email: data.email || "" }
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
    if (!form.name.trim())           e.name = "Name is required.";
    if (!form.programs.length)       e.programs = "Select at least one program.";
    if (form.email.trim() && !/\S+@\S+\.\S+/.test(form.email)) e.email = "Invalid email format.";
    if (!form.specialization.trim()) e.specialization = "Specialization is required.";
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
      await onSubmit({
        name: form.name.trim(),
        programs: form.programs,
        department: form.programs.join(", "),
        email: form.email.trim() || null,
        specialization: form.specialization.trim(),
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
            <p className="mt-1 text-xs text-gray-400">Enter as Lastname, Firstname, Middle Initial.</p>
          </div>
          <ProgramField
            programs={programs}
            selected={form.programs}
            isView={isView}
            loading={programsLoading}
            error={programsError}
            fieldError={errors.programs}
            onToggle={toggleProgram}
          />
          <Field label="Specialization" name="specialization" form={form} errors={errors} onChange={handleChange} isView={isView} />
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