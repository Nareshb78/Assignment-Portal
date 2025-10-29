// src/pages/student/StudentMySubmissionsList.jsx (NEW FILE)

import React, { useEffect, useState, useCallback, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Link } from "react-router-dom";
import { fetchMySubmissions } from "../../redux/slices/submissionSlice";
import {
  BookMarked,
  Award,
  Filter,
  ArrowRight,
  Clock,
  ChevronDown,
} from "lucide-react";
import Pagination from "../../components/common/Pagination";
import Loader from "../../components/common/Loader";

const statusOptions = [
  { value: "", label: "All Statuses" },
  { value: "graded", label: "Graded" },
  { value: "submitted", label: "Pending Grade" },
  { value: "late", label: "Late" },
];

const StudentMySubmissionsList = () => {
  const dispatch = useDispatch();

  // CRITICAL: Destructure the state from submissions.mySubmissions
  const { mySubmissions = {}, isLoading } = useSelector(
    (state) => state.submissions || {}
  );
  const { items: submissions = [], pagination = { pages: 0, total: 0 } } = mySubmissions;

  const [currentPage, setCurrentPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState("");

  // Fetch data whenever filters/page change
  useEffect(() => {
    dispatch(
      fetchMySubmissions({
        page: currentPage,
        limit: 10,
        status: statusFilter, // Uses the filter defined in statusOptions
      })
    );
  }, [dispatch, currentPage, statusFilter]);

  const handlePageChange = useCallback((page) => {
    setCurrentPage(page);
  }, []);

  const handleFilterChange = (e) => {
    setStatusFilter(e.target.value);
    setCurrentPage(1);
  };

  const getStatusBadge = (status) => {
    let style = "bg-gray-700";
    let color = "text-[#bdbdbd]";
    if (status === "graded") {
      style = "bg-[#ba68c8]/30";
      color = "text-[#ba68c8]";
    } else if (status === "late") {
      style = "bg-red-700/30";
      color = "text-red-400";
    } else if (status === "submitted") {
      style = "bg-yellow-700/30";
      color = "text-yellow-400";
    }

    return (
      // KEY CHANGE 1: Reduced padding for compactness
      <span
        className={`px-2 py-0.5 rounded-full text-xs font-semibold uppercase ${style} ${color} whitespace-nowrap`}
      >
        {status}
      </span>
    );
  };

  if (isLoading && submissions.length === 0) {
    return <Loader message="Loading your submission history..." />;
  }

  return (
    <div className="space-y-8 sm:space-y-10">
      
      {/* HEADER SECTION */}
      <header className="pb-4 border-b border-gray-700">
        {/* KEY CHANGE 2: Reduced header text size for mobile */}
        <h1 className="text-3xl sm:text-4xl font-extrabold text-[#e0e0e0] tracking-wider flex items-center">
          <BookMarked className="h-7 w-7 sm:h-8 sm:w-8 mr-3 text-[#03DAC6] flex-shrink-0" />
          My Submissions History
        </h1>
        {/* KEY CHANGE 3: Reduced paragraph text size for mobile */}
        <p className="text-[#bdbdbd] mt-1 text-sm sm:text-lg">
          Review scores and feedback for your past assignments.
        </p>
      </header>

      {/* Controls: Filter */}
      {/* KEY CHANGE 4: Use flex-col on mobile, space-y for stacking */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0">
        <h3 className="text-lg sm:text-xl font-bold text-[#bdbdbd] flex items-center flex-shrink-0">
          Total Submissions: {pagination.total || 0}
        </h3>
        {/* Filter by Status - KEY CHANGE 5: Reduced width on mobile */}
        <div className="relative w-full sm:w-48">
          <select
            value={statusFilter}
            onChange={handleFilterChange}
            className="w-full appearance-none bg-surface text-[#e0e0e0] border border-[#2f2f2f] rounded-lg py-2.5 pl-10 pr-8 focus:ring-1 focus:ring-[#03DAC6]/50 focus:border-[#03DAC6] transition-all cursor-pointer"
          >
            {statusOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
          <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-[#03DAC6] pointer-events-none" />
          <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-[#bdbdbd] pointer-events-none" />
        </div>
      </div>

      {/* Submissions Table */}
      {submissions.length > 0 ? (
        // KEY CHANGE 6: overflow-x-auto is the core responsiveness for the table
        <div className="overflow-x-auto bg-surface rounded-xl shadow-lg border border-[#2f2f2f]">
          <table className="min-w-full divide-y divide-gray-700">
            <thead className="bg-[#2b2b2b]">
              <tr>
                {/* KEY CHANGE 7: Reduced padding and added whitespace-nowrap to headers */}
                <th className="px-4 py-3 text-left text-xs font-semibold text-[#ba68c8] uppercase tracking-wider whitespace-nowrap">
                  Assignment / Class
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-[#ba68c8] uppercase tracking-wider whitespace-nowrap">
                  Submitted
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-[#ba68c8] uppercase tracking-wider whitespace-nowrap">
                  Status
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-[#ba68c8] uppercase tracking-wider whitespace-nowrap">
                  Score
                </th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-[#ba68c8] uppercase tracking-wider whitespace-nowrap">
                  Action
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800">
              {submissions.map((sub) => (
                <tr
                  key={sub._id}
                  className="hover:bg-[#2b2b2b] transition-colors"
                >
                  {/* KEY CHANGE 8: Reduced padding and ensured content doesn't break */}
                  <td className="px-4 py-3 text-sm font-medium text-[#e0e0e0] whitespace-nowrap">
                    {sub.assignmentId?.title || "N/A"}
                    <span className="block text-xs text-[#bdbdbd] font-normal">
                      {sub.assignmentId?.classId?.title || "N/A"}
                    </span>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-xs sm:text-sm text-[#bdbdbd]">
                    {/* Used toLocaleDateString for mobile friendliness */}
                    {new Date(sub.submittedAt).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    {getStatusBadge(sub.status)}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-xs sm:text-sm font-bold">
                    {sub.status === "graded" ? (
                      <span className="text-[#03DAC6] flex items-center">
                        <Award size={14} className="mr-1 flex-shrink-0" /> {sub.grade?.score}/
                        {sub.assignmentId?.maxScore || 100}
                      </span>
                    ) : (
                      <span className="text-yellow-400">Pending</span>
                    )}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-right text-sm font-medium">
                    {/* Link to the detailed review page */}
                    <Link
                      to={`/student/submissions/${sub._id}`}
                      className="text-[#03DAC6] hover:text-[#ba68c8] transition-colors flex items-center justify-end font-semibold transform hover:scale-105 text-xs sm:text-sm"
                    >
                      View Details <ArrowRight className="h-3 w-3 sm:h-4 sm:w-4 ml-1 flex-shrink-0" />
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="text-center py-12 bg-surface rounded-xl border border-[#2f2f2f] shadow-lg">
          <h2 className="text-2xl font-medium text-[#e0e0e0]">
            No Submissions Recorded
          </h2>
          <p className="text-[#bdbdbd] mt-2">
            Submit your first assignment to see it here.
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

export default StudentMySubmissionsList;