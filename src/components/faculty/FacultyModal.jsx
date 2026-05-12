import { useEffect, useState } from "react";
import { X } from "lucide-react";

const EMPTY_FORM = {
  name: "",
  department: "",
  email: "",
  phone: "",
  specialization: "",
  status: "Active",
};

const DEPARTMENTS = [
  "Computer Science",
  "Engineering",
  "Mathematics",
  "Business",
  "Science",
  "Arts and Letters",
];

const STATUSES = ["Active", "On Leave", "Inactive"];

const FacultyModal = ({ open, mode, data, onClose, onSubmit }) => {
  const [form, setForm]     = useState(EMPTY_FORM);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors]   = useState({});

  useEffect(() => {
    if (open) {
      setForm(data ? { ...data } : EMPTY_FORM);
      setErrors({});
    }
  }, [open, data]);

  if (!open) return null;

  const isView = mode === "view";
  const title  = mode === "add" ? "Add Faculty" : mode === "edit" ? "Edit Faculty" : "Faculty Details";

  const validate = () => {
    const e = {};
    if (!form.name.trim())           e.name = "Name is required.";
    if (!form.department.trim())     e.department = "Department is required.";
    if (!form.email.trim())          e.email = "Email is required.";
    else if (!/\S+@\S+\.\S+/.test(form.email)) e.email = "Invalid email format.";
    if (!form.phone.trim())          e.phone = "Phone is required.";
    if (!form.specialization.trim()) e.specialization = "Specialization is required.";
    return e;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: null }));
  };

  const handleSubmit = async () => {
    const e = validate();
    if (Object.keys(e).length) { setErrors(e); return; }
    setLoading(true);
    try {
      await onSubmit(form);
    } finally {
      setLoading(false);
    }
  };

  const Field = ({ label, name, type = "text", options }) => (
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
          onChange={handleChange}
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
          onChange={handleChange}
          placeholder={
            name === "email" ? "e.g. faculty@pup.edu.ph" : undefined
          }
          className={`px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-pup-maroon/20 focus:border-pup-maroon transition ${errors[name] ? "border-red-400" : "border-gray-200"}`}
        />
      )}
      {/* Show notification hint for email field only */}
      {!isView && name === "email" && (
        <p className="text-xs text-gray-400">
          📧 Schedule notifications will be sent to this address.
        </p>
      )}
      {errors[name] && (
        <p className="text-xs text-red-500">{errors[name]}</p>
      )}
    </div>
  );

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
          <div className="col-span-2">
            <Field label="Full Name" name="name" />
          </div>
          <Field label="Department"     name="department"     options={DEPARTMENTS} />
          <Field label="Specialization" name="specialization" />
          <div className="col-span-2">
            <Field label="Email" name="email" type="email" />
          </div>
          <Field label="Phone"  name="phone" />
          <Field label="Status" name="status" options={STATUSES} />
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