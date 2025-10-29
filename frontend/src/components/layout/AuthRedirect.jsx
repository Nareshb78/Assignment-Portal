// src/components/layout/AuthRedirect.jsx (NEW FILE)

import React from "react";
import { useSelector } from "react-redux";
import { Navigate } from "react-router-dom";
import Home from "../../pages/Home"; // Import the public Home page

const AuthRedirect = () => {
  const { isAuthenticated, user } = useSelector((state) => state.auth);

  if (isAuthenticated && user) {
    // User is logged in: Determine the correct dashboard path
    const dashboardPath =
      user.role === "admin"
        ? "/admin/users"
        : user.role === "teacher"
        ? "/teacher/classes"
        : "/student/classes";

    return <Navigate to={dashboardPath} replace />;
  }

  // User is NOT logged in: Show the public Home page
  return <Home />;
};

export default AuthRedirect;
