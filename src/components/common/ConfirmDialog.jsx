import { useEffect, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { authService } from "../../api/services/authService";

const ConfirmDialog = ({
  open,
  title,
  message,
  confirmLabel = "Confirm",
  confirmStyle = "danger",
  loading = false,
  onConfirm,
  onCancel,
  requireAuthentication = confirmStyle === "danger",
}) => {
  const { user } = useAuth();
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [verifying, setVerifying] = useState(false);

  useEffect(() => {
    if (!open) {
      setPassword("");
      setError("");
      setVerifying(false);
    }
  }, [open]);

  const handleConfirm = async () => {
    if (!requireAuthentication) {
      await onConfirm?.();
      return;
    }

    if (!password.trim()) {
      setError("Enter your account password to confirm deletion.");
      return;
    }

    if (!user?.username) {
      setError("Your session is no longer active. Please sign in again and retry.");
      return;
    }

    setVerifying(true);
    setError("");

    try {
      await authService.login({
        username: user?.username || "",
        password,
      });
      await onConfirm?.();
    } catch (err) {
      const responseMessage = err?.response?.data?.message || err?.response?.data?.error;
      setError(responseMessage || "Verification failed. Please check your password and try again.");
    } finally {
      setVerifying(false);
    }
  };

  if (!open) return null;

  const confirmClass =
    confirmStyle === "danger"
      ? "bg-red-600 hover:bg-red-700 text-white"
      : "bg-pup-maroon hover:bg-pup-maroon-dark text-white";

  const isBusy = loading || verifying;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-white/10 backdrop-blur-[2px]">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md mx-4 p-6">
        <h3 className="text-base font-bold text-gray-800 mb-2">{title}</h3>
        <p className="text-sm text-gray-500 mb-4">{message}</p>

        {requireAuthentication && (
          <div className="mb-4 rounded-xl border border-red-100 bg-red-50 p-3 text-xs text-red-700">
            This action is permanent and requires account verification before the record can be deleted.
          </div>
        )}

        {requireAuthentication && (
          <div className="space-y-3 mb-5">
            <div>
              <label className="mb-1 block text-[10px] font-semibold uppercase tracking-[0.12em] text-gray-500">
                Your password
              </label>
              <input
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="Enter your password"
                className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm text-slate-700 focus:border-pup-maroon focus:outline-none focus:ring-2 focus:ring-pup-maroon/20"
              />
            </div>

            {error && (
              <p role="alert" className="text-xs font-medium text-red-600">
                {error}
              </p>
            )}
          </div>
        )}

        <div className="flex items-center justify-end gap-3">
          <button
            onClick={onCancel}
            disabled={isBusy}
            className="px-4 py-2 text-sm border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50 transition-colors disabled:opacity-60"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            disabled={isBusy || (requireAuthentication && !password.trim())}
            className={`px-4 py-2 text-sm rounded-lg font-medium transition-colors ${confirmClass} disabled:opacity-60`}
          >
            {isBusy ? "Verifying..." : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmDialog;