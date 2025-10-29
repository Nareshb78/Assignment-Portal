// src/pages/auth/Register.jsx

import React, { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate, Link } from "react-router-dom";
import { registerUser } from "../../redux/slices/authSlice";
import { UserPlus, Mail, Lock, User, GitBranch } from "lucide-react";
import Loader from "../../components/common/Loader";

const RegisterPage = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { isAuthenticated, user, isLoading, error } = useSelector(
    (state) => state.auth
  );

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    password2: "",
  });
  const [registerError, setRegisterError] = useState(null);

  useEffect(() => {
    if (isAuthenticated && user) {
      navigate("/student/classes", { replace: true });
    }
    // Check for Redux error and map it to local display error state
    if (error) {
      setRegisterError(error.message || "Registration failed.");
    }
  }, [isAuthenticated, user, navigate, error]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setRegisterError(null);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setRegisterError(null);

    if (formData.password !== formData.password2) {
      setRegisterError("Passwords do not match.");
      return;
    }

    if (!formData.name || !formData.email || !formData.password) {
      setRegisterError("All fields are required.");
      return;
    }

    dispatch(
      registerUser({
        name: formData.name,
        email: formData.email,
        password: formData.password,
      })
    );
  };

  return (
    // KEY CHANGE 1: Used 'min-h-[85vh] p-4 sm:p-0' to ensure vertical centering and screen padding on small devices.
    <div className="flex items-center justify-center min-h-[85vh] p-4 sm:p-0">
      <div className="w-full max-w-md">
        {/* KEY CHANGE 2: Used 'p-6 sm:p-8' for better mobile padding on the card itself. 
            Replaced generic tokens (bg-surface, text-textLight, etc.) with assumed colors for consistency. */}
        <div className="bg-surface p-6 sm:p-8 rounded-2xl shadow-2xl space-y-6 border border-gray-800 transition-all duration-300 transform hover:shadow-lg hover:border-[#03DAC6]/50">
          <header className="text-center">
            <GitBranch className="h-10 w-10 mx-auto text-[#03DAC6]" />
            <h1 className="text-3xl font-extrabold text-[#e0e0e0] mt-3">
              Create Account
            </h1>
            <p className="text-[#bdbdbd] text-sm mt-1">
              New users start with the Student role
            </p>
          </header>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Name Input */}
            <div className="relative group">
              <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-[#bdbdbd] group-focus-within:text-[#03DAC6] transition-colors" />
              <input
                type="text"
                name="name"
                placeholder="Full Name"
                value={formData.name}
                onChange={handleChange}
                required
                // Updated generic color classes
                className="w-full bg-gray-800 text-[#e0e0e0] border border-gray-700 rounded-lg py-3 pl-10 pr-4 focus:border-[#03DAC6] focus:ring-1 focus:ring-[#03DAC6]/50 transition-all placeholder-[#bdbdbd]"
              />
            </div>

            {/* Email Input */}
            <div className="relative group">
              <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-[#bdbdbd] group-focus-within:text-[#03DAC6] transition-colors" />
              <input
                type="email"
                name="email"
                placeholder="Email Address"
                value={formData.email}
                onChange={handleChange}
                required
                // Updated generic color classes
                className="w-full bg-gray-800 text-[#e0e0e0] border border-gray-700 rounded-lg py-3 pl-10 pr-4 focus:border-[#03DAC6] focus:ring-1 focus:ring-[#03DAC6]/50 transition-all placeholder-[#bdbdbd]"
              />
            </div>

            {/* Password Input */}
            <div className="relative group">
              <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-[#bdbdbd] group-focus-within:text-[#03DAC6] transition-colors" />
              <input
                type="password"
                name="password"
                placeholder="Password"
                value={formData.password}
                onChange={handleChange}
                required
                // Updated generic color classes
                className="w-full bg-gray-800 text-[#e0e0e0] border border-gray-700 rounded-lg py-3 pl-10 pr-4 focus:border-[#03DAC6] focus:ring-1 focus:ring-[#03DAC6]/50 transition-all placeholder-[#bdbdbd]"
              />
            </div>

            {/* Confirm Password Input */}
            <div className="relative group">
              <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-[#bdbdbd] group-focus-within:text-[#03DAC6] transition-colors" />
              <input
                type="password"
                name="password2"
                placeholder="Confirm Password"
                value={formData.password2}
                onChange={handleChange}
                required
                // Updated generic color classes
                className="w-full bg-gray-800 text-[#e0e0e0] border border-gray-700 rounded-lg py-3 pl-10 pr-4 focus:border-[#03DAC6] focus:ring-1 focus:ring-[#03DAC6]/50 transition-all placeholder-[#bdbdbd]"
              />
            </div>

            {/* Error Message */}
            {registerError && (
              <div className="bg-red-900/40 text-red-400 p-3 rounded-lg border border-red-700 text-sm font-medium animate-pulse">
                {registerError}
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-[#03DAC6] text-white font-bold py-3 rounded-lg shadow-lg hover:bg-teal-600 transition-all duration-200 disabled:bg-gray-600 disabled:cursor-not-allowed flex items-center justify-center transform hover:scale-[1.01]"
            >
              {isLoading ? (
                <Loader size="sm" />
              ) : (
                <>
                  <UserPlus className="h-5 w-5 mr-2" />
                  Register
                </>
              )}
            </button>
          </form>

          {/* Footer Link */}
          <div className="text-center pt-4 border-t border-gray-800">
            <p className="text-[#bdbdbd] text-sm">
              Already have an account?{" "}
              <Link
                to="/login"
                className="text-[#ba68c8] hover:underline font-medium transition-colors"
              >
                Log In
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;