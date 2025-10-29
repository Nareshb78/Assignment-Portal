// src/pages/student/StudentMySubmissionsList.jsx (FIXED for Smooth Loading + Input Stability)

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

  // --- Redux State (with fallbacks) ---
  const { mySubmissions = {}, isLoading } = useSelector(
    (state) => state.submissions || {}
  );
  const { items: submissions = [], pagination = { pages: 0, total: 0 } } =
    mySubmissions;

  // --- Local State ---
  const [currentPage, setCurrentPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");

  // --- 1. Debounce Search Input ---
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearchTerm(searchTerm), 500);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  // --- 2. Reset Page when Filter or Search changes ---
  useEffect(() => {
    if (currentPage !== 1) {
      setCurrentPage(1);
    }
  }, [debouncedSearchTerm, statusFilter]);

  // --- 3. Fetch Submissions (Main Data Fetch) ---
  useEffect(() => {
    dispatch(
      fetchMySubmissions({
        page: currentPage,
        limit: 10,
        status: statusFilter,
        q: debouncedSearchTerm,
      })
    );
  }, [dispatch, currentPage, statusFilter, debouncedSearchTerm]);

  // --- Handlers ---
  const handlePageChange = useCallback((page) => setCurrentPage(page), []);
  const handleFilterChange = (e) => setStatusFilter(e.target.value);
  const handleSearchChange = (e) => setSearchTerm(e.target.value);

  // --- Badge Helper ---
  const getStatusBadge = (status) => {
    let bg = "bg-gray-700/50";
    let text = "text-gray-300";
    if (status === "graded") {
      bg = "bg-[#ba68c8]/20";
      text = "text-[#ba68c8]";
    } else if (status === "submitted") {
      bg = "bg-yellow-700/20";
      text = "text-yellow-400";
    } else if (status === "late") {
      bg = "bg-red-700/20";
      text = "text-red-400";
    }

    return (
      <span
        className={`px-2 py-0.5 rounded-full text-xs font-semibold uppercase ${bg} ${text} whitespace-nowrap`}
      >
        {status || "Unknown"}
      </span>
    );
  };

  // --- Table UI ---
  const SubmissionTable = ({ data }) => (
    <div className="overflow-x-auto bg-surface rounded-xl shadow-lg border border-[#2f2f2f]">
      <table className="min-w-full divide-y divide-gray-700">
        <thead className="bg-[#2b2b2b]">
          <tr>
            <th className="px-4 py-3 text-left text-xs font-semibold text-[#ba68c8] uppercase tracking-wider">
              Assignment / Class
            </th>
            <th className="px-4 py-3 text-left text-xs font-semibold text-[#ba68c8] uppercase tracking-wider">
              Submitted
            </th>
            <th className="px-4 py-3 text-left text-xs font-semibold text-[#ba68c8] uppercase tracking-wider">
              Status
            </th>
            <th className="px-4 py-3 text-left text-xs font-semibold text-[#ba68c8] uppercase tracking-wider">
              Score
            </th>
            <th className="px-4 py-3 text-right text-xs font-semibold text-[#ba68c8] uppercase tracking-wider">
              Action
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-800">
          {data.map((sub) => (
            <tr key={sub._id} className="hover:bg-[#2b2b2b] transition-colors">
              <td className="px-4 py-3 text-sm font-medium text-[#e0e0e0] whitespace-nowrap">
                {sub.assignmentId?.title || "N/A"}
                <span className="block text-xs text-[#bdbdbd] font-normal">
                  {sub.assignmentId?.classId?.title || "N/A"}
                </span>
              </td>
              <td className="px-4 py-3 whitespace-nowrap text-xs sm:text-sm text-[#bdbdbd]">
                {new Date(sub.submittedAt).toLocaleDateString()}
              </td>
              <td className="px-4 py-3 whitespace-nowrap">
                {getStatusBadge(sub.status)}
              </td>
              <td className="px-4 py-3 whitespace-nowrap text-xs sm:text-sm font-bold">
                {sub.status === "graded" ? (
                  <span className="text-[#03DAC6] flex items-center">
                    <Award size={14} className="mr-1 shrink-0" />
                    {sub.grade?.score}/{sub.assignmentId?.maxScore || 100}
                  </span>
                ) : (
                  <span className="text-yellow-400">Pending</span>
                )}
              </td>
              <td className="px-4 py-3 whitespace-nowrap text-right text-sm font-medium">
                <Link
                  to={`/student/submissions/${sub._id}`}
                  className="text-[#03DAC6] hover:text-[#ba68c8] transition-colors flex items-center justify-end font-semibold transform hover:scale-105 text-xs sm:text-sm"
                >
                  View Details{" "}
                  <ArrowRight className="h-3 w-3 sm:h-4 sm:w-4 ml-1 shrink-0" />
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  // --- Render ---
  return (
    <div className="space-y-8 sm:space-y-10">
      {/* HEADER */}
      <header className="pb-4 border-b border-gray-700">
        <h1 className="text-3xl sm:text-4xl font-extrabold text-[#e0e0e0] tracking-wider flex items-center">
          <BookMarked className="h-7 w-7 sm:h-8 sm:w-8 mr-3 text-[#03DAC6]" />
          My Submissions History
        </h1>
        <p className="text-[#bdbdbd] mt-1 text-sm sm:text-lg">
          Review scores and feedback for your past assignments.
        </p>
      </header>

      {/* CONTROLS */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h3 className="text-lg sm:text-xl font-bold text-[#bdbdbd]">
          Total Submissions: {pagination.total || 0}
        </h3>

        <div className="flex gap-3 flex-col sm:flex-row w-full sm:w-auto">
          {/* Search */}
          <div className="relative w-full sm:w-64">
            <input
              type="text"
              placeholder="Search submissions..."
              value={searchTerm}
              onChange={handleSearchChange}
              className="w-full bg-surface text-[#e0e0e0] border border-[#2f2f2f] rounded-lg py-2.5 pl-10 pr-4 focus:ring-1 focus:ring-[#03DAC6]/50 focus:border-[#03DAC6] transition-all placeholder-[#bdbdbd]"
            />
            <Clock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-[#03DAC6]" />
          </div>

          {/* Filter */}
          <div className="relative w-full sm:w-48">
            <select
              value={statusFilter}
              onChange={handleFilterChange}
              className="w-full appearance-none bg-surface text-[#e0e0e0] border border-[#2f2f2f] rounded-lg py-2.5 pl-10 pr-8 focus:ring-1 focus:ring-[#ba68c8]/50 focus:border-[#ba68c8] transition-all cursor-pointer"
            >
              {statusOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-[#ba68c8]" />
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#bdbdbd]" />
          </div>
        </div>
      </div>

      {/* SUBMISSIONS TABLE / LOADER */}
      <div className="min-h-[200px]">
        {isLoading ? (
          <div className="flex justify-center items-center h-[200px]">
            <Loader message="Loading your submissions..." />
          </div>
        ) : submissions.length > 0 ? (
          <SubmissionTable data={submissions} />
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
      </div>

      {/* PAGINATION */}
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
