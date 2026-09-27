import { useEffect, useState } from "react";
import { roomService } from "../../api/services/roomService";
import { X } from "lucide-react";

import { useEffect as useEffectOnce } from "react";

const EMPTY_FORM = {
  name: "",
  code: "",
  building: "",
  floor: "",
  capacity: 30,
  status: "Available",
};

// options will be fetched from backend

const Field = ({ label, name, type = "text", options, span = 1, form, errors, onChange }) => (
  <div className={`flex flex-col gap-1 ${span === 2 ? "col-span-2" : ""}`}>
    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
      {label}
    </label>
    {options ? (
      <select
        name={name}
        value={form[name]}
        onChange={onChange}
        className={`px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-pup-maroon/20 focus:border-pup-maroon transition ${errors[name] ? "border-red-400" : "border-gray-200"}`}
      >
        {!form[name] && <option value="">Select {label}</option>}
        {options.map((o) => <option key={o}>{o}</option>)}
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
  </div>
);

const RoomModal = ({ open, mode, data, onClose, onSubmit }) => {
  const [form, setForm]       = useState(EMPTY_FORM);
  const [errors, setErrors]   = useState({});
  const [loading, setLoading] = useState(false);
  const [buildings, setBuildings] = useState([]);
  const [floors, setFloors] = useState([]);
  const [statuses, setStatuses] = useState([]);
  const [metaLoading, setMetaLoading] = useState(false);
  const [metaError, setMetaError] = useState(null);

  useEffect(() => {
    if (open) {
      setForm(data ? { ...data } : EMPTY_FORM);
      setErrors({});
    }
    // fetch metadata when modal opens
    let mounted = true;
    const fetchMeta = async () => {
      setMetaLoading(true);
      setMetaError(null);
      try {
        const res = await roomService.getMetadata();
        const d = res?.data ?? res;
        if (!mounted) return;
        setBuildings(d?.buildings ?? []);
        setFloors(d?.floors ?? []);
        // types removed from metadata
        setStatuses(d?.statuses ?? []);
        // amenities removed from metadata
      } catch (err) {
        if (!mounted) return;
        setMetaError(err?.message || "Failed to load room metadata");
      } finally {
        if (mounted) setMetaLoading(false);
      }
    };
    fetchMeta();
    return () => { mounted = false; };
  }, [open, data]);

  useEffectOnce(() => {
    console.log("RoomModal mounted");
    return () => console.log("RoomModal unmounted");
  }, []);

  if (!open) return null;

  const validate = () => {
    const e = {};
    if (!form.code || !form.code.trim()) e.code = "Room code is required.";
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

  // amenities removed from backend

  const handleSubmit = async () => {
    const e = validate();
    if (Object.keys(e).length) { setErrors(e); return; }
    setLoading(true);
    try { await onSubmit(form); }
    finally { setLoading(false); }
  };

  

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
            <Field label="Room Code"  name="code"     form={form} errors={errors} onChange={handleChange} />
            <Field label="Room Name"  name="name"     span={2} form={form} errors={errors} onChange={handleChange} />
            <Field label="Building"   name="building" options={buildings} span={2} form={form} errors={errors} onChange={handleChange} />
            <Field label="Floor"      name="floor"    options={floors} form={form} errors={errors} onChange={handleChange} />
            <Field label="Capacity"   name="capacity" type="number" form={form} errors={errors} onChange={handleChange} />
            <Field label="Status"     name="status"   options={statuses} form={form} errors={errors} onChange={handleChange} />
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