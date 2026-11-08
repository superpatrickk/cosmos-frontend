import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { Eye, EyeOff } from "lucide-react";
import campusBackground from "../../assets/campus-background.png";
import cosmosLogo from "../../assets/cosmos-logo-final.png";

const LoginPage = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [credentials, setCredentials] = useState({ username: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setLoading(true);
    try {
      await login(credentials);
      navigate("/dashboard", { replace: true });
    } catch (err) {
      const responseMessage = err.response?.data?.message || err.response?.data?.error;
      setError(responseMessage || "Unable to sign in. Check your credentials and try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="relative flex min-h-screen items-center justify-center overflow-hidden px-4 py-8"
      style={{
        backgroundImage: `linear-gradient(rgba(255, 255, 255, 0.42), rgba(245, 240, 236, 0.56)), url(${campusBackground})`,
        backgroundPosition: "center bottom",
        backgroundRepeat: "no-repeat",
        backgroundSize: "cover",
      }}
    >
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(122,18,40,0.10),_transparent_34%)]" />

      <div className="relative mt-[-8vh] w-full max-w-[480px] rounded-[28px] border border-white/20 bg-white/15 shadow-[0_35px_80px_rgba(15,23,42,0.04)] backdrop-blur-[0.5px]">
        <div className="rounded-[28px] border border-white/10 bg-[linear-gradient(135deg,_rgba(255,255,255,0.35),_rgba(255,255,255,0.10))] p-6 sm:p-8">
          <div className="mb-4 text-center">
            <div className="mx-auto mb-3 h-px w-14 bg-gradient-to-r from-transparent via-[#7a1228] to-transparent" />
            <p className="text-[9px] font-semibold uppercase tracking-[0.48em] text-slate-600">
              Polytechnic University of the Philippines
            </p>
            <p className="mt-2 text-[9px] font-medium uppercase tracking-[0.28em] text-[#7a1228]">
              Bataan Campus
            </p>
          </div>

          <div className="mb-3 text-center">
            <div className="mx-auto mb-2 flex items-center justify-center bg-transparent">
              <img src={cosmosLogo} alt="COSMOS logo" className="h-32 w-44 object-contain opacity-90" style={{ background: 'transparent', border: 'none', boxShadow: 'none' }} />
            </div>
            <p className="mt-2 text-[9px] font-medium uppercase tracking-[0.18em] text-slate-600">
              Academic Management Portal
            </p>
          </div>
          

          <form onSubmit={handleSubmit} className="mt-5 space-y-4 text-left">
            <div>
              <label htmlFor="username" className="mb-1.5 block text-[10px] font-semibold uppercase tracking-[0.24em] text-slate-700">
                Username
              </label>
              <input
                id="username"
                name="username"
                autoComplete="username"
                required
                value={credentials.username}
                onChange={(event) => setCredentials((prev) => ({ ...prev, username: event.target.value }))}
                className="w-full rounded-[12px] border border-slate-300/80 bg-white/70 px-4 py-3 text-[15px] text-slate-800 placeholder:text-slate-400 shadow-[inset_0_1px_2px_rgba(148,163,184,0.12)] transition focus:border-[#7a1228] focus:bg-white/80 focus:outline-none focus:ring-2 focus:ring-[#7a1228]/10"
              />
            </div>

            <div>
              <label htmlFor="password" className="mb-1.5 block text-[10px] font-semibold uppercase tracking-[0.24em] text-slate-700">
                Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  required
                  value={credentials.password}
                  onChange={(event) => setCredentials((prev) => ({ ...prev, password: event.target.value }))}
                  className="w-full rounded-[12px] border border-slate-300/80 bg-white/70 px-4 py-3 pr-11 text-[15px] text-slate-800 placeholder:text-slate-400 shadow-[inset_0_1px_2px_rgba(148,163,184,0.12)] transition focus:border-[#7a1228] focus:bg-white/80 focus:outline-none focus:ring-2 focus:ring-[#7a1228]/10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((visible) => !visible)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  aria-pressed={showPassword}
                  className="absolute inset-y-0 right-0 flex items-center px-3 text-slate-500 transition-colors hover:text-[#7a1228]"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {error && <p role="alert" className="text-left text-xs font-medium text-red-600">{error}</p>}

            <button
              type="submit"
              disabled={loading}
              className="mt-1 w-full rounded-[12px] bg-[linear-gradient(135deg,_#8b1f2f_0%,_#6f1127_100%)] py-3 text-sm font-semibold uppercase tracking-[0.16em] text-white shadow-[0_12px_28px_rgba(108,16,36,0.18)] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_18px_30px_rgba(108,16,36,0.22)] disabled:cursor-wait disabled:opacity-70"
            >
              {loading ? "Signing in..." : "Sign in"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;