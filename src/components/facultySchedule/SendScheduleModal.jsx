import { useState } from "react";
import { X, Send, Mail, Users, AlertTriangle, Loader2 } from "lucide-react";

const SendScheduleModal = ({ open, mode, faculty, allFaculty, onClose, onConfirm }) => {
  const [sending, setSending] = useState(false);

  if (!open) return null;

  const isSingle = mode === "single";

  const handleConfirm = async () => {
    setSending(true);
    try { await onConfirm(); }
    finally { setSending(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md mx-4">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-pup-maroon/10 rounded-xl flex items-center justify-center">
              <Mail size={18} className="text-pup-maroon" />
            </div>
            <h2 className="text-base font-bold text-gray-800">
              {isSingle ? "Send Schedule" : "Send to All Faculty"}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-5 space-y-4">

          {isSingle ? (
            <>
              {/* Recipient Info */}
              <div className="p-4 bg-gray-50 rounded-xl border border-gray-100 space-y-2">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-pup-maroon/10 text-pup-maroon flex items-center justify-center text-sm font-bold">
                    {faculty?.name.split(" ").map((n) => n[0]).join("").slice(0, 2)}
                  </div>
                  <div>
                    <p className="text-sm font-bold text-gray-800">{faculty?.name}</p>
                    <p className="text-xs text-gray-400">{faculty?.department}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 pt-1">
                  <Mail size={13} className="text-gray-400" />
                  <p className="text-sm text-gray-600 font-medium">{faculty?.email}</p>
                </div>
              </div>

              {/* Schedule Preview */}
              {faculty?.assignedSchedules?.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">
                    Schedules to be sent ({faculty.assignedSchedules.length})
                  </p>
                  <div className="space-y-1.5 max-h-36 overflow-y-auto">
                    {faculty.assignedSchedules.map((s, i) => (
                      <div key={i} className="flex items-center justify-between px-3 py-2 bg-gray-50 rounded-lg border border-gray-100 text-xs">
                        <span className="font-bold text-pup-maroon">{s.subjectCode}</span>
                        <span className="text-gray-500">{s.day}</span>
                        <span className="text-gray-700">{s.startTime}–{s.endTime}</span>
                        <span className="text-gray-400">{s.room}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          ) : (
            <>
              {/* Send All Info */}
              <div className="p-4 bg-blue-50 rounded-xl border border-blue-100 flex items-start gap-3">
                <Users size={18} className="text-blue-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-bold text-blue-800">
                    Sending to {allFaculty?.length} faculty members
                  </p>
                  <p className="text-xs text-blue-600 mt-0.5">
                    Each faculty member will receive their individual schedule at their registered email address.
                  </p>
                </div>
              </div>

              {/* Faculty List Preview */}
              <div className="space-y-1.5 max-h-40 overflow-y-auto">
                {allFaculty?.map((f) => (
                  <div key={f.id} className="flex items-center justify-between px-3 py-2 bg-gray-50 rounded-lg border border-gray-100 text-xs">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-pup-maroon/10 text-pup-maroon flex items-center justify-center text-xs font-bold">
                        {f.name.charAt(0)}
                      </div>
                      <span className="font-medium text-gray-700">{f.name}</span>
                    </div>
                    <span className="text-gray-400">{f.email}</span>
                  </div>
                ))}
              </div>
            </>
          )}

          {/* Warning */}
          <div className="flex items-start gap-2.5 p-3 bg-yellow-50 border border-yellow-100 rounded-xl">
            <AlertTriangle size={15} className="text-yellow-600 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-yellow-700">
              This will send an email via Gmail. Make sure the schedule is finalized before proceeding.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-100">
          <button
            onClick={onClose}
            disabled={sending}
            className="px-4 py-2 text-sm border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            disabled={sending}
            className="flex items-center gap-2 px-4 py-2 text-sm bg-pup-maroon text-white rounded-lg font-medium hover:bg-pup-maroon-dark transition-colors disabled:opacity-60"
          >
            {sending
              ? <><Loader2 size={14} className="animate-spin" /> Sending...</>
              : <><Send size={14} /> {isSingle ? "Send Schedule" : "Send to All"}</>
            }
          </button>
        </div>
      </div>
    </div>
  );
};

export default SendScheduleModal;