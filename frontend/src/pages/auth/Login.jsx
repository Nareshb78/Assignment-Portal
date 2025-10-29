// src/pages/auth/Login.jsx (Updated)

import React, { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate, Link } from "react-router-dom";
import { loginUser } from "../../redux/slices/authSlice";
import { LogIn, Mail, Lock, Zap } from "lucide-react";
import Loader from "../../components/common/Loader";
// import { theme } from '../../assets/theme'; // Assuming tailwind handles colors

const LoginPage = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  // Destructure error object from Redux state
  const { isAuthenticated, user, isLoading, error } = useSelector(
    (state) => state.auth
  );

  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  // Removed local loginError state to rely purely on Redux state.error

  // Redirect logic upon successful login
  useEffect(() => {
    if (isAuthenticated && user) {
      const dashboardPath =
        user.role === "admin"
          ? "/admin/users"
          : user.role === "teacher"
          ? "/teacher/classes"
          : "/student/classes";

      navigate(dashboardPath, { replace: true });
    }
  }, [isAuthenticated, user, navigate]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    // NOTE: Redux state.error is cleared when loginUser.pending runs
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!formData.email || !formData.password) {
      // If local form validation fails, we won't call the API
      return;
    }

    // Dispatch the login thunk. Errors are handled in the extraReducers in authSlice
    dispatch(loginUser(formData));
  };

  // Helper to format the error message
  const displayError = (reduxError) => {
    if (!reduxError) return null;

    // The backend sends 'Invalid credentials' for both user not found and wrong password (for security reasons).
    const message = reduxError.message || String(reduxError);

    // Return the specific, expected error message
    if (message.includes("Invalid credentials")) {
      return "Login Failed: User does not exist or password is wrong.";
    }

    return message; // Fallback for other errors (e.g., network failure)
  };

  const errorMessage = displayError(error);

  return (
    // KEY CHANGE 1: Used 'p-4 sm:p-0' to ensure padding on small screens and prevent the form from touching the edge.
    // KEY CHANGE 2: Added 'min-h-screen' fallback and removed the complex calc, relying on the parent Layout for min-height.
    <div className="flex items-center justify-center min-h-[85vh] p-4 sm:p-0">
      <div className="w-full max-w-md">
        {/* KEY CHANGE 3: Used 'p-6 sm:p-8' for better mobile padding on the card itself. */}
        <div className="bg-surface p-6 sm:p-8 rounded-2xl shadow-2xl space-y-6 border border-gray-800 transition-all duration-300 transform hover:shadow-lg hover:border-[#ba68c8]/50">
          <header className="text-center">
            <Zap className="h-10 w-10 mx-auto text-[#ba68c8] animate-pulse" />
            <h1 className="text-3xl font-extrabold text-[#e0e0e0] mt-3">
              Portal Login
            </h1>
            <p className="text-[#bdbdbd] text-sm mt-1">
              Access your role-based dashboard
            </p>
          </header>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Email Input (unchanged) */}
            <div className="relative group">
              <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-[#bdbdbd] group-focus-within:text-[#ba68c8] transition-colors" />
              <input
                type="email"
                name="email"
                placeholder="Email Address"
                value={formData.email}
                onChange={handleChange}
                required
                className="w-full bg-gray-800 text-[#e0e0e0] border border-gray-700 rounded-lg py-3 pl-10 pr-4 focus:border-[#ba68c8] focus:ring-1 focus:ring-[#ba68c8]/50 transition-all placeholder-[#bdbdbd]"
              />
            </div>

            {/* Password Input (unchanged) */}
            <div className="relative group">
              <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-[#bdbdbd] group-focus-within:text-[#ba68c8] transition-colors" />
              <input
                type="password"
                name="password"
                placeholder="Password"
                value={formData.password}
                onChange={handleChange}
                required
                className="w-full bg-gray-800 text-[#e0e0e0] border border-gray-700 rounded-lg py-3 pl-10 pr-4 focus:border-[#ba68c8] focus:ring-1 focus:ring-[#ba68c8]/50 transition-all placeholder-[#bdbdbd]"
              />
            </div>

            {/* Error Message (FIXED DISPLAY) */}
            {errorMessage && (
              <div className="bg-red-900/40 text-red-400 p-3 rounded-lg border border-red-700 text-sm font-medium animate-pulse">
                {errorMessage}
              </div>
            )}

            {/* Submit Button (unchanged) */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-[#ba68c8] text-white font-bold py-3 rounded-lg shadow-lg hover:bg-violet-700 transition-all duration-200 disabled:bg-gray-600 disabled:cursor-not-allowed flex items-center justify-center transform hover:scale-[1.01]"
            >
              {isLoading ? (
                <Loader size="sm" />
              ) : (
                <>
                  <LogIn className="h-5 w-5 mr-2" />
                  Log In
                </>
              )}
            </button>
          </form>

          {/* Footer Link (unchanged) */}
          <div className="text-center pt-4 border-t border-gray-800">
            <p className="text-[#bdbdbd] text-sm">
              Don't have an account?{" "}
              <Link
                to="/register"
                className="text-[#03DAC6] hover:underline font-medium transition-colors"
              >
                Register Here
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
