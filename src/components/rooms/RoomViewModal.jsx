import { X, DoorOpen, Users, Building2, Layers, Pencil, CheckCircle2 } from "lucide-react";
import StatusBadge from "../common/StatusBadge";

const RoomViewModal = ({ open, data, onClose, onEdit }) => {
  if (!open || !data) return null;

  const details = [
    { label: "Building",  value: data.building, icon: Building2, color: "text-blue-600",   bg: "bg-blue-50"   },
    { label: "Floor",     value: data.floor,    icon: Layers,    color: "text-purple-600",  bg: "bg-purple-50" },
    { label: "Capacity",  value: `${data.capacity} seats`, icon: Users, color: "text-green-600", bg: "bg-green-50" },
    { label: "Room Type", value: data.type,     icon: DoorOpen,  color: "text-pup-maroon",  bg: "bg-red-50"    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg mx-4 max-h-[90vh] flex flex-col">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-pup-maroon/10 rounded-xl flex items-center justify-center">
              <DoorOpen size={20} className="text-pup-maroon" />
            </div>
            <div>
              <h2 className="text-base font-bold text-gray-800">{data.name}</h2>
              <span className="text-xs text-gray-400">{data.id}</span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-5 space-y-5 overflow-y-auto">

          {/* Status */}
          <div className="flex items-center justify-between">
            <p className="text-xs text-gray-400">Current Status</p>
            <StatusBadge status={data.status} />
          </div>

          {/* Detail Grid */}
          <div className="grid grid-cols-2 gap-3">
            {details.map((d) => (
              <div
                key={d.label}
                className="flex items-center gap-3 p-3 rounded-xl border border-gray-100 bg-gray-50"
              >
                <div className={`w-9 h-9 ${d.bg} rounded-lg flex items-center justify-center flex-shrink-0`}>
                  <d.icon size={16} className={d.color} />
                </div>
                <div>
                  <p className="text-sm font-bold text-gray-800">{d.value}</p>
                  <p className="text-xs text-gray-400">{d.label}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Amenities */}
          {data.amenities?.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">
                Amenities
              </p>
              <div className="flex flex-wrap gap-2">
                {data.amenities.map((a) => (
                  <span
                    key={a}
                    className="flex items-center gap-1.5 px-3 py-1 bg-green-50 text-green-700 text-xs font-medium rounded-full"
                  >
                    <CheckCircle2 size={12} />
                    {a}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Description */}
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">
              Description
            </p>
            <p className="text-sm text-gray-600 leading-relaxed bg-gray-50 rounded-xl p-4 border border-gray-100">
              {data.description}
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-100 flex-shrink-0">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50 transition-colors"
          >
            Close
          </button>
          <button
            onClick={() => onEdit(data)}
            className="flex items-center gap-2 px-4 py-2 text-sm bg-pup-maroon text-white rounded-lg font-medium hover:bg-pup-maroon-dark transition-colors"
          >
            <Pencil size={14} />
            Edit Room
          </button>
        </div>
      </div>
    </div>
  );
};

export default RoomViewModal;