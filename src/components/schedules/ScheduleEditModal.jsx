import { useEffect, useState } from "react";
import { X, Loader2 } from "lucide-react";

const SEMESTERS = ["1st Semester", "2nd Semester", "Summer"];

const ScheduleEditModal = ({
  open, data, subjects, faculty, rooms, courses, days,
  onClose, onSubmit,
}) => {
  const [form, setForm]       = useState({});
  const [errors, setErrors]   = useState({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open && data) {
      setForm({ ...data });
      setErrors({});
    }
  }, [open, data]);

  if (!open) return null;

  const validate = () => {
    const e = {};
    if (!form.subjectCode) e.subjectCode = "Required";
    if (!form.faculty)     e.faculty     = "Required";
    if (!form.room)        e.room        = "Required";
    if (!form.day)         e.day         = "Required";
    if (!form.startTime)   e.startTime   = "Required";
    if (!form.endTime)     e.endTime     = "Required";
    if (!form.course)      e.course      = "Required";
    if (!form.section?.trim()) e.section = "Required";
    if (form.startTime && form.endTime && form.startTime >= form.endTime)
      e.endTime = "End time must be after start time.";
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
    try { await onSubmit(form); }
    finally { setLoading(false); }
  };

  const Field = ({ label, name, type = "text", options, valueKey = null, labelKey = null }) => (
    <div className="flex flex-col gap-1">
      <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
        {label}
      </label>
      {options ? (
        <select
          name={name}
          value={form[name] ?? ""}
          onChange={handleChange}
          className={`px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-pup-maroon/20 focus:border-pup-maroon transition bg-white ${
            errors[name] ? "border-red-400" : "border-gray-200"
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
      ) : (
        <input
          type={type}
          name={name}
          value={form[name] ?? ""}
          onChange={handleChange}
          className={`px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-pup-maroon/20 focus:border-pup-maroon transition ${
            errors[name] ? "border-red-400" : "border-gray-200"
          }`}
        />
      )}
      {errors[name] && <p className="text-xs text-red-500">{errors[name]}</p>}
    </div>
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-xl mx-4 max-h-[90vh] flex flex-col">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 flex-shrink-0">
          <div>
            <h2 className="text-base font-bold text-gray-800">Edit Schedule</h2>
            <p className="text-xs text-gray-400 mt-0.5">
              Modify the schedule details below
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-5 grid grid-cols-2 gap-4 overflow-y-auto">
          <Field label="Subject"  name="subjectCode" options={subjects} valueKey="code"  labelKey={["code","name"]} />
          <Field label="Faculty"  name="faculty"     options={faculty}  valueKey="name"  labelKey="name" />
          <Field label="Room"     name="room"        options={rooms}    valueKey="id"    labelKey="name" />
          <Field label="Day"      name="day"         options={days} />
          <Field label="Start Time" name="startTime" type="time" />
          <Field label="End Time"   name="endTime"   type="time" />
          <Field label="Course"   name="course"      options={courses}  valueKey="code"  labelKey="code" />
          <Field label="Section"  name="section" />
          <Field label="Semester" name="semester"    options={SEMESTERS} />
          <Field label="Status"   name="status"      options={["Active", "Inactive"]} />
        </div>

        {/* Footer */}
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
            className="flex items-center gap-2 px-4 py-2 text-sm bg-pup-maroon text-white rounded-lg font-medium hover:bg-pup-maroon-dark transition-colors disabled:opacity-60"
          >
            {loading && <Loader2 size={14} className="animate-spin" />}
            {loading ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ScheduleEditModal;