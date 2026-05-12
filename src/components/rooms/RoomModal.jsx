import { useEffect, useState } from "react";
import { X } from "lucide-react";

const EMPTY_FORM = {
  name: "",
  building: "",
  floor: "",
  capacity: 30,
  type: "Lecture",
  status: "Available",
  description: "",
  amenities: [],
};

const BUILDINGS = [
  "Main Building", "Academic Building", "Science Building",
  "Engineering Building", "Business Building",
];
const FLOORS   = ["Ground Floor", "1st Floor", "2nd Floor", "3rd Floor", "4th Floor"];
const TYPES    = ["Lecture", "Laboratory", "Conference", "Tutorial", "Auditorium"];
const STATUSES = ["Available", "Occupied", "Maintenance"];
const AMENITY_OPTIONS = [
  "Projector", "Whiteboard", "AC", "WiFi",
  "Sound System", "Computers", "Printer",
  "Stage", "Equipment",
];

const RoomModal = ({ open, mode, data, onClose, onSubmit }) => {
  const [form, setForm]       = useState(EMPTY_FORM);
  const [errors, setErrors]   = useState({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open) {
      setForm(data ? { ...data, amenities: data.amenities ?? [] } : EMPTY_FORM);
      setErrors({});
    }
  }, [open, data]);

  if (!open) return null;

  const validate = () => {
    const e = {};
    if (!form.name.trim())     e.name     = "Room name is required.";
    if (!form.building.trim()) e.building = "Building is required.";
    if (!form.floor.trim())    e.floor    = "Floor is required.";
    if (!form.capacity || form.capacity < 1) e.capacity = "Capacity must be at least 1.";
    return e;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: null }));
  };

  const toggleAmenity = (amenity) => {
    setForm((prev) => ({
      ...prev,
      amenities: prev.amenities.includes(amenity)
        ? prev.amenities.filter((a) => a !== amenity)
        : [...prev.amenities, amenity],
    }));
  };

  const handleSubmit = async () => {
    const e = validate();
    if (Object.keys(e).length) { setErrors(e); return; }
    setLoading(true);
    try { await onSubmit(form); }
    finally { setLoading(false); }
  };

  const Field = ({ label, name, type = "text", options, span = 1 }) => (
    <div className={`flex flex-col gap-1 ${span === 2 ? "col-span-2" : ""}`}>
      <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
        {label}
      </label>
      {options ? (
        <select
          name={name}
          value={form[name]}
          onChange={handleChange}
          className={`px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-pup-maroon/20 focus:border-pup-maroon transition ${errors[name] ? "border-red-400" : "border-gray-200"}`}
        >
          {!form[name] && <option value="">Select {label}</option>}
          {options.map((o) => <option key={o}>{o}</option>)}
        </select>
      ) : type === "textarea" ? (
        <textarea
          name={name}
          value={form[name]}
          onChange={handleChange}
          rows={3}
          placeholder={`Enter ${label.toLowerCase()}...`}
          className={`px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-pup-maroon/20 focus:border-pup-maroon transition resize-none ${errors[name] ? "border-red-400" : "border-gray-200"}`}
        />
      ) : (
        <input
          type={type}
          name={name}
          value={form[name]}
          onChange={handleChange}
          placeholder={`Enter ${label.toLowerCase()}...`}
          className={`px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-pup-maroon/20 focus:border-pup-maroon transition ${errors[name] ? "border-red-400" : "border-gray-200"}`}
        />
      )}
      {errors[name] && <p className="text-xs text-red-500">{errors[name]}</p>}
    </div>
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg mx-4 max-h-[90vh] flex flex-col">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 flex-shrink-0">
          <div>
            <h2 className="text-base font-bold text-gray-800">
              {mode === "add" ? "Add New Room" : "Edit Room"}
            </h2>
            <p className="text-xs text-gray-400 mt-0.5">
              Fill in the room details below
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
        <div className="px-6 py-5 overflow-y-auto space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Field label="Room Name"  name="name"     span={2} />
            <Field label="Building"   name="building" options={BUILDINGS} span={2} />
            <Field label="Floor"      name="floor"    options={FLOORS} />
            <Field label="Capacity"   name="capacity" type="number" />
            <Field label="Room Type"  name="type"     options={TYPES} />
            <Field label="Status"     name="status"   options={STATUSES} />
            <Field label="Description" name="description" type="textarea" span={2} />
          </div>

          {/* Amenities */}
          <div>
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide block mb-2">
              Amenities
            </label>
            <div className="flex flex-wrap gap-2">
              {AMENITY_OPTIONS.map((a) => (
                <button
                  key={a}
                  type="button"
                  onClick={() => toggleAmenity(a)}
                  className={`px-3 py-1.5 text-xs rounded-full border font-medium transition-colors ${
                    form.amenities.includes(a)
                      ? "bg-pup-maroon text-white border-pup-maroon"
                      : "border-gray-200 text-gray-600 hover:border-pup-maroon hover:text-pup-maroon"
                  }`}
                >
                  {a}
                </button>
              ))}
            </div>
          </div>
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
            {loading ? "Saving..." : mode === "add" ? "Add Room" : "Save Changes"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default RoomModal;