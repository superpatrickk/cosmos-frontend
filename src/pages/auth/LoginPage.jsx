import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

const LoginPage = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [credentials, setCredentials] = useState({ username: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

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
    <div className="flex items-center justify-center h-screen bg-gray-100">
      <div className="bg-white p-10 rounded-2xl shadow-md text-center w-80">
        <div className="w-12 h-12 bg-pup-maroon rounded-xl flex items-center justify-center mx-auto mb-4">
          <span className="text-white font-bold text-lg">C</span>
        </div>
        <h1 className="text-2xl font-bold text-pup-maroon mb-1">COSMOS</h1>
        <p className="text-xs text-gray-400 mb-6">
          Classroom Occupancy and Student Monitoring System
        </p>
        <form onSubmit={handleSubmit} className="space-y-4 text-left">
          <div>
            <label htmlFor="username" className="mb-1 block text-xs font-semibold text-gray-600">Username</label>
            <input
              id="username"
              name="username"
              autoComplete="username"
              required
              value={credentials.username}
              onChange={(event) => setCredentials((prev) => ({ ...prev, username: event.target.value }))}
              className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm focus:border-pup-maroon focus:outline-none focus:ring-2 focus:ring-pup-maroon/20"
            />
          </div>
          <div>
            <label htmlFor="password" className="mb-1 block text-xs font-semibold text-gray-600">Password</label>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              required
              value={credentials.password}
              onChange={(event) => setCredentials((prev) => ({ ...prev, password: event.target.value }))}
              className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm focus:border-pup-maroon focus:outline-none focus:ring-2 focus:ring-pup-maroon/20"
            />
          </div>
          {error && <p role="alert" className="text-left text-xs text-red-600">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-pup-maroon py-2.5 text-sm font-medium text-white transition-colors hover:bg-pup-maroon-dark disabled:cursor-wait disabled:opacity-60"
          >
            {loading ? "Signing in..." : "Sign in"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default LoginPage;