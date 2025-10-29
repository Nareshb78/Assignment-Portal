// src/components/layout/Navbar.jsx
import React, { useState, useEffect } from "react";
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
  Menu,
  X,
} from "lucide-react";
import { logout } from "../../redux/slices/authSlice";

const Navbar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  const { isAuthenticated, user } = useSelector(
    (state) => ({
      isAuthenticated: state.auth.isAuthenticated,
      user: state.auth.user,
    }),
    shallowEqual
  );

  const dispatch = useDispatch();
  const userRole = user?.role;

  // Handle scroll background change
  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const accentPrimary = "#BB86FC";
  const accentSecondary = "#03DAC6";
  const activeAccent = userRole === "student" ? accentSecondary : accentPrimary;

  const dashboardPath =
    userRole === "admin"
      ? "/admin/users"
      : userRole === "teacher"
      ? "/teacher/classes"
      : "/student/classes";

  const roleLinks = {
    student: [
      { to: "/student/classes", label: "My Classes", icon: LayoutDashboard },
      { to: "/student/submissions/me", label: "My Submissions", icon: BookMarked },
    ],
    teacher: [
      { to: "/teacher/classes", label: "Classes & Grading", icon: LayoutDashboard },
    ],
    admin: [
      { to: "/admin/users", label: "User Management", icon: Users },
      { to: "/admin/classes", label: "Class Management", icon: Settings },
    ],
  };

  const currentLinks = isAuthenticated ? roleLinks[userRole] || [] : [];

  return (
    <nav
      className={`fixed top-0 left-0 w-full z-50 transition-all duration-300 ${
        scrolled ? "bg-[#121212]/95 backdrop-blur-md shadow-lg" : "bg-[#121212]/80"
      } border-b border-gray-800`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center shrink-0">
            <BookOpen className="h-8 w-8" style={{ color: activeAccent }} />
            <Link
              to={isAuthenticated ? dashboardPath : "/"}
              className="ml-3 text-xl font-bold text-[#e0e0e0] whitespace-nowrap"
              onClick={() => setIsMenuOpen(false)}
            >
              Portal
              <span
                className="text-sm font-normal ml-2 hidden sm:inline"
                style={{ color: activeAccent }}
              >
                ({userRole ? userRole.charAt(0).toUpperCase() + userRole.slice(1) : "Guest"})
              </span>
            </Link>
          </div>

          {/* Right section */}
          <div className="flex items-center space-x-2 sm:space-x-6">
            {/* Desktop Nav Links */}
            <div className="hidden md:flex items-center space-x-4">
              {currentLinks.map(({ to, label, icon: Icon }) => (
                <Link
                  key={to}
                  to={to}
                  className="text-[#bdbdbd] hover:text-[#e0e0e0] transition-colors flex items-center text-sm font-medium border-r border-gray-700 pr-4"
                >
                  <Icon className="h-5 w-5 mr-1" style={{ color: activeAccent }} />
                  {label}
                </Link>
              ))}
            </div>

            {/* Auth Actions */}
            <div className="flex items-center space-x-2 sm:space-x-3">
              {isAuthenticated ? (
                <>
                  <Link
                    to="/profile"
                    className="hidden sm:flex text-[#e0e0e0] hover:text-[#ba68c8] items-center text-sm font-medium"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    <User className="h-5 w-5 mr-1" /> Profile
                  </Link>
                  <button
                    onClick={() => dispatch(logout())}
                    className="bg-red-600 text-white font-medium py-1.5 px-3 rounded-md hover:bg-red-700 transition-colors flex items-center text-sm shadow-md"
                  >
                    <LogOut className="h-5 w-5 mr-1" />
                    <span className="hidden sm:inline">Logout</span>
                  </button>
                </>
              ) : (
                <>
                  <Link
                    to="/login"
                    className="text-[#bdbdbd] hover:text-[#ba68c8] font-medium flex items-center text-sm"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    <span className="hidden sm:inline">Login</span>
                    <ArrowRight className="h-5 w-5 sm:ml-1" />
                  </Link>
                  <Link
                    to="/register"
                    className="bg-[#03DAC6] text-white font-medium py-1.5 px-3 rounded-md hover:bg-teal-600 transition-colors flex items-center text-sm shadow-md"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    <UserPlus className="h-5 w-5 mr-1" />
                    <span className="hidden sm:inline">Register</span>
                  </Link>
                </>
              )}
            </div>

            {/* Mobile Menu Toggle */}
            {isAuthenticated && (
              <button
                className="md:hidden text-[#bdbdbd] hover:text-[#e0e0e0]"
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                aria-expanded={isMenuOpen}
                aria-label="Toggle menu"
              >
                {isMenuOpen ? <X size={26} /> : <Menu size={26} />}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Overlay Menu */}
      <div
        className={`fixed inset-0 z-40 bg-[#121212]/95 backdrop-blur-lg transition-all duration-300 ease-in-out ${
          isMenuOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        } md:hidden`}
      >
        <div className="flex flex-col h-full overflow-y-auto">
          <div className="flex justify-between items-center px-5 py-4 border-b border-gray-700">
            <h2 className="text-lg font-semibold text-[#e0e0e0]">Menu</h2>
            <button
              className="text-[#bdbdbd] hover:text-white"
              onClick={() => setIsMenuOpen(false)}
            >
              <X size={28} />
            </button>
          </div>

          <div className="flex-1 px-5 py-4 space-y-2">
            {currentLinks.map(({ to, label, icon: Icon }) => (
              <Link
                key={to}
                to={to}
                className="flex items-center px-3 py-2 rounded-md text-base font-medium text-[#bdbdbd] hover:bg-gray-800 hover:text-white transition-all"
                onClick={() => setIsMenuOpen(false)}
              >
                <Icon className="h-6 w-6 mr-3" style={{ color: activeAccent }} />
                {label}
              </Link>
            ))}

            {isAuthenticated && (
              <Link
                to="/profile"
                className="flex items-center px-3 py-2 rounded-md text-base font-medium text-[#bdbdbd] hover:bg-gray-800 hover:text-white transition-all"
                onClick={() => setIsMenuOpen(false)}
              >
                <User className="h-6 w-6 mr-3 text-[#ba68c8]" /> Profile Settings
              </Link>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
