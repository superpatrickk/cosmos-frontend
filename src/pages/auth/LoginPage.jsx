import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { Eye, EyeOff } from "lucide-react";
import cosmosPanelArt from "../../assets/95557ce7-472e-4bef-b73e-b5036a41e6ae.png";
import pupLogo from "../../../Polytechnic_University_of_the_Philippines_Bataan_Logo.png";

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
      className="flex min-h-screen items-center justify-center bg-pup-maroon/10 px-4 py-8"
      style={{
        backgroundImage: `linear-gradient(rgba(243, 244, 246, 0.9), rgba(243, 244, 246, 0.9)), url(${cosmosPanelArt})`,
        backgroundPosition: "center, center",
        backgroundRepeat: "no-repeat, no-repeat",
        backgroundSize: "cover, min(900px, 72vw) auto",
      }}
    >
      <div className="w-full max-w-sm rounded-2xl border border-pup-maroon-dark bg-pup-maroon p-10 text-center text-white shadow-xl">
        <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-white p-1.5">
          <img
            src={pupLogo}
            alt="Polytechnic University of the Philippines Bataan"
            className="h-full w-full object-contain"
          />
        </div>
        <h1 className="mb-1 text-2xl font-bold">COSMOS</h1>
        <p className="mb-6 text-xs text-white/75">
          Classroom Occupancy and Scheduling Management Optimization System
        </p>
        <form onSubmit={handleSubmit} className="space-y-4 text-left">
          <div>
            <label htmlFor="username" className="mb-1 block text-xs font-semibold text-white/85">Username</label>
            <input
              id="username"
              name="username"
              autoComplete="username"
              required
              value={credentials.username}
              onChange={(event) => setCredentials((prev) => ({ ...prev, username: event.target.value }))}
              className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:border-pup-maroon focus:outline-none focus:ring-2 focus:ring-pup-maroon/20"
            />
          </div>
          <div>
            <label htmlFor="password" className="mb-1 block text-xs font-semibold text-white/85">Password</label>
            <div className="relative">
              <input
                id="password"
                name="password"
                type={showPassword ? "text" : "password"}
                autoComplete="current-password"
                required
                value={credentials.password}
                onChange={(event) => setCredentials((prev) => ({ ...prev, password: event.target.value }))}
                className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2.5 pr-10 text-sm text-gray-900 placeholder:text-gray-400 focus:border-pup-maroon focus:outline-none focus:ring-2 focus:ring-pup-maroon/20"
              />
              <button
                type="button"
                onClick={() => setShowPassword((visible) => !visible)}
                aria-label={showPassword ? "Hide password" : "Show password"}
                aria-pressed={showPassword}
                className="absolute inset-y-0 right-0 flex items-center px-3 text-gray-500 hover:text-pup-maroon"
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>
          {error && <p role="alert" className="text-left text-xs text-red-600">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-white py-2.5 text-sm font-semibold text-pup-maroon transition-colors hover:bg-gray-100 disabled:cursor-wait disabled:opacity-60"
          >
            {loading ? "Signing in..." : "Sign in"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default LoginPage;