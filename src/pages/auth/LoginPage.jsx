import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

const LoginPage = () => {
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleTempLogin = () => {
    login({
      name: "Admin User",
      email: "admin@pup.edu.ph",
      role: "ADMIN",
    });
    navigate("/dashboard");
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
        <button
          onClick={handleTempLogin}
          className="w-full py-2.5 bg-pup-maroon text-white rounded-lg text-sm font-medium hover:bg-pup-maroon-dark transition-colors"
        >
          Enter as Admin (Temp)
        </button>
        <p className="text-xs text-gray-300 mt-4">
          Real login page coming soon
        </p>
      </div>
    </div>
  );
};

export default LoginPage;