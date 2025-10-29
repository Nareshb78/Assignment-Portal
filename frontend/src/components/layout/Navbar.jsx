// src/components/layout/Navbar.jsx

import React, { memo, useState } from "react"; // ADDED useState
import { Link } from "react-router-dom";
import { shallowEqual, useSelector, useDispatch } from "react-redux";
import {
  LogOut,
  User,
  BookOpen,
  LayoutDashboard,
  Users,
  BookMarked,
  Settings,
  ArrowRight,
  UserPlus,
  Menu, // ADDED Menu icon
  X, // ADDED X icon
} from "lucide-react";
import { logout } from "../../redux/slices/authSlice";

const Navbar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false); // ADDED state for mobile menu

  const { isAuthenticated, user } = useSelector(
    (state) => ({
      isAuthenticated: state.auth.isAuthenticated,
      user: state.auth.user,
    }),
    shallowEqual
  );
  const dispatch = useDispatch();
  const userRole = user?.role;

  // Role-specific colors based on our vibrant theme:
  const accentPrimary = "#BB86FC"; // Purple (Teacher/Admin)
  const accentSecondary = "#03DAC6"; // Teal (Student)
  const activeAccent = userRole === "student" ? accentSecondary : accentPrimary;

  // Role-specific dashboard route
  const dashboardPath =
    userRole === "admin"
      ? "/admin/users"
      : userRole === "teacher"
      ? "/teacher/classes"
      : "/student/classes";

  // Define Nav Links based on Role
  const roleLinks = {
    student: [
      { to: "/student/classes", label: "My Classes", icon: LayoutDashboard },
      {
        to: "/student/submissions/me",
        label: "My Submissions",
        icon: BookMarked,
      },
    ],
    teacher: [
      {
        to: "/teacher/classes",
        label: "Classes & Grading",
        icon: LayoutDashboard,
      },
    ],
    admin: [
      { to: "/admin/users", label: "User Management", icon: Users },
      { to: "/admin/classes", label: "Class Management", icon: Settings },
    ],
  };

  const currentLinks = isAuthenticated ? roleLinks[userRole] || [] : [];

  return (
    <nav className="bg-surface sticky top-0 z-50 shadow-xl border-b border-gray-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo/Title/Home Link */}
          <div className="flex items-center flex-shrink-0">
            <BookOpen className={`h-8 w-8`} style={{ color: activeAccent }} />
            <Link
              to={isAuthenticated ? dashboardPath : "/"}
              className="ml-3 text-xl font-bold text-[#e0e0e0] transition-colors whitespace-nowrap"
              onClick={() => setIsMenuOpen(false)} // Close menu on navigation
            >
              Portal
              <span
                className={`text-sm font-normal ml-2 hidden sm:inline`}
                style={{ color: activeAccent }}
              >
                (
                {userRole
                  ? userRole.charAt(0).toUpperCase() + userRole.slice(1)
                  : "Guest"}
                )
              </span>
            </Link>
          </div>

          {/* Right Side: Links, Actions & Mobile Toggle */}
          <div className="flex items-center space-x-2 sm:space-x-6">
            {/* 1. Desktop Dashboard Links (Hidden on mobile) */}
            <div className="hidden md:flex items-center space-x-4">
              {" "}
              {/* Adjusted spacing here */}
              {currentLinks.map(({ to, label, icon: Icon }) => (
                <Link
                  key={to}
                  to={to}
                  className="text-[#bdbdbd] hover:text-[#e0e0e0] transition-colors flex items-center text-sm font-medium border-r border-gray-700 pr-4"
                >
                  <Icon
                    className="h-5 w-5 mr-1"
                    style={{ color: activeAccent }}
                  />
                  {label}
                </Link>
              ))}
            </div>

            {/* 2. Profile & Auth Actions (Always visible, adjusted spacing) */}
            <div className="flex items-center space-x-2 sm:space-x-3">
              {isAuthenticated ? (
                <>
                  <Link
                    to="/profile"
                    className="hidden sm:flex text-[#e0e0e0] hover:text-[#ba68c8] transition-colors items-center text-sm font-medium"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    <User className="h-5 w-5 mr-1" /> Profile
                  </Link>
                  <button
                    onClick={() => dispatch(logout())}
                    className="bg-red-600 text-white font-medium py-1.5 px-2 sm:px-3 rounded-md hover:bg-red-700 transition-colors flex items-center text-sm shadow-md flex-shrink-0"
                  >
                    <LogOut className="h-5 w-5 sm:mr-1" />
                    <span className="hidden sm:inline">Logout</span>
                  </button>
                </>
              ) : (
                <>
                  <Link
                    to="/login"
                    className="text-[#bdbdbd] hover:text-[#ba68c8] transition-colors font-medium flex items-center text-sm"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    <span className="hidden sm:inline">Login</span>
                    <ArrowRight className="h-5 w-5 sm:mr-1 sm:ml-0.5" />
                  </Link>
                  <Link
                    to="/register"
                    className="bg-accentSecondary text-white font-medium py-1.5 px-2 sm:px-3 rounded-md hover:bg-teal-600 transition-colors shadow-md flex items-center text-sm flex-shrink-0"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    <UserPlus className="h-5 w-5 sm:mr-1" />
                    <span className="hidden sm:inline">Register</span>
                  </Link>
                </>
              )}
            </div>

            {/* 3. Mobile Menu Button (Only visible on mobile) */}
            {isAuthenticated && (
              <button
                className="md:hidden text-[#bdbdbd] hover:text-[#e0e0e0]"
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                aria-expanded={isMenuOpen}
                aria-label="Toggle navigation"
              >
                {isMenuOpen ? <X size={28} /> : <Menu size={28} />}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Menu Content (Appears only when isMenuOpen is true) */}
      <div
        className={`${
          isMenuOpen ? "block" : "hidden"
        } md:hidden border-t border-gray-800 pb-2`}
      >
        <div className="px-4 pt-2 pb-3 space-y-1">
          {/* Map over Dashboard Links */}
          {currentLinks.map(({ to, label, icon: Icon }) => (
            <Link
              key={to}
              to={to}
              className="px-3 py-2 rounded-md text-base font-medium text-[#bdbdbd] hover:bg-gray-700 hover:text-[#e0e0e0] transition-colors flex items-center"
              onClick={() => setIsMenuOpen(false)} // Close menu on click
            >
              <Icon className="h-6 w-6 mr-3" style={{ color: activeAccent }} />
              {label}
            </Link>
          ))}

          {/* Profile Link (Mobile only, since desktop version is hidden here) */}
          {isAuthenticated && (
            <Link
              to="/profile"
              className=" px-3 py-2 rounded-md text-base font-medium text-[#bdbdbd] hover:bg-gray-700 hover:text-[#e0e0e0] transition-colors flex items-center"
              onClick={() => setIsMenuOpen(false)}
            >
              <User className="h-6 w-6 mr-3 text-[#ba68c8]" /> Profile Settings
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
