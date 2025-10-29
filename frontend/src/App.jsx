// src/App.js (CLEANED AND FINALIZED)

import React, { useMemo, memo } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { useSelector, shallowEqual } from "react-redux";
import Layout from "./components/layout/Layout";

// Pages
import LoginPage from "./pages/auth/Login";
import RegisterPage from "./pages/auth/Register";
import Home from "./pages/Home";

// Student Pages
import StudentDashboard from "./pages/student/MyClasses";
import StudentSubmissionDetail from "./pages/student/SubmissionDetail"; // Form/Initial Review
import StudentAssignmentList from "./pages/student/StudentAssignmentList";
import StudentMySubmissionsList from "./pages/student/StudentMySubmissionsList"; // Historical List
import StudentSubmissionReview from "./pages/student/StudentSubmissionReview"; // Graded Review Detail

// Teacher Pages
import TeacherDashboard from "./pages/teacher/MyClasses";
import TeacherAssignmentCreate from "./pages/teacher/AssignmentCreate";
import TeacherSubmissionsQueue from "./pages/teacher/SubmissionsQueue";
import TeacherGradeView from "./pages/teacher/GradeView";
import TeacherAssignmentList from "./pages/teacher/AssignmentList";
import AssignmentAnalytics from "./pages/teacher/AssignmentAnalytics";

// Admin Pages
import AdminUserManagement from "./pages/admin/UserManagement";
import AdminClassManagement from "./pages/admin/ClassManagement";
import ProfilePage from "./pages/Profile";

/* --- ProtectedRoute and AuthRedirect components remain the same --- */
const ProtectedRoute = memo(({ children, allowedRoles }) => {
  const { isAuthenticated, user } = useSelector(
    (state) => state.auth,
    shallowEqual
  );
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  const role = user?.role;
  if (allowedRoles && !allowedRoles.includes(role)) {
    const redirectPath =
      role === "admin"
        ? "/admin/users"
        : role === "teacher"
        ? "/teacher/classes"
        : "/student/classes";
    return <Navigate to={redirectPath} replace />;
  }
  return children;
});

const AuthRedirect = memo(() => {
  const { isAuthenticated, user } = useSelector(
    (state) => state.auth,
    shallowEqual
  );
  if (isAuthenticated && user) {
    const role = user.role;
    const redirectPath =
      role === "admin"
        ? "/admin/users"
        : role === "teacher"
        ? "/teacher/classes"
        : "/student/classes";
    return <Navigate to={redirectPath} replace />;
  }
  return <Home />;
});

const App = () => {
  return (
    <Router>
      <Routes>
        {/* Layout Route Group */}
        <Route element={<Layout />}>
          {/* Public and Profile Routes */}
          <Route path="/" element={<AuthRedirect />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <ProfilePage />
              </ProtectedRoute>
            }
          />

          {/* =======================================================
             STUDENT ROUTES (CONSOLIDATED & CORRECTED)
             ======================================================= */}
          <Route
            path="/student/classes" // Student Dashboard
            element={
              <ProtectedRoute allowedRoles={["student", "teacher", "admin"]}>
                <StudentDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/student/classes/:classId/assignments" // Assignment List for a Class
            element={
              <ProtectedRoute allowedRoles={["student", "teacher", "admin"]}>
                <StudentAssignmentList />
              </ProtectedRoute>
            }
          />

          {/* 1. Historical Submissions LIST (The /me link) */}
          <Route
            path="/student/submissions/me"
            element={
              <ProtectedRoute allowedRoles={["student", "teacher", "admin"]}>
                <StudentMySubmissionsList />
              </ProtectedRoute>
            }
          />

          {/* 2. Submission REVIEW DETAIL (Clicking "View Details" from the LIST) */}
          <Route
            path="/student/submissions/:submissionId"
            element={
              <ProtectedRoute allowedRoles={["student", "teacher", "admin"]}>
                <StudentSubmissionReview />
              </ProtectedRoute>
            }
          />

          {/* 3. SUBMIT FORM/INITIAL REVIEW (Clicking "View/Submit" from the ASSIGNMENT LIST) */}
          <Route
            path="/student/assignments/:assignmentId/submit"
            element={
              <ProtectedRoute allowedRoles={["student", "teacher", "admin"]}>
                <StudentSubmissionDetail />
              </ProtectedRoute>
            }
          />

          {/* =======================================================
             TEACHER / ADMIN ROUTES
             ======================================================= */}
          <Route
            path="/teacher/classes"
            element={
              <ProtectedRoute allowedRoles={["teacher", "admin"]}>
                <TeacherDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/teacher/classes/:classId/assignments"
            element={
              <ProtectedRoute allowedRoles={["teacher", "admin"]}>
                <TeacherAssignmentList />
              </ProtectedRoute>
            }
          />
          <Route
            path="/teacher/classes/:classId/assignments/create"
            element={
              <ProtectedRoute allowedRoles={["teacher"]}>
                <TeacherAssignmentCreate />
              </ProtectedRoute>
            }
          />
          <Route
            path="/teacher/classes/:classId/assignments/:assignmentId/submissions"
            element={
              <ProtectedRoute allowedRoles={["teacher", "admin"]}>
                <TeacherSubmissionsQueue />
              </ProtectedRoute>
            }
          />
          <Route
            path="/teacher/submissions/:submissionId/grade"
            element={
              <ProtectedRoute allowedRoles={["teacher"]}>
                <TeacherGradeView />
              </ProtectedRoute>
            }
          />
          <Route
            path="/teacher/classes/:classId/assignments/:assignmentId/analytics"
            element={
              <ProtectedRoute allowedRoles={["teacher", "admin"]}>
                <AssignmentAnalytics />
              </ProtectedRoute>
            }
          />

          {/* Admin Routes */}
          <Route
            path="/admin/users"
            element={
              <ProtectedRoute allowedRoles={["admin"]}>
                <AdminUserManagement />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/classes"
            element={
              <ProtectedRoute allowedRoles={["admin"]}>
                <AdminClassManagement />
              </ProtectedRoute>
            }
          />

          {/* Fallback */}
          <Route
            path="*"
            element={
              <h1 className="text-3xl text-error p-10">
                404 - Resource Not Found
              </h1>
            }
          />
        </Route>{" "}
        {/* End of Layout Route Group */}
      </Routes>
    </Router>
  );
};

export default App;
