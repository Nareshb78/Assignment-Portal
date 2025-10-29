// src/pages/Profile.jsx

import React, { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { updateProfile, logout } from "../redux/slices/authSlice";
import { User, Mail, Lock, LogOut, Settings } from "lucide-react";
import Loader from "../components/common/Loader";
// import { theme } from '../assets/theme'; // Assuming tailwind handles colors directly

const ProfilePage = () => {
  const dispatch = useDispatch();
  // FIX: Safely destructur user object with a default empty object
  const { user = {}, isLoading, error } = useSelector((state) => state.auth);

  const [formData, setFormData] = useState({
    name: user?.name || "",
    email: user?.email || "",
    newPassword: "",
    confirmNewPassword: "",
  });
  const [updateStatus, setUpdateStatus] = useState(null);

  // Sync form with Redux user state
  useEffect(() => {
    setFormData((prev) => ({
      ...prev,
      name: user?.name || "",
      email: user?.email || "",
    }));
  }, [user]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setUpdateStatus(null);
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setUpdateStatus(null);

    const updateData = {};
    if (formData.name !== user.name) updateData.name = formData.name;
    if (formData.email !== user.email) updateData.email = formData.email;

    if (formData.newPassword) {
      if (formData.newPassword !== formData.confirmNewPassword) {
        setUpdateStatus({
          type: "error",
          message: "New passwords do not match.",
        });
        return;
      }
      if (formData.newPassword.length < 8) {
        setUpdateStatus({
          type: "error",
          message: "Password must be at least 8 characters.",
        });
        return;
      }
      updateData.password = formData.newPassword;
    }

    if (Object.keys(updateData).length === 0) {
      setUpdateStatus({ type: "warning", message: "No changes detected." });
      return;
    }

    try {
      await dispatch(updateProfile(updateData)).unwrap();
      setUpdateStatus({
        type: "success",
        message: "Profile updated successfully! Refreshing token...",
      });
      setFormData((prev) => ({
        ...prev,
        newPassword: "",
        confirmNewPassword: "",
      }));
    } catch (err) {
      // FIX: Use optional chaining and default fallback for error message
      setUpdateStatus({
        type: "error",
        message: err?.message || "Failed to update profile.",
      });
    }
  };

  // UI Helpers
  const StatusMessage = ({ type, message }) => {
    let styleClasses = "";
    if (type === "success") {
      // Use common teal/green for success
      styleClasses = "bg-[#03DAC6]/20 border-[#03DAC6] text-[#03DAC6]";
    } else if (type === "error") {
      // Use common red for error
      styleClasses = "bg-red-900/40 border-red-700 text-red-400";
    } else {
      // Use common yellow/orange for warning
      styleClasses = "bg-yellow-900/40 border-yellow-700 text-yellow-400";
    }

    return (
      <div
        className={`p-3 rounded-lg border text-sm font-medium ${styleClasses}`}
      >
        {message}
      </div>
    );
  };

  // Role styling
  const roleColors = {
    admin: "text-red-400 bg-red-900/40 border-red-700",
    teacher: "text-[#ba68c8] bg-[#ba68c8]/20 border-[#ba68c8]/50",
    student: "text-[#03DAC6] bg-[#03DAC6]/20 border-[#03DAC6]/50",
  };
  const roleStyle = roleColors[user.role] || roleColors.student;

  return (
    // KEY CHANGE 1: Removed max-w-4xl, using horizontal spacing and stacking content
    <div className="space-y-8 sm:space-y-10">
      <header className="pb-4 border-b border-gray-700">
        {/* KEY CHANGE 2: Reduced header text size for mobile */}
        <h1 className="text-3xl sm:text-4xl font-extrabold text-[#e0e0e0] flex items-center">
          <Settings className="h-7 w-7 sm:h-8 sm:w-8 mr-3 text-[#ba68c8]" />
          Account Settings
        </h1>
        <div
          className={`inline-block mt-2 px-3 py-1 rounded-full text-xs font-semibold uppercase border ${roleStyle}`}
        >
          Role: {user?.role?.toUpperCase() || "Loading"}
        </div>
      </header>

      {updateStatus && <StatusMessage {...updateStatus} />}

      <form
        onSubmit={handleUpdateProfile}
        // KEY CHANGE 3: Reduced form padding to 'p-6 sm:p-8'
        className="bg-surface p-6 sm:p-8 rounded-xl shadow-xl space-y-6 border border-gray-800 transition-all duration-300"
      >
        {/* General Information */}
        <h2 className="text-xl sm:text-2xl font-bold text-[#03DAC6] border-b border-gray-700 pb-2">
          Profile Details
        </h2>
        {/* KEY CHANGE 4: Grid is now 1 column on mobile, 2 on medium screens */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Name */}
          <div className="space-y-1 relative group">
            <label className="block text-sm font-medium text-[#e0e0e0]">
              Full Name
            </label>
            <User className="absolute left-3 top-9 h-5 w-5 text-[#bdbdbd] group-focus-within:text-[#03DAC6] transition-colors" />
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
              className="w-full bg-gray-800 text-[#e0e0e0] border border-gray-700 rounded-lg py-2 pl-10 pr-3 focus:border-[#03DAC6] focus:ring-1 focus:ring-[#03DAC6]/50 transition-all"
            />
          </div>
          {/* Email (Read-only after creation in many apps, but editable here) */}
          <div className="space-y-1 relative group">
            <label className="block text-sm font-medium text-[#e0e0e0]">
              Email Address
            </label>
            <Mail className="absolute left-3 top-9 h-5 w-5 text-[#bdbdbd] group-focus-within:text-[#03DAC6] transition-colors" />
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
              className="w-full bg-gray-800 text-[#e0e0e0] border border-gray-700 rounded-lg py-2 pl-10 pr-3 focus:border-[#03DAC6] focus:ring-1 focus:ring-[#03DAC6]/50 transition-all"
            />
          </div>
        </div>

        {/* Password Update */}
        <h2 className="text-xl sm:text-2xl font-bold text-[#ba68c8] border-b border-gray-700 pb-2 pt-4 flex items-center">
          <Lock className="h-6 w-6 mr-2" /> Change Password
        </h2>
        {/* KEY CHANGE 5: Grid is now 1 column on mobile, 2 on medium screens */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* New Password */}
          <div className="space-y-1 relative group">
            <label className="block text-sm font-medium text-[#e0e0e0]">
              New Password
            </label>
            <Lock className="absolute left-3 top-9 h-5 w-5 text-[#bdbdbd] group-focus-within:text-[#ba68c8] transition-colors" />
            <input
              type="password"
              name="newPassword"
              value={formData.newPassword}
              onChange={handleChange}
              placeholder="Leave blank to keep current password"
              className="w-full bg-gray-800 text-[#e0e0e0] border border-gray-700 rounded-lg py-2 pl-10 pr-3 focus:border-[#ba68c8] focus:ring-1 focus:ring-[#ba68c8]/50 transition-all"
            />
          </div>
          {/* Confirm New Password */}
          <div className="space-y-1 relative group">
            <label className="block text-sm font-medium text-[#e0e0e0]">
              Confirm New Password
            </label>
            <Lock className="absolute left-3 top-9 h-5 w-5 text-[#bdbdbd] group-focus-within:text-[#ba68c8] transition-colors" />
            <input
              type="password"
              name="confirmNewPassword"
              value={formData.confirmNewPassword}
              onChange={handleChange}
              placeholder="Re-enter new password"
              className="w-full bg-gray-800 text-[#e0e0e0] border border-gray-700 rounded-lg py-2 pl-10 pr-3 focus:border-[#ba68c8] focus:ring-1 focus:ring-[#ba68c8]/50 transition-all"
            />
          </div>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isLoading}
          className="w-full bg-[#ba68c8] text-white font-bold py-3 rounded-lg shadow-lg hover:bg-violet-700 transition-all duration-200 disabled:bg-gray-600 disabled:cursor-not-allowed flex items-center justify-center transform hover:scale-[1.01]"
        >
          {isLoading ? (
            <Loader size="sm" />
          ) : (
            <>
              <User className="h-5 w-5 mr-2" />
              Update Profile
            </>
          )}
        </button>
      </form>

      {/* Logout Button (Secondary Action) */}
      <div className="flex justify-center pt-2">
        <button
          onClick={() => dispatch(logout())}
          className="flex items-center text-red-400 hover:text-red-300 font-medium transition-colors p-2 rounded-lg border border-red-700/50 hover:bg-red-900/10"
        >
          <LogOut className="h-5 w-5 mr-2" /> Log Out of Portal
        </button>
      </div>
    </div>
  );
};

export default ProfilePage;
