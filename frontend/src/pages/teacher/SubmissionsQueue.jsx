// src/pages/teacher/SubmissionsQueue.jsx (STRUCTURALLY FIXED)

import React, { useEffect, useState, useCallback, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useParams, Link } from "react-router-dom";
import {
  fetchSubmissionQueue,
  fetchGradeDistribution,
} from "../../redux/slices/submissionSlice";
import {
  Filter,
  User,
  Check,
  Clock,
  Edit2,
  BarChart2,
  ChevronDown,
  ListOrdered,
  CheckCircle,
} from "lucide-react";
import Pagination from "../../components/common/Pagination";
import Loader from "../../components/common/Loader";

const statusOptions = ["all", "submitted", "graded", "late"];

const TeacherSubmissionsQueue = () => {
  const { classId, assignmentId } = useParams();
  const dispatch = useDispatch();

  // Safely destructure submissionQueue and pull out items and pagination
  const submissionsState = useSelector((state) => state.submissions);
  const {
    submissionQueue = { items: [], pagination: {} },
    gradeDistribution,
    isLoading,
  } = useMemo(() => {
    const queue = submissionsState.submissionQueue || {};
    return {
      submissionQueue: queue,
      gradeDistribution: submissionsState.gradeDistribution,
      isLoading: submissionsState.isLoading,
    };
  }, [submissionsState]);

  // Extract pagination here for use below
  const pagination = submissionQueue.pagination || { pages: 0, total: 0 };

  // Placeholder for assignment title fetch
  const assignmentTitle = "Week 3: RBAC Implementation"; // Mock Title

  const [currentPage, setCurrentPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState("all");

  // Fetch data on component mount and filter change
  useEffect(() => {
    dispatch(
      fetchSubmissionQueue({
        classId,
        assignmentId,
        page: currentPage,
        limit: 10,
        status: statusFilter === "all" ? "" : statusFilter,
      })
    );

    // Fetch the Grade Distribution for analytics chart (only if needed)
    if (statusFilter === "all" || statusFilter === "graded") {
      dispatch(fetchGradeDistribution({ classId, assignmentId }));
    }
  }, [dispatch, classId, assignmentId, currentPage, statusFilter]);

  const handlePageChange = useCallback((page) => {
    setCurrentPage(page);
  }, []);

  const handleFilterChange = (e) => {
    setStatusFilter(e.target.value);
    setCurrentPage(1);
  };

  // --- UI Helpers ---

  const getStatusBadge = (status, isLate) => {
    let style = "bg-gray-600";
    let text = status;
    if (status === "graded") {
      style = "bg-[#ba68c8] text-white";
      text = "Graded";
    } else if (isLate) {
      style = "bg-red-700 text-white";
      text = "Late";
    } else if (status === "submitted") {
      style = "bg-[#03DAC6] text-white";
      text = "Submitted";
    }

    const Icon = status === "graded" ? CheckCircle : isLate ? Clock : Check;

    return (
      <span
        // KEY CHANGE 1: Reduced padding for compactness
        className={`px-2 py-0.5 rounded-full text-xs font-semibold uppercase ${style} flex items-center whitespace-nowrap`}
      >
        <Icon className="h-3 w-3 mr-1 shrink-0" /> {text}
      </span>
    );
  };

  // --- Submission Table Component ---

  const SubmissionTable = ({ submissions }) => (
    <div className="overflow-x-auto bg-surface rounded-xl shadow-[0_0_20px_rgba(186,104,200,0.1)] border border-[#2f2f2f]">
      <table className="min-w-full divide-y divide-gray-700">
        <thead className="bg-[#2b2b2b]">
          <tr>
            {/* KEY CHANGE 2: Reduced padding and added whitespace-nowrap to headers */}
            <th className="px-4 py-3 text-left text-xs font-semibold text-[#ba68c8] uppercase tracking-wider whitespace-nowrap">
              Student
            </th>
            <th className="px-4 py-3 text-left text-xs font-semibold text-[#ba68c8] uppercase tracking-wider whitespace-nowrap">
              Submitted At
            </th>
            <th className="px-4 py-3 text-left text-xs font-semibold text-[#ba68c8] uppercase tracking-wider whitespace-nowrap">
              Status
            </th>
            <th className="px-4 py-3 text-left text-xs font-semibold text-[#ba68c8] uppercase tracking-wider whitespace-nowrap">
              Score / Max
            </th>
            <th className="px-4 py-3 text-right text-xs font-semibold text-[#ba68c8] uppercase tracking-wider whitespace-nowrap">
              Action
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-800">
          {submissionQueue.items.map((sub) => (
            <tr key={sub._id} className="hover:bg-[#2b2b2b] transition-colors">
              {/* KEY CHANGE 3: Reduced padding on all table cells */}
              <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-[#e0e0e0] flex items-center max-w-[150px] truncate">
                <User className="h-4 w-4 mr-2 text-[#bdbdbd] shrink-0" />
                {sub.studentId?.name || "Unknown Student"}
              </td>
              <td className="px-4 py-3 whitespace-nowrap text-xs sm:text-sm text-[#bdbdbd]">
                {/* Used toLocaleDateString for mobile friendliness */}
                {new Date(sub.submittedAt).toLocaleDateString()}
              </td>
              <td className="px-4 py-3 whitespace-nowrap">
                {getStatusBadge(sub.status, sub.late)}
              </td>
              <td className="px-4 py-3 whitespace-nowrap text-xs sm:text-sm font-bold text-[#03DAC6]">
                {sub.grade?.score !== undefined ? `${sub.grade.score}` : "-"} /
                {sub.assignmentId?.maxScore || 100}
              </td>
              <td className="px-4 py-3 whitespace-nowrap text-right text-sm font-medium">
                <Link
                  to={`/teacher/submissions/${sub._id}/grade`}
                  // KEY CHANGE 4: Reduced font size and icon size for mobile
                  className="text-[#ba68c8] hover:text-[#03DAC6] transition-colors flex items-center justify-end font-semibold transform hover:scale-105 text-xs sm:text-sm"
                >
                  <Edit2 className="h-3 w-3 sm:h-4 sm:w-4 mr-1 shrink-0" />{" "}
                  {sub.status === "graded" ? "View/Edit Grade" : "Grade Now"}
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  return (
    <div className="space-y-8 sm:space-y-10">
      <header className="pb-4 border-b border-gray-700 flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-2 sm:space-y-0">
        <div>
          {/* KEY CHANGE 5: Reduced header text size for mobile */}
          <h1 className="text-3xl sm:text-4xl font-extrabold text-[#e0e0e0] tracking-wider">
            Grading Queue
          </h1>
          {/* KEY CHANGE 6: Reduced paragraph text size for mobile */}
          <p className="text-[#bdbdbd] mt-1 font-semibold text-sm sm:text-lg">
            Assignment: {assignmentTitle}
          </p>
        </div>

        {/* Analytics Link */}
        <div className="flex gap-4">
          {gradeDistribution && (
            <Link
              to={`/teacher/classes/${classId}/assignments/${assignmentId}/analytics`}
              // KEY CHANGE 7: Reduced padding and font size for mobile
              className="bg-[#03DAC6] text-white py-2 px-3 sm:py-2.5 sm:px-4 rounded-full shadow-md hover:bg-teal-600 transition-colors flex items-center text-xs sm:text-sm font-medium transform hover:scale-105 shrink-0"
            >
              <BarChart2 className="h-4 w-4 mr-1 sm:mr-2" /> View Analytics
            </Link>
          )}
        </div>
      </header>

      {/* Controls: Filter - KEY CHANGE 8: Ensures controls stack on mobile */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0">
        <h3 className="text-lg sm:text-xl font-bold text-[#bdbdbd] flex items-center shrink-0">
          <ListOrdered className="h-5 w-5 mr-2 text-[#ba68c8]" /> Submissions List
        </h3>
        {/* Filter by Status - KEY CHANGE 9: Reduced width on mobile */}
        <div className="relative w-full sm:w-48">
          <select
            value={statusFilter}
            onChange={handleFilterChange}
            className="w-full appearance-none bg-surface text-[#e0e0e0] border border-[#2f2f2f] rounded-lg py-2 pl-10 pr-8 focus:ring-1 focus:ring-[#ba68c8]/50 focus:border-[#ba68c8] transition-all cursor-pointer"
          >
            {statusOptions.map((status) => (
              <option key={status} value={status}>
                {status.charAt(0).toUpperCase() + status.slice(1)}
              </option>
            ))}
          </select>
          <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-[#ba68c8] pointer-events-none" />
          <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-[#bdbdbd] pointer-events-none" />
        </div>
      </div>

      {isLoading ? (
        <Loader message="Loading submissions..." />
      ) : submissionQueue.items.length > 0 ? (
        <SubmissionTable submissions={submissionQueue.items} />
      ) : (
        <div className="text-center py-12 bg-surface rounded-xl border border-[#2f2f2f] shadow-lg">
          <h2 className="text-2xl font-medium text-[#e0e0e0]">Queue Empty</h2>
          <p className="text-[#bdbdbd] mt-2">
            No submissions found matching the current filter.
          </p>
        </div>
      )}

      {/* Pagination */}
      {pagination.pages > 1 && (
        <div className="flex justify-center pt-4">
          <Pagination
            currentPage={currentPage}
            totalPages={pagination.pages}
            onPageChange={handlePageChange}
          />
        </div>
      )}
    </div>
  );
};

export default TeacherSubmissionsQueue;