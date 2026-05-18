import { useMemo, useState } from "react";
import {
  AlertCircle,
  BookOpen,
  CopyPlus,
  Layers3,
  Loader2,
  Plus,
  Trash2,
  UserCheck,
  X,
} from "lucide-react";

const PROGRAMS = ["BSIT", "BSCS", "BSEE", "BSBA", "BSMath"];
const YEARS = ["1st Year", "2nd Year", "3rd Year", "4th Year"];
const SEMS = ["1st Semester", "2nd Semester", "Summer"];
const AY = ["2024-2025", "2025-2026", "2026-2027"];
const TYPES = ["Lecture", "Laboratory", "Lecture/Lab"];
const ROOM_TYPES = ["Lecture", "Laboratory", "Computer Lab", "Seminar", "Auditorium"];
const STATUSES = ["Active", "Inactive"];

const FACULTY = [
  { name: "Dr. Maria Santos", programs: ["BSIT", "BSCS"] },
  { name: "Prof. Juan Reyes", programs: ["BSIT", "BSBA"] },
  { name: "Dr. Ana Cruz", programs: ["BSCS", "BSMath"] },
  { name: "Prof. Carlos Garcia", programs: ["BSEE", "BSIT"] },
  { name: "Prof. Liza Mendoza", programs: ["BSBA", "BSMath"] },
];

const EMPTY_SUBJECT = {
  code: "",
  description: "",
  lec: 0,
  lab: 0,
  units: 0,
  type: "Lecture",
  roomType: "Lecture",
  faculty: "",
};

const EMPTY_FORM = {
  program: "",
  yearLevel: "",
  semester: "",
  academicYear: "",
  status: "Active",
  subjects: [],
};

const cloneForm = (form = {}) => ({
  ...EMPTY_FORM,
  ...form,
  subjects: (form?.subjects ?? []).map((subject) => ({
    ...EMPTY_SUBJECT,
    ...subject,
    roomType: subject.roomType || subject.type || "Lecture",
    faculty: subject.faculty || "",
  })),
});

const getRoomTypeForSubject = (type) => {
  if (type === "Laboratory") return "Laboratory";
  if (type === "Lecture/Lab") return "Computer Lab";
  return "Lecture";
};

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

  const availableFaculty = useMemo(() => {
    if (!form.program) return FACULTY;
    return FACULTY.filter((faculty) => faculty.programs.includes(form.program));
  }, [form.program]);

  const updateForm = (key, value) => {
    setForm((prev) => {
      const next = { ...prev, [key]: value };
      if (key === "program") {
        next.subjects = next.subjects.map((subject) => {
          const facultyAllowed = FACULTY.find(
            (faculty) => faculty.name === subject.faculty && faculty.programs.includes(value)
          );
          return facultyAllowed ? subject : { ...subject, faculty: "" };
        });
      }
      return next;
    });
  };

  const addSubject = () => {
    setForm((prev) => ({
      ...prev,
      subjects: [...prev.subjects, { ...EMPTY_SUBJECT }],
    }));
  };

  const duplicateSubject = (index) => {
    setForm((prev) => {
      const next = [...prev.subjects];
      next.splice(index + 1, 0, { ...next[index] });
      return { ...prev, subjects: next };
    });
  };

  const removeSubject = (index) => {
    setForm((prev) => ({
      ...prev,
      subjects: prev.subjects.filter((_, subjectIndex) => subjectIndex !== index),
    }));
  };

  const updateSubject = (index, key, value) => {
    setForm((prev) => {
      const subjects = [...prev.subjects];
      const updated = { ...subjects[index], [key]: value };

      if (key === "lec" || key === "lab") {
        updated.units = Number(updated.lec || 0) + Number(updated.lab || 0);
      }

      if (key === "type") {
        updated.roomType = getRoomTypeForSubject(value);
      }

      subjects[index] = updated;
      return { ...prev, subjects };
    });
  };

  const validate = () => {
    const messages = [];
    if (!form.program) messages.push("Program is required.");
    if (!form.yearLevel) messages.push("Year level is required.");
    if (!form.semester) messages.push("Semester is required.");
    if (!form.academicYear) messages.push("Academic year is required.");
    if (form.subjects.length === 0) messages.push("Add at least one subject.");
    form.subjects.forEach((subject, subjectIndex) => {
      if (!subject.code || !subject.description || !subject.roomType) {
        messages.push(`Row ${subjectIndex + 1} needs code, description, and room type.`);
      }
    });
    return messages;
  };

  const handleSubmit = async () => {
    const validationMessages = validate();
    if (validationMessages.length) {
      setErrors({ summary: validationMessages });
      return;
    }

    setLoading(true);
    try {
      await onSubmit(form);
    } finally {
      setLoading(false);
    }
  };

  const totalSubjects = form.subjects.length;
  const totalUnits = form.subjects.reduce((sum, subject) => sum + Number(subject.units || 0), 0);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-6xl max-h-[92vh] flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-pup-maroon/10 rounded-xl flex items-center justify-center">
              <BookOpen size={18} className="text-pup-maroon" />
            </div>
            <div>
              <h2 className="text-base font-bold text-gray-800">
                {mode === "add" ? "Add Curriculum" : "Edit Curriculum"}
              </h2>
              <p className="text-xs text-gray-400 mt-0.5">
                Add subjects with assigned professor and required room type in one table.
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 text-gray-400 hover:bg-gray-100 rounded-lg transition-colors">
            <X size={18} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto">


          <div className="px-6 py-5 space-y-5">
            {errors.summary?.length > 0 && (
              <div className="rounded-xl border border-red-100 bg-red-50 px-4 py-3">
                <div className="flex items-start gap-2">
                  <AlertCircle size={16} className="text-red-500 mt-0.5" />
                  <div>
                    <p className="text-sm font-semibold text-red-700">Please review these items</p>
                    <ul className="mt-1 space-y-1 text-xs text-red-600">
                      {errors.summary.slice(0, 5).map((message) => (
                        <li key={message}>{message}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            )}

            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              <Select label="Program" value={form.program} onChange={(value) => updateForm("program", value)} options={PROGRAMS} />
              <Select label="Year Level" value={form.yearLevel} onChange={(value) => updateForm("yearLevel", value)} options={YEARS} />
              <Select label="Semester" value={form.semester} onChange={(value) => updateForm("semester", value)} options={SEMS} />
              <Select label="Academic Year" value={form.academicYear} onChange={(value) => updateForm("academicYear", value)} options={AY} />
              <Select label="Status" value={form.status} onChange={(value) => updateForm("status", value)} options={STATUSES} />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <InfoStrip icon={UserCheck} label="Available Faculty" value={availableFaculty.length} note="Filtered by affiliated program" />
              <InfoStrip icon={BookOpen} label="Subjects" value={form.subjects.length} note={`${form.program || "No program"} curriculum draft`} />
              <InfoStrip icon={Layers3} label="Units" value={form.subjects.reduce((sum, subject) => sum + Number(subject.units || 0), 0)} note="Auto-computed from lec and lab" />
            </div>

            <div>
              <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
                <div>
                  <p className="text-sm font-bold text-gray-700">Curriculum Subjects</p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    Professor choices update when the program changes.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {/* Bulk block controls removed */}
                  <button
                    onClick={addSubject}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-pup-maroon text-white rounded-lg hover:bg-pup-maroon-dark transition-colors font-medium"
                  >
                    <Plus size={12} />
                    Add Subject
                  </button>
                </div>
              </div>

              {form.subjects.length === 0 ? (
                <div className="text-center py-8 border border-dashed border-gray-200 rounded-xl text-sm text-gray-400">
                  No subjects added yet.{" "}
                  <button onClick={addSubject} className="text-pup-maroon font-medium hover:underline">
                    Add one
                  </button>
                </div>
              ) : (
                <div className="border border-gray-100 rounded-xl overflow-x-auto">
                  <table className="w-full text-xs min-w-[1040px]">
                    <thead>
                      <tr className="bg-gray-50 border-b border-gray-100 text-gray-400 uppercase tracking-wide">
                        <th className="text-left px-3 py-2 font-semibold">Code</th>
                        <th className="text-left px-3 py-2 font-semibold">Description</th>
                        <th className="text-center px-2 py-2 font-semibold">Lec</th>
                        <th className="text-center px-2 py-2 font-semibold">Lab</th>
                        <th className="text-center px-2 py-2 font-semibold">Units</th>
                        <th className="text-left px-3 py-2 font-semibold">Subject Type</th>
                        <th className="text-left px-3 py-2 font-semibold">Room Type</th>
                        <th className="text-left px-3 py-2 font-semibold">Professor</th>
                        <th className="px-2 py-2" />
                      </tr>
                    </thead>
                    <tbody>
                      {form.subjects.map((subject, index) => (
                        <tr key={`${subject.code}-${index}`} className="border-b border-gray-50">
                          <td className="px-2 py-2">
                            <input
                              value={subject.code}
                              onChange={(event) => updateSubject(index, "code", event.target.value)}
                              placeholder="e.g. CS101"
                              className="w-28 px-2 py-1.5 border border-gray-200 rounded-lg focus:outline-none focus:border-pup-maroon text-xs"
                            />
                          </td>
                          <td className="px-2 py-2">
                            <input
                              value={subject.description}
                              onChange={(event) => updateSubject(index, "description", event.target.value)}
                              placeholder="Subject description"
                              className="w-full min-w-[220px] px-2 py-1.5 border border-gray-200 rounded-lg focus:outline-none focus:border-pup-maroon text-xs"
                            />
                          </td>
                          <td className="px-2 py-2">
                            <input
                              type="number"
                              min="0"
                              max="6"
                              value={subject.lec}
                              onChange={(event) => updateSubject(index, "lec", event.target.value)}
                              className="w-14 px-2 py-1.5 border border-gray-200 rounded-lg focus:outline-none focus:border-pup-maroon text-xs text-center"
                            />
                          </td>
                          <td className="px-2 py-2">
                            <input
                              type="number"
                              min="0"
                              max="6"
                              value={subject.lab}
                              onChange={(event) => updateSubject(index, "lab", event.target.value)}
                              className="w-14 px-2 py-1.5 border border-gray-200 rounded-lg focus:outline-none focus:border-pup-maroon text-xs text-center"
                            />
                          </td>
                          <td className="px-2 py-2 text-center font-bold text-gray-700">{subject.units}</td>
                          <td className="px-2 py-2">
                            <select
                              value={subject.type}
                              onChange={(event) => updateSubject(index, "type", event.target.value)}
                              className="w-32 px-2 py-1.5 border border-gray-200 rounded-lg focus:outline-none focus:border-pup-maroon text-xs bg-white"
                            >
                              {TYPES.map((type) => <option key={type}>{type}</option>)}
                            </select>
                          </td>
                          <td className="px-2 py-2">
                            <select
                              value={subject.roomType}
                              onChange={(event) => updateSubject(index, "roomType", event.target.value)}
                              className="w-36 px-2 py-1.5 border border-gray-200 rounded-lg focus:outline-none focus:border-pup-maroon text-xs bg-white"
                            >
                              {ROOM_TYPES.map((type) => <option key={type}>{type}</option>)}
                            </select>
                          </td>
                          <td className="px-2 py-2">
                            <select
                              value={subject.faculty}
                              onChange={(event) => updateSubject(index, "faculty", event.target.value)}
                              disabled={!form.program}
                              className="w-44 px-2 py-1.5 border border-gray-200 rounded-lg focus:outline-none focus:border-pup-maroon text-xs bg-white disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              <option value="">{form.program ? "Select professor" : "Select program first"}</option>
                              {availableFaculty.map((faculty) => (
                                <option key={faculty.name}>{faculty.name}</option>
                              ))}
                            </select>
                          </td>
                          <td className="px-2 py-2">
                            <div className="flex items-center gap-1">
                              <button
                                onClick={() => duplicateSubject(index)}
                                className="p-1.5 text-gray-300 hover:text-pup-maroon hover:bg-red-50 rounded-lg transition-colors"
                                title="Duplicate subject"
                              >
                                <CopyPlus size={14} />
                              </button>
                              <button
                                onClick={() => removeSubject(index)}
                                className="p-1.5 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                title="Remove subject"
                              >
                                <Trash2 size={14} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 px-6 py-4 border-t border-gray-100 flex-shrink-0">
          <p className="text-xs text-gray-400">
            Saving <strong className="text-gray-700">1</strong> curriculum, <strong className="text-gray-700">{totalSubjects}</strong> subjects, <strong className="text-gray-700">{totalUnits}</strong> units
          </p>
          <div className="flex items-center gap-3">
            <button onClick={onClose} className="px-4 py-2 text-sm border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50 transition-colors">
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={loading}
              className="flex items-center gap-2 px-4 py-2 text-sm bg-pup-maroon text-white rounded-lg font-medium hover:bg-pup-maroon-dark transition-colors disabled:opacity-60"
            >
              {loading && <Loader2 size={14} className="animate-spin" />}
              {loading ? "Saving..." : mode === "add" ? "Add Curriculum" : "Save Changes"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const Select = ({ label, value, onChange, options }) => (
  <div className="flex flex-col gap-1">
    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">{label}</label>
    <select
      value={value}
      onChange={(event) => onChange(event.target.value)}
      className="px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-pup-maroon/20 focus:border-pup-maroon transition bg-white"
    >
      <option value="">Select {label}</option>
      {options.map((option) => <option key={option}>{option}</option>)}
    </select>
  </div>
);

const InfoStrip = ({ icon: Icon, label, value, note }) => (
  <div className="flex items-center gap-3 rounded-xl border border-gray-100 bg-gray-50 px-4 py-3">
    <div className="w-9 h-9 rounded-lg bg-white text-pup-maroon flex items-center justify-center border border-gray-100">
      <Icon size={16} />
    </div>
    <div>
      <p className="text-xs text-gray-400">{label}</p>
      <p className="text-sm font-bold text-gray-800">{value}</p>
      <p className="text-xs text-gray-400">{note}</p>
    </div>
  </div>
);

export default CurriculumModal;
