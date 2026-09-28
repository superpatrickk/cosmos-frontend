import { useEffect, useState } from "react";
import { X } from "lucide-react";

const EMPTY_FORM = {
  code: "",
  name: "",
  units: 3,
  type: "Lecture",
  prerequisite: "None",
  course: "",
  yearLevel: "1st Year",
  semester: "1st Semester",
  description: "",
  status: "Active",
};

const TYPES      = ["Lecture", "Lecture/Lab", "Laboratory"];
const YEAR_LEVELS = ["1st Year", "2nd Year", "3rd Year", "4th Year", "5th Year"];
const SEMESTERS  = ["1st Semester", "2nd Semester", "Summer"];
const STATUSES   = ["Active", "Inactive"];

const Field = ({ label, name, type = "text", options, placeholder, disabled, helpText, span = 1, form, errors, onChange }) => (
  <div className={`flex flex-col gap-1 ${span === 2 ? "col-span-2" : ""}`}>
    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
      {label}
    </label>
    {options ? (
      <select
        name={name}
        value={form[name]}
        onChange={onChange}
        disabled={disabled}
        className={`px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-pup-maroon/20 focus:border-pup-maroon transition ${errors[name] ? "border-red-400" : "border-gray-200"}`}
      >
        {placeholder && <option value="">{placeholder}</option>}
        {options.map((option) => {
          const value = typeof option === "string" ? option : option.value;
          const label = typeof option === "string" ? option : option.label;
          return <option key={value} value={value}>{label}</option>;
        })}
      </select>
    ) : type === "textarea" ? (
      <textarea
        name={name}
        value={form[name]}
        onChange={onChange}
        rows={3}
        placeholder={`Enter ${label.toLowerCase()}...`}
        className={`px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-pup-maroon/20 focus:border-pup-maroon transition resize-none ${errors[name] ? "border-red-400" : "border-gray-200"}`}
      />
    ) : (
      <input
        type={type}
        name={name}
        value={form[name]}
        onChange={onChange}
        placeholder={`Enter ${label.toLowerCase()}...`}
        className={`px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-pup-maroon/20 focus:border-pup-maroon transition ${errors[name] ? "border-red-400" : "border-gray-200"}`}
      />
    )}
    {errors[name] && <p className="text-xs text-red-500">{errors[name]}</p>}
    {helpText && <p className="text-xs text-red-500">{helpText}</p>}
  </div>
);

const SubjectModal = ({ open, mode, data, courses = [], coursesLoading = false, coursesError, onClose, onSubmit }) => {
  const [form, setForm]       = useState(EMPTY_FORM);
  const [errors, setErrors]   = useState({});
  const [loading, setLoading] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const activeCourses = courses.filter((course) => course.status?.toLowerCase() === "active");
  const courseOptions = activeCourses.map((course) => ({
    value: course.code,
    label: `${course.code} - ${course.name}`,
  }));
  if (form.course && !courseOptions.some((course) => course.value === form.course)) {
    courseOptions.push({ value: form.course, label: form.course });
  }

  useEffect(() => {
    if (open) {
      setForm(data ? { ...data } : EMPTY_FORM);
      setErrors({});
      setSubmitError("");
    }
  }, [open]);

  if (!open) return null;

  const validate = () => {
    const e = {};
    if (!form.code.trim())        e.code = "Subject code is required.";
    if (!form.name.trim())        e.name = "Subject name is required.";
    if (!form.course.trim())      e.course = "Course is required.";
    if (!form.description.trim()) e.description = "Description is required.";
    if (!form.units || form.units < 1) e.units = "Units must be at least 1.";
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
    setSubmitError("");
    try {
      await onSubmit(form);
    } catch (err) {
      setSubmitError(err?.response?.data?.message || err?.message || "Failed to save subject.");
    }
    finally { setLoading(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg mx-4 max-h-[90vh] flex flex-col">

        {/* Header */}
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

        {/* Body */}
        <div className="px-6 py-5 grid grid-cols-2 gap-4 overflow-y-auto">
          {submitError && (
            <p className="col-span-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {submitError}
            </p>
          )}
          <Field label="Subject Code" name="code" form={form} errors={errors} onChange={handleChange} />
          <Field label="Units"        name="units" type="number" form={form} errors={errors} onChange={handleChange} />
          <Field label="Subject Name" name="name"  span={2} form={form} errors={errors} onChange={handleChange} />
          <Field label="Type"         name="type"  options={TYPES} form={form} errors={errors} onChange={handleChange} />
          <Field
            label="Course"
            name="course"
            options={courseOptions}
            placeholder={coursesLoading ? "Loading courses..." : coursesError ? "Courses unavailable" : "Select course"}
            disabled={coursesLoading || Boolean(coursesError) || (!activeCourses.length && !form.course)}
            helpText={coursesError ? "Course options could not be loaded from the database." : ""}
            form={form}
            errors={errors}
            onChange={handleChange}
          />
          <Field label="Prerequisite" name="prerequisite" form={form} errors={errors} onChange={handleChange} />
          <Field label="Status"       name="status" options={STATUSES} form={form} errors={errors} onChange={handleChange} />
          <Field label="Year Level"   name="yearLevel"  options={YEAR_LEVELS} form={form} errors={errors} onChange={handleChange} />
          <Field label="Semester"     name="semester"   options={SEMESTERS} form={form} errors={errors} onChange={handleChange} />
          <Field label="Description"  name="description" type="textarea" span={2} form={form} errors={errors} onChange={handleChange} />
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