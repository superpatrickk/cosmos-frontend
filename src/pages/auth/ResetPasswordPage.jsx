import { useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { authService } from "../../api/services/authService";
import campusBackground from "../../assets/campus-background.png";
import cosmosLogo from "../../assets/cosmos-logo-final.png";

const ResetPasswordPage = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token") || "";
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [complete, setComplete] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");

    if (password !== confirmPassword) {
      setError("The passwords do not match.");
      return;
    }

    setLoading(true);
    try {
      await authService.resetPassword({ token, newPassword: password });
      setComplete(true);
    } catch (err) {
      const responseMessage = err.response?.data?.message;
      setError(
        typeof responseMessage === "string"
          ? responseMessage
          : "Unable to reset your password. The link may have expired."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <main
      className="relative flex min-h-screen items-center justify-center overflow-hidden px-4 py-8"
      style={{
        backgroundImage: `linear-gradient(rgba(255, 255, 255, 0.42), rgba(245, 240, 236, 0.56)), url(${campusBackground})`,
        backgroundPosition: "center bottom",
        backgroundRepeat: "no-repeat",
        backgroundSize: "cover",
      }}
    >
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(122,18,40,0.10),_transparent_34%)]" />
      <section className="relative w-full max-w-[480px] rounded-[28px] border border-white/20 bg-white/15 shadow-[0_35px_80px_rgba(15,23,42,0.04)] backdrop-blur-[0.5px]">
        <div className="rounded-[28px] border border-white/10 bg-[linear-gradient(135deg,_rgba(255,255,255,0.35),_rgba(255,255,255,0.10))] p-6 sm:p-8">
          <div className="mb-5 text-center">
            <p className="text-[9px] font-semibold uppercase tracking-[0.48em] text-slate-600">
              Polytechnic University of the Philippines
            </p>
            <p className="mt-2 text-[9px] font-medium uppercase tracking-[0.28em] text-[#7a1228]">
              Bataan Campus
            </p>
            <img
              src={cosmosLogo}
              alt="COSMOS logo"
              className="mx-auto mt-3 h-28 w-40 object-contain opacity-90"
            />
          </div>

          {complete ? (
            <div className="text-center">
              <h1 className="text-xl font-semibold text-slate-800">Password updated</h1>
              <p className="mt-3 text-sm leading-6 text-slate-600">
                Your password has been changed. You can now sign in with your new password.
              </p>
              <Link
                to="/login"
                className="mt-6 inline-flex w-full justify-center rounded-[12px] bg-[linear-gradient(135deg,_#8b1f2f_0%,_#6f1127_100%)] py-3 text-sm font-semibold uppercase tracking-[0.12em] text-white transition hover:shadow-[0_12px_28px_rgba(108,16,36,0.18)]"
              >
                Back to sign in
              </Link>
            </div>
          ) : !token ? (
            <div className="text-center">
              <h1 className="text-xl font-semibold text-slate-800">Reset link unavailable</h1>
              <p className="mt-3 text-sm leading-6 text-slate-600">
                This reset link is incomplete. Request a new one from the sign-in page.
              </p>
              <Link
                to="/login"
                className="mt-6 inline-flex w-full justify-center rounded-[12px] bg-[linear-gradient(135deg,_#8b1f2f_0%,_#6f1127_100%)] py-3 text-sm font-semibold uppercase tracking-[0.12em] text-white"
              >
                Back to sign in
              </Link>
            </div>
          ) : (
            <>
              <h1 className="text-center text-xl font-semibold text-slate-800">
                Choose a new password
              </h1>
              <p className="mt-2 text-center text-sm leading-6 text-slate-600">
                Use at least 8 characters for your new password.
              </p>
              <form onSubmit={handleSubmit} className="mt-6 space-y-4">
                <div>
                  <label htmlFor="new-password" className="mb-1.5 block text-[10px] font-semibold uppercase tracking-[0.24em] text-slate-700">
                    New password
                  </label>
                  <input
                    id="new-password"
                    name="new-password"
                    type="password"
                    autoComplete="new-password"
                    minLength={8}
                    maxLength={72}
                    required
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    className="w-full rounded-[12px] border border-slate-300/80 bg-white/70 px-4 py-3 text-[15px] text-slate-800 transition focus:border-[#7a1228] focus:outline-none focus:ring-2 focus:ring-[#7a1228]/10"
                  />
                </div>
                <div>
                  <label htmlFor="confirm-password" className="mb-1.5 block text-[10px] font-semibold uppercase tracking-[0.24em] text-slate-700">
                    Confirm new password
                  </label>
                  <input
                    id="confirm-password"
                    name="confirm-password"
                    type="password"
                    autoComplete="new-password"
                    minLength={8}
                    maxLength={72}
                    required
                    value={confirmPassword}
                    onChange={(event) => setConfirmPassword(event.target.value)}
                    className="w-full rounded-[12px] border border-slate-300/80 bg-white/70 px-4 py-3 text-[15px] text-slate-800 transition focus:border-[#7a1228] focus:outline-none focus:ring-2 focus:ring-[#7a1228]/10"
                  />
                </div>
                {error && <p role="alert" className="text-left text-xs font-medium text-red-600">{error}</p>}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full rounded-[12px] bg-[linear-gradient(135deg,_#8b1f2f_0%,_#6f1127_100%)] py-3 text-sm font-semibold uppercase tracking-[0.12em] text-white transition disabled:cursor-wait disabled:opacity-70"
                >
                  {loading ? "Updating password..." : "Update password"}
                </button>
              </form>
            </>
          )}
        </div>
      </section>
    </main>
  );
};

export default ResetPasswordPage;
