import { useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { authService } from "../../api/services/authService";
import TopBar from "../../components/layout/TopBar";
import { KeyRound, Loader2, Mail, Pencil, ShieldCheck, UserRound } from "lucide-react";

const AccountSettingsPage = () => {
  const { user, updateProfile } = useAuth();
  const [editingProfile, setEditingProfile] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileForm, setProfileForm] = useState({ fullName: "", email: "" });
  const [profileMessage, setProfileMessage] = useState("");
  const [profileError, setProfileError] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const handleEditProfile = () => {
    setProfileForm({
      fullName: user?.name || "",
      email: user?.email || "",
    });
    setProfileMessage("");
    setProfileError("");
    setEditingProfile(true);
  };

  const handleProfileSubmit = async (event) => {
    event.preventDefault();
    setSavingProfile(true);
    setProfileError("");
    setProfileMessage("");
    try {
      await updateProfile(profileForm);
      setEditingProfile(false);
      setProfileMessage("Account information updated.");
    } catch (requestError) {
      const responseMessage = requestError?.response?.data?.message;
      setProfileError(
        typeof responseMessage === "string"
          ? responseMessage
          : requestError?.message || "Unable to update account information. Please try again."
      );
    } finally {
      setSavingProfile(false);
    }
  };

  const handlePasswordReset = async () => {
    if (!user?.email) {
      setError("There is no email address associated with this account. Contact your system administrator.");
      setMessage("");
      return;
    }

    setLoading(true);
    setError("");
    setMessage("");
    try {
      const response = await authService.requestPasswordReset(user.email);
      setMessage(
        typeof response?.data === "string"
          ? response.data
          : `Password reset instructions were requested for ${user.email}.`
      );
    } catch (requestError) {
      const responseMessage = requestError?.response?.data?.message;
      setError(
        typeof responseMessage === "string"
          ? responseMessage
          : requestError?.message || "Unable to request password reset. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  const accountDetails = [
    { label: "Full name", value: user?.name || "Not provided", icon: UserRound },
    { label: "Email address", value: user?.email || "Not provided", icon: Mail },
    { label: "Username", value: user?.username || "Not provided", icon: UserRound },
    { label: "Role", value: user?.role || "Administrator", icon: ShieldCheck },
  ];

  return (
    <>
      <TopBar title="Account Settings" subtitle="Manage your COSMOS account" />
      <div className="space-y-5 p-6">
        <section className="rounded-2xl border border-white/40 bg-white/80 p-6 shadow-[0_10px_25px_rgba(15,23,42,0.05)] backdrop-blur-[1px]">
          <form onSubmit={handleProfileSubmit}>
            <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
              <div>
                <h2 className="text-base font-bold text-gray-800">Account information</h2>
                <p className="mt-1 text-sm text-gray-500">
                  Update your name and email address. Username and role cannot be changed here.
                </p>
              </div>
              {editingProfile ? (
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setEditingProfile(false);
                      setProfileError("");
                    }}
                    disabled={savingProfile}
                    className="rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-600 transition-colors hover:bg-gray-50 disabled:opacity-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={savingProfile}
                    className="inline-flex items-center gap-2 rounded-lg bg-pup-maroon px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-pup-maroon-dark disabled:opacity-50"
                  >
                    {savingProfile && <Loader2 size={15} className="animate-spin" />}
                    {savingProfile ? "Saving..." : "Save changes"}
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={handleEditProfile}
                  className="inline-flex items-center gap-2 rounded-lg border border-gray-200 px-3 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
                >
                  <Pencil size={15} />
                  Edit account
                </button>
              )}
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              {accountDetails.map(({ label, value, icon: Icon }) => {
                const isFullName = label === "Full name";
                const isEmail = label === "Email address";
                const isEditable = isFullName || isEmail;
                const inputName = isFullName ? "fullName" : "email";
                const inputId = `account-${inputName}`;
                return (
                  <div key={label} className="flex min-w-0 items-center gap-3 rounded-xl border border-gray-100 bg-white/70 p-4">
                    <span className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-pup-maroon/5 text-pup-maroon">
                      <Icon size={18} />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">{label}</p>
                      {editingProfile && isEditable ? (
                        <input
                          id={inputId}
                          name={inputName}
                          type={isEmail ? "email" : "text"}
                          autoComplete={isEmail ? "email" : "name"}
                          required
                          maxLength={isFullName ? 120 : 255}
                          value={profileForm[inputName]}
                          onChange={(event) => setProfileForm((previous) => ({
                            ...previous,
                            [inputName]: event.target.value,
                          }))}
                          className="mt-1 w-full min-w-0 rounded-md border border-gray-200 px-2 py-1.5 text-sm text-gray-800 outline-none focus:border-pup-maroon focus:ring-2 focus:ring-pup-maroon/20"
                        />
                      ) : (
                        <p className="mt-0.5 truncate text-sm font-medium text-gray-800">{value}</p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
            {profileMessage && (
              <p role="status" className="mt-4 rounded-lg border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-700">
                {profileMessage}
              </p>
            )}
            {profileError && (
              <p role="alert" className="mt-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                {profileError}
              </p>
            )}
          </form>
        </section>

        <section className="rounded-2xl border border-white/40 bg-white/80 p-6 shadow-[0_10px_25px_rgba(15,23,42,0.05)] backdrop-blur-[1px]">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-3">
              <span className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-pup-maroon/5 text-pup-maroon">
                <KeyRound size={18} />
              </span>
              <div>
                <h2 className="text-base font-bold text-gray-800">Password</h2>
                <p className="mt-1 max-w-xl text-sm text-gray-500">
                  Request a secure password reset link to the email address on your account.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={handlePasswordReset}
              disabled={loading || !user?.email}
              className="inline-flex flex-shrink-0 items-center justify-center gap-2 rounded-lg bg-pup-maroon px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-pup-maroon-dark disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading ? <Loader2 size={16} className="animate-spin" /> : <KeyRound size={16} />}
              {loading ? "Requesting..." : "Send password reset link"}
            </button>
          </div>
          {message && (
            <p role="status" className="mt-4 rounded-lg border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-700">
              {message}
            </p>
          )}
          {error && (
            <p role="alert" className="mt-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {error}
            </p>
          )}
        </section>
      </div>
    </>
  );
};

export default AccountSettingsPage;
